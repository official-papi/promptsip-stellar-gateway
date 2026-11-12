import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CB2U4ZI42D4NVHUXKG4ZZRAOYESU65QIWY47EZX5HMRQVJMDKAKWAK2N",
  }
} as const

export const Errors = {
  1: {message:"AlreadyInitialized"},
  2: {message:"NotInitialized"},
  3: {message:"Unauthorized"},
  4: {message:"InsufficientBalance"},
  5: {message:"PromptAlreadyPaid"},
  6: {message:"InvalidAmount"}
}


export interface Stats {
  total_prompts: u64;
  total_volume: i128;
}


export interface PromptRecord {
  amount: i128;
  model: string;
  payer: string;
  timestamp: u64;
  tokens_used: u32;
}

export interface Client {
  /**
   * Construct and simulate a get_stats transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get overall stats (prompts served & total volume settled)
   */
  get_stats: (options?: MethodOptions) => Promise<AssembledTransaction<Stats>>

  /**
   * Construct and simulate a get_credit transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Read user's available pre-funded credit balance
   */
  get_credit: ({payer}: {payer: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_prompt transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Verify and fetch prompt receipt
   */
  get_prompt: ({prompt_id}: {prompt_id: string}, options?: MethodOptions) => Promise<AssembledTransaction<Option<PromptRecord>>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Initialize the contract with an admin, payment token (e.g. USDC or native XLM SAC), and default base fee
   */
  initialize: ({admin, token, prompt_fee}: {admin: string, token: string, prompt_fee: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a pay_prompt transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Direct Pay-Per-Prompt: payer transfers tokens directly to the contract/admin to unlock prompt response
   */
  pay_prompt: ({payer, prompt_id, model, tokens_used, amount}: {payer: string, prompt_id: string, model: string, tokens_used: u32, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<PromptRecord>>>

  /**
   * Construct and simulate a fund_credits transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Deposit / Pre-fund a micro-credit pool for rapid HTTP 402 streaming without per-prompt tx wait
   */
  fund_credits: ({payer, amount}: {payer: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a consume_credit transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Consume credit from user's pre-funded balance (called by Gateway/Admin upon delivering AI stream)
   */
  consume_credit: ({payer, prompt_id, model, tokens_used, amount}: {payer: string, prompt_id: string, model: string, tokens_used: u32, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a withdraw_credits transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Withdraw remaining pre-funded credits back to payer
   */
  withdraw_credits: ({payer, amount}: {payer: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAABgAAAAAAAAASQWxyZWFkeUluaXRpYWxpemVkAAAAAAABAAAAAAAAAA5Ob3RJbml0aWFsaXplZAAAAAAAAgAAAAAAAAAMVW5hdXRob3JpemVkAAAAAwAAAAAAAAATSW5zdWZmaWNpZW50QmFsYW5jZQAAAAAEAAAAAAAAABFQcm9tcHRBbHJlYWR5UGFpZAAAAAAAAAUAAAAAAAAADUludmFsaWRBbW91bnQAAAAAAAAG",
        "AAAAAQAAAAAAAAAAAAAABVN0YXRzAAAAAAAAAgAAAAAAAAANdG90YWxfcHJvbXB0cwAAAAAAAAYAAAAAAAAADHRvdGFsX3ZvbHVtZQAAAAs=",
        "AAAAAQAAAAAAAAAAAAAADFByb21wdFJlY29yZAAAAAUAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAFbW9kZWwAAAAAAAARAAAAAAAAAAVwYXllcgAAAAAAABMAAAAAAAAACXRpbWVzdGFtcAAAAAAAAAYAAAAAAAAAC3Rva2Vuc191c2VkAAAAAAQ=",
        "AAAAAAAAADlHZXQgb3ZlcmFsbCBzdGF0cyAocHJvbXB0cyBzZXJ2ZWQgJiB0b3RhbCB2b2x1bWUgc2V0dGxlZCkAAAAAAAAJZ2V0X3N0YXRzAAAAAAAAAAAAAAEAAAfQAAAABVN0YXRzAAAA",
        "AAAAAAAAAC9SZWFkIHVzZXIncyBhdmFpbGFibGUgcHJlLWZ1bmRlZCBjcmVkaXQgYmFsYW5jZQAAAAAKZ2V0X2NyZWRpdAAAAAAAAQAAAAAAAAAFcGF5ZXIAAAAAAAATAAAAAQAAAAs=",
        "AAAAAAAAAB9WZXJpZnkgYW5kIGZldGNoIHByb21wdCByZWNlaXB0AAAAAApnZXRfcHJvbXB0AAAAAAABAAAAAAAAAAlwcm9tcHRfaWQAAAAAAAARAAAAAQAAA+gAAAfQAAAADFByb21wdFJlY29yZA==",
        "AAAAAAAAAGhJbml0aWFsaXplIHRoZSBjb250cmFjdCB3aXRoIGFuIGFkbWluLCBwYXltZW50IHRva2VuIChlLmcuIFVTREMgb3IgbmF0aXZlIFhMTSBTQUMpLCBhbmQgZGVmYXVsdCBiYXNlIGZlZQAAAAppbml0aWFsaXplAAAAAAADAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAAAAAABXRva2VuAAAAAAAAEwAAAAAAAAAKcHJvbXB0X2ZlZQAAAAAACwAAAAEAAAPpAAAAAgAAAAM=",
        "AAAAAAAAAGZEaXJlY3QgUGF5LVBlci1Qcm9tcHQ6IHBheWVyIHRyYW5zZmVycyB0b2tlbnMgZGlyZWN0bHkgdG8gdGhlIGNvbnRyYWN0L2FkbWluIHRvIHVubG9jayBwcm9tcHQgcmVzcG9uc2UAAAAAAApwYXlfcHJvbXB0AAAAAAAFAAAAAAAAAAVwYXllcgAAAAAAABMAAAAAAAAACXByb21wdF9pZAAAAAAAABEAAAAAAAAABW1vZGVsAAAAAAAAEQAAAAAAAAALdG9rZW5zX3VzZWQAAAAABAAAAAAAAAAGYW1vdW50AAAAAAALAAAAAQAAA+kAAAfQAAAADFByb21wdFJlY29yZAAAAAM=",
        "AAAAAAAAAF5EZXBvc2l0IC8gUHJlLWZ1bmQgYSBtaWNyby1jcmVkaXQgcG9vbCBmb3IgcmFwaWQgSFRUUCA0MDIgc3RyZWFtaW5nIHdpdGhvdXQgcGVyLXByb21wdCB0eCB3YWl0AAAAAAAMZnVuZF9jcmVkaXRzAAAAAgAAAAAAAAAFcGF5ZXIAAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAABAAAD6QAAAAsAAAAD",
        "AAAAAAAAAGFDb25zdW1lIGNyZWRpdCBmcm9tIHVzZXIncyBwcmUtZnVuZGVkIGJhbGFuY2UgKGNhbGxlZCBieSBHYXRld2F5L0FkbWluIHVwb24gZGVsaXZlcmluZyBBSSBzdHJlYW0pAAAAAAAADmNvbnN1bWVfY3JlZGl0AAAAAAAFAAAAAAAAAAVwYXllcgAAAAAAABMAAAAAAAAACXByb21wdF9pZAAAAAAAABEAAAAAAAAABW1vZGVsAAAAAAAAEQAAAAAAAAALdG9rZW5zX3VzZWQAAAAABAAAAAAAAAAGYW1vdW50AAAAAAALAAAAAQAAA+kAAAALAAAAAw==",
        "AAAAAAAAADNXaXRoZHJhdyByZW1haW5pbmcgcHJlLWZ1bmRlZCBjcmVkaXRzIGJhY2sgdG8gcGF5ZXIAAAAAEHdpdGhkcmF3X2NyZWRpdHMAAAACAAAAAAAAAAVwYXllcgAAAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAEAAAPpAAAACwAAAAM=" ]),
      options
    )
  }
  public readonly fromJSON = {
    get_stats: this.txFromJSON<Stats>,
        get_credit: this.txFromJSON<i128>,
        get_prompt: this.txFromJSON<Option<PromptRecord>>,
        initialize: this.txFromJSON<Result<void>>,
        pay_prompt: this.txFromJSON<Result<PromptRecord>>,
        fund_credits: this.txFromJSON<Result<i128>>,
        consume_credit: this.txFromJSON<Result<i128>>,
        withdraw_credits: this.txFromJSON<Result<i128>>
  }
}