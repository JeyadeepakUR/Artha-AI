# Artha AI - Personal CFO MVP ✨

**Demo-ready full-stack financial mentorship platform** built for ET Hacks Bangalore 2025.

## 🎯 Feature Highlights

### Financial Intelligence
- **Health Score**: 6-factor financial wellness assessment
- **FIRE Plan**: Personalized retirement projections with SIP recommendations
- **What-If Scenarios**: Model life changes (salary, kids, loans, job loss)
- **Smart Alerts**: Spending, saving, tax, insurance nudges

### AI Mentor Chat
- **LLM-Powered**: OpenAI-compatible API support with smart fallback
- **Context-Aware**: Understands your profile, goals, and constraints
- **Financial Nudges**: Tax optimization, emergency funds, investment allocation

### 💾 Full Database Integration
- **Prisma ORM** with SQLite
- User profiles, financial plans, chat history
- Auto-migration on first run

---

## 🚀 Getting Started (2 minutes)

### Prerequisites
```bash
Node.js 18+, npm 9+
```

### Quick Setup & Run
```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run dev server
npm run dev
```

**Open** [http://localhost:3000](http://localhost:3000) →  
**Click "Get Started"** → Auto-loads demo profile → Explore dashboard

---

## 📋 Pages & Workflows

| Page | Purpose |
|------|---------|
| **Splash** | Intro + quick demo load |
| **Dashboard** | Health score, insights, KPIs |
| **Plan** | FIRE roadmap, corpus, asset allocation |
| **Simulate** | Test scenarios (salary, kids, job loss, etc.) |
| **Chat** | AI mentor with fallback local logic |
| **Insights** | Actionable alerts and recommendations |
| **Profile** | View your financial summary |

---

## 🛠 Architecture

```
money-tracker/
├── app/
│   ├── api/
│   │   ├── profile          # User profile CRUD
│   │   ├── calculate/
│   │   │   ├── health-score # 6-factor wellness
│   │   │   ├── fire-plan    # Retirement projections
│   │   │   └── scenario     # What-if modeler
│   │   └── chat            # AI mentor + DB persistence
│   ├── dashboard, plan, simulate, chat, etc.  # Pages
│   ├── layout.tsx, globals.css
│   └── page.tsx            # Root → /splash redirect
│
├── components/
│   └── Layout.tsx          # Sidebar + TopBar
│
├── lib/
│   ├── finance/            # Core engines
│   │   ├── healthScore.ts  # Wellness scoring
│   │   ├── firePlan.ts     # Retirement math
│   │   ├── scenarios.ts    # What-if modeler
│   │   ├── insights.ts     # Alert generation
│   │   └── index.ts        # Exports
│   ├── store.ts            # Zustand state + demo profile
│   └── db.ts               # Prisma helpers
│
├── prisma/
│   ├── schema.prisma       # Models: UserProfile, FinancialPlan, ChatMessage
│   └── migrations/
│
└── [build, config files...]
```

---

## 🧮 Financial Calculation Highlights

### Health Score (100-point system)
- Emergency Fund (15%)
- Insurance Coverage (20%)
- Debt Ratio (20%)
- Asset Diversification (15%)
- Tax Efficiency (15%)
- Retirement Readiness (15%)

### FIRE Plan
- Safe withdrawal rate: 4%
- Debt/Equity/Gold/Cash allocation by risk profile
- 30-year projection with inflation (6%) and salary growth
- Required monthly SIP calculated via future-value annuity formula

### Scenarios
- **Salary Increase**: Model 25% income boost
- **Bonus Windfall**: ₹3L lump-sum injection
- **House Purchase**: Add ₹1L EMI + maintenance
- **New Baby**: +₹30k/month expenses
- **Career Break**: 6/12-month zero income stress test
- **Medical Emergency**: ₹5L one-time expense
- **Market Rally**: +₹5L portfolio growth

---

## 🤖 AI Chat Integration

### Smart Fallback Architecture
1. **Try OpenAI-compatible first** (respects `OPENAI_API_KEY` + `OPENAI_MODEL`)
2. **Fallback to deterministic mentor logic** (always responsive, offline-capable)

### Deterministic Response Topics
- Retirement & FIRE planning
- Investment allocation
- EMI & debt management
- Emergency funds
- Insurance strategies
- Tax optimization (80C, 80D, NPS, HRA)
- Spending & budgeting

```typescript
// Set up optional OpenAI support:
export OPENAI_API_KEY="sk-..."
export OPENAI_MODEL="gpt-4o-mini"
export OPENAI_BASE_URL="https://api.openai.com/v1"  # optional
```

---

## 🎨 Design System

**Material Design 3** with Artha-specific palette:
- **Primary**: #1a237e (Deep Navy)
- **Secondary**: #006e2a (Forest Green)
- **Error**: #ba1a1a (Red)
- **Surface**: Light off-white (#f7f9fc)

Fonts: **Manrope** (headlines), **Inter** (body), **Material Symbols** (icons)

---

## 🔧 Build & Deploy

### Local Build
```bash
npm run build
npm run lint
```

### Production Ready
- ✅ Full TypeScript strict mode
- ✅ ESLint clean
- ✅ Database migrations auto-applied
- ✅ Prisma types generated
- ✅ Static + SSR pages optimized

---

## 📊 Demo Data

**Alex Rivera** (auto-loaded):
- Age: 28, Single
- Income: ₹80k/month
- Expenses: ₹40k/month
- Savings: ₹2L, Investments: ₹1.5L
- EMI: ₹15k/month (car/personal loan)
- Insurance: ₹3L coverage
- Risk Profile: Moderate

**Dashboard Preview**:
- Health Score: ~72/100 (Healthy)
- SIP Target: ₹15-20k/month for retirement at 60
- Emergency Fund: 5 months covered

---

## 📝 API Endpoints

### Profiles
- `POST /api/profile` - Create/update user
- `GET /api/profile?email=...` - Fetch profile

### Calculations
- `POST /api/calculate/health-score` - Score assessment
- `POST /api/calculate/fire-plan` - Retirement plan
- `POST /api/calculate/scenario` - What-if modeling

### Chat
- `POST /api/chat` - Send message, get response
- `GET /api/chat?userEmail=...` - Fetch history

---

## 🎯 Next Steps (Post-Hackathon)

1. **LLM Upgrade**: Integrate real financial API (Crunchbase, NSE, NSDL)
2. **Document Parsing**: Upload bank statements, tax returns for auto-filling
3. **Goal Tracking**: Real portfolio monitoring
4. **Social**: Share plans, compete on savings rate
5. **White-Label**: B2B version for banks, fintechs

---

## 📄 License

Built for **ET Hacks 2026**. Code: MIT License.

---

**Built with ❤️ by Team Artha**
