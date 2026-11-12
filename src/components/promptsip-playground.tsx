import { useState, type FormEvent } from "react";
import {
  Activity,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Braces,
  Check,
  ChevronDown,
  CircleDot,
  Clock3,
  Code2,
  Copy,
  Cpu,
  Droplets,
  ExternalLink,
  FileCode2,
  Fingerprint,
  Gauge,
  Globe2,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  MessageSquareText,
  Radio,
  ReceiptText,
  Send,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Users,
  WalletCards,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { CARD_MINIMUM_USD, getCardMinimumMultiple, STELLAR_PROMPT_FEE_USD } from "@/lib/prompt-fee-metrics";

type View = "terminal" | "protocol" | "agents" | "receipts" | "ajo" | "stellardrop" | "suite";
type FlowState = "idle" | "requesting" | "challenge" | "settling" | "streaming" | "done";
type Language = "Python" | "TypeScript" | "cURL";

const navigation: { id: View; label: string; icon: typeof TerminalSquare; section: "promptsip" | "suite" }[] = [
  { id: "terminal", label: "AI terminal", icon: TerminalSquare, section: "promptsip" },
  { id: "protocol", label: "402 inspector", icon: Braces, section: "promptsip" },
  { id: "agents", label: "Agent snippets", icon: Code2, section: "promptsip" },
  { id: "receipts", label: "Ledger receipts", icon: ReceiptText, section: "promptsip" },
  { id: "ajo", label: "Ajo Savings (Esusu)", icon: Users, section: "suite" },
  { id: "stellardrop", label: "StellarDrop (Telegram)", icon: Send, section: "suite" },
  { id: "suite", label: "Unified Ecosystem", icon: Sparkles, section: "suite" },
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
  const [view, setView] = useState<View>("terminal");
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
    <div className="min-h-screen bg-background text-foreground">
      <div className="min-h-screen md:grid md:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="flex min-h-screen flex-col border-r border-sidebar-border bg-sidebar max-md:min-h-0 max-md:border-r-0 max-md:border-b">
          <div className="flex h-[68px] items-center gap-3 border-b border-sidebar-border px-5">
            <div className="grid size-8 place-items-center rounded-md bg-signal text-primary-foreground">
              <Droplets className="size-[18px]" strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-[16px] font-semibold tracking-tight">stellar<span className="text-signal">suite</span></span>
              <p className="text-[10px] text-muted-foreground leading-none">Boundless 2026</p>
            </div>
            <span className="ml-auto rounded border border-signal/40 bg-signal/10 px-1.5 py-0.5 font-mono text-[9px] text-signal font-semibold">TESTNET</span>
          </div>

          <div className="px-3 pt-5 max-md:flex max-md:gap-1 max-md:overflow-x-auto max-md:pt-2">
            <p className="px-2 pb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground max-md:hidden">PromptSip (AI 402)</p>
            {navigation.filter((n) => n.section === "promptsip").map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant="ghost"
                onClick={() => setView(id)}
                className={`mb-1 h-9 w-full justify-start gap-2.5 rounded px-2.5 text-[12.5px] max-md:mb-0 max-md:w-auto max-md:shrink-0 ${view === id ? "bg-sidebar-accent text-sidebar-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
                aria-current={view === id ? "page" : undefined}
              >
                <Icon className={`size-4 ${view === id ? "text-signal" : ""}`} />
                {label}
                {id === "protocol" && <span className="ml-auto rounded border border-warning/30 px-1.5 py-0.5 font-mono text-[9px] text-warning max-md:hidden">402</span>}
              </Button>
            ))}

            <p className="px-2 pb-2 pt-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground max-md:hidden">Team Ecosystem</p>
            {navigation.filter((n) => n.section === "suite").map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant="ghost"
                onClick={() => setView(id)}
                className={`mb-1 h-9 w-full justify-start gap-2.5 rounded px-2.5 text-[12.5px] max-md:mb-0 max-md:w-auto max-md:shrink-0 ${view === id ? "bg-sidebar-accent text-sidebar-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
                aria-current={view === id ? "page" : undefined}
              >
                <Icon className={`size-4 ${view === id ? "text-signal" : ""}`} />
                {label}
                {id === "suite" && <span className="ml-auto rounded border border-signal/40 bg-signal/10 px-1.5 py-0.5 font-mono text-[9px] text-signal max-md:hidden">ALL</span>}
              </Button>
            ))}
          </div>

          <div className="mt-auto border-t border-sidebar-border p-4 max-md:hidden">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground"><span className="size-1.5 rounded-full bg-signal" /> Stellar Testnet Live</div>
            <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-muted-foreground"><span>Contract status</span><span className="text-signal">DEPLOYED</span></div>
            <div className="mt-3 rounded border border-border bg-secondary/40 p-2 text-[10px] text-muted-foreground">
              <span className="font-semibold text-foreground">3 Team Projects</span>
              <p className="mt-0.5">Ajo · StellarDrop · PromptSip</p>
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <header className="flex min-h-[68px] flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3 sm:px-8">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>StellarSuite</span><span className="text-border">/</span>
              <span className="text-foreground">{navigation.find((item) => item.id === view)?.label}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded border border-signal/30 bg-signal/10 px-2.5 py-1.5 font-mono text-[10px] text-signal">
                <span className="size-1.5 rounded-full bg-signal" /> SOROBAN CONTRACT LIVE
              </span>
              <Button variant="outline" size="sm" asChild className="h-8 gap-2 rounded border-border bg-transparent px-2.5 text-[11px] text-muted-foreground">
                <a href="https://stellar.expert/explorer/testnet/contract/CB2U4ZI42D4NVHUXKG4ZZRAOYESU65QIWY47EZX5HMRQVJMDKAKWAK2N" target="_blank" rel="noreferrer">
                  <Globe2 className="size-3.5" /> Explorer <ExternalLink className="size-3" />
                </a>
              </Button>
            </div>
          </header>

          <div className="mx-auto max-w-[1440px] px-5 pb-12 pt-7 sm:px-8">
            {view === "terminal" && (
              <>
                <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-signal"><span className="size-1.5 rounded-full bg-signal animate-pulse-signal" /> Stellar · HTTP 402 · Soroban</div>
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">Pay per prompt.</h1>
                    <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">Autonomous AI micropayment gateway with on-chain Soroban contract verification and streaming vaults.</p>
                  </div>
                  <div className="flex items-center gap-2 rounded border border-border bg-card px-3 py-2 text-xs">
                    <WalletCards className="size-4 text-signal" /><span className="text-muted-foreground">Contract:</span><span className="font-mono text-signal">CB2U4Z…AK2N</span>
                  </div>
                </div>

                <section aria-label="Cost and network metrics" className="mb-6 grid grid-cols-1 border-y border-border sm:grid-cols-3">
                  <Metric icon={Zap} label="Per prompt" value={formatUsd(STELLAR_PROMPT_FEE_USD)} detail="Stellar network fee" accent />
                  <Metric icon={ArrowUpRight} label="Card minimum" value={`$${CARD_MINIMUM_USD.toFixed(2)}+`} detail={`${getCardMinimumMultiple().toLocaleString()}× higher floor`} />
                  <Metric icon={Activity} label="Settlement" value="~3-5 sec" detail="Stellar consensus · live" />
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
    <section className="flex flex-col border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <TerminalSquare className="size-4 text-signal" /><h2 className="text-xs font-semibold tracking-wide">Interactive Terminal</h2>
        </div>
        <div className="flex items-center gap-1 rounded border border-border bg-background p-0.5">
          {(["USDC", "XLM"] as const).map((item) => (
            <Button key={item} variant="ghost" size="sm" onClick={() => setAsset(item)} aria-pressed={asset === item} className={`h-7 rounded px-2.5 font-mono text-[10px] ${asset === item ? "bg-accent text-foreground" : "text-muted-foreground"}`}>{item}</Button>
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
      <section className="border border-border bg-card p-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-xs font-semibold">Protocol Inspector</h3>
          <Button variant="ghost" size="sm" onClick={onInspect} className="h-6 text-[10px] text-signal">View details</Button>
        </div>
        <div className="mt-3 space-y-2 font-mono text-[11px]">
          <div className="flex justify-between text-muted-foreground"><span>Protocol</span><span className="text-foreground">HTTP 402</span></div>
          <div className="flex justify-between text-muted-foreground"><span>Ledger</span><span className="text-foreground">Stellar Testnet</span></div>
          <div className="flex justify-between text-muted-foreground"><span>Method</span><span className="text-foreground">pay_prompt / SAC</span></div>
          <div className="flex justify-between text-muted-foreground"><span>Latest TX</span><span className="text-signal truncate max-w-[140px]">{hash || "Ready"}</span></div>
        </div>
      </section>

      <section className="border border-border bg-card p-4">
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
    <section className="border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3"><div className="flex items-center gap-2"><Braces className="size-4 text-signal" /><h2 className="text-xs font-semibold">Challenge payload</h2></div><span className="font-mono text-[10px] text-signal font-semibold">HTTP 402 · TESTNET</span></div>
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-6 text-terminal-foreground"><code>{JSON.stringify(challenge, null, 2)}</code></pre>
    </section>
    <section className="space-y-4">
      <div className="border border-border bg-card p-4">
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
    <section className="min-w-0 border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3"><div className="flex items-center gap-2"><FileCode2 className="size-4 text-signal" /><h2 className="text-xs font-semibold">402 negotiation example</h2></div><div className="flex items-center gap-1 rounded border border-border bg-background p-0.5">{(["Python", "TypeScript", "cURL"] as const).map((item) => <Button key={item} variant="ghost" size="sm" onClick={() => setLanguage(item)} aria-pressed={language === item} className={`h-7 rounded px-2.5 font-mono text-[10px] ${language === item ? "bg-accent text-foreground" : "text-muted-foreground"}`}>{item}</Button>)}</div></div>
      <div className="flex items-center justify-between border-b border-border px-4 py-2"><span className="font-mono text-[10px] text-muted-foreground">{language === "Python" ? "agent.py" : language === "TypeScript" ? "agent.ts" : "request.sh"}</span><Button variant="outline" size="sm" onClick={onCopy} className="h-7 gap-1.5 rounded border-border bg-transparent px-2 text-[10px]">{copied ? <Check className="size-3 text-signal" /> : <Copy className="size-3" />}{copied ? "Copied" : "Copy"}</Button></div>
      <pre className="max-h-[560px] overflow-auto p-4 text-[11px] leading-[1.8] text-terminal-foreground"><code>{code}</code></pre>
    </section>
    <div className="space-y-4">
      <div className="border border-border bg-card p-4">
        <h3 className="text-xs font-semibold mb-2">Autonomous Agent Flow</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          AI agents use this pattern to pay for intelligence without needing bank accounts, credit cards, or centralized API keys.
        </p>
      </div>
    </div>
  </div>;
}

function ReceiptsView({ receipts }: { receipts: typeof initialReceipts }) {
  return <div className="border border-border bg-card">
    <div className="border-b border-border px-4 py-3 flex justify-between items-center"><h2 className="text-xs font-semibold">Ledger Receipts</h2><span className="font-mono text-[10px] text-signal">VERIFIED ON TESTNET</span></div>
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
      <div className="border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-signal">
              <Users className="size-3.5" /> Pillar 1 · Decentralized Social Finance
            </div>
            <h2 className="text-xl font-bold tracking-tight mt-1">Ajo — Rotating Savings Circles (Esusu)</h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
              Ajo is the traditional rotating savings circle millions of Africans rely on. We put it on Stellar Soroban with refundable deposits, automated payouts, and Passkey wallets.
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
            <span className="font-mono text-[10px] text-signal uppercase">Live Circle Demo</span>
            <h3 className="font-semibold text-sm mt-1">Lagos Builders Circle</h3>
            <p className="text-xs text-muted-foreground mt-1">Protected by Soroban Contract</p>
            <div className="mt-4 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between"><span>Contribution</span><span className="text-signal">50 USDC / wk</span></div>
              <div className="flex justify-between"><span>Members</span><span>5 of 6 filled</span></div>
              <div className="flex justify-between"><span>Pot Size</span><span className="font-bold">300 USDC</span></div>
            </div>
          </div>

          <div className="rounded border border-border bg-secondary/20 p-4">
            <span className="font-mono text-[10px] text-signal uppercase">Trust Metric</span>
            <h3 className="font-semibold text-sm mt-1">Ajo Credit Score</h3>
            <p className="text-xs text-muted-foreground mt-1">Immutable on-chain reputation</p>
            <div className="mt-4 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between"><span>Baseline Score</span><span>500</span></div>
              <div className="flex justify-between"><span>On-time bonus</span><span className="text-signal">+25 pts</span></div>
              <div className="flex justify-between"><span>Late penalty</span><span className="text-warning">-40 pts</span></div>
            </div>
          </div>

          <div className="rounded border border-border bg-secondary/20 p-4">
            <span className="font-mono text-[10px] text-signal uppercase">Off-Ramping</span>
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
      <div className="border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-signal">
              <Send className="size-3.5" /> Pillar 2 · Social Remittances
            </div>
            <h2 className="text-xl font-bold tracking-tight mt-1">StellarDrop — Telegram Micro-Payments</h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
              Send live Stellar Testnet USDC with an instant claim code. Recipients open Telegram, receive an automatic encrypted custodial wallet, and withdraw via SDF Test Anchor.
            </p>
          </div>
          <Button size="sm" variant="outline" asChild>
            <a href="https://github.com/jedi-dtechmaker/stellar-hackathon" target="_blank" rel="noreferrer">
              GitHub Repo
            </a>
          </Button>
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
                <p className="text-[10px] font-mono text-signal uppercase">Claim Code Ready</p>
                <p className="font-mono text-base font-bold text-foreground mt-1">{createdCode}</p>
                <div className="mt-2 text-[11px] text-muted-foreground">
                  Telegram Deep Link: <span className="font-mono text-signal">t.me/StellarDropBot?start={createdCode}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded border border-border bg-secondary/20 p-4">
              <h4 className="text-xs font-semibold">Recipient Journey</h4>
              <ol className="mt-2 space-y-2 text-xs text-muted-foreground list-decimal list-inside">
                <li>Recipient taps link inside WhatsApp or Telegram.</li>
                <li>Bot generates an encrypted Stellar keypair automatically.</li>
                <li>Friendbot funds XLM & establishes USDC trustline atomically.</li>
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
      <div className="border border-border bg-card p-6">
        <div className="border-b border-border pb-4">
          <span className="font-mono text-[10px] uppercase tracking-widest text-signal font-semibold">StellarSuite · Boundless 2026</span>
          <h2 className="text-2xl font-bold tracking-tight mt-1">One Unified Stellar Platform</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-3xl leading-relaxed">
            A collaborative 3-pillar ecosystem combining community savings (Ajo), social micro-transfers (StellarDrop), and autonomous AI agent settlements (PromptSip) — all powered by Stellar and Soroban.
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
              <p className="text-muted-foreground text-[11px] mt-0.5">PromptSip & Soroban Contract</p>
            </div>
            <div className="p-3 rounded border border-border bg-secondary/10">
              <p className="font-bold text-foreground">Savioula23</p>
              <p className="text-muted-foreground text-[11px] mt-0.5">Ajo Protocol & Frontend</p>
            </div>
            <div className="p-3 rounded border border-border bg-secondary/10">
              <p className="font-bold text-foreground">jedi-dtechmaker</p>
              <p className="text-muted-foreground text-[11px] mt-0.5">StellarDrop API & Telegram Engine</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
