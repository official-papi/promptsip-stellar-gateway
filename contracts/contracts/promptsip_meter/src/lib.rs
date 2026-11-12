#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short,
    token, Address, Env, IntoVal, Symbol,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    InsufficientBalance = 4,
    PromptAlreadyPaid = 5,
    InvalidAmount = 6,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PromptRecord {
    pub payer: Address,
    pub amount: i128,
    pub model: Symbol,
    pub tokens_used: u32,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Stats {
    pub total_prompts: u64,
    pub total_volume: i128,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Token,
    PromptFee,
    Balance(Address),
    Prompt(Symbol),
    Stats,
}

#[contract]
pub struct PromptSipMeter;

#[contractimpl]
impl PromptSipMeter {
    /// Initialize the contract with an admin, payment token (e.g. USDC or native XLM SAC), and default base fee
    pub fn initialize(env: Env, admin: Address, token: Address, prompt_fee: i128) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        if prompt_fee <= 0 {
            return Err(Error::InvalidAmount);
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::PromptFee, &prompt_fee);
        env.storage().instance().set(&DataKey::Stats, &Stats {
            total_prompts: 0,
            total_volume: 0,
        });

        Ok(())
    }

    /// Direct Pay-Per-Prompt: payer transfers tokens directly to the contract/admin to unlock prompt response
    pub fn pay_prompt(
        env: Env,
        payer: Address,
        prompt_id: Symbol,
        model: Symbol,
        tokens_used: u32,
        amount: i128,
    ) -> Result<PromptRecord, Error> {
        payer.require_auth();

        if !env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::NotInitialized);
        }

        let prompt_key = DataKey::Prompt(prompt_id.clone());
        if env.storage().persistent().has(&prompt_key) {
            return Err(Error::PromptAlreadyPaid);
        }

        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        // Transfer tokens from payer to admin
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&payer, &admin, &amount);

        let timestamp = env.ledger().timestamp();
        let record = PromptRecord {
            payer: payer.clone(),
            amount,
            model: model.clone(),
            tokens_used,
            timestamp,
        };

        // Store prompt record
        env.storage().persistent().set(&prompt_key, &record);

        // Update stats
        let mut stats: Stats = env.storage().instance().get(&DataKey::Stats).unwrap_or(Stats {
            total_prompts: 0,
            total_volume: 0,
        });
        stats.total_prompts += 1;
        stats.total_volume += amount;
        env.storage().instance().set(&DataKey::Stats, &stats);

        // Emit Soroban event
        env.events().publish(
            (symbol_short!("prompt_pd"), payer, prompt_id),
            (amount, model, tokens_used),
        );

        Ok(record)
    }

    /// Deposit / Pre-fund a micro-credit pool for rapid HTTP 402 streaming without per-prompt tx wait
    pub fn fund_credits(env: Env, payer: Address, amount: i128) -> Result<i128, Error> {
        payer.require_auth();

        if !env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::NotInitialized);
        }
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let contract_address = env.current_contract_address();

        // Transfer tokens from payer into contract vault
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&payer, &contract_address, &amount);

        let balance_key = DataKey::Balance(payer.clone());
        let current_balance: i128 = env.storage().persistent().get(&balance_key).unwrap_or(0);
        let new_balance = current_balance + amount;
        env.storage().persistent().set(&balance_key, &new_balance);

        env.events().publish(
            (symbol_short!("funded"), payer),
            amount,
        );

        Ok(new_balance)
    }

    /// Consume credit from user's pre-funded balance (called by Gateway/Admin upon delivering AI stream)
    pub fn consume_credit(
        env: Env,
        payer: Address,
        prompt_id: Symbol,
        model: Symbol,
        tokens_used: u32,
        amount: i128,
    ) -> Result<i128, Error> {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).ok_or(Error::NotInitialized)?;
        admin.require_auth();

        let prompt_key = DataKey::Prompt(prompt_id.clone());
        if env.storage().persistent().has(&prompt_key) {
            return Err(Error::PromptAlreadyPaid);
        }
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let balance_key = DataKey::Balance(payer.clone());
        let current_balance: i128 = env.storage().persistent().get(&balance_key).unwrap_or(0);
        if current_balance < amount {
            return Err(Error::InsufficientBalance);
        }

        let new_balance = current_balance - amount;
        env.storage().persistent().set(&balance_key, &new_balance);

        // Transfer consumed credit from contract to admin
        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&env.current_contract_address(), &admin, &amount);

        let timestamp = env.ledger().timestamp();
        let record = PromptRecord {
            payer: payer.clone(),
            amount,
            model: model.clone(),
            tokens_used,
            timestamp,
        };
        env.storage().persistent().set(&prompt_key, &record);

        // Update stats
        let mut stats: Stats = env.storage().instance().get(&DataKey::Stats).unwrap_or(Stats {
            total_prompts: 0,
            total_volume: 0,
        });
        stats.total_prompts += 1;
        stats.total_volume += amount;
        env.storage().instance().set(&DataKey::Stats, &stats);

        env.events().publish(
            (symbol_short!("consumed"), payer, prompt_id),
            (amount, model, tokens_used),
        );

        Ok(new_balance)
    }

    /// Withdraw remaining pre-funded credits back to payer
    pub fn withdraw_credits(env: Env, payer: Address, amount: i128) -> Result<i128, Error> {
        payer.require_auth();

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let balance_key = DataKey::Balance(payer.clone());
        let current_balance: i128 = env.storage().persistent().get(&balance_key).unwrap_or(0);
        if current_balance < amount {
            return Err(Error::InsufficientBalance);
        }

        let new_balance = current_balance - amount;
        env.storage().persistent().set(&balance_key, &new_balance);

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&env.current_contract_address(), &payer, &amount);

        env.events().publish(
            (symbol_short!("withdrawn"), payer),
            amount,
        );

        Ok(new_balance)
    }

    /// Read user's available pre-funded credit balance
    pub fn get_credit(env: Env, payer: Address) -> i128 {
        let balance_key = DataKey::Balance(payer);
        env.storage().persistent().get(&balance_key).unwrap_or(0)
    }

    /// Verify and fetch prompt receipt
    pub fn get_prompt(env: Env, prompt_id: Symbol) -> Option<PromptRecord> {
        let prompt_key = DataKey::Prompt(prompt_id);
        env.storage().persistent().get(&prompt_key)
    }

    /// Get overall stats (prompts served & total volume settled)
    pub fn get_stats(env: Env) -> Stats {
        env.storage().instance().get(&DataKey::Stats).unwrap_or(Stats {
            total_prompts: 0,
            total_volume: 0,
        })
    }
}

mod test;
