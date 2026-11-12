# PromptSip Stellar Gateway

Build PromptSip: an HTTP 402 Payment Required AI micropayment gateway and developer playground on Stellar. 

It allows unbanked developers and autonomous AI agents to pay per prompt in sub-cent micropayments on Stellar (XLM / USDC) with zero credit cards, API keys, or subscriptions.

Key features:
1. Interactive AI Terminal & Chat: Test prompt submissions that trigger an HTTP 402 Payment Required response, auto-clear via connected Stellar testnet wallet (Freighter wallet or instant in-browser testnet burner keypair with friendbot funding), and stream AI response tokens immediately upon settlement.
2. HTTP 402 Protocol Inspector: A developer inspect view showing the raw HTTP request/response headers (402 status, Stellar challenge payload, transaction envelope, instant ledger confirmation hash).
3. Agent Integration & Code Generator: Ready-to-copy code snippets (Python, TypeScript, cURL) showing how autonomous agents can automatically negotiate and pay the 402 challenge.
4. Ledger Telemetry & Cost Dashboard: Live fee metrics comparing Stellar's sub-cent cost ($0.00001) against credit card minimums ($0.30+), transaction latency, and recent streaming receipts.
5. Sleek cyberpunk / modern developer UI with dark mode, high contrast, and smooth animations fitting a top-tier hackathon project.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/63fb0113-0fc7-46a9-a5ed-47a3420dac4d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
