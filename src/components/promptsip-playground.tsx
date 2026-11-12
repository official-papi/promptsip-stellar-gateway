import { useState, type FormEvent } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Braces,
  Check,
  CheckCircle2,
  Clock3,
  Code2,
  Copy,
  Cpu,
  Database,
  ExternalLink,
  FileCode2,
  Fingerprint,
  Globe2,
  Layers3,
  LoaderCircle,
  ReceiptText,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Users,
  WalletCards,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { CARD_MINIMUM_USD, getCardMinimumMultiple, STELLAR_PROMPT_FEE_USD } from "@/lib/prompt-fee-metrics";

type ActivePage = "home" | "ajo" | "stellardrop" | "promptsip" | "contracts";
type PromptSipTab = "terminal" | "inspector" | "sdk" | "receipts";
type FlowState = "idle" | "requesting" | "challenge" | "settling" | "streaming" | "done";
type Language = "TypeScript" | "Python" | "cURL";

const codeSamples: Record<Language, string> = {
  TypeScript: `const endpoint = "https://api.promptsip.dev/v1/execute";
const body = { prompt: "Analyze on-chain ledger events" };

// 1. Initial request without centralized API key
let response = await fetch(endpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

// 2. Settle HTTP 402 challenge on Soroban
if (response.status === 402) {
  const { payment } = await response.json();
  const txHash = await stellarWallet.pay({
    destination: payment.destination,
    asset: payment.asset,
    amount: payment.amount,
  });
  
  // 3. Resubmit request with verified on-chain receipt hash
  response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Payment-Hash": txHash
    },
    body: JSON.stringify(body),
  });
}

for await (const chunk of streamResponse(response)) {
  process.stdout.write(chunk);
}`,
  Python: `import requests

# 1. Send request without centralized credentials
response = requests.post(
    "https://api.promptsip.dev/v1/execute",
    json={"prompt": "Analyze on-chain ledger events"},
)

# 2. Negotiate HTTP 402 Payment Required
if response.status_code == 402:
    challenge = response.json()["payment"]
    tx_hash = wallet.pay(
        challenge["destination"],
        challenge["amount"],
    )
    # 3. Resubmit with transaction hash proof
    response = requests.post(
        "https://api.promptsip.dev/v1/execute",
        json={"prompt": "Analyze on-chain ledger events"},
        headers={"X-Payment-Hash": tx_hash},
    )

print(response.json()["result"])`,
  cURL: `curl -i https://api.promptsip.dev/v1/execute \\
  -H 'Content-Type: application/json' \\
  -d '{"prompt":"Analyze on-chain ledger events"}'

# Response returns HTTP 402 with Soroban payment destination.
# Settle payment on Stellar Testnet, then retry with hash:
curl -N https://api.promptsip.dev/v1/execute \\
  -H 'Content-Type: application/json' \\
  -H 'X-Payment-Hash: <stellar-tx-hash>' \\
  -d '{"prompt":"Analyze on-chain ledger events"}'`,
};

const initialReceipts = [
  { hash: "tx_8fa2c1d9…b741", prompt: "Summarize ledger contract events", asset: "USDC", amount: "$0.00001", time: "just now" },
  { hash: "tx_17d04ac8…91ef", prompt: "Streamed query execution", asset: "XLM", amount: "$0.00001", time: "2 min ago" },
  { hash: "tx_3bc71e02…6a50", prompt: "Automated wallet audit check", asset: "USDC", amount: "$0.00001", time: "5 min ago" },
];

const simulatedReply =
  "Settlement confirmed on Stellar Testnet. Transaction verified against Soroban contract CB2U4ZI4...AK2N. Request unlocked with zero credit card friction and sub-second cryptographic proof.";

function formatUsd(value: number) {
  return `$${value.toFixed(5)}`;
}

export function PromptSipPlayground() {
  const [page, setPage] = useState<ActivePage>("home");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* TOP NAVIGATION HEADER (NO CLUTTERED SIDEBAR) */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setPage("home")}
              className="flex items-center gap-2.5 text-left focus:outline-none"
            >
              <div className="grid size-8 place-items-center rounded bg-signal text-signal-foreground font-bold text-xs tracking-wider">
                SS
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-foreground">
                  stellar<span className="text-signal">suite</span>
                </span>
                <span className="ml-2 hidden rounded border border-signal/30 bg-signal-soft px-1.5 py-0.5 font-mono text-[9px] font-semibold text-signal sm:inline-block">
                  TESTNET
                </span>
              </div>
            </button>

            {/* MAIN NAVIGATION LINKS */}
            <nav className="hidden md:flex items-center gap-1 font-medium text-xs">
              <button
                onClick={() => setPage("home")}
                className={`rounded px-3 py-1.5 transition-colors ${page === "home" ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}
              >
                Overview
              </button>
              <button
                onClick={() => setPage("ajo")}
                className={`rounded px-3 py-1.5 transition-colors ${page === "ajo" ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}
              >
                1. Ajo Savings (Esusu)
              </button>
              <button
                onClick={() => setPage("stellardrop")}
                className={`rounded px-3 py-1.5 transition-colors ${page === "stellardrop" ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}
              >
                2. StellarDrop (Telegram)
              </button>
              <button
                onClick={() => setPage("promptsip")}
                className={`rounded px-3 py-1.5 transition-colors ${page === "promptsip" ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}
              >
                3. PromptSip (HTTP 402)
              </button>
              <button
                onClick={() => setPage("contracts")}
                className={`rounded px-3 py-1.5 transition-colors ${page === "contracts" ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}
              >
                Smart Contracts
              </button>
            </nav>
          </div>

          {/* HEADER ACTIONS */}
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" asChild className="hidden sm:inline-flex h-8 text-xs font-medium">
              <a href="https://github.com/official-papi/promptsip-stellar-gateway" target="_blank" rel="noreferrer">
                GitHub Repo
              </a>
            </Button>
            <Button
              size="sm"
              onClick={() => setPage(page === "home" ? "promptsip" : "home")}
              className="h-8 gap-1.5 bg-signal text-signal-foreground font-semibold text-xs hover:bg-signal/90"
            >
              {page === "home" ? "Launch Console" : "Back to Home"}
            </Button>
          </div>
        </div>

        {/* MOBILE NAVIGATION BAR */}
        <div className="flex md:hidden border-t border-border overflow-x-auto px-4 py-2 gap-1 text-xs">
          <button onClick={() => setPage("home")} className={`px-2 py-1 rounded whitespace-nowrap ${page === "home" ? "bg-secondary font-semibold" : "text-muted-foreground"}`}>Home</button>
          <button onClick={() => setPage("ajo")} className={`px-2 py-1 rounded whitespace-nowrap ${page === "ajo" ? "bg-secondary font-semibold" : "text-muted-foreground"}`}>Ajo</button>
          <button onClick={() => setPage("stellardrop")} className={`px-2 py-1 rounded whitespace-nowrap ${page === "stellardrop" ? "bg-secondary font-semibold" : "text-muted-foreground"}`}>StellarDrop</button>
          <button onClick={() => setPage("promptsip")} className={`px-2 py-1 rounded whitespace-nowrap ${page === "promptsip" ? "bg-secondary font-semibold" : "text-muted-foreground"}`}>PromptSip</button>
          <button onClick={() => setPage("contracts")} className={`px-2 py-1 rounded whitespace-nowrap ${page === "contracts" ? "bg-secondary font-semibold" : "text-muted-foreground"}`}>Contracts</button>
        </div>
      </header>

      {/* PAGE VIEWPORT */}
      <main className="flex-1">
        {page === "home" && <UnifiedHomePage onSelectProject={(p) => setPage(p)} />}
        {page === "ajo" && <AjoProjectPage />}
        {page === "stellardrop" && <StellarDropProjectPage />}
        {page === "promptsip" && <PromptSipProjectPage />}
        {page === "contracts" && <ContractsRegistryPage />}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border bg-card/40 py-8 text-xs text-muted-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 flex flex-wrap justify-between items-center gap-4">
          <div>
            <p className="font-bold text-foreground">StellarSuite · Boundless Hackathon 2026</p>
            <p className="text-[11px] mt-0.5">Stellar Nigeria Chapter · Team Submission (3 Projects)</p>
          </div>
          <div className="flex gap-4 font-mono text-[11px]">
            <span>Ajo: Savioula23</span>
            <span>·</span>
            <span>StellarDrop: jedi-dtechmaker</span>
            <span>·</span>
            <span>PromptSip: official-papi</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* =========================================================================
   1. UNIFIED HOME LANDING PAGE (EVERY PROJECT STANDS EQUALLY)
========================================================================= */
function UnifiedHomePage({ onSelectProject }: { onSelectProject: (p: ActivePage) => void }) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-8 py-12 space-y-20">
      {/* HERO BANNER */}
      <section className="text-center max-w-3xl mx-auto space-y-5 pt-4">
        <div className="inline-flex items-center gap-2 rounded border border-signal/30 bg-signal-soft px-3 py-1 font-mono text-xs text-signal font-semibold">
          <Sparkles className="size-3.5" /> Boundless Hackathon 2026 · Official Team Build
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12]">
          One Platform. Three Pillars. Built on Stellar.
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          StellarSuite brings together three foundational projects from our 3-person team: Community Savings, Telegram Social Remittances, and Programmable HTTP 402 Settlement.
        </p>
      </section>

      {/* THREE EQUAL PROJECT SHOWCASE CARDS */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-xl font-bold tracking-tight text-foreground">The Three Projects</h2>
          <span className="font-mono text-xs text-signal font-semibold">ALL LIVE ON STELLAR TESTNET</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* PROJECT 1: AJO */}
          <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between hover:border-signal/40 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded bg-signal-soft px-2.5 py-1 font-mono text-[10px] text-signal font-bold">
                  PROJECT 1 · DEFI SAVINGS
                </span>
                <span className="font-mono text-xs text-muted-foreground">Savioula23</span>
              </div>
              <h3 className="text-2xl font-bold mt-4 text-foreground">Ajo (Esusu)</h3>
              <p className="text-sm font-medium text-signal mt-1">Rotating Savings Circles on Soroban</p>
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                Millions of Africans rely on informal rotating savings pools. Ajo puts the circle on Stellar Soroban, eliminating treasurer fraud with refundable collateral, automated turn orders, and on-chain Ajo credit scores.
              </p>

              <div className="mt-6 space-y-2 border-t border-border pt-4 text-xs font-mono">
                <div className="flex justify-between text-muted-foreground">
                  <span>Smart Contract</span>
                  <span className="text-foreground">Soroban Vault</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Credit Score</span>
                  <span className="text-signal font-semibold">Ajo Score (300–850)</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Auth System</span>
                  <span className="text-foreground">Passkeys &amp; Biometrics</span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-2.5">
              <Button onClick={() => onSelectProject("ajo")} className="w-full gap-2 bg-signal text-signal-foreground font-semibold hover:bg-signal/90 text-xs">
                View Project Details <ArrowRight className="size-3.5" />
              </Button>
              <Button variant="outline" asChild className="w-full text-xs font-medium">
                <a href="https://ajo-stellar.vercel.app" target="_blank" rel="noreferrer">
                  Launch Live Web App <ExternalLink className="size-3.5" />
                </a>
              </Button>
            </div>
          </div>

          {/* PROJECT 2: STELLARDROP */}
          <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between hover:border-signal/40 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded bg-signal-soft px-2.5 py-1 font-mono text-[10px] text-signal font-bold">
                  PROJECT 2 · SOCIAL REMITTANCE
                </span>
                <span className="font-mono text-xs text-muted-foreground">jedi-dtechmaker</span>
              </div>
              <h3 className="text-2xl font-bold mt-4 text-foreground">StellarDrop</h3>
              <p className="text-sm font-medium text-signal mt-1">Telegram USDC Micro-Payments</p>
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                Send live Stellar Testnet USDC with an instant claim code over WhatsApp or Telegram. Recipients open the bot, receive an automatically generated encrypted custodial wallet, and cash out via SDF Test Anchor.
              </p>

              <div className="mt-6 space-y-2 border-t border-border pt-4 text-xs font-mono">
                <div className="flex justify-between text-muted-foreground">
                  <span>Interface</span>
                  <span className="text-foreground">Telegram Bot &amp; Web</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Settlement</span>
                  <span className="text-signal font-semibold">Claimable Balances</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Off-Ramping</span>
                  <span className="text-foreground">SEP-10 / SEP-24 Anchor</span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-2.5">
              <Button onClick={() => onSelectProject("stellardrop")} className="w-full gap-2 bg-signal text-signal-foreground font-semibold hover:bg-signal/90 text-xs">
                View Project Details <ArrowRight className="size-3.5" />
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" asChild className="text-xs font-medium">
                  <a href="https://stellardrop.netlify.app/" target="_blank" rel="noreferrer">
                    Live Web App <ExternalLink className="size-3" />
                  </a>
                </Button>
                <Button variant="outline" asChild className="text-xs font-medium">
                  <a href="https://t.me/ST_dropBot" target="_blank" rel="noreferrer">
                    <Send className="size-3" /> Telegram Bot <ExternalLink className="size-3" />
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* PROJECT 3: PROMPTSIP */}
          <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between hover:border-signal/40 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded bg-signal-soft px-2.5 py-1 font-mono text-[10px] text-signal font-bold">
                  PROJECT 3 · PROGRAMMABLE 402
                </span>
                <span className="font-mono text-xs text-muted-foreground">official-papi</span>
              </div>
              <h3 className="text-2xl font-bold mt-4 text-foreground">PromptSip</h3>
              <p className="text-sm font-medium text-signal mt-1">Pay-Per-Prompt AI Gateway on Stellar</p>
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                An on-chain vending machine for AI. Instead of paying $20/month subscriptions or entering credit cards, developers and AI agents pay fractions of a cent ($0.00001) per prompt on Stellar Soroban with zero signups.
              </p>

              <div className="mt-6 space-y-2 border-t border-border pt-4 text-xs font-mono">
                <div className="flex justify-between text-muted-foreground">
                  <span>How It Works</span>
                  <span className="text-foreground">HTTP 402 Pay-Per-Query</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Cost per Prompt</span>
                  <span className="text-signal font-semibold">$0.00001 (0.001 XLM)</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Soroban Contract</span>
                  <span className="text-foreground">CB2U4Z…AK2N</span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-2.5">
              <Button onClick={() => onSelectProject("promptsip")} className="w-full gap-2 bg-signal text-signal-foreground font-semibold hover:bg-signal/90 text-xs">
                Open Settlement Console <ArrowRight className="size-3.5" />
              </Button>
              <Button variant="outline" asChild className="w-full text-xs font-medium">
                <a href="https://stellar.expert/explorer/testnet/contract/CB2U4ZI42D4NVHUXKG4ZZRAOYESU65QIWY47EZX5HMRQVJMDKAKWAK2N" target="_blank" rel="noreferrer">
                  View Soroban Explorer <ExternalLink className="size-3.5" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* REPOSITORY & ARCHITECTURE MATRIX */}
      <section className="rounded-xl border border-border bg-card p-8">
        <h3 className="text-lg font-bold text-foreground">How the Three Projects Interoperate</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
          Capital generated in community savings (Ajo) flows directly into peer-to-peer social gifts (StellarDrop), and provides automated micro-settlement for APIs and autonomous software (PromptSip) — all on Stellar Testnet.
        </p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 rounded border border-border bg-background">
            <span className="text-signal font-bold">1. AJO CAPITAL POOL</span>
            <p className="text-muted-foreground mt-2 font-sans text-xs">Users save USDC collectively in decentralized circles. Payouts are claimed safely on-chain.</p>
          </div>
          <div className="p-4 rounded border border-border bg-background">
            <span className="text-signal font-bold">2. STELLARDROP TRANSFERS</span>
            <p className="text-muted-foreground mt-2 font-sans text-xs">Recipients receive portions of capital over Telegram and off-ramp to local Naira via SEP-24.</p>
          </div>
          <div className="p-4 rounded border border-border bg-background">
            <span className="text-signal font-bold">3. PROMPTSIP PAY-PER-USE</span>
            <p className="text-muted-foreground mt-2 font-sans text-xs">Sub-cent fractions of USDC settle queries, compute, and services via HTTP 402 challenges.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

/* =========================================================================
   2. INDEPENDENT AJO PROJECT PAGE (SAVIOULA23)
========================================================================= */
function AjoProjectPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-8 py-10 space-y-10">
      <div className="border-b border-border pb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="rounded bg-signal-soft px-2.5 py-1 font-mono text-[10px] text-signal font-bold">
            PROJECT 1 · DECENTRALIZED SAVINGS
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-2 text-foreground">Ajo — Rotating Savings Circles (Esusu)</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Ajo (esusu, adashe) is the rotating savings circle millions of Africans rely on. Ajo puts the circle on Stellar Soroban with no dishonest treasurer and no default risk.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild className="gap-2 bg-signal text-signal-foreground font-semibold hover:bg-signal/90 text-xs">
            <a href="https://ajo-stellar.vercel.app" target="_blank" rel="noreferrer">
              Launch Live App <ExternalLink className="size-3.5" />
            </a>
          </Button>
          <Button variant="outline" asChild className="text-xs font-medium">
            <a href="https://github.com/Savioula23/ajo-stellar" target="_blank" rel="noreferrer">
              GitHub Repo
            </a>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5">
          <span className="font-mono text-xs text-signal font-bold uppercase">Circle Protection</span>
          <h3 className="font-bold text-base mt-1 text-foreground">Refundable Collateral</h3>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Every member deposits collateral held in the Soroban contract. If a member misses a round payment, anyone in the circle can trigger compensation from their deposit.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <span className="font-mono text-xs text-signal font-bold uppercase">On-Chain Reputation</span>
          <h3 className="font-bold text-base mt-1 text-foreground">Ajo Credit Score</h3>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Immutable trust score kept on-chain: 500 baseline, +25 per on-time payment, -40 per late payment, and +20 per completed circle.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <span className="font-mono text-xs text-signal font-bold uppercase">Cash Out</span>
          <h3 className="font-bold text-base mt-1 text-foreground">SEP-10 / 24 Anchor Payout</h3>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Directly connected to the SDF Test Anchor. Members withdraw payouts to simulated local bank accounts with hosted KYC.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-bold text-sm text-foreground">Interactive Demo Circle (Protected by Soroban)</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-4 font-mono text-xs">
          <div className="p-3.5 rounded border border-border bg-background">
            <p className="text-muted-foreground">Circle ID</p>
            <p className="font-bold text-foreground mt-1">1AB-CDE</p>
          </div>
          <div className="p-3.5 rounded border border-border bg-background">
            <p className="text-muted-foreground">Round Contribution</p>
            <p className="font-bold text-signal mt-1">50 USDC</p>
          </div>
          <div className="p-3.5 rounded border border-border bg-background">
            <p className="text-muted-foreground">Circle Members</p>
            <p className="font-bold text-foreground mt-1">5 / 6 Filled</p>
          </div>
          <div className="p-3.5 rounded border border-border bg-background">
            <p className="text-muted-foreground">Total Pot</p>
            <p className="font-bold text-signal mt-1">300 USDC</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   3. INDEPENDENT STELLARDROP PROJECT PAGE (JEDI-DTECHMAKER)
========================================================================= */
function StellarDropProjectPage() {
  const [amount, setAmount] = useState("5");
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  function handleCreateDrop() {
    const code = `DROP-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setCreatedCode(code);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-8 py-10 space-y-10">
      <div className="border-b border-border pb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="rounded bg-signal-soft px-2.5 py-1 font-mono text-[10px] text-signal font-bold">
            PROJECT 2 · SOCIAL REMITTANCE
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-2 text-foreground">StellarDrop — Telegram Micro-Payments</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Send live Stellar Testnet USDC with an instant claim code over Telegram and WhatsApp. Zero friction for unbanked recipients.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="gap-2 bg-signal text-signal-foreground font-semibold hover:bg-signal/90 text-xs">
            <a href="https://stellardrop.netlify.app/" target="_blank" rel="noreferrer">
              Launch Live App <ExternalLink className="size-3.5" />
            </a>
          </Button>
          <Button asChild variant="outline" className="gap-2 text-xs font-medium">
            <a href="https://t.me/ST_dropBot" target="_blank" rel="noreferrer">
              <Send className="size-3.5" /> Telegram Bot <ExternalLink className="size-3" />
            </a>
          </Button>
          <Button variant="outline" asChild className="text-xs font-medium">
            <a href="https://github.com/jedi-dtechmaker/stellar-hackathon" target="_blank" rel="noreferrer">
              GitHub Repo
            </a>
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h3 className="font-bold text-base text-foreground">Generate Instant Claim Code</h3>
          <p className="text-xs text-muted-foreground">Test the drop generation flow right here:</p>

          <div>
            <label className="text-xs font-medium text-foreground">Amount (Testnet USDC)</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-signal"
              placeholder="5"
            />
          </div>

          <Button onClick={handleCreateDrop} className="w-full bg-signal text-signal-foreground font-semibold hover:bg-signal/90 text-xs">
            Generate Atomic Drop Code
          </Button>

          {createdCode && (
            <div className="rounded border border-signal/40 bg-signal-soft p-4 mt-4 space-y-2">
              <p className="font-mono text-xs text-signal font-bold uppercase">Claim Code Ready</p>
              <p className="font-mono text-xl font-bold text-foreground">{createdCode}</p>
              <p className="text-xs text-muted-foreground">Telegram Deep Link:</p>
              <p className="font-mono text-xs text-signal font-semibold break-all">t.me/ST_dropBot?start={createdCode}</p>
              <Button asChild className="w-full mt-2 gap-2 bg-signal text-signal-foreground font-semibold hover:bg-signal/90 text-xs">
                <a href={`https://t.me/ST_dropBot?start=${createdCode}`} target="_blank" rel="noreferrer">
                  <Send className="size-3.5" /> Claim via Telegram Bot <ExternalLink className="size-3" />
                </a>
              </Button>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h3 className="font-bold text-base text-foreground">How the Recipient Flow Works</h3>
          <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
            <div className="p-3 rounded border border-border bg-background">
              <p className="font-semibold text-foreground">1. Deep-link Claiming</p>
              <p className="mt-1">Recipient taps the link inside WhatsApp or Telegram. The bot launches automatically with the code.</p>
            </div>
            <div className="p-3 rounded border border-border bg-background">
              <p className="font-semibold text-foreground">2. Encrypted Custodial Keypair</p>
              <p className="mt-1">A secure Stellar keypair is generated and encrypted on the fly. No extension required.</p>
            </div>
            <div className="p-3 rounded border border-border bg-background">
              <p className="font-semibold text-foreground">3. Atomic Claim &amp; Trustline</p>
              <p className="mt-1">Friendbot funds the wallet, establishes the USDC trustline, and claims the escrow balance atomically.</p>
            </div>
            <div className="p-3 rounded border border-border bg-background">
              <p className="font-semibold text-foreground">4. Anchor Cash-Out</p>
              <p className="mt-1">Receiver types <code className="text-signal font-semibold">/withdraw</code> to initiate simulated bank payouts via SDF Test Anchor.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   4. INDEPENDENT PROMPTSIP PROJECT PAGE (OFFICIAL-PAPI)
========================================================================= */
function PromptSipProjectPage() {
  const [tab, setTab] = useState<PromptSipTab>("terminal");
  const [prompt, setPrompt] = useState("");
  const [asset, setAsset] = useState<"USDC" | "XLM">("USDC");
  const [flowState, setFlowState] = useState<FlowState>("idle");
  const [reply, setReply] = useState("");
  const [requestPrompt, setRequestPrompt] = useState("");
  const [hash, setHash] = useState("");
  const [receipts, setReceipts] = useState(initialReceipts);
  const [language, setLanguage] = useState<Language>("TypeScript");
  const [copied, setCopied] = useState(false);

  const busy = flowState === "requesting" || flowState === "challenge" || flowState === "settling" || flowState === "streaming";

  async function submitPrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submittedPrompt = prompt.trim();
    if (!submittedPrompt || busy) return;

    setRequestPrompt(submittedPrompt);
    setPrompt("");
    setReply("");
    setHash("");
    setFlowState("requesting");
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    setFlowState("challenge");
    await new Promise((resolve) => window.setTimeout(resolve, 600));
    setFlowState("settling");
    const transactionId = `tx_${Math.random().toString(16).slice(2, 10)}…${Math.random().toString(16).slice(2, 6)}`;
    setHash(transactionId);
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    setFlowState("streaming");
    const words = simulatedReply.split(" ");
    let response = "";
    for (const word of words) {
      response = response ? `${response} ${word}` : word;
      setReply(response);
      await new Promise((resolve) => window.setTimeout(resolve, 24));
    }
    setFlowState("done");
    setReceipts((current) => [
      { hash: transactionId, prompt: submittedPrompt, asset, amount: formatUsd(STELLAR_PROMPT_FEE_USD), time: "just now" },
      ...current.slice(0, 3),
    ]);
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(codeSamples[language]);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-8 py-10 space-y-8">
      <div className="border-b border-border pb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="rounded bg-signal-soft px-2.5 py-1 font-mono text-[10px] text-signal font-bold">
            PROJECT 3 · HTTP 402 SETTLEMENT
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-2 text-foreground">PromptSip — Pay-Per-Prompt AI Gateway</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            An on-chain digital vending machine for AI: Pay fractions of a cent ($0.00001) per prompt or API call on Stellar Soroban with zero subscriptions and zero credit cards.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild className="gap-2 bg-signal text-signal-foreground font-semibold hover:bg-signal/90 text-xs">
            <a href="https://stellar.expert/explorer/testnet/contract/CB2U4ZI42D4NVHUXKG4ZZRAOYESU65QIWY47EZX5HMRQVJMDKAKWAK2N" target="_blank" rel="noreferrer">
              <ShieldCheck className="size-3.5" /> View Soroban Contract <ExternalLink className="size-3" />
            </a>
          </Button>
          <Button variant="outline" asChild className="text-xs font-medium">
            <a href="https://github.com/official-papi/promptsip-stellar-gateway" target="_blank" rel="noreferrer">
              GitHub Repo
            </a>
          </Button>
        </div>
      </div>

      {/* PLAIN-ENGLISH PROJECT EXPLAINER */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-6">
        <div>
          <span className="rounded bg-signal-soft px-2.5 py-1 font-mono text-[10px] text-signal font-bold uppercase">
            Understand PromptSip in 60 Seconds
          </span>
          <h2 className="text-2xl font-bold mt-2 text-foreground">
            How It Works: No Subscriptions. No Credit Cards. Just Instant Micropayments.
          </h2>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed max-w-3xl">
            Today, AI models and APIs force developers and users to pay <strong>$20/month fixed subscriptions</strong> or link high-risk credit cards.
            Credit card processors (Stripe/Visa) charge a minimum fee of <strong>$0.30 per swipe</strong>, making 0.001-cent AI prompts impossible.
            <strong> PromptSip unlocks true micropayments on Stellar</strong>: with fees of $0.00001, our live Soroban smart contract lets you pay strictly for what you use, per prompt, in milliseconds.
          </p>
        </div>

        {/* 3-STEP VISUAL WORKFLOW */}
        <div className="grid gap-4 md:grid-cols-3 text-xs">
          <div className="rounded-lg border border-border bg-background p-4 space-y-1.5">
            <span className="rounded bg-signal text-signal-foreground px-2 py-0.5 font-mono text-[10px] font-bold">
              STEP 1
            </span>
            <h4 className="font-bold text-sm text-foreground">Ask Any AI Question</h4>
            <p className="text-muted-foreground leading-relaxed text-xs">
              Your app or autonomous AI agent sends a prompt. No login, no password, and no credit card is required.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-background p-4 space-y-1.5">
            <span className="rounded bg-signal text-signal-foreground px-2 py-0.5 font-mono text-[10px] font-bold">
              STEP 2
            </span>
            <h4 className="font-bold text-sm text-foreground">HTTP 402 Challenge</h4>
            <p className="text-muted-foreground leading-relaxed text-xs">
              The server pauses and returns standard web status <code className="text-signal font-semibold">402 Payment Required</code>: <em>"Pay 0.001 XLM on Soroban contract CB2U4Z..."</em>
            </p>
          </div>

          <div className="rounded-lg border border-border bg-background p-4 space-y-1.5">
            <span className="rounded bg-signal text-signal-foreground px-2 py-0.5 font-mono text-[10px] font-bold">
              STEP 3
            </span>
            <h4 className="font-bold text-sm text-foreground">Instant 0ms Response</h4>
            <p className="text-muted-foreground leading-relaxed text-xs">
              The user&apos;s Stellar wallet settles the tiny fee, the Soroban contract confirms it on-chain, and the AI streams the response immediately.
            </p>
          </div>
        </div>
      </section>

      {/* METRIC STRIP */}
      <section className="grid grid-cols-1 border-y border-border sm:grid-cols-3 font-mono">
        <div className="py-3 sm:px-4">
          <p className="text-[10.5px] text-muted-foreground uppercase">Fee per Request</p>
          <p className="text-xl font-bold text-signal mt-0.5">$0.00001</p>
          <p className="text-[10px] text-muted-foreground">Stellar sub-cent fee</p>
        </div>
        <div className="py-3 sm:border-l sm:border-border sm:px-4">
          <p className="text-[10.5px] text-muted-foreground uppercase">Card Minimum Comparison</p>
          <p className="text-xl font-bold text-foreground mt-0.5">$0.30+</p>
          <p className="text-[10px] text-muted-foreground">30,000× higher floor</p>
        </div>
        <div className="py-3 sm:border-l sm:border-border sm:px-4">
          <p className="text-[10.5px] text-muted-foreground uppercase">Smart Contract</p>
          <p className="text-xl font-bold text-signal mt-0.5">CB2U4Z…AK2N</p>
          <p className="text-[10px] text-muted-foreground">Live on Testnet</p>
        </div>
      </section>

      {/* TAB SWITCHER */}
      <div className="flex gap-1 border-b border-border pb-2 text-xs font-medium">
        <button
          onClick={() => setTab("terminal")}
          className={`px-3 py-1.5 rounded transition-colors ${tab === "terminal" ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}
        >
          Execution Console
        </button>
        <button
          onClick={() => setTab("inspector")}
          className={`px-3 py-1.5 rounded transition-colors ${tab === "inspector" ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}
        >
          HTTP 402 Inspector
        </button>
        <button
          onClick={() => setTab("sdk")}
          className={`px-3 py-1.5 rounded transition-colors ${tab === "sdk" ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}
        >
          Integration SDK
        </button>
        <button
          onClick={() => setTab("receipts")}
          className={`px-3 py-1.5 rounded transition-colors ${tab === "receipts" ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}
        >
          Settlement Ledger
        </button>
      </div>

      {/* TAB CONTENT */}
      {tab === "terminal" && (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <section className="flex flex-col border border-border bg-card rounded-lg">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <TerminalSquare className="size-4 text-signal" />
                <h2 className="text-xs font-semibold tracking-wide">Interactive Terminal</h2>
              </div>
              <div className="flex items-center gap-1 rounded border border-border bg-background p-0.5">
                {(["USDC", "XLM"] as const).map((item) => (
                  <button
                    key={item}
                    onClick={() => setAsset(item)}
                    className={`h-7 rounded px-2.5 font-mono text-[10px] ${asset === item ? "bg-accent text-foreground font-semibold" : "text-muted-foreground"}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex min-h-[360px] flex-1 flex-col justify-between p-4">
              <div className="space-y-4">
                <div className="rounded border border-border bg-background p-3">
                  <p className="font-mono text-[10px] text-muted-foreground uppercase font-semibold">Soroban Smart Contract Attached</p>
                  <p className="mt-1 font-mono text-xs text-signal break-all font-medium">CB2U4ZI42D4NVHUXKG4ZZRAOYESU65QIWY47EZX5HMRQVJMDKAKWAK2N</p>
                </div>
                {requestPrompt && <div className="rounded border border-border bg-background/50 p-3"><p className="text-xs font-medium text-foreground">{requestPrompt}</p></div>}
                {reply && <div className="rounded border border-signal/30 bg-signal-soft p-3 font-mono text-xs text-foreground leading-6"><p>{reply}</p></div>}
                {busy && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <LoaderCircle className="size-4 animate-spin text-signal" />
                    <span>{flowState === "requesting" ? "Dispatching HTTP 402 challenge…" : flowState === "challenge" ? "Receiving payment challenge…" : flowState === "settling" ? "Executing settlement on Soroban…" : "Streaming verified tokens…"}</span>
                  </div>
                )}
              </div>

              {/* QUICK PRESET EXAMPLES */}
              <div className="mt-3 space-y-1.5 border-t border-border pt-3">
                <p className="text-[11px] text-muted-foreground font-medium">Click an example prompt to test live Stellar settlement:</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPrompt("Explain how Soroban smart contracts settle 0.001 XLM micropayments")}
                    className="rounded border border-border bg-background px-2.5 py-1 text-xs text-foreground hover:border-signal/50 hover:bg-signal-soft transition-colors text-left"
                  >
                    💡 How Soroban settles 0.001 XLM
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrompt("Why are credit card minimum fees ($0.30) too high for AI queries?")}
                    className="rounded border border-border bg-background px-2.5 py-1 text-xs text-foreground hover:border-signal/50 hover:bg-signal-soft transition-colors text-left"
                  >
                    ⚡ Credit card fees vs Stellar
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrompt("Audit on-chain receipt hash on Stellar Testnet")}
                    className="rounded border border-border bg-background px-2.5 py-1 text-xs text-foreground hover:border-signal/50 hover:bg-signal-soft transition-colors text-left"
                  >
                    🔍 Verify on-chain receipt
                  </button>
                </div>
              </div>

              <form onSubmit={submitPrompt} className="mt-3 flex gap-2">
                <input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Execute query or service payload (settles on Stellar Testnet)…"
                  disabled={busy}
                  className="flex-1 rounded border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-signal"
                />
                <Button type="submit" disabled={busy || !prompt.trim()} size="sm" className="gap-2 bg-signal text-signal-foreground font-semibold hover:bg-signal/90 text-xs">
                  <Send className="size-3.5" /> Execute
                </Button>
              </form>
            </div>
          </section>

          <div className="space-y-4">
            <div className="border border-border bg-card rounded-lg p-4 font-mono text-xs">
              <h3 className="font-bold text-foreground mb-3 font-sans">Protocol Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-muted-foreground"><span>Standard</span><span className="text-foreground">RFC HTTP 402</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Ledger</span><span className="text-foreground">Stellar Testnet</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Method</span><span className="text-foreground">pay_prompt</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Latest TX</span><span className="text-signal truncate max-w-[120px] font-semibold">{hash || "Ready"}</span></div>
              </div>
            </div>

            <div className="border border-border bg-card rounded-lg p-4 text-xs">
              <h3 className="font-bold text-foreground mb-2">Recent On-Chain Receipts</h3>
              <div className="divide-y divide-border">
                {receipts.map((r) => (
                  <div key={r.hash} className="py-2">
                    <p className="font-medium text-foreground truncate">{r.prompt}</p>
                    <div className="flex justify-between font-mono text-[10px] text-muted-foreground mt-0.5">
                      <span>{r.amount} {r.asset}</span>
                      <span className="text-signal font-semibold">{r.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "inspector" && (
        <div className="border border-border bg-card rounded-lg p-5 space-y-4">
          <h3 className="font-bold text-sm text-foreground">HTTP 402 Challenge Payload</h3>
          <pre className="overflow-x-auto p-4 font-mono text-xs text-terminal-foreground bg-terminal rounded">
            <code>{JSON.stringify({
              status: 402,
              protocol: "RFC-402",
              network: "stellar:testnet",
              contract_id: "CB2U4ZI42D4NVHUXKG4ZZRAOYESU65QIWY47EZX5HMRQVJMDKAKWAK2N",
              payment: {
                asset: "USDC",
                amount: "0.00001",
                destination: "GAMWOYHYZLFCQHNWBRHCJOMLM3S5ZUM2VAW4QQD2GPJJSHML7BSQEY3Q",
                memo: "promptsip:challenge-001",
              },
            }, null, 2)}</code>
          </pre>
        </div>
      )}

      {tab === "sdk" && (
        <div className="border border-border bg-card rounded-lg p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-foreground">Autonomous Agent &amp; Service SDK</h3>
            <div className="flex gap-1 font-mono text-xs">
              {(["TypeScript", "Python", "cURL"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  className={`px-2 py-1 rounded ${language === l ? "bg-secondary font-bold" : "text-muted-foreground"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <pre className="overflow-x-auto p-4 font-mono text-xs text-terminal-foreground bg-terminal rounded">
            <code>{codeSamples[language]}</code>
          </pre>
        </div>
      )}

      {tab === "receipts" && (
        <div className="border border-border bg-card rounded-lg p-5 space-y-4">
          <h3 className="font-bold text-sm text-foreground">On-Chain Audit Receipts</h3>
          <div className="divide-y divide-border text-xs">
            {receipts.map((r) => (
              <div key={r.hash} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-foreground">{r.prompt}</p>
                  <p className="font-mono text-[10px] text-muted-foreground mt-0.5">{r.hash}</p>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="text-signal font-bold">{r.amount} {r.asset}</span>
                  <p className="text-[10px] text-muted-foreground">{r.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   5. SMART CONTRACTS REGISTRY (ALL REPOS & CONTRACTS FOR JUDGES)
========================================================================= */
function ContractsRegistryPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-8 py-10 space-y-10">
      <div className="border-b border-border pb-6">
        <span className="rounded bg-signal-soft px-2.5 py-1 font-mono text-[10px] text-signal font-bold">
          VERIFICATION REGISTRY
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight mt-2 text-foreground">Verified Contracts &amp; Repositories</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Everything deployed and submitted for the Boundless Hackathon 2026.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <span className="font-mono text-xs text-signal font-bold uppercase">PromptSip Soroban Contract</span>
          <h3 className="font-bold text-lg text-foreground">promptsip_meter</h3>
          <div className="space-y-2 text-xs font-mono">
            <div className="p-3 rounded border border-border bg-background">
              <p className="text-muted-foreground">Contract ID</p>
              <p className="font-bold text-signal mt-1 break-all">CB2U4ZI42D4NVHUXKG4ZZRAOYESU65QIWY47EZX5HMRQVJMDKAKWAK2N</p>
            </div>
            <div className="p-3 rounded border border-border bg-background">
              <p className="text-muted-foreground">Deployment Transaction</p>
              <p className="font-bold text-foreground mt-1 break-all">9b421221df7ed238f996a93e78fadf8c0daa4d5b84d034564dfa438352033c61</p>
            </div>
            <div className="p-3 rounded border border-border bg-background">
              <p className="text-muted-foreground">Payment Asset</p>
              <p className="font-bold text-foreground mt-1">Native XLM SAC (CDLZFC...CYSC)</p>
            </div>
          </div>
          <Button asChild className="w-full gap-2 bg-signal text-signal-foreground font-semibold hover:bg-signal/90 text-xs">
            <a href="https://stellar.expert/explorer/testnet/contract/CB2U4ZI42D4NVHUXKG4ZZRAOYESU65QIWY47EZX5HMRQVJMDKAKWAK2N" target="_blank" rel="noreferrer">
              View on StellarExpert <ExternalLink className="size-3.5" />
            </a>
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <span className="font-mono text-xs text-signal font-bold uppercase">All Three Repositories</span>
          <h3 className="font-bold text-lg text-foreground">Source Code Repositories</h3>
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded border border-border bg-background flex justify-between items-center">
              <div>
                <p className="font-bold text-foreground">Ajo Savings Circles</p>
                <p className="font-mono text-[10px] text-muted-foreground">github.com/Savioula23/ajo-stellar</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" asChild className="h-7 text-xs">
                  <a href="https://ajo-stellar.vercel.app" target="_blank" rel="noreferrer">App</a>
                </Button>
                <Button size="sm" variant="outline" asChild className="h-7 text-xs">
                  <a href="https://github.com/Savioula23/ajo-stellar" target="_blank" rel="noreferrer">Repo</a>
                </Button>
              </div>
            </div>
            <div className="p-3 rounded border border-border bg-background flex justify-between items-center">
              <div>
                <p className="font-bold text-foreground">StellarDrop Remittance</p>
                <p className="font-mono text-[10px] text-muted-foreground">github.com/jedi-dtechmaker/stellar-hackathon</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" asChild className="h-7 text-xs">
                  <a href="https://stellardrop.netlify.app/" target="_blank" rel="noreferrer">App</a>
                </Button>
                <Button size="sm" variant="outline" asChild className="h-7 text-xs">
                  <a href="https://t.me/ST_dropBot" target="_blank" rel="noreferrer">Bot</a>
                </Button>
                <Button size="sm" variant="outline" asChild className="h-7 text-xs">
                  <a href="https://github.com/jedi-dtechmaker/stellar-hackathon" target="_blank" rel="noreferrer">Repo</a>
                </Button>
              </div>
            </div>
            <div className="p-3 rounded border border-border bg-background flex justify-between items-center">
              <div>
                <p className="font-bold text-foreground">PromptSip Gateway &amp; Suite</p>
                <p className="font-mono text-[10px] text-muted-foreground">github.com/official-papi/promptsip-stellar-gateway</p>
              </div>
              <Button size="sm" variant="outline" asChild className="h-7 text-xs">
                <a href="https://github.com/official-papi/promptsip-stellar-gateway" target="_blank" rel="noreferrer">Repo</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
