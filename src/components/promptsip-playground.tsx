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
  WalletCards,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { CARD_MINIMUM_USD, getCardMinimumMultiple, STELLAR_PROMPT_FEE_USD } from "@/lib/prompt-fee-metrics";

type View = "terminal" | "protocol" | "agents" | "receipts";
type FlowState = "idle" | "requesting" | "challenge" | "settling" | "streaming" | "done";
type Language = "Python" | "TypeScript" | "cURL";

const navigation: { id: View; label: string; icon: typeof TerminalSquare }[] = [
  { id: "terminal", label: "AI terminal", icon: TerminalSquare },
  { id: "protocol", label: "402 inspector", icon: Braces },
  { id: "agents", label: "Agent snippets", icon: Code2 },
  { id: "receipts", label: "Ledger receipts", icon: ReceiptText },
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
      <div className="min-h-screen md:grid md:grid-cols-[232px_minmax(0,1fr)]">
        <aside className="flex min-h-screen flex-col border-r border-sidebar-border bg-sidebar max-md:min-h-0 max-md:border-r-0 max-md:border-b">
          <div className="flex h-[68px] items-center gap-3 border-b border-sidebar-border px-5">
            <div className="grid size-8 place-items-center rounded-md bg-signal text-primary-foreground">
              <Droplets className="size-[18px]" strokeWidth={2.5} />
            </div>
            <span className="text-[17px] font-semibold tracking-tight">prompt<span className="text-signal">sip</span></span>
            <span className="ml-auto rounded border border-border px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">DEV</span>
          </div>

          <div className="px-3 pt-6 max-md:flex max-md:gap-1 max-md:overflow-x-auto max-md:pt-2">
            <p className="px-2 pb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground max-md:hidden">Workspace</p>
            {navigation.map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant="ghost"
                onClick={() => setView(id)}
                className={`mb-1 h-10 w-full justify-start gap-3 rounded px-2.5 text-[13px] max-md:mb-0 max-md:w-auto max-md:shrink-0 ${view === id ? "bg-sidebar-accent text-sidebar-foreground" : "text-muted-foreground hover:text-foreground"}`}
                aria-current={view === id ? "page" : undefined}
              >
                <Icon className={`size-4 ${view === id ? "text-signal" : ""}`} />
                {label}
                {id === "protocol" && <span className="ml-auto rounded border border-warning/30 px-1.5 py-0.5 font-mono text-[9px] text-warning max-md:hidden">402</span>}
              </Button>
            ))}
          </div>

          <div className="mt-auto border-t border-sidebar-border p-4 max-md:hidden">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground"><span className="size-1.5 rounded-full bg-signal" /> Stellar testnet</div>
            <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-muted-foreground"><span>Network status</span><span className="text-signal">SANDBOX</span></div>
            <div className="mt-4 flex items-center gap-2 border-t border-sidebar-border pt-4">
              <div className="grid size-8 place-items-center rounded border border-border bg-secondary"><Fingerprint className="size-4 text-signal" /></div>
              <div><p className="text-xs font-medium">Local preview</p><p className="mt-0.5 text-[10px] text-muted-foreground">No wallet connected</p></div>
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <header className="flex min-h-[68px] flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3 sm:px-8">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><span>Playground</span><span className="text-border">/</span><span className="text-foreground">{navigation.find((item) => item.id === view)?.label}</span></div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded border border-warning/30 bg-warning/10 px-2.5 py-1.5 font-mono text-[10px] text-warning"><span className="size-1.5 rounded-full bg-warning" /> DEMO MODE · NO FUNDS MOVED</span>
              <Button variant="outline" size="sm" className="h-8 gap-2 rounded border-border bg-transparent px-2.5 text-[11px] text-muted-foreground">
                <Globe2 className="size-3.5" /> Testnet <ChevronDown className="size-3" />
              </Button>
            </div>
          </header>

          <div className="mx-auto max-w-[1440px] px-5 pb-12 pt-7 sm:px-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-signal"><span className="size-1.5 rounded-full bg-signal animate-pulse-signal" /> Stellar · HTTP 402</div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{view === "terminal" ? "Pay per prompt." : navigation.find((item) => item.id === view)?.label}</h1>
                <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">{view === "terminal" ? "A tiny payment challenge between your request and the answer." : view === "protocol" ? "Inspect the payment challenge, retry envelope, and receipt." : view === "agents" ? "Copy a starting point for autonomous, pay-per-prompt agents." : "A local preview of recent micropayment receipts."}</p>
              </div>
              <div className="flex items-center gap-2 rounded border border-border bg-card px-3 py-2 text-xs">
                <WalletCards className="size-4 text-signal" /><span className="text-muted-foreground">Wallet</span><span className="font-medium">Sandbox only</span><span className="size-1.5 rounded-full bg-warning" />
              </div>
            </div>

            <section aria-label="Cost and network metrics" className="mb-6 grid grid-cols-1 border-y border-border sm:grid-cols-3">
              <Metric icon={Zap} label="Per prompt" value={formatUsd(STELLAR_PROMPT_FEE_USD)} detail="Stellar network fee" accent />
              <Metric icon={ArrowUpRight} label="Card minimum" value={`$${CARD_MINIMUM_USD.toFixed(2)}+`} detail={`${getCardMinimumMultiple().toLocaleString()}× higher floor`} />
              <Metric icon={Activity} label="Settlement" value="~5 sec" detail="Stellar ledger · typical" />
            </section>

            {view === "terminal" && <TerminalView
              prompt={prompt} setPrompt={setPrompt} asset={asset} setAsset={setAsset} flowState={flowState}
              requestPrompt={requestPrompt} reply={reply} hash={hash} busy={busy} onSubmit={submitPrompt}
              onInspect={() => setView("protocol")} receipts={receipts}
            />}
            {view === "protocol" && <ProtocolView flowState={flowState} requestPrompt={requestPrompt} hash={hash} onTry={() => setView("terminal")} />}
            {view === "agents" && <AgentsView language={language} setLanguage={setLanguage} code={codeSamples[language]} copied={copied} onCopy={copyCode} />}
            {view === "receipts" && <ReceiptsView receipts={receipts} />}
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

function TerminalView({ prompt, setPrompt, asset, setAsset, flowState, requestPrompt, reply, hash, busy, onSubmit, onInspect, receipts }: {
  prompt: string; setPrompt: (value: string) => void; asset: "USDC" | "XLM"; setAsset: (value: "USDC" | "XLM") => void;
  flowState: FlowState; requestPrompt: string; reply: string; hash: string; busy: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onInspect: () => void; receipts: typeof initialReceipts;
}) {
  return <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
    <section className="min-w-0 border border-border bg-card">
      <div className="flex min-h-12 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2"><TerminalSquare className="size-4 text-signal" /><h2 className="text-xs font-semibold">Prompt terminal</h2></div>
        <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground"><span className="size-1.5 rounded-full bg-signal" /> STREAM READY</div>
      </div>
      <div className="min-h-[224px] space-y-4 p-4">
        {!requestPrompt && <div className="flex min-h-[190px] flex-col items-center justify-center text-center">
          <div className="mb-3 grid size-10 place-items-center rounded border border-border bg-secondary"><MessageSquareText className="size-4 text-signal" /></div>
          <p className="text-sm font-medium">Start with a prompt</p>
          <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">The sandbox will show the 402 challenge, simulate settlement, then stream a sample reply.</p>
        </div>}
        {requestPrompt && <div className="space-y-4">
          <div className="animate-stream-in flex gap-3"><span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded border border-border bg-secondary font-mono text-[9px] text-muted-foreground">YOU</span><p className="pt-1 text-sm leading-6">{requestPrompt}</p></div>
          {(flowState === "requesting" || flowState === "challenge" || flowState === "settling" || flowState === "streaming" || flowState === "done") && <div className="animate-stream-in border-l-2 border-warning pl-3">
            <div className="flex items-center gap-2 font-mono text-[10px] text-warning"><ArrowDownLeft className="size-3.5" /> 402 PAYMENT REQUIRED <span className="text-muted-foreground">· {formatUsd(STELLAR_PROMPT_FEE_USD)} {asset}</span></div>
            <p className="mt-1 text-[11px] text-muted-foreground">{flowState === "requesting" ? "Sending request…" : "Challenge received · Stellar testnet"}</p>
          </div>}
          {(flowState === "settling" || flowState === "streaming" || flowState === "done") && <div className="animate-stream-in border-l-2 border-signal pl-3">
            <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-signal"><Check className="size-3.5" /> DEMO SETTLED <span className="text-muted-foreground">· simulated, not on-ledger</span></div>
            {hash && <p className="mt-1 break-all font-mono text-[10px] text-muted-foreground">{hash}</p>}
          </div>}
          {(reply || flowState === "streaming") && <div className="animate-stream-in flex gap-3"><span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded border border-signal/30 bg-signal-soft"><Sparkles className="size-3 text-signal" /></span><p className="pt-0.5 text-sm leading-6 text-foreground">{reply}{flowState === "streaming" && <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-signal align-middle" />}</p></div>}
        </div>}
      </div>
      <form onSubmit={onSubmit} className="border-t border-border bg-terminal p-3">
        <label className="sr-only" htmlFor="prompt-input">Enter a prompt</label>
        <textarea id="prompt-input" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Ask anything…" rows={3} className="w-full resize-y bg-transparent px-2 py-1 text-sm leading-6 text-terminal-foreground outline-none placeholder:text-muted-foreground" />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
          <div className="flex items-center gap-1 rounded border border-border bg-card p-0.5" aria-label="Payment asset">
            {(["USDC", "XLM"] as const).map((choice) => <Button key={choice} type="button" variant="ghost" size="sm" onClick={() => setAsset(choice)} aria-pressed={asset === choice} className={`h-6 rounded px-2 font-mono text-[10px] ${asset === choice ? "bg-accent text-foreground" : "text-muted-foreground"}`}>{choice}</Button>)}
          </div>
          <div className="flex items-center gap-2"><span className="font-mono text-[10px] text-muted-foreground">{formatUsd(STELLAR_PROMPT_FEE_USD)} per prompt</span><Button type="submit" disabled={busy || !prompt.trim()} className="h-8 gap-2 rounded bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"><span>{busy ? "Running" : "Send prompt"}</span>{busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}</Button></div>
        </div>
      </form>
    </section>

    <aside className="min-w-0 space-y-6">
      <section className="border border-border bg-card">
        <div className="flex min-h-12 items-center justify-between border-b border-border px-4"><div className="flex items-center gap-2"><Braces className="size-4 text-signal" /><h2 className="text-xs font-semibold">Request / response</h2></div><Button onClick={onInspect} variant="ghost" size="sm" className="h-7 gap-1.5 rounded px-2 text-[10px] text-muted-foreground">Inspect <ArrowRight className="size-3" /></Button></div>
        <div className="space-y-4 p-4 font-mono text-[10px] leading-5">
          <div><div className="mb-1 flex items-center gap-2 text-muted-foreground"><ArrowUpRight className="size-3" /> REQUEST</div><p className="break-all text-foreground">POST /v1/chat/completions</p><p className="text-muted-foreground">Content-Type: application/json</p><p className="text-muted-foreground">X-Network: stellar-testnet</p></div>
          <div className="border-t border-border pt-3"><div className="mb-1 flex items-center gap-2 text-warning"><ArrowDownLeft className="size-3" /> RESPONSE <span className="rounded border border-warning/30 px-1.5 py-0.5 text-[9px]">402</span></div><p className="text-foreground">Payment Required</p><p className="text-muted-foreground">X-Payment-Asset: {asset}</p><p className="text-muted-foreground">X-Payment-Amount: {STELLAR_PROMPT_FEE_USD}</p></div>
          {hash && <div className="break-all border-t border-border pt-3"><div className="mb-1 flex items-center gap-2 text-signal"><Check className="size-3" /> DEMO RECEIPT</div><p className="text-muted-foreground">{hash}</p><p className="mt-1 text-warning">Not submitted to Stellar.</p></div>}
        </div>
      </section>
      <section className="border-t border-border pt-4">
        <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><ReceiptText className="size-4 text-muted-foreground" /><h2 className="text-xs font-semibold">Recent receipts</h2></div><Button variant="ghost" size="sm" className="h-7 rounded px-2 text-[10px] text-muted-foreground" onClick={onInspect}>View all <ArrowRight className="ml-1 size-3" /></Button></div>
        <div className="divide-y divide-border">{receipts.slice(0, 3).map((item) => <ReceiptRow key={item.hash} receipt={item} />)}</div>
      </section>
    </aside>
  </div>;
}

function ProtocolView({ flowState, requestPrompt, hash, onTry }: { flowState: FlowState; requestPrompt: string; hash: string; onTry: () => void }) {
  const challenge = {
    status: 402,
    error: "payment_required",
    payment: {
      network: "stellar-testnet",
      asset: "USDC",
      amount: STELLAR_PROMPT_FEE_USD.toFixed(5),
      destination: "G…DEMO_DESTINATION_NOT_CONFIGURED",
      memo: "promptsip:demo-request",
      expires_in: 60,
    },
    note: "Sample challenge only — not a payable Stellar destination.",
  };
  return <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
    <section className="border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3"><div className="flex items-center gap-2"><Braces className="size-4 text-signal" /><h2 className="text-xs font-semibold">Challenge payload</h2></div><span className="font-mono text-[10px] text-warning">HTTP 402 · SAMPLE</span></div>
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-6 text-terminal-foreground"><code>{JSON.stringify(challenge, null, 2)}</code></pre>
    </section>
    <section className="space-y-5">
      <div className="border border-border bg-card">
        <div className="border-b border-border px-4 py-3"><h2 className="text-xs font-semibold">Exchange timeline</h2></div>
        <div className="space-y-0 p-4">
          <TimelineStep number="01" title="POST /v1/chat/completions" detail={requestPrompt || "Request body is waiting for a prompt"} tone="neutral" active={flowState !== "idle"} />
          <TimelineStep number="02" title="402 Payment Required" detail="Challenge asks for a Stellar payment" tone="warning" active={flowState !== "idle"} />
          <TimelineStep number="03" title="Payment settlement" detail={hash || "No ledger transaction in demo mode"} tone={hash ? "signal" : "neutral"} active={Boolean(hash)} />
          <TimelineStep number="04" title="Stream response" detail={flowState === "done" ? "Sample tokens streamed" : "Waiting for simulated settlement"} tone="neutral" active={flowState === "done"} last />
        </div>
      </div>
      <div className="flex gap-3 border border-warning/30 bg-warning/5 p-4"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-warning" /><div><h3 className="text-xs font-medium text-warning">Safe sandbox payload</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">The displayed destination and hash are examples only. This preview has no signing wallet, payment endpoint, or live AI connection.</p></div></div>
      <Button onClick={onTry} className="gap-2 rounded bg-primary text-primary-foreground"><TerminalSquare className="size-4" /> Try the flow <ArrowRight className="size-4" /></Button>
    </section>
  </div>;
}

function TimelineStep({ number, title, detail, tone, active, last = false }: { number: string; title: string; detail: string; tone: "neutral" | "warning" | "signal"; active: boolean; last?: boolean }) {
  return <div className="flex gap-3"><div className="flex w-6 shrink-0 flex-col items-center"><span className={`grid size-6 place-items-center rounded-full border font-mono text-[9px] ${active ? tone === "warning" ? "border-warning/50 bg-warning/10 text-warning" : "border-signal/40 bg-signal-soft text-signal" : "border-border text-muted-foreground"}`}>{active ? <Check className="size-3" /> : number}</span>{!last && <span className="my-1 min-h-7 w-px flex-1 bg-border" />}</div><div className="min-w-0 pb-5"><p className="text-xs font-medium">{title}</p><p className="mt-1 break-all text-[11px] leading-5 text-muted-foreground">{detail}</p></div></div>;
}

function AgentsView({ language, setLanguage, code, copied, onCopy }: { language: Language; setLanguage: (value: Language) => void; code: string; copied: boolean; onCopy: () => void }) {
  return <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
    <section className="min-w-0 border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3"><div className="flex items-center gap-2"><FileCode2 className="size-4 text-signal" /><h2 className="text-xs font-semibold">402 negotiation example</h2></div><div className="flex items-center gap-1 rounded border border-border bg-background p-0.5">{(["Python", "TypeScript", "cURL"] as const).map((item) => <Button key={item} variant="ghost" size="sm" onClick={() => setLanguage(item)} aria-pressed={language === item} className={`h-7 rounded px-2.5 font-mono text-[10px] ${language === item ? "bg-accent text-foreground" : "text-muted-foreground"}`}>{item}</Button>)}</div></div>
      <div className="flex items-center justify-between border-b border-border px-4 py-2"><span className="font-mono text-[10px] text-muted-foreground">{language === "Python" ? "agent.py" : language === "TypeScript" ? "agent.ts" : "request.sh"} · illustrative</span><Button variant="outline" size="sm" onClick={onCopy} className="h-7 gap-1.5 rounded border-border bg-transparent px-2 text-[10px]">{copied ? <Check className="size-3 text-signal" /> : <Copy className="size-3" />}{copied ? "Copied" : "Copy"}</Button></div>
      <pre className="max-h-[560px] overflow-auto p-4 text-[11px] leading-[1.8] text-terminal-foreground"><code>{code}</code></pre>
    </section>
    <div className="space-y-6">
      <section className="border-t border-border pt-4"><div className="mb-4 flex items-center gap-2"><Layers3 className="size-4 text-signal" /><h2 className="text-xs font-semibold">Agent flow</h2></div><div className="divide-y divide-border">{[
        { icon: ArrowUpRight, title: "Send prompt", detail: "POST your request with no API key" },
        { icon: LockKeyhole, title: "Read 402 challenge", detail: "Parse amount, asset, and destination" },
        { icon: WalletCards, title: "Sign payment", detail: "Approve a Stellar transaction" },
        { icon: Radio, title: "Retry & stream", detail: "Attach receipt hash and read tokens" },
      ].map(({ icon: Icon, title, detail }, index) => <div key={title} className="flex items-center gap-3 py-3"><span className="font-mono text-[10px] text-muted-foreground">0{index + 1}</span><Icon className="size-4 text-signal" /><div><p className="text-xs font-medium">{title}</p><p className="mt-1 text-[10px] text-muted-foreground">{detail}</p></div></div>)}</div></section>
      <div className="border border-warning/30 bg-warning/5 p-4"><p className="flex items-center gap-2 text-xs font-medium text-warning"><CircleDot className="size-3.5" /> Example only</p><p className="mt-2 text-xs leading-5 text-muted-foreground">These snippets demonstrate the protocol shape. The API endpoint, wallet SDK, and payment verifier are not connected in this preview.</p></div>
    </div>
  </div>;
}

function ReceiptsView({ receipts }: { receipts: typeof initialReceipts }) {
  return <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
    <section className="min-w-0 border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3"><div className="flex items-center gap-2"><ReceiptText className="size-4 text-signal" /><h2 className="text-xs font-semibold">Recent receipts</h2></div><span className="font-mono text-[10px] text-warning">LOCAL SAMPLES</span></div>
      <div className="divide-y divide-border">{receipts.map((receipt) => <ReceiptRow key={receipt.hash} receipt={receipt} />)}</div>
    </section>
    <section className="border-t border-border pt-4">
      <div className="mb-4 flex items-center gap-2"><Gauge className="size-4 text-signal" /><h2 className="text-xs font-semibold">Cost at a glance</h2></div>
      <div className="space-y-5">
        <div><div className="mb-2 flex justify-between text-xs"><span className="text-muted-foreground">PromptSip · Stellar</span><span className="font-mono text-signal">{formatUsd(STELLAR_PROMPT_FEE_USD)}</span></div><div className="h-2 overflow-hidden rounded-sm bg-secondary"><div className="h-full w-[3%] bg-signal" /></div></div>
        <div><div className="mb-2 flex justify-between text-xs"><span className="text-muted-foreground">Card payment minimum</span><span className="font-mono text-foreground">$0.30+</span></div><div className="h-2 overflow-hidden rounded-sm bg-secondary"><div className="h-full w-full bg-chart-3" /></div></div>
        <div className="border-t border-border pt-4"><p className="font-mono text-3xl font-medium text-signal">{getCardMinimumMultiple().toLocaleString()}×</p><p className="mt-1 text-xs text-muted-foreground">Lower per-prompt floor in this comparison</p></div>
        <div className="flex items-start gap-2 border border-border p-3 text-[11px] leading-5 text-muted-foreground"><Clock3 className="mt-0.5 size-3.5 shrink-0" />Typical Stellar confirmation is around 5 seconds. No live ledger telemetry is connected.</div>
      </div>
    </section>
  </div>;
}

function ReceiptRow({ receipt }: { receipt: (typeof initialReceipts)[number] }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
    <div className="flex min-w-0 items-center gap-3"><span className="grid size-7 shrink-0 place-items-center rounded border border-signal/25 bg-signal-soft"><Check className="size-3.5 text-signal" /></span><div className="min-w-0"><p className="truncate text-xs font-medium">{receipt.prompt}</p><p className="mt-1 break-all font-mono text-[9px] text-muted-foreground">{receipt.hash}</p></div></div>
    <div className="ml-10 flex shrink-0 items-center gap-3 font-mono text-[10px]"><span className="text-muted-foreground">{receipt.asset}</span><span className="text-foreground">{receipt.amount}</span><span className="text-muted-foreground">{receipt.time}</span><span className="rounded border border-warning/30 px-1.5 py-0.5 text-[8px] text-warning">DEMO</span></div>
  </div>;
}