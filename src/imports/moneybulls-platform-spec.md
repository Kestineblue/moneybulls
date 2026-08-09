# Moneybulls — Platform Specification

**Status:** Draft v1 — items marked 🟡 TBD need your confirmation before dev starts.

---

## 1. Legal Note (read first)

This platform pools user funds for forex trading with variable, non-guaranteed returns. In Cameroon this activity intersects with CEMAC/COBAC financial regulation. Nothing here is legal advice — have a Cameroonian lawyer review your Terms of Service, Privacy Policy, and payout structure before launch. This spec assumes returns are always presented as historical/variable, never promised.

---

## 2. Brand Identity

| Element | Value |
|---|---|
| Name | Moneybulls |
| Logo | Mountain-peak "M" mark, dark wordmark, lime accent dot |
| Primary (dark) | `#112522` — text, backgrounds, header |
| Accent (lime) | `#CFFF26` — CTAs, highlights, chart positives |
| Accent (orange) | `#F2594A` — alerts, urgency, secondary CTA |
| Neutral | `#F8F6F4` — page background, cards |

**Typography (🟡 TBD — no brand fonts given):** Suggest a bold geometric sans for headings (e.g. *Sora* or *General Sans*) paired with a clean readable sans for body (e.g. *Inter*). Confirm or swap.

**Tone:** Confident, plain-spoken, financially credible — not hype-y. Avoid "guaranteed," "risk-free," "get rich" language anywhere on site or chatbot per compliance.

---

## 3. Site Structure

1. **Home** — hero, how it works (3-step), tier preview, trust signals (registered business, licensed trader), CTA to sign up
2. **Packages** — full tier table, perks per tier
3. **Reviews** — testimonials (real, dated, attributed with consent)
4. **How It Works** — deposit → trading cycle → payout → withdraw/reinvest
5. **FAQ** — on-site chatbot lives here + persistent widget sitewide
6. **Login / Sign Up** — KYC-gated
7. **Dashboard** (post-login) — see §7
8. **Privacy Policy**
9. **Terms of Service** (includes risk disclosure: losses possible, returns not guaranteed, token compensation on loss)

---

## 4. User Flow

```
Visitor lands on Home
  → Clicks "Invest" or chats with bot
  → Bot answers FAQ (returns range, min/max, how withdrawals work)
  → Bot offers: "Ready to start? Sign up" OR "Talk to a human" → WhatsApp handoff
  → Sign Up: email/phone + password
  → KYC step: upload ID photo + selfie → pending review
  → Once approved: select package → choose payment method → deposit
  → Dashboard unlocks: shows active investment, cycle countdown, daily earnings log
  → On fixed payout date: funds released to withdrawal method OR auto-reinvested
  → Early withdrawal option available anytime (flat 1,000 CFA fee, confirmation prompt shown)
  → On any cycle loss: user notified + token credited automatically
```

---

## 5. Investment Tiers 🟡 TBD — confirm exact ladder

Based on your description (round figures, 10k–70k confirmed, jumping to 1M after 500k). Draft ladder below — edit freely:

| Tier | Min. Deposit (CFA) | Withdrawal Windows/month | Platform Fee | Priority Support |
|---|---|---|---|---|
| 1 | 10,000 | 1 | Standard | — |
| 2 | 30,000 | 1 | Standard | — |
| 3 | 50,000 | 2 | Standard | — |
| 4 | 70,000 | 2 | Reduced | — |
| 5 | 100,000 | 2 | Reduced | — |
| 6 | 150,000 | 3 | Reduced | ✓ |
| 7 | 200,000 | 3 | Low | ✓ |
| 8 | 300,000 | 4 | Low | ✓ |
| 9 | 400,000 | 4 | Low | ✓ Dedicated |
| 10 | 500,000 | Unlimited | Lowest | ✓ Dedicated |
| 11 | 1,000,000 | Unlimited | Lowest | ✓ Dedicated |

**Returns display:** Show a *historical average monthly performance range* (e.g. "past 6 cycles: X%–Y%") sitewide — same market-driven range regardless of tier, since tier perks are about fees/access, not inflated promised returns. 🟡 Provide actual historical numbers once you have real cycle data — until then, site should say "Performance history available after first live cycle."

---

## 6. Loss / Token Mechanism

- On any cycle where trading results in a net loss for a user's pool share:
  - User is notified (in-app + WhatsApp/email)
  - Token issued automatically — 🟡 confirm: flat CFA credit vs. % discount on next deposit (spec supports both; recommend picking one to keep it simple for v1)
  - Token shown in dashboard with expiry date (recommend 90 days to encourage reinvestment)

---

## 7. Dashboard (requires auth)

- Active package + amount invested
- Daily earnings log with timestamps
- Countdown to fixed payout date
- Withdrawal history
- "Withdraw early" button → shows fee (1,000 CFA) + confirmation modal before processing
- Token balance + expiry
- KYC status indicator

---

## 8. Payments

| Method | Notes |
|---|---|
| Bitcoin | 🟡 Gateway TBD — e.g. BTCPay Server (self-hosted, no KYC leakage) or NowPayments |
| USDT | Same gateway as BTC likely, confirm network (TRC20 recommended for low fees) |
| MTN Mobile Money | 🟡 Confirm merchant account / aggregator (e.g. Pawapay, Flutterwave, or direct MTN MoMo API) |
| Orange Money | 🟡 Same — often bundled with MTN via same aggregator (Flutterwave, Pawapay support both) |

All deposits/withdrawals logged in Supabase with status (pending/confirmed/failed) and reconciled before dashboard balance updates.

---

## 9. KYC / Age Verification

- Required at signup: government ID photo + live selfie
- 18+ enforced — ID date-of-birth checked
- 🟡 Manual review (your team) for v1 vs. automated provider (e.g. Smile Identity — strong Africa coverage, has Cameroon support) for v2
- Status: pending → approved/rejected, user notified either way
- No package purchase possible until KYC approved

---

## 10. Chatbot

Two surfaces, same knowledge base:
1. **On-site widget** — answers FAQ (min/max invest, how payout works, fees, KYC requirements) using a fixed Q&A set + fallback to "Talk to a human on WhatsApp" button
2. **WhatsApp handoff** — pre-filled message (e.g. "Hi, I'm interested in investing with Moneybulls") opens to your business number (placeholder until live number provided)

Bot must **never** state guaranteed returns, even if asked directly — scripted response should redirect to "returns are variable based on trading performance, historical range is X–Y%."

---

## 11. Backend (Supabase) — Core Tables

```
users            (id, email, phone, kyc_status, dob, created_at)
kyc_documents    (id, user_id, id_photo_url, selfie_url, status, reviewed_by, reviewed_at)
packages         (id, name, min_amount, fee_tier, withdrawal_windows)
investments      (id, user_id, package_id, amount, status, cycle_start, cycle_end, created_at)
earnings_log     (id, investment_id, date, amount, note, timestamp)
payouts          (id, investment_id, amount, method, status, scheduled_date, paid_at)
withdrawals      (id, user_id, amount, type[early|scheduled], fee, status, requested_at)
tokens           (id, user_id, amount_or_percent, type, expires_at, redeemed)
payment_transactions (id, user_id, method, amount, direction[deposit|withdrawal], status, provider_ref)
reviews          (id, user_id, rating, text, approved, created_at)
```

RLS: users can only read their own rows across all tables except `reviews` (public read on approved) and `packages` (public read).

---

## 12. Open Items Needing Your Input

- [ ] Confirm/edit tier ladder (§5)
- [ ] Font pairing
- [ ] Real historical performance numbers once available
- [ ] Token mechanism: flat amount vs. % discount — pick one
- [ ] Payment gateway/aggregator choice for crypto + mobile money
- [ ] KYC provider: manual vs. automated
- [ ] WhatsApp business number
- [ ] Legal review sign-off on Terms/Privacy Policy wording
