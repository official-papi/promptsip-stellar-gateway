#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token::Client as TokenClient,
    token::StellarAssetClient as TokenAdminClient,
    Address, Env, Symbol,
};

fn create_token_contract<'a>(env: &Env, admin: &Address) -> (TokenClient<'a>, TokenAdminClient<'a>) {
    let token_address = env.register_stellar_asset_contract_v2(admin.clone()).address();
    (
        TokenClient::new(env, &token_address),
        TokenAdminClient::new(env, &token_address),
    )
}

#[test]
fn test_direct_prompt_payment() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let payer = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (token_client, token_admin_client) = create_token_contract(&env, &token_admin);
    token_admin_client.mint(&payer, &10_000);

    let contract_id = env.register(PromptSipMeter, ());
    let client = PromptSipMeterClient::new(&env, &contract_id);

    client.initialize(&admin, &token_client.address, &100);

    let prompt_id = Symbol::new(&env, "p_001");
    let model = Symbol::new(&env, "claude");
    let record = client.pay_prompt(&payer, &prompt_id, &model, &128, &100);

    assert_eq!(record.amount, 100);
    assert_eq!(record.tokens_used, 128);
    assert_eq!(token_client.balance(&admin), 100);
    assert_eq!(token_client.balance(&payer), 9_900);

    let fetched = client.get_prompt(&prompt_id).unwrap();
    assert_eq!(fetched.payer, payer);
    assert_eq!(fetched.model, model);

    let stats = client.get_stats();
    assert_eq!(stats.total_prompts, 1);
    assert_eq!(stats.total_volume, 100);
}

#[test]
fn test_prefunded_credits_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let payer = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (token_client, token_admin_client) = create_token_contract(&env, &token_admin);
    token_admin_client.mint(&payer, &5_000);

    let contract_id = env.register(PromptSipMeter, ());
    let client = PromptSipMeterClient::new(&env, &contract_id);

    client.initialize(&admin, &token_client.address, &50);

    // 1. Fund 1,000 micro-credits
    let balance = client.fund_credits(&payer, &1_000);
    assert_eq!(balance, 1_000);
    assert_eq!(client.get_credit(&payer), 1_000);
    assert_eq!(token_client.balance(&payer), 4_000);

    // 2. Consume 150 credits for Prompt #201
    let prompt_id = Symbol::new(&env, "p_201");
    let model = Symbol::new(&env, "gemini");
    let remaining = client.consume_credit(&payer, &prompt_id, &model, &350, &150);
    assert_eq!(remaining, 850);
    assert_eq!(client.get_credit(&payer), 850);
    assert_eq!(token_client.balance(&admin), 150);

    // 3. Withdraw 350 credits back to payer
    let final_balance = client.withdraw_credits(&payer, &350);
    assert_eq!(final_balance, 500);
    assert_eq!(token_client.balance(&payer), 4_350);
}

#[test]
#[should_panic(expected = "Error(Contract, #5)")]
fn test_prevent_duplicate_prompt_payment() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let payer = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (token_client, token_admin_client) = create_token_contract(&env, &token_admin);
    token_admin_client.mint(&payer, &10_000);

    let contract_id = env.register(PromptSipMeter, ());
    let client = PromptSipMeterClient::new(&env, &contract_id);
    client.initialize(&admin, &token_client.address, &100);

    let prompt_id = Symbol::new(&env, "p_dup");
    let model = Symbol::new(&env, "gpt4");

    client.pay_prompt(&payer, &prompt_id, &model, &100, &100);
    // Duplicate payment for same prompt ID should fail
    client.pay_prompt(&payer, &prompt_id, &model, &100, &100);
}
