/**
 * API Route: POST /api/chat
 * Handles chat messages - simple AI mentor responses
 */

import { NextRequest, NextResponse } from "next/server";
import { saveChatMessage, getChatHistory, getUserProfile } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ChatUserProfile = {
  id: string;
  monthlyIncome?: number;
  monthlyExpenses?: number;
  currentSavings?: number;
  investments?: number;
  emi?: number;
  insurance?: number;
  age?: number;
  riskProfile?: string;
  goals?: unknown;
};

type NormalizedMessage = {
  role: string;
  content: string;
};

function envFlag(name: string): boolean {
  return process.env[name]?.trim().toLowerCase() === "true";
}

const SYSTEM_PROMPT = `You are a certified Indian financial advisor.
You provide safe, practical, long-term financial advice based on user data.
Avoid speculation, avoid stock tips, focus on planning.
Always be concise, numeric where possible, and actionable.
Honor hard numeric constraints (especially monthly budget caps) provided by user messages.`;

function extractMonthlyBudget(text: string): number | null {
  const lower = text.toLowerCase();
  const matches = [
    /(?:under|below|less than|<=?)\s*₹?\s*(\d+(?:\.\d+)?)\s*([kml]?)\s*(?:\/|per)?\s*month?/i,
    /₹\s*(\d+(?:\.\d+)?)\s*([kml]?)\s*(?:\/|per)?\s*month?/i,
  ];

  for (const pattern of matches) {
    const match = lower.match(pattern);
    if (!match) continue;

    const amount = Number(match[1]);
    const unit = match[2]?.toLowerCase();
    const multiplier = unit === "k" ? 1000 : unit === "l" ? 100000 : unit === "m" ? 1000000 : 1;
    return Math.round(amount * multiplier);
  }

  return null;
}

function responseExceedsBudget(response: string, budget: number): boolean {
  const matches = response.match(/₹\s*([\d,]+(?:\.\d+)?)\s*([kml]?)/gi) || [];
  for (const raw of matches) {
    const parsed = raw.match(/₹\s*([\d,]+(?:\.\d+)?)\s*([kml]?)/i);
    if (!parsed) continue;

    const amount = Number(parsed[1].replace(/,/g, ""));
    const unit = parsed[2]?.toLowerCase();
    const multiplier = unit === "k" ? 1000 : unit === "l" ? 100000 : unit === "m" ? 1000000 : 1;
    if (amount * multiplier > budget) {
      return true;
    }
  }

  return false;
}

function isInvestmentIntent(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("invest") ||
    lower.includes("sip") ||
    lower.includes("mutual") ||
    lower.includes("allocation") ||
    lower.includes("plan")
  );
}

function buildBudgetAwarePlan(budget: number, userProfile?: ChatUserProfile): string {
  const cap = Math.max(500, budget);
  const equity = Math.round(cap * 0.5);
  const debt = Math.round(cap * 0.3);
  const gold = cap - equity - debt;
  const risk = userProfile?.riskProfile || "moderate";

  return `Under your strict monthly cap of ₹${cap.toLocaleString("en-IN")}, here is a practical 6-month plan:

### Monthly allocation (cap respected)
- Equity index SIP: ₹${equity.toLocaleString("en-IN")}
- Debt fund/RD: ₹${debt.toLocaleString("en-IN")}
- Gold/cash buffer: ₹${gold.toLocaleString("en-IN")}

### 6-month approach
1. Keep total auto-debit at **₹${cap.toLocaleString("en-IN")}/month max**.
2. Prioritize emergency liquidity if buffer is weak.
3. Review at month 3; increase only if income improves.
4. Avoid high-fee products at this ticket size.

Your profile risk setting is **${risk}**, so this keeps growth exposure while staying within your hard budget.`;
}

async function callOpenAICompatible(
  message: string,
  userProfile: ChatUserProfile,
  recentMessages: Array<{ role?: unknown; content?: unknown }>
): Promise<string | null> {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const openAIKey = process.env.OPENAI_API_KEY;
  const apiKey = openRouterKey || openAIKey;
  const usingOpenRouter = Boolean(openRouterKey);
  const baseUrl = (
    process.env.OPENROUTER_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    (usingOpenRouter ? "https://openrouter.ai/api/v1" : "https://api.openai.com/v1")
  ).replace(/\/$/, "");

  const configuredModels =
    process.env.OPENROUTER_MODELS?.split(",")
      .map((modelId) => modelId.trim())
      .filter(Boolean) || [];

  const modelChain = configuredModels.length
    ? configuredModels
    : usingOpenRouter
    ? [
        "nvidia/nemotron-3-super-120b-a12b:free",
        "nvidia/nemotron-3-nano-30b-a3b:free",
      ]
    : [process.env.OPENAI_MODEL || "gpt-4o-mini"];

  if (!apiKey) {
    return null;
  }

  // Keep context useful while avoiding unnecessary direct PII in prompt.
  const userContext = {
    age: userProfile.age,
    incomeBand: userProfile.monthlyIncome
      ? userProfile.monthlyIncome < 50000
        ? "under_50k"
        : userProfile.monthlyIncome < 100000
        ? "50k_to_100k"
        : "100k_plus"
      : "unknown",
    savingsRate:
      userProfile.monthlyIncome && userProfile.monthlyExpenses
        ? Math.round(
            ((userProfile.monthlyIncome - userProfile.monthlyExpenses) /
              userProfile.monthlyIncome) *
              100
          )
        : null,
    emergencyMonths:
      userProfile.currentSavings && userProfile.monthlyExpenses
        ? Number((userProfile.currentSavings / userProfile.monthlyExpenses).toFixed(1))
        : null,
    debtToIncomePct:
      userProfile.emi && userProfile.monthlyIncome
        ? Math.round((userProfile.emi / userProfile.monthlyIncome) * 100)
        : null,
    riskProfile: userProfile.riskProfile,
    goalsCount: Array.isArray(userProfile.goals) ? userProfile.goals.length : 0,
  };

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "system",
      content: `User financial profile: ${JSON.stringify(userContext)}`,
    },
    ...recentMessages
      .slice(-8)
      .map((m) => ({ role: String(m.role ?? ""), content: String(m.content ?? "") }))
      .filter((m) => m.role.length > 0 && m.content.length > 0),
    { role: "user", content: message },
  ];

  for (const model of modelChain) {
    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          ...(usingOpenRouter
            ? {
                "HTTP-Referer": process.env.APP_BASE_URL || "http://localhost:3000",
                "X-Title": "Artha AI",
              }
            : {}),
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          messages,
        }),
      });

      if (!res.ok) {
        continue;
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const content = data.choices?.[0]?.message?.content?.trim();
      if (content) {
        return content;
      }
    } catch {
      continue;
    }
  }

  return null;
}

async function callOllamaCompatible(
  message: string,
  userProfile: ChatUserProfile,
  recentMessages: Array<{ role?: unknown; content?: unknown }>
): Promise<string | null> {
  const ollamaEnabled = process.env.OLLAMA_ENABLED === "true";
  if (!ollamaEnabled) {
    return null;
  }

  const baseUrl = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
  const configuredModel = process.env.OLLAMA_MODEL || "qwen2.5:3b";

  const userContext = {
    age: userProfile.age,
    monthlyIncome: userProfile.monthlyIncome,
    monthlyExpenses: userProfile.monthlyExpenses,
    currentSavings: userProfile.currentSavings,
    investments: userProfile.investments,
    emi: userProfile.emi,
    insurance: userProfile.insurance,
    riskProfile: userProfile.riskProfile,
  };

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "system",
      content: `User financial profile: ${JSON.stringify(userContext)}`,
    },
    ...recentMessages
      .slice(-8)
      .map((m) => ({ role: String(m.role ?? ""), content: String(m.content ?? "") }))
      .filter((m) => m.role.length > 0 && m.content.length > 0),
    { role: "user", content: message },
  ];

  const prompt = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");

  const isModelNotFound = (raw: string): boolean => /model\s+'[^']+'\s+not\s+found/i.test(raw);

  const selectInstalledModel = async (): Promise<string | null> => {
    try {
      const tagsRes = await fetch(`${baseUrl}/api/tags`);
      if (!tagsRes.ok) {
        return null;
      }

      const tagsJson = (await tagsRes.json()) as {
        models?: Array<{ name?: string; model?: string }>;
      };

      const names = (tagsJson.models || [])
        .map((m) => m.name || m.model)
        .filter((m): m is string => Boolean(m));

      const nonEmbedding = names.find((name) => !name.toLowerCase().includes("embed"));
      return nonEmbedding || names[0] || null;
    } catch {
      return null;
    }
  };

  const tryModel = async (model: string): Promise<{ content: string | null; modelMissing: boolean }> => {
    try {
      const chatResponse = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          options: {
            temperature: 0.2,
          },
        }),
      });

      const chatRaw = await chatResponse.text();
      if (chatResponse.ok) {
        try {
          const data = JSON.parse(chatRaw) as {
            message?: { content?: string };
          };
          const content = data.message?.content?.trim();
          if (content) {
            return { content, modelMissing: false };
          }
        } catch {
          // Ignore parse errors and continue to /api/generate fallback.
        }
      }

      const chatModelMissing = isModelNotFound(chatRaw);

      const generateResponse = await fetch(`${baseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          options: {
            temperature: 0.2,
          },
        }),
      });

      const generateRaw = await generateResponse.text();
      if (generateResponse.ok) {
        try {
          const data = JSON.parse(generateRaw) as {
            response?: string;
          };
          const content = data.response?.trim();
          if (content) {
            return { content, modelMissing: false };
          }
        } catch {
          return { content: null, modelMissing: false };
        }
      }

      return {
        content: null,
        modelMissing: chatModelMissing || isModelNotFound(generateRaw),
      };
    } catch {
      return { content: null, modelMissing: false };
    }
  };

  const primaryAttempt = await tryModel(configuredModel);
  if (primaryAttempt.content) {
    return primaryAttempt.content;
  }

  if (primaryAttempt.modelMissing) {
    const installedModel = await selectInstalledModel();
    if (installedModel && installedModel !== configuredModel) {
      const fallbackAttempt = await tryModel(installedModel);
      if (fallbackAttempt.content) {
        return fallbackAttempt.content;
      }
    }
  }

  return null;
}

/**
 * Simple financial mentor responses (no external API required for MVP)
 */
function generateMentorResponse(userMessage: string, userProfile?: ChatUserProfile): string {
  const lower = userMessage.toLowerCase();

  // Detect intent and provide relevant response
  if (
    lower.includes("retirement") ||
    lower.includes("retire") ||
    lower.includes("fire")
  ) {
    return `Based on your profile, you need to invest ₹${userProfile?.monthlyIncome ? Math.round(userProfile.monthlyIncome * 0.2) : 15000}/month to achieve financial independence by 60. 

Key steps:
1. Maximize tax-saving investments (80C, NPS)
2. Maintain 6-12 months emergency fund
3. Rebalance portfolio annually
4. Avoid lifestyle inflation as your income grows

Your current FIRE score is strong if you maintain consistent SIP. Would you like me to adjust your retirement target age?`;
  }

  if (
    lower.includes("invest") ||
    lower.includes("investment") ||
    lower.includes("mutual")
  ) {
    return `For someone with a moderate risk profile at your age, I recommend:
- 60% Equity (diversified mutual funds/stocks)
- 25% Debt (bonds/fixed deposits)  
- 10% Gold (for inflation hedge)
- 5% Cash (emergency buffer)

Start with a monthly SIP of ₹5,000-₹10,000 in index funds. Consider these tax-efficient options:
- ELSS (Equity Linked Saving Scheme) under 80C
- NPS for additional retirement savings
- Direct plans have lower fees than regular plans`;
  }

  if (
    lower.includes("emi") ||
    lower.includes("loan") ||
    lower.includes("debt")
  ) {
    return `Your EMI should ideally be <30% of income for financial health. If it's higher:

1. Explore refinancing options for lower interest rates
2. Consider prepayment with 6-month emergency fund protected
3. Avoid taking additional loans until EMI is reduced
4. Create a debt payoff plan

Strong EMI management now ensures more investment capacity later. Want me to model a debt payoff scenario?`;
  }

  if (
    lower.includes("emergency") ||
    lower.includes("savings") ||
    lower.includes("save")
  ) {
    return `Emergency fund is your financial safety net. You should have:
- 3-6 months for decent coverage
- 6-12 months if income is variable
- 12+ months if you have dependents

Keep it in:
- Savings account (instant access)
- Money market funds (0-60 day access)
- Short-term FDs (slightly higher returns)

Only invest in higher-risk assets once emergency fund is secured. Is your emergency fund adequate?`;
  }

  if (
    lower.includes("insurance") ||
    lower.includes("cover") ||
    lower.includes("protection")
  ) {
    return `Insurance is about protecting your dependents, not investment. You need:

- **Life Insurance**: 10-15x annual income (low-cost term plans)
- **Health Insurance**: ₹5-10L coverage minimum
- **Critical Illness**: Support major illnesses
- **Disability**: Income protection if you can't work

For your income profile, a ₹50L term plan costs ~₹300-500/month. Don't confuse insurance with investment!`;
  }

  if (lower.includes("tax") || lower.includes("save tax")) {
    return `Smart tax saving strategies for you:

1. **Section 80C** (₹1.5L limit): ELSS, PPF, life insurance premiums
2. **Section 80D** (up to ₹25K): Health insurance premiums
3. **Section 80E**: Education loan interest
4. **NPS** (Section 80CCD): Additional ₹2L for retirement
5. **HRA**: If you pay rent (claim in tax return)

Invest ₹1.5L annually in 80C to save ~₹45K in taxes. That's free money! Which investment appeals to you most?`;
  }

  if (lower.includes("spend") || lower.includes("budget")) {
    return `Budget management is key to wealth building:

1. **Track spending**: Use apps to categorize expenses
2. **50-30-20 rule**: 50% needs, 30% wants, 20% savings
3. **Cut unnecessary**: Subscriptions, eating out, shopping
4. **Common leaks**: Coffee (₹10k/year easily!), apps, subscriptions

Once you fix your spending, the same income gives better results. What spending category would you like to optimize?`;
  }

  // Default response
  return `That's a great question! While I'm your AI financial mentor, I can help you with:
- Retirement and FIRE planning
- Investment allocation based on your risk profile
- Insurance and emergency fund strategies
- Tax optimization techniques
- Debt management
- What-if scenarios for life changes

Tell me what aspect of your finances concerns you most, and I'll provide specific guidance.`;
}

function generateMentorResponseWithContext(
  userMessage: string,
  userProfile: ChatUserProfile | undefined,
  recentMessages: NormalizedMessage[]
): string {
  const recentUserContext = recentMessages
    .filter((m) => m.role === "user")
    .slice(-4)
    .map((m) => m.content)
    .join(" ");

  const budget = extractMonthlyBudget(`${recentUserContext} ${userMessage}`);
  const investmentIntent =
    isInvestmentIntent(userMessage) || isInvestmentIntent(recentUserContext);

  if (budget && investmentIntent) {
    return buildBudgetAwarePlan(budget, userProfile);
  }

  return generateMentorResponse(userMessage, userProfile);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { message } = await request.json();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!message) {
      return NextResponse.json(
        { error: "Missing message" },
        { status: 400 }
      );
    }

    // Get user profile for context
    const userProfile = (await getUserProfile(user.email)) as ChatUserProfile | null;

    if (!userProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Save user message
    await saveChatMessage(userProfile.id, "user", message);

    // Load recent conversation for context
    const recentHistory = await getChatHistory(userProfile.id, 10);
    const normalizedHistory = (recentHistory as Array<Record<string, unknown>>).map((entry) => ({
      role: entry.role,
      content: entry.content,
    }));
    const normalizedForFallback: NormalizedMessage[] = normalizedHistory.map((entry) => ({
      role: String(entry.role ?? ""),
      content: String(entry.content ?? ""),
    }));

    const hardBudget = extractMonthlyBudget(
      [
        ...normalizedForFallback.filter((m) => m.role === "user").slice(-4).map((m) => m.content),
        message,
      ].join(" ")
    );

    // Model order is env-driven for demo/deploy flexibility.
    const preferOllama = envFlag("OLLAMA_PREFERRED");
    let modelResponse: string | null = null;

    if (preferOllama) {
      modelResponse = await callOllamaCompatible(message, userProfile, normalizedHistory);
      if (!modelResponse) {
        modelResponse = await callOpenAICompatible(message, userProfile, normalizedHistory);
      }
    } else {
      modelResponse = await callOpenAICompatible(message, userProfile, normalizedHistory);
      if (!modelResponse) {
        modelResponse = await callOllamaCompatible(message, userProfile, normalizedHistory);
      }
    }

    const llmViolatesBudget =
      Boolean(hardBudget && modelResponse && responseExceedsBudget(modelResponse, hardBudget));
    const response =
      modelResponse && !llmViolatesBudget
        ? modelResponse
        : generateMentorResponseWithContext(message, userProfile, normalizedForFallback);

    // Save mentor response
    await saveChatMessage(userProfile.id, "assistant", response);

    return NextResponse.json({
      success: true,
      userMessage: message,
      assistantMessage: response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in chat:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat
 * Fetch chat history for user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userProfile = await getUserProfile(user.email);

    if (!userProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const chatHistory = await getChatHistory(userProfile.id);

    return NextResponse.json({
      success: true,
      messages: chatHistory,
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat history" },
      { status: 500 }
    );
  }
}
