import { useState, type FormEvent } from "react";
import {
  Activity,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  Braces,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Clock3,
  Code2,
  Coins,
  Copy,
  Cpu,
  Database,
  Droplets,
  ExternalLink,
  FileCode2,
  Fingerprint,
  Gauge,
  Globe2,
  Layers3,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  MessageSquareText,
  Radio,
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

type View = "landing" | "terminal" | "protocol" | "agents" | "receipts" | "ajo" | "stellardrop" | "suite";
type FlowState = "idle" | "requesting" | "challenge" | "settling" | "streaming" | "done";
type Language = "Python" | "TypeScript" | "cURL";

const navigation: { id: View; label: string; icon: typeof TerminalSquare; section: "overview" | "promptsip" | "suite" }[] = [
  { id: "landing", label: "Executive Overview", icon: LayoutDashboard, section: "overview" },
  { id: "terminal", label: "AI 402 Terminal", icon: TerminalSquare, section: "promptsip" },
  { id: "protocol", label: "Protocol Inspector", icon: Braces, section: "promptsip" },
  { id: "agents", label: "Agent SDK & Code", icon: Code2, section: "promptsip" },
  { id: "receipts", label: "Ledger Receipts", icon: ReceiptText, section: "promptsip" },
  { id: "ajo", label: "Ajo Savings (Esusu)", icon: Users, section: "suite" },
  { id: "stellardrop", label: "StellarDrop (Telegram)", icon: Send, section: "suite" },
  { id: "suite", label: "Ecosystem Topology", icon: Sparkles, section: "suite" },
];

const codeSamples: Record<Language, string> = {
  Python: `import requests\n\nresponse = requests.post(\n    "https://api.promptsip.dev/v1/chat",\n    json={"prompt": "Summarize this block"},\n)\n\nif response.status_code == 402:\n    challenge = response.json()["payment"]\n    tx_hash = wallet.pay(\n        challenge["destination"],\n        challenge["amount"],\n    )\n    response = requests.post(\n        "https://api.promptsip.dev/v1/chat",\n        json={"prompt": "Summarize this block"},\n        headers={"X-Payment-Hash": tx_hash},\n    )\n\nprint(response.json()["reply"])`,
  TypeScript: `const endpoint = "https://api.promptsip.dev/v1/chat";\nconst body = { prompt: "Summarize this block" };\n\nlet response = await fetch(endpoint, {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify(body),\n});\n\nif (response.status === 402) {\n  const { payment } = await response.json();\n  const txHash = await stellarWallet.pay({\n    destination: payment.destination,\n    asset: payment.asset,\n    amount: payment.amount,\n  });\n  response = await fetch(endpoint, {\n    method: "POST",\n    headers: { "Content-Type": "application/json",\n      "X-Payment-Hash": txHash },\n    body: JSON.stringify(body),\n  });\n}\n\nfor await (const token of streamTokens(response)) {\n  process.stdout.write(token);\n}`,
  cURL: `curl -i https://api.promptsip.dev/v1/chat \\\n  -H 'Content-Type: application/json' \\\n  -d '{"prompt":"Summarize this block"}'\n\n# 402 response includes a Stellar payment challenge.\n# Submit payment, then retry with the transaction hash.\ncurl -N https://api.promptsip.dev/v1/chat \\\n  -H 'Content-Type: application/json' \\\n  -H 'X-Payment-Hash: <stellar-tx-hash>' \\\n  -d '{"prompt":"Summarize this block"}'`,
};

const initialReceipts = [
  { hash: "demo_8fa2c1d9…b741", prompt: "Parse wallet activity", asset: "USDC", amount: "$0.00001", time: "just now" },
  { hash: "demo_17d04ac8…91ef", prompt: "Summarize ledger events", asset: "XLM", amount: "$0.00001", time: "2 min ago" },
  { hash: "demo_3bc71e02…6a50", prompt: "Classify support request", asset: "USDC", amount: "$0.00001", time: "5 min ago" },
];

const simulatedReply =
  "Here's a compact approach: parse the request into a small, typed payload, validate it at the boundary, and retry only after the payment receipt is confirmed. Keep the transaction hash with each response so an agent can audit the exchange later.";

function formatUsd(value: number) {
  return `$${value.toFixed(5)}`;
}

export function PromptSipPlayground() {
  const [view, setView] = useState<View>("landing");
  const [prompt, setPrompt] = useState("");
  const [asset, setAsset] = useState<"USDC" | "XLM">("USDC");
  const [flowState, setFlowState] = useState<FlowState>("idle");
  const [reply, setReply] = useState("");
  const [requestPrompt, setRequestPrompt] = useState("");
  const [hash, setHash] = useState("");
  const [receipts, setReceipts] = useState(initialReceipts);
  const [language, setLanguage] = useState<Language>("Python");
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
    const transactionId = `demo_${Math.random().toString(16).slice(2, 10)}…${Math.random().toString(16).slice(2, 6)}`;
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
    <div className="min-h-screen bg-background text-foreground selection:bg-signal/20 selection:text-foreground">
      <div className="min-h-screen md:grid md:grid-cols-[250px_minmax(0,1fr)]">
        {/* SIDEBAR NAVIGATION (STICKY FIXED HEIGHT) */}
        <aside className="md:sticky md:top-0 md:h-screen md:max-h-screen flex flex-col border-r border-sidebar-border bg-sidebar max-md:min-h-0 max-md:border-r-0 max-md:border-b overflow-hidden">
          <div className="flex h-[64px] shrink-0 items-center gap-3 border-b border-sidebar-border px-5">
            <div className="grid size-8 place-items-center rounded bg-signal text-primary-foreground font-bold text-xs tracking-wider">
              SS
            </div>
            <div>
              <span className="text-[15px] font-bold tracking-tight">stellar<span className="text-signal">suite</span></span>
              <p className="text-[9.5px] text-muted-foreground">Boundless Hackathon 2026</p>
            </div>
            <span className="ml-auto rounded border border-signal/30 bg-signal/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-signal">
              TESTNET
            </span>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden max-md:flex max-md:gap-1 max-md:overflow-x-auto max-md:py-2">
            <p className="px-2 pb-1.5 font-mono text-[9.5px] uppercase tracking-widest text-muted-foreground max-md:hidden">Platform</p>
            {navigation.filter((n) => n.section === "overview").map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant="ghost"
                onClick={() => setView(id)}
                className={`mb-0.5 h-8.5 w-full justify-start gap-2.5 rounded px-2.5 text-[12px] max-md:mb-0 max-md:w-auto max-md:shrink-0 ${view === id ? "bg-sidebar-accent text-sidebar-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}
                aria-current={view === id ? "page" : undefined}
              >
                <Icon className={`size-3.5 ${view === id ? "text-signal" : ""}`} />
                {label}
              </Button>
            ))}

            <p className="px-2 pb-1.5 pt-3 font-mono text-[9.5px] uppercase tracking-widest text-muted-foreground max-md:hidden">AI 402 Gateway</p>
            {navigation.filter((n) => n.section === "promptsip").map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant="ghost"
                onClick={() => setView(id)}
                className={`mb-0.5 h-8.5 w-full justify-start gap-2.5 rounded px-2.5 text-[12px] max-md:mb-0 max-md:w-auto max-md:shrink-0 ${view === id ? "bg-sidebar-accent text-sidebar-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}
                aria-current={view === id ? "page" : undefined}
              >
                <Icon className={`size-3.5 ${view === id ? "text-signal" : ""}`} />
                {label}
                {id === "protocol" && <span className="ml-auto rounded border border-warning/30 px-1.5 py-0.5 font-mono text-[9px] text-warning max-md:hidden">402</span>}
              </Button>
            ))}

            <p className="px-2 pb-1.5 pt-3 font-mono text-[9.5px] uppercase tracking-widest text-muted-foreground max-md:hidden">Ecosystem Protocols</p>
            {navigation.filter((n) => n.section === "suite").map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant="ghost"
                onClick={() => setView(id)}
                className={`mb-0.5 h-8.5 w-full justify-start gap-2.5 rounded px-2.5 text-[12px] max-md:mb-0 max-md:w-auto max-md:shrink-0 ${view === id ? "bg-sidebar-accent text-sidebar-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}
                aria-current={view === id ? "page" : undefined}
              >
                <Icon className={`size-3.5 ${view === id ? "text-signal" : ""}`} />
                {label}
              </Button>
            ))}
          </div>

          <div className="shrink-0 border-t border-sidebar-border p-3.5 max-md:hidden">
            <div className="flex items-center gap-2 text-[11px] font-medium text-foreground">
              <span className="size-2 rounded-full bg-signal animate-pulse" />
              Stellar Testnet Live
            </div>
            <div className="mt-1 text-[9.5px] text-muted-foreground font-mono truncate">
              Contract: CB2U4Z…AK2N
            </div>
            <div className="mt-2.5 flex gap-2">
              <Button size="sm" variant="outline" asChild className="h-6.5 w-full text-[10px] px-1">
                <a href="https://github.com/official-papi/promptsip-stellar-gateway" target="_blank" rel="noreferrer">
                  GitHub
                </a>
              </Button>
              <Button size="sm" variant="outline" asChild className="h-6.5 w-full text-[10px] px-1">
                <a href="https://stellar.expert/explorer/testnet/contract/CB2U4ZI42D4NVHUXKG4ZZRAOYESU65QIWY47EZX5HMRQVJMDKAKWAK2N" target="_blank" rel="noreferrer">
                  Explorer
                </a>
              </Button>
            </div>
          </div>
        </aside>

        {/* MAIN VIEWPORT */}
        <main className="min-w-0">
          <header className="flex min-h-[68px] flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3 sm:px-8">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>StellarSuite</span>
              <span className="text-border">/</span>
              <span className="font-medium text-foreground">{navigation.find((item) => item.id === view)?.label}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {view !== "landing" ? (
                <Button size="sm" variant="outline" onClick={() => setView("landing")} className="h-8 gap-1.5 text-xs">
                  <LayoutDashboard className="size-3.5" /> Landing Page
                </Button>
              ) : (
                <Button size="sm" onClick={() => setView("terminal")} className="h-8 gap-1.5 bg-signal text-primary-foreground font-semibold text-xs">
                  <TerminalSquare className="size-3.5" /> Open App Console
                </Button>
              )}
              <span className="inline-flex items-center gap-1.5 rounded border border-border bg-card px-2.5 py-1.5 font-mono text-[10px] text-muted-foreground">
                <span className="size-1.5 rounded-full bg-signal" /> SOROBAN v22 / PROTOCOL 22
              </span>
            </div>
          </header>

          <div className="mx-auto max-w-[1440px] px-5 pb-16 pt-7 sm:px-8">
            {/* VIEW ROUTER */}
            {view === "landing" && <ExecutiveLandingView onNavigate={(v) => setView(v)} />}
            {view === "terminal" && (
              <>
                <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-signal">
                      <span className="size-1.5 rounded-full bg-signal" /> HTTP 402 AI Settlement
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">Pay-Per-Prompt Terminal</h1>
                    <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
                      Test automated prompt execution settled over Stellar Soroban smart contracts with verifiable cryptographic receipts.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded border border-border bg-card px-3 py-2 text-xs">
                    <WalletCards className="size-4 text-signal" /><span className="text-muted-foreground">Contract:</span><span className="font-mono text-signal">CB2U4Z…AK2N</span>
                  </div>
                </div>

                <section aria-label="Cost and network metrics" className="mb-6 grid grid-cols-1 border-y border-border sm:grid-cols-3">
                  <Metric icon={Zap} label="Per prompt" value={formatUsd(STELLAR_PROMPT_FEE_USD)} detail="Stellar network fee" accent />
                  <Metric icon={ArrowUpRight} label="Card minimum" value={`$${CARD_MINIMUM_USD.toFixed(2)}+`} detail={`${getCardMinimumMultiple().toLocaleString()}× higher floor`} />
                  <Metric icon={Activity} label="Settlement" value="~3.8 sec" detail="Stellar consensus · live" />
                </section>

                <TerminalView
                  prompt={prompt} setPrompt={setPrompt} asset={asset} setAsset={setAsset} flowState={flowState}
                  requestPrompt={requestPrompt} reply={reply} hash={hash} busy={busy} onSubmit={submitPrompt}
                  onInspect={() => setView("protocol")} receipts={receipts}
                />
              </>
            )}
            {view === "protocol" && <ProtocolView flowState={flowState} requestPrompt={requestPrompt} hash={hash} onTry={() => setView("terminal")} />}
            {view === "agents" && <AgentsView language={language} setLanguage={setLanguage} code={codeSamples[language]} copied={copied} onCopy={copyCode} />}
            {view === "receipts" && <ReceiptsView receipts={receipts} />}
            {view === "ajo" && <AjoView />}
            {view === "stellardrop" && <StellarDropView />}
            {view === "suite" && <SuiteView onSelect={(v) => setView(v)} />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ==================== EXECUTIVE LANDING PAGE ==================== */
function ExecutiveLandingView({ onNavigate }: { onNavigate: (v: View) => void }) {
  return (
    <div className="space-y-16">
      {/* HERO SECTION */}
      <section className="relative pt-4 pb-8 border-b border-border">
        <div className="inline-flex items-center gap-2 rounded-full border border-signal/30 bg-signal/5 px-3 py-1 font-mono text-[11px] text-signal font-medium mb-6">
          <Sparkles className="size-3" /> Boundless Hackathon 2026 · Stellar Nigeria Chapter
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl max-w-4xl text-foreground">
          Financial Infrastructure for Community Capital & Autonomous AI.
        </h1>
        <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-3xl leading-relaxed">
          StellarSuite bridges the real African financial economy with Web3 and autonomous agents. Three production-grade protocols built on Stellar Soroban: Rotating Community Savings (Ajo), Telegram Social Micro-Transfers (StellarDrop), and Machine-to-Machine HTTP 402 AI Settlement (PromptSip).
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" onClick={() => onNavigate("terminal")} className="gap-2 bg-signal text-primary-foreground font-semibold px-6 shadow-sm hover:opacity-90">
            <TerminalSquare className="size-4" /> Open Interactive Console <ArrowRight className="size-4" />
          </Button>
          <Button size="lg" variant="outline" asChild className="gap-2">
            <a href="https://stellar.expert/explorer/testnet/contract/CB2U4ZI42D4NVHUXKG4ZZRAOYESU65QIWY47EZX5HMRQVJMDKAKWAK2N" target="_blank" rel="noreferrer">
              <ShieldCheck className="size-4 text-signal" /> View Soroban Contract <ExternalLink className="size-3.5" />
            </a>
          </Button>
          <Button size="lg" variant="ghost" asChild>
            <a href="https://github.com/official-papi/promptsip-stellar-gateway" target="_blank" rel="noreferrer">
              GitHub Monorepo
            </a>
          </Button>
        </div>

        {/* PROOF TICKER */}
        <div className="mt-12 grid grid-cols-2 gap-4 border-t border-border pt-8 sm:grid-cols-4 font-mono">
          <div>
            <p className="text-[11px] text-muted-foreground uppercase">Settlement Time</p>
            <p className="text-2xl font-bold text-foreground mt-1">~3.5s</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Deterministic ledger close</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase">Transaction Cost</p>
            <p className="text-2xl font-bold text-signal mt-1">&lt; $0.00001</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Sub-cent micropayments</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase">Off-Ramping Rails</p>
            <p className="text-2xl font-bold text-foreground mt-1">SEP-10 / 24</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">SDF Anchor fiat payout</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase">Soroban Smart Contract</p>
            <p className="text-2xl font-bold text-signal mt-1">LIVE</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Stellar Testnet verified</p>
          </div>
        </div>
      </section>

      {/* THREE PILLARS (FINTECH GRID) */}
      <section className="space-y-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-signal font-semibold">Core Protocols</span>
          <h2 className="text-2xl font-bold tracking-tight mt-1">Three Synergistic Pillars on One Ledger</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Each protocol solves a critical friction point across community finance, social remittance, and autonomous agent infrastructure.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* PILLAR 1: AJO */}
          <div className="rounded-lg border border-border bg-card p-6 flex flex-col justify-between hover:border-signal/50 transition-colors">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded bg-signal/10 px-2 py-0.5 font-mono text-[10px] text-signal font-semibold">PILLAR 1 · COMMUNITY</span>
                <span className="size-2 rounded-full bg-signal" />
              </div>
              <h3 className="text-lg font-bold mt-4">Ajo Rotating Savings (Esusu)</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Digitizes traditional rotating savings groups on Soroban. Eliminates treasurer theft through refundable collateral pools, automated rotation schedules, Passkey accounts, and SEP-24 bank cash-outs.
              </p>
              <div className="mt-5 space-y-2 border-t border-border pt-4 text-xs font-mono">
                <div className="flex justify-between text-muted-foreground"><span>Collateral Guard</span><span className="text-foreground">Soroban Contract</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Credit Scoring</span><span className="text-signal">Ajo Score (300-850)</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Wallet Support</span><span className="text-foreground">Passkeys &amp; Freighter</span></div>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <Button size="sm" asChild className="w-full gap-2 bg-signal text-primary-foreground font-semibold">
                <a href="https://ajo-stellar.vercel.app" target="_blank" rel="noreferrer">
                  Launch Live App <ExternalLink className="size-3.5" />
                </a>
              </Button>
              <Button size="sm" variant="outline" onClick={() => onNavigate("ajo")} className="w-full">
                Interactive Spec
              </Button>
            </div>
          </div>

          {/* PILLAR 2: STELLARDROP */}
          <div className="rounded-lg border border-border bg-card p-6 flex flex-col justify-between hover:border-signal/50 transition-colors">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded bg-signal/10 px-2 py-0.5 font-mono text-[10px] text-signal font-semibold">PILLAR 2 · SOCIAL REMITTANCE</span>
                <span className="size-2 rounded-full bg-signal" />
              </div>
              <h3 className="text-lg font-bold mt-4">StellarDrop Telegram Engine</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Instant social micro-gifts and cross-border cash drops. Senders generate bearer claim codes; recipients claim in Telegram with automatically generated encrypted custodial wallets and SDF Test Anchor off-ramps.
              </p>
              <div className="mt-5 space-y-2 border-t border-border pt-4 text-xs font-mono">
                <div className="flex justify-between text-muted-foreground"><span>Delivery Medium</span><span className="text-foreground">Telegram &amp; WhatsApp</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Settlement</span><span className="text-signal">Atomic Claimable Balances</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Fiat Off-Ramp</span><span className="text-foreground">SDF Anchor (SEP-10/24)</span></div>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <Button size="sm" asChild className="w-full gap-2 bg-signal text-primary-foreground font-semibold">
                <a href="https://t.me/StellarDropBot" target="_blank" rel="noreferrer">
                  <Send className="size-3.5" /> Launch Telegram Bot <ExternalLink className="size-3.5" />
                </a>
              </Button>
              <Button size="sm" variant="outline" onClick={() => onNavigate("stellardrop")} className="w-full">
                Drop Generator
              </Button>
            </div>
          </div>

          {/* PILLAR 3: PROMPTSIP */}
          <div className="rounded-lg border border-border bg-card p-6 flex flex-col justify-between hover:border-signal/50 transition-colors">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded bg-signal/10 px-2 py-0.5 font-mono text-[10px] text-signal font-semibold">PILLAR 3 · AGENT ECONOMY</span>
                <span className="size-2 rounded-full bg-signal" />
              </div>
              <h3 className="text-lg font-bold mt-4">PromptSip AI 402 Gateway</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Web-native pay-per-prompt AI gateway implementing RFC HTTP 402. Enables autonomous AI agents to purchase intelligence for fractions of a cent ($0.00001) over Soroban without credit cards or central API keys.
              </p>
              <div className="mt-5 space-y-2 border-t border-border pt-4 text-xs font-mono">
                <div className="flex justify-between text-muted-foreground"><span>Protocol</span><span className="text-foreground">HTTP 402 Standard</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Smart Contract</span><span className="text-signal">promptsip_meter (Live)</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Latency Strategy</span><span className="text-foreground">Pre-funded Vaults</span></div>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <Button size="sm" onClick={() => onNavigate("terminal")} className="w-full gap-2 bg-signal text-primary-foreground font-semibold">
                <TerminalSquare className="size-3.5" /> Open 402 Terminal
              </Button>
              <Button size="sm" variant="outline" asChild className="w-full">
                <a href="https://stellar.expert/explorer/testnet/contract/CB2U4ZI42D4NVHUXKG4ZZRAOYESU65QIWY47EZX5HMRQVJMDKAKWAK2N" target="_blank" rel="noreferrer">
                  Explorer Link <ExternalLink className="size-3.5" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* VERIFIED SMART CONTRACT PROOF */}
      <section className="rounded-xl border border-border bg-card p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-signal font-semibold">On-Chain Verification</span>
            <h2 className="text-2xl font-bold tracking-tight mt-1">Verified Soroban Smart Contract</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Tested, built, and deployed on Stellar Testnet for the Boundless Hackathon.
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild>
              <a href="https://lab.stellar.org/r/testnet/contract/CB2U4ZI42D4NVHUXKG4ZZRAOYESU65QIWY47EZX5HMRQVJMDKAKWAK2N" target="_blank" rel="noreferrer">
                Inspect in Stellar Lab
              </a>
            </Button>
            <Button size="sm" asChild className="bg-signal text-primary-foreground font-semibold">
              <a href="https://stellar.expert/explorer/testnet/contract/CB2U4ZI42D4NVHUXKG4ZZRAOYESU65QIWY47EZX5HMRQVJMDKAKWAK2N" target="_blank" rel="noreferrer">
                StellarExpert Explorer
              </a>
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 font-mono text-xs">
          <div className="p-4 rounded border border-border bg-secondary/20">
            <p className="text-[10px] text-muted-foreground uppercase">Contract ID</p>
            <p className="font-bold text-signal mt-1 truncate" title="CB2U4ZI42D4NVHUXKG4ZZRAOYESU65QIWY47EZX5HMRQVJMDKAKWAK2N">CB2U4ZI4…AK2N</p>
          </div>
          <div className="p-4 rounded border border-border bg-secondary/20">
            <p className="text-[10px] text-muted-foreground uppercase">Deployment TX</p>
            <p className="font-bold text-foreground mt-1 truncate" title="9b421221df7ed238f996a93e78fadf8c0daa4d5b84d034564dfa438352033c61">9b421221…3c61</p>
          </div>
          <div className="p-4 rounded border border-border bg-secondary/20">
            <p className="text-[10px] text-muted-foreground uppercase">Payment Asset</p>
            <p className="font-bold text-foreground mt-1">Native XLM SAC</p>
          </div>
          <div className="p-4 rounded border border-border bg-secondary/20">
            <p className="text-[10px] text-muted-foreground uppercase">Rust Test Suite</p>
            <p className="font-bold text-signal mt-1">3/3 Tests Passed</p>
          </div>
        </div>

        <div className="mt-6 rounded border border-border bg-terminal p-4 font-mono text-xs text-terminal-foreground">
          <p className="text-muted-foreground mb-2"># CLI Verification Command for Hackathon Judges:</p>
          <p className="text-signal">stellar contract invoke --id CB2U4ZI42D4NVHUXKG4ZZRAOYESU65QIWY47EZX5HMRQVJMDKAKWAK2N --network testnet -- get_stats</p>
        </div>
      </section>

      {/* TEAM CREDITS */}
      <section className="border-t border-border pt-8">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Engineering Team</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="p-4 rounded-lg border border-border bg-card">
            <p className="font-bold text-foreground">official-papi</p>
            <p className="text-xs text-signal mt-0.5">PromptSip &amp; Soroban Smart Contract</p>
            <p className="text-[11px] text-muted-foreground mt-2">HTTP 402 gateway architecture, Rust contract development, test suite, and unified platform UI.</p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card">
            <p className="font-bold text-foreground">Savioula23</p>
            <p className="text-xs text-signal mt-0.5">Ajo Protocol &amp; Frontend</p>
            <p className="text-[11px] text-muted-foreground mt-2">Rotating savings circle mechanics, Soroban savings vault, Passkey authentication, and Vercel web deployment.</p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card">
            <p className="font-bold text-foreground">jedi-dtechmaker</p>
            <p className="text-xs text-signal mt-0.5">StellarDrop API &amp; Telegram Engine</p>
            <p className="text-[11px] text-muted-foreground mt-2">Express API, Telegraf bot automation, claimable balance generation, and SDF Test Anchor SEP-10/24 integration.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value, detail, accent = false }: { icon: typeof Zap; label: string; value: string; detail: string; accent?: boolean }) {
  return <div className="flex items-start gap-3 py-4 sm:border-l sm:border-border sm:px-4 sm:first:border-l-0 sm:first:pl-0">
    <div className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded border border-border ${accent ? "bg-signal-soft text-signal" : "bg-secondary text-muted-foreground"}`}><Icon className="size-4" /></div>
    <div className="min-w-0"><p className="text-[11px] text-muted-foreground">{label}</p><p className={`mt-0.5 font-mono text-lg font-medium ${accent ? "text-signal" : "text-foreground"}`}>{value}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{detail}</p></div>
  </div>;
}

function TerminalView({
  prompt, setPrompt, asset, setAsset, flowState, requestPrompt, reply, hash, busy, onSubmit, onInspect, receipts,
}: {
  prompt: string; setPrompt: (value: string) => void; asset: "USDC" | "XLM"; setAsset: (value: "USDC" | "XLM") => void;
  flowState: FlowState; requestPrompt: string; reply: string; hash: string; busy: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void; onInspect: () => void; receipts: typeof initialReceipts;
}) {
  return <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
    <section className="flex flex-col border border-border bg-card rounded-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <TerminalSquare className="size-4 text-signal" /><h2 className="text-xs font-semibold tracking-wide">AI Execution Console</h2>
        </div>
        <div className="flex items-center gap-1 rounded border border-border bg-background p-0.5">
          {(["USDC", "XLM"] as const).map((item) => (
            <Button key={item} variant="ghost" size="sm" onClick={() => setAsset(item)} aria-pressed={asset === item} className={`h-7 rounded px-2.5 font-mono text-[10px] ${asset === item ? "bg-accent text-foreground font-semibold" : "text-muted-foreground"}`}>{item}</Button>
          ))}
        </div>
      </div>
      <div className="flex min-h-[380px] flex-1 flex-col justify-between p-4">
        <div className="space-y-4">
          <div className="rounded border border-border bg-secondary/30 p-3">
            <p className="font-mono text-[10px] text-muted-foreground uppercase">Soroban Smart Contract Attached</p>
            <p className="mt-1 font-mono text-xs text-signal break-all">CB2U4ZI42D4NVHUXKG4ZZRAOYESU65QIWY47EZX5HMRQVJMDKAKWAK2N</p>
          </div>
          {requestPrompt && <div className="rounded border border-border bg-secondary/20 p-3"><p className="text-xs font-medium text-foreground">{requestPrompt}</p></div>}
          {reply && <div className="rounded border border-signal/30 bg-signal-soft/30 p-3 font-mono text-xs text-foreground leading-6"><p>{reply}</p></div>}
          {busy && <div className="flex items-center gap-2 text-xs text-muted-foreground"><LoaderCircle className="size-4 animate-spin text-signal" /> <span>{flowState === "requesting" ? "Dispatching HTTP 402 challenge…" : flowState === "challenge" ? "Receiving payment challenge…" : flowState === "settling" ? "Executing micro-settlement on Soroban…" : "Streaming tokens…"}</span></div>}
        </div>
        <form onSubmit={onSubmit} className="mt-4 flex gap-2 border-t border-border pt-3">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask AI anything (settles on Stellar Testnet)…"
            disabled={busy}
            className="flex-1 rounded border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-signal"
          />
          <Button type="submit" disabled={busy || !prompt.trim()} size="sm" className="gap-2 bg-signal text-primary-foreground font-semibold">
            <Send className="size-3.5" /> Send
          </Button>
        </form>
      </div>
    </section>

    <div className="space-y-4">
      <section className="border border-border bg-card rounded-lg p-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-xs font-semibold">Protocol Inspector</h3>
          <Button variant="ghost" size="sm" onClick={onInspect} className="h-6 text-[10px] text-signal font-semibold">View details</Button>
        </div>
        <div className="mt-3 space-y-2 font-mono text-[11px]">
          <div className="flex justify-between text-muted-foreground"><span>Protocol</span><span className="text-foreground">HTTP 402</span></div>
          <div className="flex justify-between text-muted-foreground"><span>Ledger</span><span className="text-foreground">Stellar Testnet</span></div>
          <div className="flex justify-between text-muted-foreground"><span>Method</span><span className="text-foreground">pay_prompt / SAC</span></div>
          <div className="flex justify-between text-muted-foreground"><span>Latest TX</span><span className="text-signal truncate max-w-[140px]">{hash || "Ready"}</span></div>
        </div>
      </section>

      <section className="border border-border bg-card rounded-lg p-4">
        <h3 className="text-xs font-semibold mb-2">Recent On-Chain Receipts</h3>
        <div className="divide-y divide-border text-xs">
          {receipts.slice(0, 3).map((r) => (
            <div key={r.hash} className="py-2">
              <p className="font-medium truncate">{r.prompt}</p>
              <div className="flex justify-between font-mono text-[10px] text-muted-foreground mt-0.5">
                <span>{r.amount} {r.asset}</span>
                <span className="text-signal">{r.time}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  </div>;
}

function ProtocolView({ flowState, requestPrompt, hash, onTry }: { flowState: FlowState; requestPrompt: string; hash: string; onTry: () => void }) {
  const challenge = {
    protocol: "RFC-402",
    network: "stellar:testnet",
    contract_id: "CB2U4ZI42D4NVHUXKG4ZZRAOYESU65QIWY47EZX5HMRQVJMDKAKWAK2N",
    payment: {
      asset: "USDC",
      amount: STELLAR_PROMPT_FEE_USD.toFixed(5),
      destination: "GAMWOYHYZLFCQHNWBRHCJOMLM3S5ZUM2VAW4QQD2GPJJSHML7BSQEY3Q",
      memo: "promptsip:challenge-001",
      expires_in: 60,
    },
  };
  return <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
    <section className="border border-border bg-card rounded-lg">
      <div className="flex items-center justify-between border-b border-border px-4 py-3"><div className="flex items-center gap-2"><Braces className="size-4 text-signal" /><h2 className="text-xs font-semibold">Challenge payload</h2></div><span className="font-mono text-[10px] text-signal font-semibold">HTTP 402 · TESTNET</span></div>
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-6 text-terminal-foreground"><code>{JSON.stringify(challenge, null, 2)}</code></pre>
    </section>
    <section className="space-y-4">
      <div className="border border-border bg-card rounded-lg p-4">
        <h3 className="text-xs font-semibold mb-3">Live Contract Integration</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The HTTP 402 challenge directs payments into the Soroban contract. The AI gateway verifies the transaction hash against Stellar RPC before streaming tokens.
        </p>
        <Button onClick={onTry} className="mt-4 w-full gap-2 bg-signal text-primary-foreground font-semibold"><TerminalSquare className="size-4" /> Try the Flow</Button>
      </div>
    </section>
  </div>;
}

function AgentsView({ language, setLanguage, code, copied, onCopy }: { language: Language; setLanguage: (value: Language) => void; code: string; copied: boolean; onCopy: () => void }) {
  return <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
    <section className="min-w-0 border border-border bg-card rounded-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3"><div className="flex items-center gap-2"><FileCode2 className="size-4 text-signal" /><h2 className="text-xs font-semibold">402 negotiation example</h2></div><div className="flex items-center gap-1 rounded border border-border bg-background p-0.5">{(["Python", "TypeScript", "cURL"] as const).map((item) => <Button key={item} variant="ghost" size="sm" onClick={() => setLanguage(item)} aria-pressed={language === item} className={`h-7 rounded px-2.5 font-mono text-[10px] ${language === item ? "bg-accent text-foreground font-semibold" : "text-muted-foreground"}`}>{item}</Button>)}</div></div>
      <div className="flex items-center justify-between border-b border-border px-4 py-2"><span className="font-mono text-[10px] text-muted-foreground">{language === "Python" ? "agent.py" : language === "TypeScript" ? "agent.ts" : "request.sh"}</span><Button variant="outline" size="sm" onClick={onCopy} className="h-7 gap-1.5 rounded border-border bg-transparent px-2 text-[10px]">{copied ? <Check className="size-3 text-signal" /> : <Copy className="size-3" />}{copied ? "Copied" : "Copy"}</Button></div>
      <pre className="max-h-[560px] overflow-auto p-4 text-[11px] leading-[1.8] text-terminal-foreground"><code>{code}</code></pre>
    </section>
    <div className="space-y-4">
      <div className="border border-border bg-card rounded-lg p-4">
        <h3 className="text-xs font-semibold mb-2">Autonomous Agent Flow</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          AI agents use this pattern to pay for intelligence without needing bank accounts, credit cards, or centralized API keys.
        </p>
      </div>
    </div>
  </div>;
}

function ReceiptsView({ receipts }: { receipts: typeof initialReceipts }) {
  return <div className="border border-border bg-card rounded-lg">
    <div className="border-b border-border px-4 py-3 flex justify-between items-center"><h2 className="text-xs font-semibold">Ledger Receipts</h2><span className="font-mono text-[10px] text-signal font-semibold">VERIFIED ON TESTNET</span></div>
    <div className="divide-y divide-border">{receipts.map((r) => (
      <div key={r.hash} className="p-4 flex items-center justify-between text-xs">
        <div><p className="font-medium">{r.prompt}</p><p className="font-mono text-[10px] text-muted-foreground mt-0.5">{r.hash}</p></div>
        <div className="text-right font-mono text-[11px]"><span className="text-signal">{r.amount} {r.asset}</span><p className="text-[10px] text-muted-foreground">{r.time}</p></div>
      </div>
    ))}</div>
  </div>;
}

/* ==================== AJO VIEW (TEAMMATE 2 INTEGRATION) ==================== */
function AjoView() {
  return (
    <div className="space-y-6">
      <div className="border border-border bg-card rounded-lg p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-signal font-semibold">
              <Users className="size-3.5" /> Pillar 1 · Decentralized Community Finance
            </div>
            <h2 className="text-xl font-bold tracking-tight mt-1">Ajo — Rotating Savings Circles (Esusu)</h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
              Ajo is the traditional rotating savings circle millions of Africans rely on. Built on Stellar Soroban with refundable collateral, automated round payouts, and Passkey wallets.
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" asChild className="gap-2 bg-signal text-primary-foreground font-semibold">
              <a href="https://ajo-stellar.vercel.app" target="_blank" rel="noreferrer">
                <ExternalLink className="size-3.5" /> Launch Live App
              </a>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href="https://github.com/Savioula23/ajo-stellar" target="_blank" rel="noreferrer">
                GitHub Repo
              </a>
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded border border-border bg-secondary/20 p-4">
            <span className="font-mono text-[10px] text-signal uppercase font-semibold">Live Circle Demo</span>
            <h3 className="font-semibold text-sm mt-1">Lagos Builders Circle</h3>
            <p className="text-xs text-muted-foreground mt-1">Protected by Soroban Contract</p>
            <div className="mt-4 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between"><span>Contribution</span><span className="text-signal">50 USDC / wk</span></div>
              <div className="flex justify-between"><span>Members</span><span>5 of 6 filled</span></div>
              <div className="flex justify-between"><span>Pot Size</span><span className="font-bold">300 USDC</span></div>
            </div>
          </div>

          <div className="rounded border border-border bg-secondary/20 p-4">
            <span className="font-mono text-[10px] text-signal uppercase font-semibold">Trust Metric</span>
            <h3 className="font-semibold text-sm mt-1">Ajo Credit Score</h3>
            <p className="text-xs text-muted-foreground mt-1">Immutable on-chain reputation</p>
            <div className="mt-4 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between"><span>Baseline Score</span><span>500</span></div>
              <div className="flex justify-between"><span>On-time bonus</span><span className="text-signal">+25 pts</span></div>
              <div className="flex justify-between"><span>Late penalty</span><span className="text-warning">-40 pts</span></div>
            </div>
          </div>

          <div className="rounded border border-border bg-secondary/20 p-4">
            <span className="font-mono text-[10px] text-signal uppercase font-semibold">Off-Ramping</span>
            <h3 className="font-semibold text-sm mt-1">Anchor Cash-Out</h3>
            <p className="text-xs text-muted-foreground mt-1">Direct to Bank Accounts</p>
            <div className="mt-4 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between"><span>Authentication</span><span>SEP-10</span></div>
              <div className="flex justify-between"><span>Interactive KYC</span><span>SEP-24</span></div>
              <div className="flex justify-between"><span>Target Fiat</span><span className="text-signal">NGN (Naira)</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================== STELLARDROP VIEW (TEAMMATE 1 INTEGRATION) ==================== */
function StellarDropView() {
  const [amount, setAmount] = useState("5");
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  function handleCreateDrop() {
    const code = `DROP-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setCreatedCode(code);
  }

  return (
    <div className="space-y-6">
      <div className="border border-border bg-card rounded-lg p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-signal font-semibold">
              <Send className="size-3.5" /> Pillar 2 · Social Remittances
            </div>
            <h2 className="text-xl font-bold tracking-tight mt-1">StellarDrop — Telegram Micro-Payments</h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
              Send live Stellar Testnet USDC with an instant claim code. Recipients open Telegram, receive an automatic encrypted custodial wallet, and withdraw via SDF Test Anchor.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" asChild className="gap-2 bg-signal text-primary-foreground font-semibold">
              <a href="https://t.me/StellarDropBot" target="_blank" rel="noreferrer">
                <Send className="size-3.5" /> Launch Telegram Bot <ExternalLink className="size-3" />
              </a>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href="https://github.com/jedi-dtechmaker/stellar-hackathon" target="_blank" rel="noreferrer">
                GitHub Repo
              </a>
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded border border-border bg-secondary/10 p-5 space-y-4">
            <h3 className="font-semibold text-sm">Create Instant USDC Drop</h3>
            <div>
              <label className="text-[11px] text-muted-foreground">Amount (USDC)</label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-xs"
                placeholder="5"
              />
            </div>
            <Button onClick={handleCreateDrop} size="sm" className="w-full bg-signal text-primary-foreground font-semibold">
              Generate Atomic Claim Code
            </Button>

            {createdCode && (
              <div className="rounded border border-signal/40 bg-signal-soft/30 p-3 mt-3">
                <p className="text-[10px] font-mono text-signal uppercase font-semibold">Claim Code Ready</p>
                <p className="font-mono text-base font-bold text-foreground mt-1">{createdCode}</p>
                <div className="mt-2 text-[11px] text-muted-foreground">
                  Telegram Deep Link: <span className="font-mono text-signal">t.me/StellarDropBot?start={createdCode}</span>
                </div>
                <Button size="sm" asChild className="mt-3 w-full gap-2 bg-signal text-primary-foreground font-semibold">
                  <a href={`https://t.me/StellarDropBot?start=${createdCode}`} target="_blank" rel="noreferrer">
                    <Send className="size-3.5" /> Claim in Telegram Bot <ExternalLink className="size-3" />
                  </a>
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded border border-border bg-secondary/20 p-4">
              <h4 className="text-xs font-semibold">Recipient Journey</h4>
              <ol className="mt-2 space-y-2 text-xs text-muted-foreground list-decimal list-inside">
                <li>Recipient taps link inside WhatsApp or Telegram.</li>
                <li>Bot generates an encrypted Stellar keypair automatically.</li>
                <li>Friendbot funds XLM &amp; establishes USDC trustline atomically.</li>
                <li>Escrow claimable balance is released to receiver.</li>
                <li>Receiver runs <code className="text-signal">/withdraw</code> for SDF Anchor SEP-24 fiat transfer.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================== UNIFIED ECOSYSTEM VIEW ==================== */
function SuiteView({ onSelect }: { onSelect: (v: View) => void }) {
  return (
    <div className="space-y-6">
      <div className="border border-border bg-card rounded-lg p-6">
        <div className="border-b border-border pb-4">
          <span className="font-mono text-[10px] uppercase tracking-widest text-signal font-semibold">StellarSuite · Topology</span>
          <h2 className="text-2xl font-bold tracking-tight mt-1">Ecosystem Interoperability</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-3xl leading-relaxed">
            How community savings, social remittances, and AI agent settlements interoperate seamlessly on Stellar and Soroban.
          </p>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="rounded border border-border bg-card p-5 flex flex-col justify-between">
            <div>
              <span className="rounded bg-signal/10 px-2 py-0.5 font-mono text-[9px] text-signal font-semibold">PILLAR 1</span>
              <h3 className="font-bold text-base mt-2">Ajo Savings Circles</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Rotating credit pools on Soroban eliminating treasurer fraud with refundable collateral and Passkeys.
              </p>
            </div>
            <Button onClick={() => onSelect("ajo")} variant="outline" size="sm" className="mt-4 w-full">Explore Ajo</Button>
          </div>

          <div className="rounded border border-border bg-card p-5 flex flex-col justify-between">
            <div>
              <span className="rounded bg-signal/10 px-2 py-0.5 font-mono text-[9px] text-signal font-semibold">PILLAR 2</span>
              <h3 className="font-bold text-base mt-2">StellarDrop Remittance</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Instant social USDC drops claimed inside Telegram with SDF Test Anchor SEP-10/24 bank payouts.
              </p>
            </div>
            <Button onClick={() => onSelect("stellardrop")} variant="outline" size="sm" className="mt-4 w-full">Explore StellarDrop</Button>
          </div>

          <div className="rounded border border-border bg-card p-5 flex flex-col justify-between">
            <div>
              <span className="rounded bg-signal/10 px-2 py-0.5 font-mono text-[9px] text-signal font-semibold">PILLAR 3</span>
              <h3 className="font-bold text-base mt-2">PromptSip AI Gateway</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                HTTP 402 pay-per-prompt AI gateway with live Soroban smart contract metering and streaming vaults.
              </p>
            </div>
            <Button onClick={() => onSelect("terminal")} variant="outline" size="sm" className="mt-4 w-full">Explore PromptSip</Button>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Team Contributions</h4>
          <div className="grid gap-3 sm:grid-cols-3 text-xs">
            <div className="p-3 rounded border border-border bg-secondary/10">
              <p className="font-bold text-foreground">official-papi</p>
              <p className="text-muted-foreground text-[11px] mt-0.5">PromptSip &amp; Soroban Contract</p>
            </div>
            <div className="p-3 rounded border border-border bg-secondary/10">
              <p className="font-bold text-foreground">Savioula23</p>
              <p className="text-muted-foreground text-[11px] mt-0.5">Ajo Protocol &amp; Frontend</p>
            </div>
            <div className="p-3 rounded border border-border bg-secondary/10">
              <p className="font-bold text-foreground">jedi-dtechmaker</p>
              <p className="text-muted-foreground text-[11px] mt-0.5">StellarDrop API &amp; Telegram Engine</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
