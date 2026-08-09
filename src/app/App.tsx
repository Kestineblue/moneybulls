import { useState, useEffect, useRef } from "react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import newLogo from "@/imports/loo.png";
import { supabase } from "@/lib/supabase";
import type { Profile, Package, Investment, EarningsLog } from "@/lib/supabase";
import {
  X, Menu, ChevronRight, ChevronDown, MessageCircle, ArrowRight,
  Star, Shield, TrendingUp, CheckCircle, Send, Wallet,
  LogOut, Eye, EyeOff, Bell, Lock, AlertTriangle,
  Upload, Clock, BarChart2, Coins, BadgeCheck, Phone,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// ── Page / Modal Types ─────────────────────────────────────────────────────
type Page = "home" | "packages" | "how-it-works" | "reviews" | "faq" | "dashboard";
type AuthModal = "none" | "login" | "signup";
interface ChatMsg { role: "bot" | "user"; text: string; }

// ── Brand Tokens ───────────────────────────────────────────────────────────
const DARK   = "#02312b";
const LIME   = "#bdf228";
const ORANGE = "#fe8837";
const CREAM  = "#fdfef8";
const PP     = "'Poppins', sans-serif";   // headings / CTAs
const NB     = "'Nobile', sans-serif";    // body / labels
const WA_URL = "https://wa.me/237680266954?text=Hi%2C%20I'm%20interested%20in%20investing%20with%20Moneybulls";

// ── Fallback Tiers (shown before DB loads) ─────────────────────────────────
const FALLBACK_TIERS: Package[] = [
  { id:"t1",  name:"Starter",   min_amount:10000,   fee_tier:"Standard", withdrawal_windows:1 },
  { id:"t2",  name:"Basic",     min_amount:30000,   fee_tier:"Standard", withdrawal_windows:1 },
  { id:"t3",  name:"Essential", min_amount:50000,   fee_tier:"Standard", withdrawal_windows:2 },
  { id:"t4",  name:"Growth",    min_amount:70000,   fee_tier:"Reduced",  withdrawal_windows:2 },
  { id:"t5",  name:"Plus",      min_amount:100000,  fee_tier:"Reduced",  withdrawal_windows:2 },
  { id:"t6",  name:"Premium",   min_amount:150000,  fee_tier:"Reduced",  withdrawal_windows:3 },
  { id:"t7",  name:"Advanced",  min_amount:200000,  fee_tier:"Low",      withdrawal_windows:3 },
  { id:"t8",  name:"Elite",     min_amount:300000,  fee_tier:"Low",      withdrawal_windows:4 },
  { id:"t9",  name:"Pro",       min_amount:400000,  fee_tier:"Low",      withdrawal_windows:4 },
  { id:"t10", name:"Prestige",  min_amount:500000,  fee_tier:"Lowest",   withdrawal_windows:"Unlimited" },
  { id:"t11", name:"Sovereign", min_amount:1000000, fee_tier:"Lowest",   withdrawal_windows:"Unlimited" },
];

// ── Static Content ─────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  { q:"What is the minimum investment?",              a:"The minimum investment on Moneybulls is 10,000 CFA (Tier 1 — Starter). We offer 11 investment tiers up to 1,000,000 CFA." },
  { q:"Are returns guaranteed?",                      a:"No. Returns are variable and depend entirely on forex trading performance. Past performance does not guarantee future results. Full risk disclosure is in our Terms of Service." },
  { q:"How do payouts work?",                         a:"Payouts are distributed at the end of each trading cycle. Funds are released to your registered withdrawal method or auto-reinvested. Early withdrawal is available at any time for a flat 1,000 CFA fee." },
  { q:"What payment methods do you accept?",          a:"We accept Bitcoin, USDT (TRC20), MTN Mobile Money, and Orange Money. All deposits are logged and reconciled before your dashboard balance updates." },
  { q:"What is KYC verification?",                    a:"KYC is mandatory. Upload a government-issued ID photo and a live selfie. Review takes 1–2 business days. You must be 18 or older." },
  { q:"What happens if a cycle ends in a loss?",      a:"You will be notified in-app and via WhatsApp or email. A compensation token is automatically credited to your account — valid for 90 days toward your next deposit." },
  { q:"How many withdrawals can I make per month?",   a:"Tier 1–2: 1/month. Tier 3–5: 2/month. Tier 6–7: 3/month. Tier 8–9: 4/month. Tiers 10–11: unlimited." },
];

const TESTIMONIALS = [
  { name:"Amara N.",   location:"Yaoundé",    rating:5, initials:"AN", date:"March 2025",    text:"I started with Tier 3 in January. The process was completely transparent and the dashboard kept me informed at every step. Definitely reinvesting." },
  { name:"Pascal T.",  location:"Douala",     rating:5, initials:"PT", date:"February 2025", text:"What I appreciate most is the honesty about returns — no false promises, just real numbers. Mobile Money deposit was seamless. Already at Tier 5." },
  { name:"Nadège F.",  location:"Bafoussam", rating:4, initials:"NF", date:"April 2025",    text:"KYC took two days but after that everything moved quickly. Payout arrived exactly on the scheduled date. I feel confident my capital is handled well." },
  { name:"Emmanuel B.",location:"Kribi",      rating:5, initials:"EB", date:"January 2025",  text:"Best investment decision I made this year. The WhatsApp support team replies fast. Moved from Tier 2 to Tier 7 after three successful cycles." },
];

const BOT_KB: Record<string,string> = {
  minimum:  "The minimum investment is **10,000 CFA** (Tier 1 — Starter). We have 11 tiers up to 1,000,000 CFA.",
  maximum:  "Our highest tier is **Tier 11 Sovereign at 1,000,000 CFA**, with unlimited monthly withdrawal windows.",
  returns:  "Returns are **variable** — based entirely on live forex trading performance. We never guarantee any specific return.",
  payout:   "Payouts are released at the end of each trading cycle. You can withdraw or reinvest. Early withdrawal costs a flat **1,000 CFA**.",
  payment:  "We accept **Bitcoin**, **USDT (TRC20)**, **MTN Mobile Money**, and **Orange Money**.",
  kyc:      "KYC is mandatory. Upload a government ID photo and a selfie. Review takes 1–2 business days. You must be **18 or older**.",
  fee:      "Platform fees are tier-dependent. Higher tiers pay lower fees. Early withdrawal costs **1,000 CFA** flat.",
  withdraw: "Withdrawal windows vary by tier (1–unlimited per month). Early withdrawal costs 1,000 CFA.",
  loss:     "On a net cycle loss you are notified and a **compensation token** is auto-credited with a 90-day expiry.",
  token:    "Tokens are compensation credits (90-day expiry) applied to future deposits on cycle losses.",
};

const QUICK_QS = [
  "What is the minimum investment?",
  "Are returns guaranteed?",
  "How do payouts work?",
  "What payment methods?",
  "What is KYC?",
];

// ── Validation ─────────────────────────────────────────────────────────────
const sanitize = (s: string) => s.trim().replace(/<[^>]*>/g,"").replace(/[<>"'`]/g,"");
const isEmail    = (v: string) => /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(v.trim());
const isPhone    = (v: string) => /^\+?[0-9\s\-()]{8,18}$/.test(v.trim());
const isStrongPwd= (v: string) => v.length >= 8 && /[a-zA-Z]/.test(v) && /[0-9]/.test(v);
const isName     = (v: string) => v.trim().length >= 2 && /^[a-zA-ZÀ-ÿ\s'\-]+$/.test(v.trim());

// ── Helpers ────────────────────────────────────────────────────────────────
const fmtCFA = (n: number) => n.toLocaleString("fr-CM") + " CFA";

function getTierFor(amount: number, pkgs: Package[]): Package | null {
  const sorted = [...pkgs].sort((a,b) => a.min_amount - b.min_amount);
  const valid   = sorted.filter(p => amount >= p.min_amount);
  return valid.length > 0 ? valid[valid.length - 1] : null;
}

const hasPriority = (p: Package) => p.min_amount >= 150000;

function matchBot(text: string): string {
  const l = text.toLowerCase();
  if (l.includes("minimum")||l.includes("how much")||l.includes("least")) return BOT_KB.minimum;
  if (l.includes("maximum")||l.includes("most"))                           return BOT_KB.maximum;
  if (l.includes("return")||l.includes("guarantee")||l.includes("earn"))   return BOT_KB.returns;
  if (l.includes("payout")||l.includes("paid")||l.includes("schedule"))    return BOT_KB.payout;
  if (l.includes("payment")||l.includes("bitcoin")||l.includes("momo")||l.includes("orange")) return BOT_KB.payment;
  if (l.includes("kyc")||l.includes("verify")||l.includes("identity"))     return BOT_KB.kyc;
  if (l.includes("fee")||l.includes("cost")||l.includes("charge"))         return BOT_KB.fee;
  if (l.includes("withdraw")||l.includes("cash out")||l.includes("window"))return BOT_KB.withdraw;
  if (l.includes("loss")||l.includes("lose")||l.includes("negative"))      return BOT_KB.loss;
  if (l.includes("token")||l.includes("credit")||l.includes("compensation"))return BOT_KB.token;
  return "I can answer questions about minimum investments, returns, payouts, payment methods, KYC, and fees. Tap **Talk to a human** to reach our team on WhatsApp.";
}

function BotText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return <span>{parts.map((p,i) => i%2===1 ? <strong key={i}>{p}</strong> : p)}</span>;
}

// ── ModalOverlay ───────────────────────────────────────────────────────────
function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background:"rgba(0,0,0,0.78)", backdropFilter:"blur(8px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      {children}
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────
function Field({ label, type="text", value, onChange, placeholder, error, hint }: {
  label:string; type?:string; value:string; onChange:(v:string)=>void;
  placeholder?:string; error?:string; hint?:string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color:"rgba(253,254,248,0.65)", fontFamily:NB }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(sanitize(e.target.value))} placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
        style={{ background:"#0c1f1a", color:CREAM, border:`1px solid ${error ? ORANGE : "rgba(189,242,40,0.18)"}`, fontFamily:NB }} />
      {error && <p className="text-xs mt-1 font-medium" style={{ color:ORANGE, fontFamily:NB }}>{error}</p>}
      {!error && hint && <p className="text-xs mt-1" style={{ color:"rgba(253,254,248,0.35)", fontFamily:NB }}>{hint}</p>}
    </div>
  );
}

// ── Chatbot Widget ─────────────────────────────────────────────────────────
function ChatbotWidget() {
  const [open, setOpen]     = useState(false);
  const [msgs, setMsgs]     = useState<ChatMsg[]>([{ role:"bot", text:"Hi! I'm the Moneybulls assistant. Ask me anything about investing, returns, payments, or KYC — or tap a question below." }]);
  const [input, setInput]   = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef           = useRef<HTMLDivElement>(null);

  useEffect(() => { if (open) bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs, open]);

  const send = (text: string) => {
    if (!text.trim()) return;
    setMsgs(m => [...m, { role:"user", text }]);
    setInput(""); setTyping(true);
    setTimeout(() => { setMsgs(m => [...m, { role:"bot", text:matchBot(text) }]); setTyping(false); }, 700);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ background:DARK, border:`1px solid rgba(189,242,40,0.15)`, maxHeight:"520px", width:"min(340px, calc(100vw - 40px))" }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3"
            style={{ background:"#0a1f18", borderBottom:"1px solid rgba(189,242,40,0.1)" }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background:LIME, color:DARK, fontFamily:PP }}>MB</div>
              <div>
                <p className="text-sm font-semibold" style={{ color:CREAM, fontFamily:PP }}>Moneybulls Assistant</p>
                <p className="text-xs" style={{ color:LIME }}>● Online</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded-full hover:bg-white/10 transition-colors">
              <X size={16} style={{ color:CREAM }} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ minHeight:0 }}>
            {msgs.map((m,i) => (
              <div key={i} className={`flex ${m.role==="user" ? "justify-end" : "justify-start"}`}>
                <div className="rounded-2xl px-3 py-2 text-sm leading-relaxed"
                  style={{ maxWidth:"82%", background:m.role==="user" ? LIME : "#143d30", color:m.role==="user" ? DARK : CREAM, fontFamily:NB }}>
                  {m.role==="bot" ? <BotText text={m.text} /> : m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-3 flex gap-1" style={{ background:"#143d30" }}>
                  {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background:LIME, animationDelay:`${i*0.15}s` }} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick questions */}
          {msgs.length <= 1 && (
            <div className="px-4 pb-2 flex flex-col gap-1.5">
              {QUICK_QS.map(q => (
                <button key={q} onClick={() => send(q)}
                  className="text-left text-xs rounded-xl px-3 py-2 hover:opacity-80 transition-opacity"
                  style={{ background:"#143d30", color:LIME, fontFamily:NB, border:`1px solid rgba(189,242,40,0.2)` }}>{q}</button>
              ))}
            </div>
          )}

          {/* WhatsApp */}
          <div className="px-4 pb-2">
            <a href={WA_URL} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
              style={{ background:"#25D366", color:"#fff", fontFamily:NB }}>
              <Phone size={14} /> Talk to a human on WhatsApp
            </a>
          </div>

          {/* Input */}
          <div className="px-4 pb-4 flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key==="Enter" && send(input)}
              placeholder="Ask a question…"
              className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
              style={{ background:"#143d30", color:CREAM, border:"1px solid rgba(189,242,40,0.15)", fontFamily:NB }} />
            <button onClick={() => send(input)}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{ background:LIME }}>
              <Send size={14} style={{ color:DARK }} />
            </button>
          </div>
        </div>
      )}

      <button onClick={() => setOpen(o => !o)}
        className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-105"
        style={{ background:LIME }} aria-label="Open chat">
        {open ? <X size={22} style={{ color:DARK }} /> : <MessageCircle size={22} style={{ color:DARK }} />}
      </button>
    </div>
  );
}

// ── Navbar ─────────────────────────────────────────────────────────────────
function Navbar({ page, setPage, profile, onLoginClick, onSignupClick, onLogout }: {
  page:Page; setPage:(p:Page)=>void;
  profile:Profile|null; onLoginClick:()=>void; onSignupClick:()=>void; onLogout:()=>void;
}) {
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const links: { label:string; page:Page }[] = [
    { label:"How It Works", page:"how-it-works" },
    { label:"Packages",     page:"packages" },
    { label:"Reviews",      page:"reviews" },
    { label:"FAQ",          page:"faq" },
  ];

  const close = () => setMobileOpen(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
      style={{ background:DARK, borderBottom:scrolled?"1px solid rgba(189,242,40,0.12)":"none", boxShadow:scrolled?"0 4px 32px rgba(0,0,0,0.35)":"none" }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <button onClick={() => { setPage("home"); close(); }} className="shrink-0">
          <ImageWithFallback src={newLogo} alt="Moneybulls" className="h-10 w-auto object-contain" />
        </button>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <button key={l.page} onClick={() => setPage(l.page)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color:page===l.page ? LIME : "rgba(253,254,248,0.7)", background:page===l.page ? "rgba(189,242,40,0.08)" : "transparent", fontFamily:NB }}>
              {l.label}
            </button>
          ))}
        </div>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {profile ? (
            <>
              <button onClick={() => setPage("dashboard")}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ color:page==="dashboard" ? LIME : CREAM, background:page==="dashboard" ? "rgba(189,242,40,0.1)" : "transparent", fontFamily:NB }}>
                Dashboard
              </button>
              <button onClick={onLogout}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-70 transition-opacity"
                style={{ color:"rgba(253,254,248,0.5)", fontFamily:NB }}>
                <LogOut size={14} /> Sign out
              </button>
            </>
          ) : (
            <>
              <button onClick={onLoginClick}
                className="px-5 py-2 rounded-lg text-sm font-semibold hover:bg-white/10 transition-colors"
                style={{ color:CREAM, fontFamily:NB }}>
                Sign In
              </button>
              <button onClick={onSignupClick}
                className="px-5 py-2 rounded-lg text-sm font-bold transition-all hover:scale-105"
                style={{ background:LIME, color:DARK, fontFamily:PP }}>
                Start Investing
              </button>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button className="md:hidden p-2 rounded-lg" onClick={() => setMobileOpen(o => !o)}>
          {mobileOpen ? <X size={22} style={{ color:CREAM }} /> : <Menu size={22} style={{ color:CREAM }} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden px-5 pb-6 pt-2 flex flex-col gap-1"
          style={{ background:DARK, borderTop:"1px solid rgba(189,242,40,0.08)" }}>
          {links.map(l => (
            <button key={l.page} onClick={() => { setPage(l.page); close(); }}
              className="text-left px-4 py-3 rounded-xl text-sm font-medium"
              style={{ color:page===l.page ? LIME : CREAM, background:page===l.page ? "rgba(189,242,40,0.08)" : "transparent", fontFamily:NB }}>
              {l.label}
            </button>
          ))}
          {profile ? (
            <>
              <button onClick={() => { setPage("dashboard"); close(); }}
                className="text-left px-4 py-3 rounded-xl text-sm font-medium" style={{ color:LIME, fontFamily:NB }}>Dashboard</button>
              <button onClick={() => { onLogout(); close(); }}
                className="text-left px-4 py-3 rounded-xl text-sm font-medium" style={{ color:"rgba(253,254,248,0.5)", fontFamily:NB }}>Sign out</button>
            </>
          ) : (
            <>
              <button onClick={() => { onLoginClick(); close(); }}
                className="px-4 py-3 rounded-xl text-sm font-semibold text-center" style={{ color:CREAM, fontFamily:NB }}>Sign In</button>
              <button onClick={() => { onSignupClick(); close(); }}
                className="px-4 py-3 rounded-xl text-sm font-bold text-center" style={{ background:LIME, color:DARK, fontFamily:PP }}>Start Investing</button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

// ── Login Modal ────────────────────────────────────────────────────────────
function LoginModal({ onClose, onSuccess, onSwitchToSignup }: {
  onClose:()=>void; onSuccess:()=>void; onSwitchToSignup:()=>void;
}) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow]         = useState(false);
  const [errors, setErrors]     = useState<Record<string,string>>({});
  const [serverErr, setServerErr]= useState("");
  const [loading, setLoading]   = useState(false);

  const validate = () => {
    const e: Record<string,string> = {};
    if (!email.trim())           e.email = "Email is required.";
    else if (!isEmail(email))    e.email = "Enter a valid email address.";
    if (!password)               e.password = "Password is required.";
    else if (password.length<6)  e.password = "Password must be at least 6 characters.";
    return e;
  };

  const submit = async () => {
    const e = validate(); setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true); setServerErr("");
    const { error } = await supabase.auth.signInWithPassword({ email:sanitize(email), password });
    setLoading(false);
    if (error) { setServerErr(error.message.includes("Invalid") ? "Incorrect email or password." : error.message); return; }
    onSuccess(); onClose();
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-full max-w-md rounded-2xl p-8 my-4" style={{ background:DARK }}>
        <div className="flex items-center justify-between mb-6">
          <ImageWithFallback src={newLogo} alt="Moneybulls" className="h-8 w-auto object-contain" />
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10"><X size={18} style={{ color:CREAM }} /></button>
        </div>
        <h2 className="text-2xl font-bold mb-1" style={{ color:CREAM, fontFamily:PP }}>Welcome back</h2>
        <p className="text-sm mb-6" style={{ color:"rgba(253,254,248,0.55)", fontFamily:NB }}>Sign in to your Moneybulls account</p>

        {serverErr && (
          <div className="mb-4 px-3 py-2.5 rounded-xl" style={{ background:"rgba(254,136,55,0.12)", border:`1px solid ${ORANGE}` }}>
            <p className="text-xs font-medium" style={{ color:ORANGE, fontFamily:NB }}>{serverErr}</p>
          </div>
        )}

        <div className="space-y-4">
          <Field label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@example.com" error={errors.email} />
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color:"rgba(253,254,248,0.65)", fontFamily:NB }}>Password</label>
            <div className="relative">
              <input type={show?"text":"password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none pr-11 transition-colors"
                style={{ background:"#0c1f1a", color:CREAM, border:`1px solid ${errors.password ? ORANGE : "rgba(189,242,40,0.18)"}`, fontFamily:NB }} />
              <button onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100">
                {show ? <EyeOff size={16} style={{ color:CREAM }} /> : <Eye size={16} style={{ color:CREAM }} />}
              </button>
            </div>
            {errors.password && <p className="text-xs mt-1 font-medium" style={{ color:ORANGE, fontFamily:NB }}>{errors.password}</p>}
          </div>
        </div>

        <button onClick={submit} disabled={loading}
          className="mt-6 w-full py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
          style={{ background:LIME, color:DARK, fontFamily:PP }}>
          {loading ? "Signing in…" : "Sign In"}
        </button>
        <p className="text-center text-xs mt-4" style={{ color:"rgba(253,254,248,0.45)", fontFamily:NB }}>
          No account?{" "}
          <button onClick={onSwitchToSignup} className="font-semibold hover:opacity-80" style={{ color:LIME }}>Start investing</button>
        </p>
      </div>
    </ModalOverlay>
  );
}

// ── Signup Modal ───────────────────────────────────────────────────────────
function SignupModal({ onClose, onSuccess, onSwitchToLogin }: {
  onClose:()=>void; onSuccess:()=>void; onSwitchToLogin:()=>void;
}) {
  const [step, setStep]         = useState<"form"|"kyc"|"done">("form");
  const [fullName, setFullName] = useState("");
  const [email, setEmail]       = useState("");
  const [phone, setPhone]       = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow]         = useState(false);
  const [errors, setErrors]     = useState<Record<string,string>>({});
  const [serverErr, setServerErr]= useState("");
  const [loading, setLoading]   = useState(false);
  const [idFile, setIdFile]     = useState<File|null>(null);
  const [selfieFile, setSelfie] = useState<File|null>(null);
  const [kycErr, setKycErr]     = useState<Record<string,string>>({});
  const idRef     = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  const validateForm = () => {
    const e: Record<string,string> = {};
    if (!fullName.trim())       e.fullName = "Full name is required.";
    else if (!isName(fullName)) e.fullName = "Name may only contain letters, spaces, hyphens, and apostrophes.";
    if (!email.trim())          e.email = "Email is required.";
    else if (!isEmail(email))   e.email = "Enter a valid email address.";
    if (!phone.trim())          e.phone = "Phone number is required.";
    else if (!isPhone(phone))   e.phone = "Enter a valid phone (e.g. +237 6XX XXX XXX).";
    if (!password)              e.password = "Password is required.";
    else if (!isStrongPwd(password)) e.password = "Min 8 characters, include a letter and a number.";
    return e;
  };

  const submitForm = async () => {
    const e = validateForm(); setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true); setServerErr("");

    const { data, error: authErr } = await supabase.auth.signUp({
      email: sanitize(email),
      password,
      options: { data: { full_name:sanitize(fullName), phone:sanitize(phone) } },
    });

    if (authErr) {
      setLoading(false);
      setServerErr(authErr.message.includes("already") ? "An account with this email already exists. Please sign in." : authErr.message);
      return;
    }

    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        email: sanitize(email),
        phone: sanitize(phone),
        full_name: sanitize(fullName),
        kyc_status: "pending",
      });
    }

    setLoading(false);
    setStep("kyc");
  };

  const submitKYC = async () => {
    const e: Record<string,string> = {};
    if (!idFile)     e.id     = "Please upload your government ID.";
    if (!selfieFile) e.selfie = "Please upload a selfie with your ID.";
    setKycErr(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const ext1 = idFile!.name.split(".").pop();
      const ext2 = selfieFile!.name.split(".").pop();
      const idPath     = `${user.id}/id_${Date.now()}.${ext1}`;
      const selfiePath = `${user.id}/selfie_${Date.now()}.${ext2}`;

      const [r1, r2] = await Promise.all([
        supabase.storage.from("kyc-documents").upload(idPath,     idFile!,     { upsert:true }),
        supabase.storage.from("kyc-documents").upload(selfiePath, selfieFile!, { upsert:true }),
      ]);

      const idUrl     = r1.data ? supabase.storage.from("kyc-documents").getPublicUrl(idPath).data.publicUrl     : "";
      const selfieUrl = r2.data ? supabase.storage.from("kyc-documents").getPublicUrl(selfiePath).data.publicUrl : "";

      await supabase.from("kyc_documents").upsert({ user_id:user.id, id_photo_url:idUrl, selfie_url:selfieUrl, status:"pending" });
    }

    setLoading(false);
    setStep("done");
    onSuccess();
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-full max-w-md rounded-2xl p-8 my-4" style={{ background:DARK }}>
        <div className="flex items-center justify-between mb-6">
          <ImageWithFallback src={newLogo} alt="Moneybulls" className="h-8 w-auto object-contain" />
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10"><X size={18} style={{ color:CREAM }} /></button>
        </div>

        {/* ── Step 1: Registration form ── */}
        {step === "form" && (
          <>
            <h2 className="text-2xl font-bold mb-1" style={{ color:CREAM, fontFamily:PP }}>Create your account</h2>
            <p className="text-sm mb-6" style={{ color:"rgba(253,254,248,0.55)", fontFamily:NB }}>You must be 18 or older to invest.</p>

            {serverErr && (
              <div className="mb-4 px-3 py-2.5 rounded-xl" style={{ background:"rgba(254,136,55,0.12)", border:`1px solid ${ORANGE}` }}>
                <p className="text-xs font-medium" style={{ color:ORANGE, fontFamily:NB }}>{serverErr}</p>
              </div>
            )}

            <div className="space-y-4">
              <Field label="Full name"     value={fullName} onChange={setFullName} placeholder="Your full name"         error={errors.fullName} />
              <Field label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@example.com" error={errors.email} />
              <Field label="Phone number"  type="tel"   value={phone} onChange={setPhone} placeholder="+237 6XX XXX XXX" error={errors.phone} />
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color:"rgba(253,254,248,0.65)", fontFamily:NB }}>Password</label>
                <div className="relative">
                  <input type={show?"text":"password"} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Min 8 chars, letter + number"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none pr-11 transition-colors"
                    style={{ background:"#0c1f1a", color:CREAM, border:`1px solid ${errors.password ? ORANGE : "rgba(189,242,40,0.18)"}`, fontFamily:NB }} />
                  <button onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100">
                    {show ? <EyeOff size={16} style={{ color:CREAM }} /> : <Eye size={16} style={{ color:CREAM }} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs mt-1 font-medium" style={{ color:ORANGE, fontFamily:NB }}>{errors.password}</p>}
              </div>
            </div>

            <button onClick={submitForm} disabled={loading}
              className="mt-6 w-full py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
              style={{ background:LIME, color:DARK, fontFamily:PP }}>
              {loading ? "Creating account…" : "Continue to KYC →"}
            </button>
            <p className="text-center text-xs mt-4" style={{ color:"rgba(253,254,248,0.45)", fontFamily:NB }}>
              Have an account?{" "}
              <button onClick={onSwitchToLogin} className="font-semibold hover:opacity-80" style={{ color:LIME }}>Sign in</button>
            </p>
          </>
        )}

        {/* ── Step 2: KYC upload ── */}
        {step === "kyc" && (
          <>
            <h2 className="text-2xl font-bold mb-1" style={{ color:CREAM, fontFamily:PP }}>Identity verification</h2>
            <p className="text-sm mb-6" style={{ color:"rgba(253,254,248,0.55)", fontFamily:NB }}>Required by law. Review takes 1–2 business days.</p>

            <div className="space-y-3">
              {([
                { label:"Government ID (front)", key:"id",     file:idFile,     ref:idRef,     set:setIdFile },
                { label:"Selfie holding your ID",key:"selfie", file:selfieFile, ref:selfieRef, set:setSelfie },
              ] as const).map(item => (
                <div key={item.key}>
                  <input ref={item.ref} type="file" accept="image/*,.pdf" className="hidden"
                    onChange={e => item.set(e.target.files?.[0] ?? null)} />
                  <button onClick={() => item.ref.current?.click()}
                    className="w-full flex items-center gap-3 px-4 py-4 rounded-xl cursor-pointer hover:opacity-80 transition-opacity text-left"
                    style={{ background:"#0c1f1a", border:`1px dashed ${kycErr[item.key] ? ORANGE : "rgba(189,242,40,0.25)"}` }}>
                    <Upload size={18} style={{ color:item.file ? LIME : "rgba(253,254,248,0.35)" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color:CREAM, fontFamily:NB }}>{item.label}</p>
                      <p className="text-xs truncate" style={{ color:item.file ? LIME : "rgba(253,254,248,0.4)", fontFamily:NB }}>
                        {item.file ? item.file.name : "JPG, PNG or PDF · Max 5 MB"}
                      </p>
                    </div>
                    {item.file && <CheckCircle size={16} style={{ color:LIME, flexShrink:0 }} />}
                  </button>
                  {kycErr[item.key] && <p className="text-xs mt-1 font-medium" style={{ color:ORANGE, fontFamily:NB }}>{kycErr[item.key]}</p>}
                </div>
              ))}
            </div>

            <div className="mt-4 px-3 py-3 rounded-xl flex items-start gap-2"
              style={{ background:"rgba(189,242,40,0.06)", border:"1px solid rgba(189,242,40,0.12)" }}>
              <Shield size={14} style={{ color:LIME, marginTop:2 }} />
              <p className="text-xs" style={{ color:"rgba(253,254,248,0.6)", fontFamily:NB }}>Your documents are encrypted and stored securely. Never shared with third parties.</p>
            </div>

            <button onClick={submitKYC} disabled={loading}
              className="mt-6 w-full py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
              style={{ background:LIME, color:DARK, fontFamily:PP }}>
              {loading ? "Uploading…" : "Submit for Review"}
            </button>
          </>
        )}

        {/* ── Step 3: Pending ── */}
        {step === "done" && (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background:"rgba(189,242,40,0.12)" }}>
              <Clock size={28} style={{ color:LIME }} />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color:CREAM, fontFamily:PP }}>KYC under review</h2>
            <p className="text-sm mb-6" style={{ color:"rgba(253,254,248,0.55)", fontFamily:NB }}>
              Our team is reviewing your documents. You'll be notified within 1–2 business days. Once approved you can select a package and deposit.
            </p>
            <button onClick={onClose}
              className="px-8 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
              style={{ background:LIME, color:DARK, fontFamily:PP }}>Got it</button>
          </div>
        )}
      </div>
    </ModalOverlay>
  );
}

// ── Tier Card ──────────────────────────────────────────────────────────────
function TierCard({ pkg, onSelect, featured=false }: { pkg:Package; onSelect:()=>void; featured?:boolean }) {
  return (
    <div className="rounded-2xl p-6 flex flex-col gap-4 transition-all hover:-translate-y-1"
      style={{ background:featured ? LIME : "#143d30", border:featured ? "none" : "1px solid rgba(189,242,40,0.1)" }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1"
            style={{ color:featured ? "rgba(2,49,43,0.5)" : "rgba(189,242,40,0.5)", fontFamily:NB }}>{pkg.name}</p>
          <p className="text-xl sm:text-2xl font-bold" style={{ color:featured ? DARK : CREAM, fontFamily:PP }}>{fmtCFA(pkg.min_amount)}</p>
          <p className="text-xs mt-0.5" style={{ color:featured ? "rgba(2,49,43,0.5)" : "rgba(253,254,248,0.4)", fontFamily:NB }}>minimum deposit</p>
        </div>
        {hasPriority(pkg) && (
          <span className="text-xs px-2 py-1 rounded-lg font-semibold shrink-0"
            style={{ background:featured ? "rgba(2,49,43,0.12)" : "rgba(189,242,40,0.12)", color:featured ? DARK : LIME, fontFamily:NB }}>Priority</span>
        )}
      </div>
      <div className="space-y-2">
        {[
          { label:"Withdrawals/month", val:String(pkg.withdrawal_windows) },
          { label:"Platform fee",      val:pkg.fee_tier },
        ].map(r => (
          <div key={r.label} className="flex justify-between text-xs">
            <span style={{ color:featured ? "rgba(2,49,43,0.6)" : "rgba(253,254,248,0.5)", fontFamily:NB }}>{r.label}</span>
            <span className="font-semibold" style={{ color:featured ? DARK : CREAM, fontFamily:NB }}>{r.val}</span>
          </div>
        ))}
      </div>
      <button onClick={onSelect}
        className="mt-auto py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
        style={{ background:featured ? DARK : LIME, color:featured ? LIME : DARK, fontFamily:PP }}>
        Select {pkg.name}
      </button>
    </div>
  );
}

// ── Home Page ──────────────────────────────────────────────────────────────
function HomePage({ packages, pkgLoading, onSignup, setPage }: {
  packages:Package[]; pkgLoading:boolean; onSignup:()=>void; setPage:(p:Page)=>void;
}) {
  const [amount, setAmount] = useState(100000);
  const [openFaq, setOpenFaq] = useState<number|null>(null);
  const tier = getTierFor(amount, packages);

  return (
    <div className="overflow-x-hidden">
      {/* ─── Hero ─── */}
      <section className="min-h-screen flex items-center relative overflow-hidden" style={{ background:DARK, paddingTop:64 }}>
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{ backgroundImage:"radial-gradient(circle at 1px 1px,#bdf228 1px,transparent 0)", backgroundSize:"40px 40px" }} />
        <div className="absolute top-0 right-0 w-72 h-72 sm:w-96 sm:h-96 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background:LIME }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-5 blur-3xl pointer-events-none" style={{ background:ORANGE }} />

        <div className="relative max-w-7xl mx-auto px-5 lg:px-8 py-20 grid lg:grid-cols-2 gap-12 items-center w-full">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-8"
              style={{ background:"rgba(189,242,40,0.1)", color:LIME, border:"1px solid rgba(189,242,40,0.2)", fontFamily:NB }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background:LIME }} />
              Forex Investment Platform · Cameroon
            </div>
            <h1 className="font-bold leading-[1.05] mb-6"
              style={{ fontSize:"clamp(2.5rem,6vw,4.8rem)", color:CREAM, fontFamily:PP }}>
              Growth is<br /><span style={{ color:LIME }}>Inevitable.</span>
            </h1>
            <p className="text-base sm:text-lg leading-relaxed mb-8 max-w-lg"
              style={{ color:"rgba(253,254,248,0.65)", fontFamily:NB }}>
              Pool your capital with Africa's most transparent forex investment platform. Variable returns, clear fees, and a team you can actually reach. From 10,000 CFA.
            </p>
            <div className="flex flex-wrap gap-3 mb-10">
              <button onClick={onSignup}
                className="px-6 py-3.5 rounded-xl font-bold text-base transition-all hover:scale-105"
                style={{ background:LIME, color:DARK, fontFamily:PP, boxShadow:`0 0 24px rgba(189,242,40,0.3)` }}>
                Start Investing
              </button>
              <button onClick={() => setPage("how-it-works")}
                className="px-6 py-3.5 rounded-xl font-semibold text-base hover:bg-white/10 transition-colors"
                style={{ color:CREAM, border:"1px solid rgba(253,254,248,0.2)", fontFamily:NB }}>
                How it works →
              </button>
            </div>
            <div>
              <p className="text-xs font-semibold mb-3 uppercase tracking-widest" style={{ color:"rgba(253,254,248,0.4)", fontFamily:NB }}>Deposit via</p>
              <div className="flex flex-wrap gap-2">
                {["MTN MoMo","Orange Money","Bitcoin","USDT TRC20"].map(m => (
                  <span key={m} className="px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background:"rgba(253,254,248,0.06)", color:"rgba(253,254,248,0.7)", border:"1px solid rgba(253,254,248,0.1)", fontFamily:NB }}>{m}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Calculator */}
          <div className="flex justify-center lg:justify-end w-full">
            <div className="w-full max-w-sm rounded-2xl p-6"
              style={{ background:"#143d30", border:"1px solid rgba(189,242,40,0.15)", boxShadow:"0 32px 64px rgba(0,0,0,0.4)" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color:LIME, fontFamily:NB }}>Investment Calculator</p>
              <p className="text-sm mb-2" style={{ color:"rgba(253,254,248,0.6)", fontFamily:NB }}>I want to invest</p>
              <div className="flex items-center gap-2 mb-2">
                <input type="number" value={amount} onChange={e => setAmount(Math.max(0, parseInt(e.target.value)||0))}
                  className="flex-1 text-xl font-bold rounded-xl px-4 py-3 outline-none min-w-0"
                  style={{ background:"#0a1a14", color:CREAM, border:"1px solid rgba(189,242,40,0.15)", fontFamily:PP }} />
                <span className="text-sm font-semibold shrink-0" style={{ color:"rgba(253,254,248,0.5)", fontFamily:NB }}>CFA</span>
              </div>
              <input type="range" min={10000} max={1000000} step={10000}
                value={Math.min(amount,1000000)} onChange={e => setAmount(parseInt(e.target.value))}
                className="w-full mb-5" style={{ accentColor:LIME }} />

              {pkgLoading ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor:LIME, borderTopColor:"transparent" }} />
                </div>
              ) : tier ? (
                <div className="space-y-3">
                  {[
                    { label:"Your tier",        val:tier.name,                       hi:true },
                    { label:"Withdrawals/month", val:String(tier.withdrawal_windows), hi:false },
                    { label:"Platform fee",      val:tier.fee_tier,                   hi:false },
                    { label:"Priority support",  val:hasPriority(tier) ? "✓ Included" : "—", hi:hasPriority(tier) },
                  ].map(r => (
                    <div key={r.label} className="flex items-center justify-between py-2 border-b"
                      style={{ borderColor:"rgba(189,242,40,0.1)" }}>
                      <span className="text-sm" style={{ color:"rgba(253,254,248,0.55)", fontFamily:NB }}>{r.label}</span>
                      <span className="text-sm font-bold" style={{ color:r.hi ? LIME : CREAM, fontFamily:NB }}>{r.val}</span>
                    </div>
                  ))}
                  <button onClick={onSignup}
                    className="w-full py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity mt-2"
                    style={{ background:LIME, color:DARK, fontFamily:PP }}>
                    Start with {tier.name} →
                  </button>
                </div>
              ) : (
                <p className="text-sm text-center py-4" style={{ color:"rgba(253,254,248,0.4)", fontFamily:NB }}>Enter at least 10,000 CFA to see your tier</p>
              )}

              <p className="text-xs text-center mt-4" style={{ color:"rgba(253,254,248,0.3)", fontFamily:NB }}>
                Returns variable · not guaranteed · risk disclosure in T&amp;C
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats strip ─── */}
      <section style={{ background:LIME }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label:"Investment Tiers",      value:"11" },
            { label:"Payment Methods",       value:"4" },
            { label:"Token Protection",      value:"90-day" },
            { label:"Early Withdrawal Fee",  value:"1,000 CFA" },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-bold" style={{ color:DARK, fontFamily:PP }}>{s.value}</p>
              <p className="text-xs font-semibold uppercase tracking-wide mt-1" style={{ color:"rgba(2,49,43,0.6)", fontFamily:NB }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How it works (3 steps) ─── */}
      <section className="py-20" style={{ background:CREAM }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg"
              style={{ background:DARK, color:LIME, fontFamily:NB }}>Process</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-4" style={{ color:DARK, fontFamily:PP }}>Three steps to growth</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n:"01", icon:<Upload size={22} style={{ color:LIME }} />,     title:"Deposit",              body:"Choose your tier, complete KYC, and deposit via MTN MoMo, Orange Money, Bitcoin, or USDT. Funds are confirmed before activation." },
              { n:"02", icon:<TrendingUp size={22} style={{ color:LIME }} />, title:"Trade Cycle",          body:"Your pooled capital enters the active forex trading cycle. Track daily earnings in real time on your dashboard." },
              { n:"03", icon:<Wallet size={22} style={{ color:LIME }} />,     title:"Withdraw or Reinvest", body:"On your scheduled payout date, funds are released. Withdraw to your mobile wallet or reinvest for compounding." },
            ].map(step => (
              <div key={step.n} className="rounded-2xl p-8 hover:shadow-xl transition-shadow"
                style={{ background:"#fff", border:"1px solid rgba(2,49,43,0.07)" }}>
                <div className="text-5xl font-bold mb-6 opacity-10" style={{ color:DARK, fontFamily:PP }}>{step.n}</div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background:DARK }}>{step.icon}</div>
                <h3 className="text-xl font-bold mb-3" style={{ color:DARK, fontFamily:PP }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color:"#4a5568", fontFamily:NB }}>{step.body}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <button onClick={() => setPage("how-it-works")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm hover:gap-3 transition-all"
              style={{ color:DARK, border:`1px solid ${DARK}`, fontFamily:NB }}>
              See the full process <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ─── Tier preview ─── */}
      <section className="py-20" style={{ background:DARK }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:LIME, fontFamily:NB }}>Investment Tiers</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold" style={{ color:CREAM, fontFamily:PP }}>Pick your level</h2>
            </div>
            <button onClick={() => setPage("packages")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity self-start sm:self-auto"
              style={{ color:DARK, background:LIME, fontFamily:NB }}>
              View all 11 tiers <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {packages.slice(0,4).map(p => <TierCard key={p.id} pkg={p} onSelect={onSignup} />)}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-20" style={{ background:CREAM }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg"
              style={{ background:DARK, color:LIME, fontFamily:NB }}>Investors</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-4" style={{ color:DARK, fontFamily:PP }}>Real people, real cycles</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="rounded-2xl p-6" style={{ background:"#fff", border:"1px solid rgba(2,49,43,0.07)" }}>
                <div className="flex gap-1 mb-4">
                  {Array(t.rating).fill(0).map((_,i) => <Star key={i} size={14} fill={LIME} style={{ color:LIME }} />)}
                </div>
                <p className="text-sm leading-relaxed mb-5" style={{ color:"#2d3748", fontFamily:NB }}>"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background:DARK, color:LIME, fontFamily:PP }}>{t.initials}</div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color:DARK, fontFamily:NB }}>{t.name}</p>
                    <p className="text-xs" style={{ color:"rgba(2,49,43,0.45)", fontFamily:NB }}>{t.location} · {t.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <button onClick={() => setPage("reviews")} className="inline-flex items-center gap-2 text-sm font-semibold hover:gap-3 transition-all"
              style={{ color:DARK, fontFamily:NB }}>
              Read all reviews <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* ─── Trust signals ─── */}
      <section className="py-16" style={{ background:DARK }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon:<Shield size={22} style={{ color:LIME }} />,    title:"KYC-Secured",      body:"Identity verified. No anonymous investments. Every investor screened per CEMAC guidelines." },
            { icon:<BadgeCheck size={22} style={{ color:LIME }} />,title:"Registered Business",body:"Moneybulls operates as a registered entity under Cameroonian law." },
            { icon:<Lock size={22} style={{ color:LIME }} />,      title:"Encrypted Data",    body:"All personal documents and transaction data are encrypted at rest and in transit." },
            { icon:<Bell size={22} style={{ color:LIME }} />,      title:"Real-time Alerts",  body:"Cycle updates, payout confirmations, and loss notifications via app and WhatsApp." },
          ].map(s => (
            <div key={s.title} className="flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:"rgba(189,242,40,0.1)" }}>{s.icon}</div>
              <p className="font-bold text-base" style={{ color:CREAM, fontFamily:PP }}>{s.title}</p>
              <p className="text-sm leading-relaxed" style={{ color:"rgba(253,254,248,0.5)", fontFamily:NB }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FAQ preview ─── */}
      <section className="py-20" style={{ background:CREAM }}>
        <div className="max-w-4xl mx-auto px-5 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold" style={{ color:DARK, fontFamily:PP }}>Common questions</h2>
          </div>
          <div className="space-y-3">
            {FAQ_ITEMS.slice(0,4).map((item,i) => (
              <div key={i} className="rounded-xl overflow-hidden" style={{ border:"1px solid rgba(2,49,43,0.1)", background:"#fff" }}>
                <button onClick={() => setOpenFaq(openFaq===i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left gap-4">
                  <span className="font-semibold text-sm" style={{ color:DARK, fontFamily:NB }}>{item.q}</span>
                  <ChevronDown size={16} style={{ color:DARK, transform:openFaq===i?"rotate(180deg)":"none", transition:"transform 0.2s", flexShrink:0 }} />
                </button>
                {openFaq===i && (
                  <div className="px-6 pb-4">
                    <p className="text-sm leading-relaxed" style={{ color:"#4a5568", fontFamily:NB }}>{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <button onClick={() => setPage("faq")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm hover:gap-3 transition-all"
              style={{ color:DARK, border:`1px solid ${DARK}`, fontFamily:NB }}>
              View all FAQs <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="py-20" style={{ background:LIME }}>
        <div className="max-w-4xl mx-auto px-5 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-6" style={{ color:DARK, fontFamily:PP }}>Ready to grow?</h2>
          <p className="text-base sm:text-lg mb-10 max-w-xl mx-auto" style={{ color:"rgba(2,49,43,0.65)", fontFamily:NB }}>
            Join Moneybulls investors across Cameroon. Start from 10,000 CFA. No hidden fees. Full transparency.
          </p>
          <button onClick={onSignup}
            className="px-10 py-4 rounded-xl font-bold text-base hover:scale-105 transition-all"
            style={{ background:DARK, color:LIME, fontFamily:PP }}>
            Create your account →
          </button>
          <p className="text-xs mt-6" style={{ color:"rgba(2,49,43,0.5)", fontFamily:NB }}>
            Returns are variable and not guaranteed. Read our{" "}
            <span className="underline cursor-pointer">Terms of Service</span> and{" "}
            <span className="underline cursor-pointer">Risk Disclosure</span> before investing.
          </p>
        </div>
      </section>
    </div>
  );
}

// ── Packages Page ──────────────────────────────────────────────────────────
function PackagesPage({ packages, loading, onSignup }: { packages:Package[]; loading:boolean; onSignup:()=>void }) {
  const tiers = loading ? FALLBACK_TIERS : packages;
  return (
    <div style={{ paddingTop:64 }} className="overflow-x-hidden">
      <section className="py-20" style={{ background:DARK }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color:LIME, fontFamily:NB }}>Investment Tiers</p>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-6" style={{ color:CREAM, fontFamily:PP }}>Pick your tier</h1>
          <p className="text-base sm:text-lg max-w-xl mx-auto" style={{ color:"rgba(253,254,248,0.55)", fontFamily:NB }}>
            All tiers access the same forex trading pool. Higher tiers pay lower fees and unlock more withdrawal windows and priority support.
          </p>
        </div>
      </section>

      <section className="py-16" style={{ background:CREAM }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {tiers.map((p,i) => <TierCard key={p.id} pkg={p} onSelect={onSignup} featured={i===5} />)}
          </div>

          {/* Comparison table */}
          <div className="mt-16 rounded-2xl overflow-hidden" style={{ border:"1px solid rgba(2,49,43,0.1)" }}>
            <div className="px-6 py-4" style={{ background:DARK }}>
              <p className="font-bold text-base" style={{ color:CREAM, fontFamily:PP }}>Tier comparison</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[540px] w-full text-sm">
                <thead>
                  <tr style={{ background:"#eef3e8" }}>
                    {["#","Package","Min. Deposit","Withdrawals/month","Platform Fee","Priority Support"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide"
                        style={{ color:"rgba(2,49,43,0.5)", fontFamily:NB }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tiers.map((p,i) => (
                    <tr key={p.id} style={{ background:i%2===0?"#fff":"#fdfef8", borderTop:"1px solid rgba(2,49,43,0.06)" }}>
                      <td className="px-5 py-3.5 font-bold" style={{ color:DARK, fontFamily:NB }}>{i+1}</td>
                      <td className="px-5 py-3.5 font-semibold" style={{ color:DARK, fontFamily:NB }}>{p.name}</td>
                      <td className="px-5 py-3.5" style={{ color:DARK, fontFamily:NB }}>{fmtCFA(p.min_amount)}</td>
                      <td className="px-5 py-3.5" style={{ color:DARK, fontFamily:NB }}>{p.withdrawal_windows}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-1 rounded-lg text-xs font-medium" style={{
                          background:p.fee_tier==="Lowest"?"rgba(189,242,40,0.15)":p.fee_tier==="Low"?"rgba(189,242,40,0.08)":"rgba(2,49,43,0.05)",
                          color:p.fee_tier==="Lowest"?"#1a5200":p.fee_tier==="Low"?"#2a6900":"#4a6b5d",
                          fontFamily:NB,
                        }}>{p.fee_tier}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        {hasPriority(p)
                          ? <span className="flex items-center gap-1 text-xs font-semibold" style={{ color:"#1a5200", fontFamily:NB }}><CheckCircle size={14} style={{ color:LIME }} />{p.min_amount>=400000?"Dedicated":"Included"}</span>
                          : <span className="text-xs" style={{ color:"rgba(2,49,43,0.3)", fontFamily:NB }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 p-5 rounded-2xl flex items-start gap-3" style={{ background:"rgba(254,136,55,0.07)", border:`1px solid rgba(254,136,55,0.2)` }}>
            <AlertTriangle size={18} style={{ color:ORANGE, marginTop:2, flexShrink:0 }} />
            <p className="text-sm leading-relaxed" style={{ color:"#6b3a00", fontFamily:NB }}>
              <strong>Risk disclosure:</strong> All investments involve risk. Returns are variable based on forex trading performance and are not guaranteed. Past performance does not predict future results. Invest only what you can afford to lose.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── How It Works Page ──────────────────────────────────────────────────────
function HowItWorksPage({ onSignup }: { onSignup:()=>void }) {
  const steps = [
    { n:"01", title:"Sign Up & KYC",             icon:<BadgeCheck size={28} style={{ color:LIME }} />, body:"Create your account with email and phone. Upload a government-issued ID photo and a live selfie for mandatory KYC. Our team reviews within 1–2 business days. You must be 18 or older." },
    { n:"02", title:"Select Package & Deposit",  icon:<Wallet size={28} style={{ color:LIME }} />,    body:"Once KYC is approved, choose your investment tier. Deposit via MTN MoMo, Orange Money, Bitcoin, or USDT (TRC20). All deposits are reconciled before your balance updates." },
    { n:"03", title:"Active Trading Cycle",      icon:<TrendingUp size={28} style={{ color:LIME }} />,body:"Your capital enters the pooled forex trading cycle. Track your daily earnings log in real time from your dashboard. Payout countdown is always visible." },
    { n:"04", title:"Payout Date",               icon:<Coins size={28} style={{ color:LIME }} />,     body:"On the fixed payout date your returns are released. Withdraw to your payment method or auto-reinvest into the next cycle. Early withdrawal: flat 1,000 CFA fee." },
    { n:"05", title:"Loss Protection",           icon:<Shield size={28} style={{ color:LIME }} />,    body:"On a net cycle loss you are notified immediately in-app and via WhatsApp or email. A compensation token is credited automatically — valid 90 days toward your next deposit." },
  ];

  return (
    <div style={{ paddingTop:64 }} className="overflow-x-hidden">
      <section className="py-20" style={{ background:DARK }}>
        <div className="max-w-4xl mx-auto px-5 lg:px-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color:LIME, fontFamily:NB }}>The Process</p>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-6" style={{ color:CREAM, fontFamily:PP }}>How Moneybulls works</h1>
          <p className="text-base sm:text-lg" style={{ color:"rgba(253,254,248,0.55)", fontFamily:NB }}>From your first deposit to your first payout — every step, explained plainly.</p>
        </div>
      </section>

      <section className="py-20" style={{ background:CREAM }}>
        <div className="max-w-3xl mx-auto px-5 lg:px-8">
          <div className="space-y-10">
            {steps.map(s => (
              <div key={s.n} className="flex flex-col sm:flex-row gap-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background:DARK }}>{s.icon}</div>
                <div className="flex-1 sm:pt-3">
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color:LIME, fontFamily:NB }}>Step {s.n}</p>
                  <h3 className="text-xl font-bold mb-3" style={{ color:DARK, fontFamily:PP }}>{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color:"#4a5568", fontFamily:NB }}>{s.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-16 p-8 rounded-2xl text-center" style={{ background:DARK }}>
            <h3 className="text-2xl font-bold mb-3" style={{ color:CREAM, fontFamily:PP }}>Ready to start?</h3>
            <p className="text-sm mb-6" style={{ color:"rgba(253,254,248,0.55)", fontFamily:NB }}>Create your account in under 2 minutes.</p>
            <button onClick={onSignup} className="px-8 py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
              style={{ background:LIME, color:DARK, fontFamily:PP }}>Start Investing →</button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Reviews Page ───────────────────────────────────────────────────────────
function ReviewsPage() {
  const all = [
    ...TESTIMONIALS,
    { name:"Diane M.",   location:"Ngaoundéré", rating:5, initials:"DM", date:"May 2025",   text:"The KYC process was smooth and well-explained. After approval, my Tier 4 investment was live within hours. Payout was exactly as described." },
    { name:"Roger A.",   location:"Bertoua",    rating:4, initials:"RA", date:"March 2025", text:"Initially skeptical about forex platforms, but Moneybulls impressed me with how clearly they explain risks. No promises of easy money — just honest communication." },
    { name:"Sylvie K.",  location:"Limbe",      rating:5, initials:"SK", date:"April 2025", text:"Used MTN MoMo to deposit and it was instant. Dashboard is clean and shows my earnings daily. Withdrew on time with zero issues. Now at Tier 6." },
  ];

  return (
    <div style={{ paddingTop:64 }} className="overflow-x-hidden">
      <section className="py-20" style={{ background:DARK }}>
        <div className="max-w-4xl mx-auto px-5 lg:px-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color:LIME, fontFamily:NB }}>Community</p>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-6" style={{ color:CREAM, fontFamily:PP }}>What investors say</h1>
          <p className="text-base sm:text-lg" style={{ color:"rgba(253,254,248,0.55)", fontFamily:NB }}>All reviews are real, dated, and attributed with investor consent.</p>
        </div>
      </section>
      <section className="py-16" style={{ background:CREAM }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {all.map(t => (
              <div key={t.name} className="rounded-2xl p-6 flex flex-col gap-4" style={{ background:"#fff", border:"1px solid rgba(2,49,43,0.07)" }}>
                <div className="flex gap-1">
                  {Array(t.rating).fill(0).map((_,i) => <Star key={i} size={14} fill={LIME} style={{ color:LIME }} />)}
                  {Array(5-t.rating).fill(0).map((_,i) => <Star key={`e${i}`} size={14} style={{ color:"rgba(2,49,43,0.15)" }} />)}
                </div>
                <p className="text-sm leading-relaxed flex-1" style={{ color:"#2d3748", fontFamily:NB }}>"{t.text}"</p>
                <div className="flex items-center gap-3 pt-3" style={{ borderTop:"1px solid rgba(2,49,43,0.07)" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background:DARK, color:LIME, fontFamily:PP }}>{t.initials}</div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color:DARK, fontFamily:NB }}>{t.name}</p>
                    <p className="text-xs" style={{ color:"rgba(2,49,43,0.45)", fontFamily:NB }}>{t.location} · {t.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ── FAQ Page ───────────────────────────────────────────────────────────────
function FAQPage() {
  const [open, setOpen] = useState<number|null>(0);
  return (
    <div style={{ paddingTop:64 }} className="overflow-x-hidden">
      <section className="py-20" style={{ background:DARK }}>
        <div className="max-w-4xl mx-auto px-5 lg:px-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color:LIME, fontFamily:NB }}>FAQ</p>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-6" style={{ color:CREAM, fontFamily:PP }}>Questions answered</h1>
          <p className="text-base sm:text-lg" style={{ color:"rgba(253,254,248,0.55)", fontFamily:NB }}>Can't find what you need? Our chatbot is live — or reach us on WhatsApp.</p>
        </div>
      </section>
      <section className="py-16" style={{ background:CREAM }}>
        <div className="max-w-3xl mx-auto px-5 lg:px-8">
          <div className="space-y-3">
            {FAQ_ITEMS.map((item,i) => (
              <div key={i} className="rounded-xl overflow-hidden" style={{ border:"1px solid rgba(2,49,43,0.1)", background:"#fff" }}>
                <button onClick={() => setOpen(open===i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left gap-4">
                  <span className="font-semibold text-sm" style={{ color:DARK, fontFamily:NB }}>{item.q}</span>
                  <ChevronDown size={16} style={{ color:DARK, transform:open===i?"rotate(180deg)":"none", transition:"transform 0.2s", flexShrink:0 }} />
                </button>
                {open===i && (
                  <div className="px-6 pb-5">
                    <p className="text-sm leading-relaxed" style={{ color:"#4a5568", fontFamily:NB }}>{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 p-5 sm:p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4" style={{ background:DARK }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background:"#25D366" }}>
              <Phone size={20} style={{ color:"#fff" }} />
            </div>
            <div className="flex-1">
              <p className="font-bold" style={{ color:CREAM, fontFamily:PP }}>Still have questions?</p>
              <p className="text-sm" style={{ color:"rgba(253,254,248,0.55)", fontFamily:NB }}>Our team is available on WhatsApp for direct answers.</p>
            </div>
            <a href={WA_URL} target="_blank" rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity whitespace-nowrap"
              style={{ background:"#25D366", color:"#fff", fontFamily:NB }}>Chat on WhatsApp</a>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Dashboard Page ─────────────────────────────────────────────────────────
function DashboardPage({ profile, onSignup }: { profile:Profile|null; onSignup:()=>void }) {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [earnings, setEarnings]       = useState<EarningsLog[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [wStep, setWStep]             = useState<"confirm"|"done">("confirm");

  useEffect(() => {
    if (!profile) { setLoadingData(false); return; }
    (async () => {
      const { data:invData } = await supabase
        .from("investments").select("*, packages(*)")
        .eq("user_id", profile.id).order("created_at",{ ascending:false });
      const inv = (invData ?? []) as Investment[];
      setInvestments(inv);

      const active = inv.find(i => i.status==="active") ?? inv[0];
      if (active) {
        const { data:logData } = await supabase
          .from("earnings_log").select("*")
          .eq("investment_id", active.id)
          .order("date",{ ascending:true }).limit(30);
        setEarnings((logData ?? []) as EarningsLog[]);
      }
      setLoadingData(false);
    })();
  }, [profile?.id]);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5" style={{ paddingTop:64, background:CREAM }}>
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background:DARK }}>
            <Lock size={24} style={{ color:LIME }} />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color:DARK, fontFamily:PP }}>Dashboard is locked</h2>
          <p className="text-sm mb-6" style={{ color:"#4a5568", fontFamily:NB }}>Create an account and complete KYC to unlock your investment dashboard.</p>
          <button onClick={onSignup} className="px-8 py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
            style={{ background:LIME, color:DARK, fontFamily:PP }}>Get Started →</button>
        </div>
      </div>
    );
  }

  const activeInv  = investments.find(i => i.status==="active") ?? investments[0] ?? null;
  const totalEarned = earnings.reduce((s,e) => s+e.amount, 0);
  const chartData   = earnings.map((e,i) => ({ day:`D${i+1}`, amount:e.amount }));

  const kycBadge = {
    pending:  { bg:`rgba(254,136,55,0.1)`,     color:ORANGE,   label:"KYC Pending" },
    approved: { bg:"rgba(189,242,40,0.12)",     color:"#1a5200",label:"KYC Approved" },
    rejected: { bg:`rgba(254,136,55,0.1)`,     color:ORANGE,   label:"KYC Rejected" },
  }[profile.kyc_status];

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ paddingTop:64, background:CREAM }}>
      {/* Withdraw modal */}
      {showWithdraw && (
        <ModalOverlay onClose={() => { setShowWithdraw(false); setWStep("confirm"); }}>
          <div className="w-full max-w-sm rounded-2xl p-8" style={{ background:DARK }}>
            {wStep==="confirm" ? (
              <>
                <h2 className="text-2xl font-bold mb-2" style={{ color:CREAM, fontFamily:PP }}>Early Withdrawal</h2>
                <p className="text-sm mb-6" style={{ color:"rgba(253,254,248,0.55)", fontFamily:NB }}>A flat fee of 1,000 CFA applies to early withdrawals.</p>
                <div className="rounded-xl p-4 mb-6" style={{ background:"#0c1f1a" }}>
                  {[
                    { label:"Invested amount",       val:fmtCFA(activeInv?.amount??0),        col:CREAM },
                    { label:"Early withdrawal fee",  val:"− 1,000 CFA",                       col:ORANGE },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between text-sm mb-2">
                      <span style={{ color:"rgba(253,254,248,0.5)", fontFamily:NB }}>{r.label}</span>
                      <span style={{ color:r.col, fontFamily:NB }}>{r.val}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm pt-2 border-t" style={{ borderColor:"rgba(189,242,40,0.1)" }}>
                    <span className="font-semibold" style={{ color:CREAM, fontFamily:NB }}>You receive</span>
                    <span className="font-bold" style={{ color:LIME, fontFamily:NB }}>{fmtCFA((activeInv?.amount??1000)-1000)}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setShowWithdraw(false); setWStep("confirm"); }}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm"
                    style={{ background:"rgba(253,254,248,0.08)", color:CREAM, fontFamily:NB }}>Cancel</button>
                  <button onClick={() => setWStep("done")}
                    className="flex-1 py-3 rounded-xl font-bold text-sm hover:opacity-90"
                    style={{ background:ORANGE, color:"#fff", fontFamily:PP }}>Confirm</button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background:"rgba(189,242,40,0.12)" }}>
                  <CheckCircle size={28} style={{ color:LIME }} />
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{ color:CREAM, fontFamily:PP }}>Request submitted</h2>
                <p className="text-sm mb-6" style={{ color:"rgba(253,254,248,0.55)", fontFamily:NB }}>Your withdrawal request has been submitted. Funds will be sent within 24 hours.</p>
                <button onClick={() => { setShowWithdraw(false); setWStep("confirm"); }}
                  className="px-8 py-3 rounded-xl font-bold text-sm hover:opacity-90"
                  style={{ background:LIME, color:DARK, fontFamily:PP }}>Done</button>
              </div>
            )}
          </div>
        </ModalOverlay>
      )}

      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color:DARK, fontFamily:PP }}>
              Welcome back{profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-sm mt-1" style={{ color:"#4a5568", fontFamily:NB }}>{profile.email}</p>
          </div>
          <span className="px-3 py-1.5 rounded-full text-xs font-bold self-start"
            style={{ background:kycBadge.bg, color:kycBadge.color, fontFamily:NB }}>
            {kycBadge.label}
          </span>
        </div>

        {profile.kyc_status==="pending" ? (
          <div className="rounded-2xl p-8 text-center" style={{ background:"#fff", border:`1px solid rgba(254,136,55,0.2)` }}>
            <Clock size={36} style={{ color:ORANGE, margin:"0 auto 16px" }} />
            <h2 className="text-xl font-bold mb-2" style={{ color:DARK, fontFamily:PP }}>KYC review in progress</h2>
            <p className="text-sm" style={{ color:"#4a5568", fontFamily:NB }}>Our team is reviewing your documents. You'll be notified within 1–2 business days.</p>
          </div>
        ) : loadingData ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor:DARK, borderTopColor:LIME }} />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label:"Active Investment", value:fmtCFA(activeInv?.amount??0),     sub:activeInv?.packages?.name??"No active investment", icon:<Wallet size={16} style={{ color:LIME }} /> },
                { label:"Cycle Earnings",    value:fmtCFA(totalEarned),              sub:"This cycle",                                       icon:<TrendingUp size={16} style={{ color:LIME }} /> },
                { label:"Payout Date",       value:activeInv?.cycle_end ? new Date(activeInv.cycle_end).toLocaleDateString():"—", sub:activeInv?"Scheduled":"No active cycle", icon:<Clock size={16} style={{ color:LIME }} /> },
                { label:"Token Balance",     value:"0 CFA",                          sub:"No active tokens",                                  icon:<Coins size={16} style={{ color:LIME }} /> },
              ].map(s => (
                <div key={s.label} className="rounded-2xl p-4 sm:p-5 flex flex-col gap-2 sm:gap-3"
                  style={{ background:"#fff", border:"1px solid rgba(2,49,43,0.07)" }}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color:"rgba(2,49,43,0.45)", fontFamily:NB }}>{s.label}</p>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center" style={{ background:DARK }}>{s.icon}</div>
                  </div>
                  <p className="text-lg sm:text-2xl font-bold" style={{ color:DARK, fontFamily:PP }}>{s.value}</p>
                  <p className="text-xs" style={{ color:"rgba(2,49,43,0.45)", fontFamily:NB }}>{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Cycle panel + chart */}
            <div className="grid lg:grid-cols-3 gap-6 mb-6">
              <div className="rounded-2xl p-6" style={{ background:DARK }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color:LIME, fontFamily:NB }}>Current Cycle</p>
                {activeInv ? (
                  <>
                    {[
                      { label:"Package", val:activeInv.packages?.name??"—" },
                      { label:"Amount",  val:fmtCFA(activeInv.amount) },
                      { label:"Status",  val:activeInv.status },
                      { label:"Payout",  val:activeInv.cycle_end ? new Date(activeInv.cycle_end).toLocaleDateString():"—" },
                    ].map(r => (
                      <div key={r.label} className="flex justify-between text-sm mb-3">
                        <span style={{ color:"rgba(253,254,248,0.55)", fontFamily:NB }}>{r.label}</span>
                        <span className={r.label==="Status"?"font-semibold":""} style={{ color:r.label==="Status" ? LIME : CREAM, fontFamily:NB }}>{r.val}</span>
                      </div>
                    ))}
                    <button onClick={() => setShowWithdraw(true)}
                      className="mt-2 w-full py-3 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity"
                      style={{ background:`rgba(254,136,55,0.15)`, color:ORANGE, border:`1px solid rgba(254,136,55,0.3)`, fontFamily:NB }}>
                      Withdraw Early (1,000 CFA fee)
                    </button>
                  </>
                ) : (
                  <p className="text-sm" style={{ color:"rgba(253,254,248,0.45)", fontFamily:NB }}>No active investment. Select a package to start.</p>
                )}
              </div>

              <div className="lg:col-span-2 rounded-2xl p-6" style={{ background:"#fff", border:"1px solid rgba(2,49,43,0.07)" }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color:"rgba(2,49,43,0.45)", fontFamily:NB }}>Earnings Log — Current Cycle</p>
                {chartData.length>0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData} margin={{ top:0, right:0, left:-20, bottom:0 }}>
                      <defs>
                        <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={LIME} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={LIME} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(2,49,43,0.06)" />
                      <XAxis dataKey="day" tick={{ fontSize:11, fill:"rgba(2,49,43,0.4)", fontFamily:NB }} />
                      <YAxis tick={{ fontSize:11, fill:"rgba(2,49,43,0.4)", fontFamily:NB }} />
                      <Tooltip
                        contentStyle={{ background:DARK, border:"1px solid rgba(189,242,40,0.2)", borderRadius:12, fontFamily:NB, fontSize:12 }}
                        labelStyle={{ color:LIME }} itemStyle={{ color:CREAM }}
                        formatter={(v:number) => [fmtCFA(v),"Earnings"]}
                      />
                      <Area type="monotone" dataKey="amount" stroke={LIME} strokeWidth={2} fill="url(#eg)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-48">
                    <div className="text-center">
                      <BarChart2 size={32} style={{ color:"rgba(2,49,43,0.2)", margin:"0 auto 8px" }} />
                      <p className="text-sm" style={{ color:"rgba(2,49,43,0.4)", fontFamily:NB }}>No earnings data yet</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Investment history table */}
            {investments.length>0 && (
              <div className="rounded-2xl overflow-hidden" style={{ border:"1px solid rgba(2,49,43,0.08)" }}>
                <div className="px-6 py-4" style={{ background:"#fff", borderBottom:"1px solid rgba(2,49,43,0.06)" }}>
                  <p className="font-bold" style={{ color:DARK, fontFamily:PP }}>Investment History</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-[420px] w-full text-sm">
                    <thead>
                      <tr style={{ background:"#eef3e8" }}>
                        {["Date","Package","Amount","Status"].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide"
                            style={{ color:"rgba(2,49,43,0.45)", fontFamily:NB }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {investments.map((inv,i) => (
                        <tr key={inv.id} style={{ background:"#fff", borderTop:"1px solid rgba(2,49,43,0.05)" }}>
                          <td className="px-5 py-3.5" style={{ color:"#4a5568", fontFamily:NB }}>{new Date(inv.created_at).toLocaleDateString()}</td>
                          <td className="px-5 py-3.5 font-medium" style={{ color:DARK, fontFamily:NB }}>{inv.packages?.name??"—"}</td>
                          <td className="px-5 py-3.5 font-semibold" style={{ color:DARK, fontFamily:NB }}>{fmtCFA(inv.amount)}</td>
                          <td className="px-5 py-3.5">
                            <span className="px-2 py-1 rounded-lg text-xs font-medium"
                              style={{ background:inv.status==="active"?"rgba(189,242,40,0.12)":"rgba(2,49,43,0.06)", color:inv.status==="active"?"#1a5200":DARK, fontFamily:NB }}>
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────
function Footer({ setPage }: { setPage:(p:Page)=>void }) {
  return (
    <footer style={{ background:DARK }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-14">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="sm:col-span-2 md:col-span-1">
            <ImageWithFallback src={newLogo} alt="Moneybulls" className="h-10 w-auto object-contain mb-4" />
            <p className="text-sm leading-relaxed" style={{ color:"rgba(253,254,248,0.45)", fontFamily:NB }}>
              Africa's most transparent forex investment platform. Based in Cameroon.
            </p>
          </div>
          {[
            { title:"Platform", links:[{label:"How It Works",page:"how-it-works" as Page},{label:"Packages",page:"packages" as Page},{label:"Reviews",page:"reviews" as Page},{label:"FAQ",page:"faq" as Page}] },
            { title:"Legal",    links:[{label:"Terms of Service",page:null},{label:"Privacy Policy",page:null},{label:"Risk Disclosure",page:null}] },
            { title:"Contact",  links:[{label:"WhatsApp Support",page:null},{label:"Email Us",page:null}] },
          ].map(col => (
            <div key={col.title}>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color:"rgba(253,254,248,0.4)", fontFamily:NB }}>{col.title}</p>
              <div className="space-y-2">
                {col.links.map(l => (
                  <button key={l.label} onClick={() => l.page && setPage(l.page)}
                    className="block text-sm hover:opacity-80 transition-opacity"
                    style={{ color:"rgba(253,254,248,0.65)", fontFamily:NB }}>{l.label}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop:"1px solid rgba(189,242,40,0.08)" }}>
          <p className="text-xs" style={{ color:"rgba(253,254,248,0.3)", fontFamily:NB }}>© 2025 Moneybulls. All rights reserved. Registered business, Cameroon.</p>
          <p className="text-xs text-center" style={{ color:"rgba(253,254,248,0.25)", fontFamily:NB }}>Investment returns are variable and not guaranteed. Invest responsibly.</p>
        </div>
      </div>
    </footer>
  );
}

// ── App Root ───────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage]         = useState<Page>("home");
  const [profile, setProfile]   = useState<Profile|null>(null);
  const [authModal, setAuthModal]= useState<AuthModal>("none");
  const [packages, setPackages] = useState<Package[]>(FALLBACK_TIERS);
  const [pkgLoading, setPkgLoading] = useState(true);

  // Supabase auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data:{ session } }) => {
      if (session?.user) loadProfile(session.user.id);
    });
    const { data:{ subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) loadProfile(session.user.id);
      else setProfile(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Packages from DB
  useEffect(() => {
    supabase.from("packages").select("*").order("min_amount",{ ascending:true }).then(({ data }) => {
      if (data && data.length>0) setPackages(data as Package[]);
      setPkgLoading(false);
    });
  }, []);

  const loadProfile = async (uid: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
    if (data) setProfile(data as Profile);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setPage("home");
  };

  useEffect(() => { window.scrollTo({ top:0, behavior:"smooth" }); }, [page]);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ fontFamily:NB, background:CREAM }}>
      <Navbar
        page={page} setPage={setPage} profile={profile}
        onLoginClick={() => setAuthModal("login")}
        onSignupClick={() => setAuthModal("signup")}
        onLogout={handleLogout}
      />

      {page==="home"         && <HomePage     packages={packages} pkgLoading={pkgLoading} onSignup={() => setAuthModal("signup")} setPage={setPage} />}
      {page==="packages"     && <PackagesPage packages={packages} loading={pkgLoading}    onSignup={() => setAuthModal("signup")} />}
      {page==="how-it-works" && <HowItWorksPage onSignup={() => setAuthModal("signup")} />}
      {page==="reviews"      && <ReviewsPage />}
      {page==="faq"          && <FAQPage />}
      {page==="dashboard"    && <DashboardPage profile={profile} onSignup={() => setAuthModal("signup")} />}

      {page!=="dashboard" && <Footer setPage={setPage} />}

      {authModal==="login" && (
        <LoginModal
          onClose={() => setAuthModal("none")}
          onSuccess={() => { setPage("dashboard"); setAuthModal("none"); }}
          onSwitchToSignup={() => setAuthModal("signup")}
        />
      )}
      {authModal==="signup" && (
        <SignupModal
          onClose={() => setAuthModal("none")}
          onSuccess={() => setAuthModal("none")}
          onSwitchToLogin={() => setAuthModal("login")}
        />
      )}

      <ChatbotWidget />
    </div>
  );
}
