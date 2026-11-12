# PromptSip Soroban Smart Contract (`promptsip_meter`)

An on-chain HTTP 402 AI metering and micro-settlement contract built for Stellar Soroban.

## 🚀 Live Testnet Deployment

| Resource | Value / Link |
| :--- | :--- |
| **Contract ID** | `CB2U4ZI42D4NVHUXKG4ZZRAOYESU65QIWY47EZX5HMRQVJMDKAKWAK2N` |
| **StellarExpert Explorer** | [View on StellarExpert](https://stellar.expert/explorer/testnet/contract/CB2U4ZI42D4NVHUXKG4ZZRAOYESU65QIWY47EZX5HMRQVJMDKAKWAK2N) |
| **Stellar Lab** | [Inspect in Stellar Lab](https://lab.stellar.org/r/testnet/contract/CB2U4ZI42D4NVHUXKG4ZZRAOYESU65QIWY47EZX5HMRQVJMDKAKWAK2N) |
| **Deployment TX** | [`9b421221df7ed238...`](https://stellar.expert/explorer/testnet/tx/9b421221df7ed238f996a93e78fadf8c0daa4d5b84d034564dfa438352033c61) |
| **Init TX** | [`fce04374a177e723...`](https://stellar.expert/explorer/testnet/tx/fce04374a177e7235eb1255256d371c1263ded684dd978bbb537fd3c93d57dfb) |
| **Admin Address** | `GAMWOYHYZLFCQHNWBRHCJOMLM3S5ZUM2VAW4QQD2GPJJSHML7BSQEY3Q` |
| **Payment Token** | Native XLM SAC (`CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`) |

---

## 🛠️ Contract Features

1. **`pay_prompt(payer, prompt_id, model, tokens_used, amount)`**:
   - Direct HTTP 402 Pay-Per-Prompt settlement.
   - Transfers the micropayment fee from `payer` to `admin`.
   - Records an immutable on-chain receipt mapping `prompt_id` to timestamp, model, and token usage.
   - Emits a Soroban event `prompt_pd`.
   - Built-in replay protection: rejects duplicate payments for the same prompt ID.

2. **`fund_credits(payer, amount)`**:
   - Pre-funds a credit pool within the contract vault.
   - Enables zero-latency streaming where the AI model begins generating words immediately without waiting 3–5 seconds per prompt for block consensus.

3. **`consume_credit(payer, prompt_id, model, tokens_used, amount)`**:
   - Gateway/Admin settles delivered streaming tokens from the payer's credit pool.
   - Emits `consumed` event and updates cumulative volume.

4. **`withdraw_credits(payer, amount)`**:
   - Payer can withdraw unused pre-funded credits back to their wallet at any time.

5. **`get_prompt(prompt_id)`**:
   - Read-only receipt verification for AI agents and audit gateways.

6. **`get_stats()`**:
   - Returns `{ total_prompts, total_volume }`.

---

## 🧪 Testing & Verification

Run the Rust unit tests:
```powershell
cd contracts
cargo test
```
*Result: 3/3 tests passed (direct payments, credit pools, duplicate protection).*

Build WASM:
```powershell
cd contracts
stellar contract build
```

Read live stats on Testnet:
```powershell
stellar contract invoke --id CB2U4ZI42D4NVHUXKG4ZZRAOYESU65QIWY47EZX5HMRQVJMDKAKWAK2N --source testnet_admin --network testnet -- get_stats
```
