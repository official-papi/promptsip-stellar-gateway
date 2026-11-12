import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { STELLAR_PROMPT_FEE_USD, CARD_MINIMUM_USD, getCardMinimumMultiple } from "@/lib/prompt-fee-metrics";

/* Stelsuite: Ajo (save), StellarDrop (send) and PromptSip (pay per use) on one set of Stellar rails. */

type Page = "home" | "ajo" | "drop" | "promptsip" | "verify";
const PAGES: Page[] = ["home", "ajo", "drop", "promptsip", "verify"];

const AJO_APP = "https://ajo-stellar.vercel.app";
const AJO_REPO = "https://github.com/Savioula23/ajo-stellar";
const AJO_CONTRACT = "CD3DQJD4NVU2OHGM4LTRUMJAH6XK2LFGGE3ZRZTRUH7XJ37VZ4K36BFT";
const DROP_REPO = "https://github.com/jedi-dtechmaker/stellar-hackathon";
const DROP_BOT = "https://t.me/StellarDropBot";
const DROP_APP = "https://stellardrop.netlify.app";
const SIP_REPO = "https://github.com/official-papi/promptsip-stellar-gateway";
const SIP_CONTRACT = "CB2U4ZI42D4NVHUXKG4ZZRAOYESU65QIWY47EZX5HMRQVJMDKAKWAK2N";
const SIP_DEPLOY_TX = "9b421221df7ed238f996a93e78fadf8c0daa4d5b84d034564dfa438352033c61";
const SIP_INIT_TX = "fce04374a177e7235eb1255256d371c1263ded684dd978bbb537fd3c93d57dfb";
const expertContract = (id: string) => `https://stellar.expert/explorer/testnet/contract/${id}`;
const expertTx = (h: string) => `https://stellar.expert/explorer/testnet/tx/${h}`;
const short = (s: string) => `${s.slice(0, 6)}…${s.slice(-4)}`;
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const ICONS = { ajo: "◎", drop: "➤", promptsip: "⌁" } as const;

const PRODUCTS = {
  ajo: { name: "Ajo", verb: "Save", color: "var(--ajo)", soft: "var(--ajo-soft)", line: "Rotating savings circles with no treasurer to trust." },
  drop: { name: "StellarDrop", verb: "Send", color: "var(--drop)", soft: "var(--drop-soft)", line: "Send USDC to anyone on Telegram with a claim link." },
  promptsip: { name: "PromptSip", verb: "Pay per use", color: "var(--sip)", soft: "var(--sip-soft)", line: "Pay for each AI request with a Stellar micropayment." },
} as const;

export function Suite() {
  const [page, setPage] = useState<Page>("home");
  useEffect(() => {
    const read = () => { const h = window.location.hash.slice(1) as Page; setPage(PAGES.includes(h) ? h : "home"); };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [page]);

  return (
    <div className="flex min-h-screen flex-col">
      <Nav page={page} />
      <main className="flex-1">
        {page === "home" && <Home />}
        {page === "ajo" && <AjoPage />}
        {page === "drop" && <DropPage />}
        {page === "promptsip" && <PromptSipPage />}
        {page === "verify" && <VerifyPage />}
      </main>
      <Footer />
    </div>
  );
}

/* ---------------------------------- Shell ---------------------------------- */

function Mark() {
  return (
    <span className="grid h-[35px] w-[35px] place-items-center rounded-[10px]" style={{ background: "var(--foreground)", color: "var(--lime)" }} aria-hidden="true">
      <svg width="21" height="21" viewBox="0 0 32 32">
        <circle cx="16" cy="9" r="4" fill="currentColor" />
        <circle cx="22.5" cy="20.5" r="4" fill="currentColor" fillOpacity="0.75" />
        <circle cx="9.5" cy="20.5" r="4" fill="currentColor" fillOpacity="0.5" />
      </svg>
    </span>
  );
}
function Wordmark() {
  return <span className="whitespace-nowrap text-[24px] font-bold tracking-[-1.1px]">stel<span className="font-normal">suite</span><span className="font-black" style={{ color: "#81ab41" }}>.</span></span>;
}

function Nav({ page }: { page: Page }) {
  const [open, setOpen] = useState(false);
  const links: [Page, string][] = [["ajo", "Ajo"], ["drop", "StellarDrop"], ["promptsip", "PromptSip"], ["verify", "Verify"]];
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="wrap flex h-20 items-center justify-between gap-6">
        <a href="#home" className="flex items-center gap-2.5 text-foreground no-underline" onClick={() => setOpen(false)}>
          <Mark /><Wordmark />
        </a>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Products">
          {links.map(([p, label]) => (
            <a key={p} href={`#${p}`} aria-current={page === p ? "page" : undefined}
              className={`rounded-full px-3.5 py-1.5 text-[15px] font-medium no-underline transition-colors ${page === p ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex"><span className="badge">Stellar Testnet</span><a className="btn btn-ink btn-sm" href={AJO_APP} target="_blank" rel="noreferrer">Open Ajo app</a></div>
        <button className="btn btn-line btn-sm md:hidden" aria-expanded={open} aria-controls="m-nav" onClick={() => setOpen(!open)}>{open ? "Close" : "Menu"}</button>
      </div>
      {open && (
        <nav id="m-nav" className="fixed inset-x-0 top-20 bottom-0 z-50 flex flex-col gap-2 bg-background p-6 md:hidden" aria-label="Products">
          {links.map(([p, label]) => (
            <a key={p} href={`#${p}`} onClick={() => setOpen(false)} className="border-b border-border py-4 text-2xl font-bold text-foreground no-underline" style={{ fontFamily: "var(--font-display)" }}>{label}</a>
          ))}
          <a className="btn btn-ink mt-4" href={AJO_APP} target="_blank" rel="noreferrer">Open Ajo app</a>
        </nav>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="wrap flex flex-wrap items-center justify-between gap-4 py-8 text-sm text-muted-foreground">
        <span className="flex items-center gap-2 text-foreground"><Mark /> <Wordmark /></span>
        <span>Built for Boundless Build Day, Stellar Nigeria. All three products run on Stellar testnet with test money.</span>
      </div>
    </footer>
  );
}

function Ext({ href, children, className = "btn btn-line" }: { href: string; children: ReactNode; className?: string }) {
  return <a className={className} href={href} target="_blank" rel="noreferrer">{children} <span aria-hidden="true">↗</span></a>;
}

/* ---------------------------------- Home ---------------------------------- */

function Home() {
  return (
    <>
      <section className="wrap grid items-center gap-12 py-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16" style={{ minHeight: "var(--screen)" }} aria-labelledby="h1">
        <div>
          <p className="eyebrow">Save. Send. Pay per use.</p>
          <h1 id="h1" className="mt-5 text-[clamp(50px,5.2vw,76px)] font-bold leading-[1.03]">
            Everyday money,<br />on <Squiggle>Stellar.</Squiggle>
          </h1>
          <p className="lede mt-6">
            Stelsuite is everyday money for Nigeria: savings circles, Telegram cash transfers and pay-per-request AI,
            all settled in USDC on Stellar with fees under a cent.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a className="btn btn-ink" href="#products">See the products <span aria-hidden="true">↓</span></a>
            <a className="btn btn-line" href="#verify">Verify the contracts</a>
          </div>
        </div>
        <HeroStack />
      </section>

      <div className="wrap">
        <div className="trust">
          <span style={{ letterSpacing: "0.14em" }}>THREE PRODUCTS. ONE SET OF RAILS.</span>
          <span>⚡ Stellar speed</span><span>₦ Naira in and out</span><span>🔒 Contracts you can check</span>
          <span style={{ letterSpacing: "0.14em" }}>✦ STELLAR</span>
        </div>
      </div>

      <section id="products" className="sec wrap" aria-labelledby="products-h">
        <h2 id="products-h">Three products, one set of Stellar rails</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {(Object.keys(PRODUCTS) as (keyof typeof PRODUCTS)[]).map((k, i) => {
            const p = PRODUCTS[k];
            return (
              <a key={k} href={`#${k}`} className="card-link flex min-h-[300px] flex-col gap-4 rounded-[10px] border border-[#dde2d1] p-7 text-foreground no-underline" style={{ background: p.soft }}>
                <span className="flex items-center justify-between"><span className="icon-box" aria-hidden="true">{ICONS[k]}</span><span className="num text-sm">0{i + 1}</span></span>
                <h3 className="text-[26px] font-bold tracking-[-0.04em]">{p.name}</h3>
                <p className="text-[15px]" style={{ color: "var(--ink-2)" }}>{p.line}</p>
                <ProductGlyph kind={k} />
                <span className="card-foot mt-auto">{p.verb} <span aria-hidden="true">↗</span></span>
              </a>
            );
          })}
        </div>
      </section>

      <section className="sec wrap" aria-labelledby="rails-h">
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 id="rails-h">How money moves through the suite</h2>
            <p className="lede mt-6">
              Naira comes in through a licensed Stellar anchor and becomes USDC. From there it can sit in an Ajo circle,
              go to a friend on Telegram, or pay for an AI request a fraction of a cent at a time, then leave as naira the same way.
            </p>
          </div>
          <Rails />
        </div>
      </section>

      <section id="verify-band" className="dark-band" aria-labelledby="proof-h">
        <div className="wrap grid gap-10 py-24" style={{ minHeight: "min(var(--screen), 760px)", alignContent: "center" }}>
          <h2 id="proof-h" className="h2" style={{ color: "inherit" }}>Two smart contracts you can check yourself</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <ContractCard name="Ajo circles" id={AJO_CONTRACT} what="Holds deposits and contributions, covers missed payments, releases each pot." />
            <ContractCard name="PromptSip meter" id={SIP_CONTRACT} what="Settles each AI request, keeps a receipt per prompt, refuses duplicate payments." />
          </div>
          <a href="#verify" className="uline justify-self-start text-[15px] font-semibold" style={{ color: "inherit" }}>Every contract, transaction and repository →</a>
        </div>
      </section>

      <section className="sec wrap" aria-labelledby="team-h">
        <h2 id="team-h">Built by three Stellar builders in Nigeria</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Builder handle="Savioula23" product="Ajo" what="Savings-circle contract, passkey wallets, naira cash-in and cash-out." color="var(--ajo)" />
          <Builder handle="jedi-dtechmaker" product="StellarDrop" what="Telegram bot, claim links, anchor cash-out for recipients." color="var(--drop)" />
          <Builder handle="official-papi" product="PromptSip" what="HTTP 402 gateway, metering contract, the suite's first build." color="var(--sip)" />
        </div>
      </section>

      <Close />
    </>
  );
}

function ContractCard({ name, id, what }: { name: string; id: string; what: string }) {
  return (
    <a className="dark-card block p-7 no-underline" style={{ color: "inherit" }} href={expertContract(id)} target="_blank" rel="noreferrer">
      <span className="tag opacity-70">Soroban contract</span>
      <h3 className="mt-3 text-xl font-bold">{name}</h3>
      <p className="mt-2 opacity-75">{what}</p>
      <p className="num mt-6 text-sm opacity-90">{short(id)} on Stellar Expert ↗</p>
    </a>
  );
}

function Builder({ handle, product, what, color }: { handle: string; product: string; what: string; color: string }) {
  return (
    <a className="card card-link flex flex-col gap-3 p-7 text-foreground no-underline" href={`https://github.com/${handle}`} target="_blank" rel="noreferrer">
      <span className="flex items-center gap-3">
        <img src={`https://github.com/${handle}.png?size=96`} alt="" width={44} height={44} className="rounded-full border border-border" loading="lazy" />
        <span><b className="block">{handle}</b><span className="tag" style={{ color }}>{product}</span></span>
      </span>
      <p className="text-muted-foreground">{what}</p>
    </a>
  );
}

function Close() {
  return (
    <section className="lime-band" aria-labelledby="close-h">
      <div className="wrap grid justify-items-center gap-5 py-28 text-center">
        <h2 id="close-h" className="h2" style={{ color: "inherit", maxWidth: "18ch" }}>Good money moves, on Stellar.</h2>
        <p className="max-w-[46ch] text-lg" style={{ color: "var(--ink-2)" }}>Save with Ajo, send with StellarDrop, and pay per request with PromptSip.</p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <a className="btn btn-ink" href={AJO_APP} target="_blank" rel="noreferrer">Open Ajo ↗</a>
          <a className="btn btn-line" style={{ borderColor: "#20281f40" }} href={DROP_APP} target="_blank" rel="noreferrer">Open StellarDrop ↗</a>
        </div>
      </div>
    </section>
  );
}

/* StellarDrop's hand-drawn underline. */
function Squiggle({ children }: { children: ReactNode }) {
  return (
    <span className="squiggle">{children}<svg viewBox="0 0 470 16" preserveAspectRatio="none" aria-hidden="true"><path d="M4 11 Q200 -2 466 9 M80 15 Q280 5 435 14" /></svg></span>
  );
}

/* Small diagram glyph per product card. */
function ProductGlyph({ kind }: { kind: keyof typeof PRODUCTS }) {
  const c = PRODUCTS[kind].color;
  return (
    <svg viewBox="0 0 240 70" className="w-full" aria-hidden="true">
      {kind === "ajo" && (<>
        <circle cx="120" cy="35" r="26" fill="none" stroke={c} strokeOpacity="0.35" strokeWidth="2" strokeDasharray="4 5" />
        {[0, 1, 2, 3, 4, 5].map((i) => { const a = (i / 6) * Math.PI * 2 - Math.PI / 2; return <circle key={i} cx={120 + Math.cos(a) * 26} cy={35 + Math.sin(a) * 26} r={i === 0 ? 7 : 5} fill={i === 0 ? c : "var(--card)"} stroke={c} strokeWidth="2" />; })}
      </>)}
      {kind === "drop" && (<>
        <rect x="20" y="20" width="60" height="30" rx="15" fill="var(--card)" stroke={c} strokeWidth="2" />
        <path d="M84 35 H156" stroke={c} strokeWidth="2" strokeDasharray="5 5"><animate attributeName="stroke-dashoffset" from="20" to="0" dur="1.5s" repeatCount="indefinite" /></path>
        <rect x="160" y="20" width="60" height="30" rx="15" fill={c} />
        <text x="50" y="40" textAnchor="middle" fontSize="12" fontWeight="600" fill={c}>you</text>
        <text x="190" y="40" textAnchor="middle" fontSize="12" fontWeight="600" fill="white">friend</text>
      </>)}
      {kind === "promptsip" && (<>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => <rect key={i} x={22 + i * 22} y={35 - (8 + (i % 3) * 7)} width="14" height={16 + (i % 3) * 14} rx="4" fill={c} fillOpacity={0.25 + (i % 3) * 0.25} />)}
      </>)}
    </svg>
  );
}

/* Hero: the three products' own screens, layered. */
function HeroStack() {
  return (
    <div className="relative mx-auto grid w-full max-w-[560px] gap-4" aria-label="Screens from Ajo, StellarDrop and PromptSip" role="img">
      <div className="orbit hidden lg:block" style={{ inset: "-30px -40px auto auto", width: 460, height: 460 }} aria-hidden="true" />
      <div className="orbit hidden lg:block" style={{ inset: "auto auto -40px -50px", width: 300, height: 300 }} aria-hidden="true" />
      <div className="frame tilt-l relative">
        <div className="frame-bar"><i /><i /><i /><span>ajo-stellar.vercel.app</span></div>
        <AjoMini />
      </div>
      <div className="relative grid gap-4 sm:grid-cols-2">
        <div className="tilt-r"><TelegramMini /></div>
        <div className="tilt-l"><TerminalMini /></div>
      </div>
    </div>
  );
}

function useCycle(n: number, ms = 3000) {
  const [i, setI] = useState(Math.max(0, n - 2)); // open part-way through, so the first look is never empty
  useEffect(() => {
    if (reduced()) { setI(n - 1); return; }
    const t = window.setInterval(() => setI((x) => (x + 1) % n), ms);
    return () => window.clearInterval(t);
  }, [n, ms]);
  return i;
}

function AjoMini() {
  const paid = useCycle(4); // 0..3 of the three payers have paid
  const names = ["Adaeze", "Bola", "Chike", "Dayo"];
  const payers = ["Adaeze", "Chike", "Dayo"]; // Bola receives this round
  return (
    <div className="grid gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <div><b>Market women, Itam</b><p className="text-sm text-muted-foreground">₦30,000 weekly · 4 members · protected</p></div>
        <span className="pill pill-ajo">Round 2 of 4</span>
      </div>
      <div className="rounded-[10px] p-3" style={{ background: "var(--ajo-soft)" }}>
        <span className="text-sm text-muted-foreground">Pot for Bola, of ₦90,000</span>
        <p className="num text-3xl font-bold" style={{ color: "var(--ajo)" }}>₦{(paid * 30000).toLocaleString("en-US")}</p>
      </div>
      <ul className="grid gap-1.5 text-sm">
        {names.map((m) => {
          const j = payers.indexOf(m);
          const s = j < 0 ? "Receives" : j < paid ? "Paid" : "Due Fri";
          return (
            <li key={m} className="flex items-center gap-2.5 border-t border-border pt-1.5 first:border-0 first:pt-0">
              <span className="avatar">{m[0]}</span><span className="flex-1">{m}</span>
              <span className={`pill ${s === "Paid" ? "pill-ok" : s === "Receives" ? "pill-ajo" : ""}`}>{s}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TelegramMini() {
  const step = useCycle(3, 2800);
  return (
    <div className="frame p-4" style={{ background: "var(--drop-soft)" }}>
      <p className="tag mb-3" style={{ color: "var(--drop)" }}>StellarDrop · Telegram</p>
      <div className="grid gap-2 text-sm">
        <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-card px-3 py-2 shadow-sm">Tunde sent you <b className="num">10 USDC</b>. Tap to claim.</div>
        {step >= 1 && <div className="ml-auto max-w-[70%] rounded-2xl rounded-br-sm px-3 py-2 text-white" style={{ background: "var(--drop)" }}>/claim</div>}
        {step >= 2 && <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-card px-3 py-2 shadow-sm">Claimed. <b className="num">10 USDC</b> is in your wallet. Type /withdraw to cash out.</div>}
      </div>
    </div>
  );
}

function TerminalMini() {
  const step = useCycle(4, 2600);
  const lines = [
    ["→", "POST /v1/execute", ""],
    ["←", "402 Payment Required", "var(--sip)"],
    ["⇢", "pay_prompt 0.00001 USDC", ""],
    ["←", "200 OK · streaming", "var(--ok)"],
  ];
  return (
    <div className="code shadow-xl" style={{ borderRadius: "var(--radius-lg)" }}>
      <p className="tag mb-2" style={{ color: "var(--sip)" }}>PromptSip · HTTP 402</p>
      {lines.map(([a, t, c], i) => (
        <p key={t} className="num text-[13px] transition-opacity duration-300" style={{ opacity: i <= step ? 1 : 0.25, color: c || undefined }}>
          <span className="opacity-60">{a}</span> {t}
        </p>
      ))}
    </div>
  );
}

/* Diagram: bank → anchor → USDC → three products, payments pulsing along the lines. */
function Rails() {
  const outs: [string, string, number][] = [["Ajo", "var(--ajo)", 60], ["StellarDrop", "var(--drop)", 150], ["PromptSip", "var(--sip)", 240]];
  return (
    <svg viewBox="0 0 560 300" className="flow w-full" role="img" aria-label="Naira from a bank goes through a Stellar anchor into USDC, which flows to Ajo, StellarDrop and PromptSip">
      <path id="r-in" d="M108 150 H196" className="flow-line" />
      <path id="r-mid" d="M300 150 H340" className="flow-line" />
      {outs.map(([n, , y]) => <path key={n} id={`r-${n}`} d={`M340 150 C 380 150, 380 ${y}, 420 ${y}`} className="flow-line" />)}
      {!reduced() && (<>
        <circle r="5" fill="var(--foreground)"><animateMotion dur="2.8s" repeatCount="indefinite"><mpath href="#r-in" /></animateMotion></circle>
        {outs.map(([n, c], i) => <circle key={n} r="5" fill={c}><animateMotion dur="2.8s" begin={`${0.9 + i * 0.3}s`} repeatCount="indefinite"><mpath href={`#r-${n}`} /></animateMotion></circle>)}
      </>)}
      <g transform="translate(8 126)"><rect width="100" height="48" rx="12" className="flow-node" /><text x="50" y="22" textAnchor="middle">Your bank</text><text x="50" y="38" textAnchor="middle" className="sub">₦ naira</text></g>
      <g transform="translate(196 116)"><rect width="104" height="68" rx="14" fill="var(--foreground)" /><text x="52" y="31" textAnchor="middle" style={{ fill: "var(--background)" }}>Anchor</text><text x="52" y="49" textAnchor="middle" className="sub" style={{ fill: "var(--background)", opacity: 0.7 }}>SEP-24 · USDC</text></g>
      {outs.map(([n, c, y]) => (
        <g key={n} transform={`translate(420 ${y - 22})`}><rect width="132" height="44" rx="22" fill="var(--card)" stroke={c} strokeWidth="1.6" /><circle cx="22" cy="22" r="6" fill={c} /><text x="38" y="27">{n}</text></g>
      ))}
    </svg>
  );
}

/* ------------------------------ Product pages ------------------------------ */

function ProductHero({ kind, title, lede, actions, visual }: { kind: keyof typeof PRODUCTS; title: string; lede: string; actions: ReactNode; visual: ReactNode }) {
  const p = PRODUCTS[kind];
  return (
    <section className="wrap grid items-center gap-12 py-10 lg:grid-cols-[1fr_1fr] lg:gap-16" style={{ minHeight: "var(--screen)" }} aria-labelledby={`${kind}-h1`}>
      <div>
        <span className="eyebrow">{p.name} · {p.verb}</span>
        <h1 id={`${kind}-h1`} className="mt-5 text-[clamp(44px,4.4vw,68px)] font-bold leading-[1.03]">{title}</h1>
        <p className="lede mt-6">{lede}</p>
        <div className="mt-8 flex flex-wrap gap-3">{actions}</div>
      </div>
      {visual}
    </section>
  );
}

function Steps({ items, color }: { items: [string, string][]; color: string }) {
  return (
    <ol className="grid gap-4 md:grid-cols-4">
      {items.map(([t, d], i) => (
        <li key={t} className="card p-6">
          <span className="num text-sm font-semibold" style={{ color }}>0{i + 1}</span>
          <h3 className="mt-3 text-lg font-bold">{t}</h3>
          <p className="mt-2 text-muted-foreground">{d}</p>
        </li>
      ))}
    </ol>
  );
}

function AjoPage() {
  return (
    <>
      <ProductHero kind="ajo" title="Savings circles nobody can run off with."
        lede="Ajo puts the rotating savings circle on a Soroban contract. Members put down a refundable deposit, pay each round, and the contract releases the pot. No treasurer holds the cash."
        actions={<><Ext href={AJO_APP} className="btn btn-ink">Open the Ajo app</Ext><Ext href={AJO_REPO}>Read the code</Ext></>}
        visual={<div className="frame"><div className="frame-bar"><i /><i /><i /><span>ajo-stellar.vercel.app/#/c/122-228</span></div><AjoMini /></div>} />
      <section className="sec wrap" aria-labelledby="ajo-how">
        <h2 id="ajo-how">One round of an Ajo circle</h2>
        <Steps color="var(--ajo)" items={[
          ["Create the circle", "Set the contribution in naira, how often, and up to 12 seats."],
          ["Share a code", "Friends join with a six-character code, a QR code or a WhatsApp link."],
          ["Everyone pays in", "The contract counts each payment and who paid on time."],
          ["The pot is released", "When every share lands, the round's recipient claims the full pot."],
        ]} />
      </section>
      <section className="sec wrap" aria-labelledby="ajo-protect">
        <h2 id="ajo-protect">What the contract enforces</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Refundable deposit", "Held by the contract, returned after the last round."],
            ["Missed payment cover", "After a grace period, anyone can pay a missing share from that member's deposit."],
            ["Early payout by bid", "A member can bid to take a round early; the member they swap with gets the bid."],
            ["Passkey sign-in", "A fingerprint instead of a secret key, with network fees sponsored."],
            ["Naira in and out", "Deposits and cash-outs through a Stellar anchor, shown in naira."],
            ["Ajo Score", "A 300 to 850 payment record read from the ledger, shareable by link."],
          ].map(([t, d]) => (
            <div key={t} className="card p-6"><h3 className="text-lg font-bold">{t}</h3><p className="mt-2 text-muted-foreground">{d}</p></div>
          ))}
        </div>
        <a className="uline justify-self-start num text-sm" href={expertContract(AJO_CONTRACT)} target="_blank" rel="noreferrer">Contract {short(AJO_CONTRACT)} on Stellar Expert ↗</a>
      </section>
    </>
  );
}

function DropPage() {
  const [amount, setAmount] = useState("10");
  const [preview, setPreview] = useState<string | null>(null);
  const make = (e: FormEvent) => {
    e.preventDefault();
    const part = () => Math.random().toString(36).slice(2, 6).toUpperCase();
    setPreview(`DROP-${part()}-${part()}`);
  };
  return (
    <>
      <ProductHero kind="drop" title="Send USDC to anyone on Telegram."
        lede="StellarDrop turns a payment into a claim link. The recipient taps it in Telegram, gets a wallet without installing anything, and can cash out to a bank through the anchor."
        actions={<><Ext href={DROP_APP} className="btn btn-ink">Open StellarDrop</Ext><Ext href={DROP_BOT}>Telegram bot</Ext></>}
        visual={<div className="tilt-r mx-auto w-full max-w-[420px]"><TelegramMini /></div>} />
      <section className="sec wrap" aria-labelledby="drop-how">
        <h2 id="drop-how">From sender to bank account in four steps</h2>
        <Steps color="var(--drop)" items={[
          ["Create a drop", "The sender's USDC is held in a Stellar claimable balance."],
          ["Share the link", "A Telegram deep link carries the claim code, so it works from WhatsApp too."],
          ["Claim in the bot", "The bot makes the recipient a wallet, adds USDC and claims the balance."],
          ["Cash out", "/withdraw starts an anchor cash-out to a bank account."],
        ]} />
      </section>
      <section className="sec wrap" aria-labelledby="drop-try">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <div>
            <h2 id="drop-try">What a claim link looks like</h2>
            <p className="lede mt-6">The bot issues the real code when it escrows the money. This preview only shows the format; it sends nothing.</p>
          </div>
          <form onSubmit={make} className="card grid gap-4 p-7">
            <label className="grid gap-2 text-sm font-semibold">Amount in USDC
              <input className="input num" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} />
            </label>
            <button className="btn btn-ink" disabled={!Number(amount)}>Preview a claim link</button>
            {preview && (
              <div className="rounded-[10px] p-4" style={{ background: "var(--drop-soft)" }}>
                <span className="tag" style={{ color: "var(--drop)" }}>Preview · {amount} USDC</span>
                <p className="num mt-2 text-xl font-bold">{preview}</p>
                <p className="num mt-1 break-all text-sm text-muted-foreground">t.me/StellarDropBot?start={preview}</p>
              </div>
            )}
          </form>
        </div>
      </section>
    </>
  );
}

const codeSamples = {
  TypeScript: `let res = await fetch(endpoint, { method: "POST", body })

if (res.status === 402) {
  const { payment } = await res.json()
  const hash = await wallet.pay(payment)   // settles on Stellar
  res = await fetch(endpoint, {
    method: "POST", body,
    headers: { "X-Payment-Hash": hash },
  })
}`,
  Python: `res = requests.post(endpoint, json=body)

if res.status_code == 402:
    payment = res.json()["payment"]
    tx_hash = wallet.pay(payment)        # settles on Stellar
    res = requests.post(endpoint, json=body,
                        headers={"X-Payment-Hash": tx_hash})`,
  cURL: `curl -i $ENDPOINT -d '{"prompt":"…"}'
# HTTP/1.1 402 Payment Required → pay on Stellar, then:
curl -N $ENDPOINT -H "X-Payment-Hash: <tx>" -d '{"prompt":"…"}'`,
} as const;
type Lang = keyof typeof codeSamples;

function PromptSipPage() {
  return (
    <>
      <ProductHero kind="promptsip" title="Pay for each AI request, not a monthly plan."
        lede="PromptSip answers an AI request with HTTP 402 Payment Required. The client pays a fraction of a cent on Stellar, the metering contract records a receipt, and the answer streams back."
        actions={<><Ext href={expertContract(SIP_CONTRACT)} className="btn btn-ink">See the contract</Ext><Ext href={SIP_REPO}>Read the code</Ext></>}
        visual={<TerminalMini />} />
      <section className="sec wrap" aria-labelledby="sip-fee">
        <h2 id="sip-fee">Why per-request pricing needs Stellar</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card p-7"><span className="tag" style={{ color: "var(--sip)" }}>PromptSip price</span><p className="num mt-3 text-4xl font-bold">${STELLAR_PROMPT_FEE_USD.toFixed(5)}</p><p className="mt-2 text-muted-foreground">per request in the demo, settled in USDC or XLM.</p></div>
          <div className="card p-7"><span className="tag text-muted-foreground">Typical card minimum</span><p className="num mt-3 text-4xl font-bold">${CARD_MINIMUM_USD.toFixed(2)}</p><p className="mt-2 text-muted-foreground">fixed fee on a card payment, before any percentage.</p></div>
          <div className="card p-7"><span className="tag text-muted-foreground">Difference</span><p className="num mt-3 text-4xl font-bold">{getCardMinimumMultiple().toLocaleString("en-US")}×</p><p className="mt-2 text-muted-foreground">which is why cards cannot charge per request.</p></div>
        </div>
      </section>
      <section className="sec wrap" aria-labelledby="sip-try">
        <h2 id="sip-try">Try the 402 flow</h2>
        <Playground />
      </section>
      <section className="sec wrap" aria-labelledby="sip-sdk">
        <h2 id="sip-sdk">Add pay-per-request to any client</h2>
        <Sdk />
      </section>
    </>
  );
}

type Flow = "idle" | "request" | "challenge" | "settle" | "stream" | "done";
const FLOW_TEXT: Record<Flow, string> = { idle: "", request: "POST /v1/execute", challenge: "402 Payment Required: 0.00001 USDC", settle: "Settling pay_prompt on Stellar…", stream: "200 OK, streaming answer", done: "Receipt recorded" };

function Playground() {
  const [prompt, setPrompt] = useState("");
  const [flow, setFlow] = useState<Flow>("idle");
  const [log, setLog] = useState<string[]>([]);
  const [answer, setAnswer] = useState("");
  const [receipts, setReceipts] = useState<{ id: number; prompt: string }[]>([]);
  const busy = flow !== "idle" && flow !== "done";
  const wait = (ms: number) => new Promise((r) => window.setTimeout(r, reduced() ? 0 : ms));

  async function run(e: FormEvent) {
    e.preventDefault();
    const q = prompt.trim();
    if (!q || busy) return;
    setPrompt(""); setAnswer(""); setLog([]);
    for (const s of ["request", "challenge", "settle", "stream"] as Flow[]) {
      setFlow(s); setLog((l) => [...l, FLOW_TEXT[s]]); await wait(650);
    }
    const words = "In the live gateway, this answer streams only after the payment is verified against the metering contract.".split(" ");
    for (let i = 1; i <= words.length; i++) { setAnswer(words.slice(0, i).join(" ")); await wait(30); }
    setFlow("done");
    setReceipts((r) => [{ id: Date.now(), prompt: q }, ...r].slice(0, 4));
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="frame flex flex-col">
        <div className="frame-bar"><i /><i /><i /><span>Browser simulation · no payment is sent</span></div>
        <div className="grid min-h-[300px] content-start gap-3 p-5">
          {log.map((l, i) => <p key={i} className="num text-sm" style={{ color: l.startsWith("402") ? "var(--sip)" : l.startsWith("200") ? "var(--ok)" : undefined }}>{l}</p>)}
          {answer && <p className="rounded-[10px] p-3 text-[15px]" style={{ background: "var(--sip-soft)" }}>{answer}</p>}
          {!log.length && <p className="text-muted-foreground">Ask anything to see the request, the 402 challenge, the payment and the answer.</p>}
        </div>
        <form onSubmit={run} className="flex gap-2 border-t border-border p-3">
          <label htmlFor="sip-q" className="sr-only">Prompt</label>
          <input id="sip-q" className="input" placeholder="Summarise today's Stellar ledger activity" value={prompt} disabled={busy} onChange={(e) => setPrompt(e.target.value)} />
          <button className="btn btn-ink" disabled={busy || !prompt.trim()}>Send request</button>
        </form>
      </div>
      <div className="card p-6">
        <h3 className="text-lg font-bold">Receipts in this session</h3>
        {receipts.length === 0 ? <p className="mt-2 text-muted-foreground">Each simulated request adds one here.</p> : (
          <ul className="mt-3 grid gap-2">
            {receipts.map((r) => (
              <li key={r.id} className="flex justify-between gap-3 border-t border-border pt-2 text-sm first:border-0 first:pt-0">
                <span className="truncate">{r.prompt}</span><span className="num shrink-0" style={{ color: "var(--sip)" }}>$0.00001</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Sdk() {
  const [lang, setLang] = useState<Lang>("TypeScript");
  const [copied, setCopied] = useState(false);
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="seg" role="group" aria-label="Language">
          {(Object.keys(codeSamples) as Lang[]).map((l) => <button key={l} aria-pressed={lang === l} onClick={() => setLang(l)}>{l}</button>)}
        </div>
        <button className="btn btn-line btn-sm" onClick={() => navigator.clipboard.writeText(codeSamples[lang]).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1400); }, () => {})}>
          {copied ? "Copied" : "Copy code"}
        </button>
      </div>
      <pre className="code"><code>{codeSamples[lang]}</code></pre>
    </div>
  );
}

/* --------------------------------- Verify ---------------------------------- */

function VerifyPage() {
  const rows: [string, string, string, string][] = [
    ["Ajo", "Savings-circle contract", AJO_CONTRACT, expertContract(AJO_CONTRACT)],
    ["PromptSip", "Metering contract (promptsip_meter)", SIP_CONTRACT, expertContract(SIP_CONTRACT)],
    ["PromptSip", "Deployment transaction", SIP_DEPLOY_TX, expertTx(SIP_DEPLOY_TX)],
    ["PromptSip", "Initialisation transaction", SIP_INIT_TX, expertTx(SIP_INIT_TX)],
  ];
  const repos: [string, string][] = [["Ajo app", AJO_APP], ["StellarDrop app", DROP_APP], ["Ajo code", AJO_REPO], ["StellarDrop code", DROP_REPO], ["PromptSip and this site", SIP_REPO]];
  return (
    <section className="wrap grid gap-12 py-16" style={{ minHeight: "var(--screen)" }} aria-labelledby="verify-h1">
      <div>
        <span className="eyebrow">Verify it yourself</span>
        <h1 id="verify-h1" className="mt-5 text-[clamp(44px,4.4vw,68px)] font-bold leading-[1.03]">Every contract and repository</h1>
        <p className="lede mt-6">All on Stellar testnet. Open any line on Stellar Expert to see the code and every call made to it.</p>
      </div>
      <div className="card overflow-hidden">
        {rows.map(([p, what, id, href]) => (
          <a key={id} href={href} target="_blank" rel="noreferrer" className="grid gap-1 border-t border-border p-5 text-foreground no-underline transition-colors first:border-0 hover:bg-secondary md:grid-cols-[140px_1fr_auto] md:items-center md:gap-6">
            <span className="tag" style={{ color: p === "Ajo" ? "var(--ajo)" : "var(--sip)" }}>{p}</span>
            <span><b>{what}</b><span className="num block break-all text-sm text-muted-foreground">{id}</span></span>
            <span className="text-sm font-semibold">Stellar Expert ↗</span>
          </a>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {repos.map(([n, href]) => (
          <a key={href} href={href} target="_blank" rel="noreferrer" className="card card-link p-6 text-foreground no-underline">
            <span className="tag text-muted-foreground">{href.includes("github") ? "Repository" : "Live app"}</span>
            <h3 className="mt-2 text-lg font-bold">{n}</h3>
            <p className="num mt-2 break-all text-sm text-muted-foreground">{href.replace("https://", "")}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
