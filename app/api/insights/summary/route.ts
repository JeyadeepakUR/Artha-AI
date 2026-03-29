import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/db";

type SummaryPayload = {
  summary: string;
  opportunities: string[];
  risks: string[];
  forecastNarrative: string;
};

type FinanceContext = {
  age: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  currentSavings: number;
  investments: number;
  emi: number;
  insurance: number;
  riskProfile: string;
};

function defaultSummary(context: FinanceContext): SummaryPayload {
  const annualSavings = Math.max(0, (context.monthlyIncome - context.monthlyExpenses) * 12);
  const savingsRate = context.monthlyIncome > 0
    ? Math.round(((context.monthlyIncome - context.monthlyExpenses) / context.monthlyIncome) * 100)
    : 0;
  const emergencyMonths = context.monthlyExpenses > 0
    ? Number((context.currentSavings / context.monthlyExpenses).toFixed(1))
    : 0;

  return {
    summary: `You save around ${savingsRate}% of income with ₹${Math.round(annualSavings).toLocaleString("en-IN")} annual surplus.`,
    opportunities: [
      "Increase SIP allocation whenever income increases to lock in lifestyle control.",
      "Route part of cash savings to higher-yield diversified investments after emergency coverage.",
      "Use annual review checkpoints for insurance and debt ratio optimization.",
    ],
    risks: [
      emergencyMonths < 6
        ? `Emergency buffer is only ${emergencyMonths} months; target at least 6 months.`
        : "Emergency buffer is healthy; ensure it stays liquid.",
      context.emi > context.monthlyIncome * 0.3
        ? "EMI burden is above 30% of income and can delay FIRE goals."
        : "EMI burden is currently manageable.",
    ],
    forecastNarrative:
      "If savings discipline continues and income growth is invested, your retirement readiness can improve steadily in the next 3-5 years.",
  };
}

async function callOpenRouterSummary(context: FinanceContext): Promise<SummaryPayload | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return null;
  }

  const baseUrl = (process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1").replace(/\/$/, "");
  const modelChain =
    process.env.OPENROUTER_MODELS?.split(",").map((m) => m.trim()).filter(Boolean) || [
      "nvidia/nemotron-3-super-120b-a12b:free",
      "nvidia/nemotron-3-nano-30b-a3b:free",
    ];

  const systemPrompt =
    "You are a personal finance strategist for India. Return strict JSON only with keys summary, opportunities, risks, forecastNarrative. Keep opportunities and risks as arrays of 2-4 short bullet strings. No markdown.";

  const userPrompt = `Context: ${JSON.stringify(context)}. Produce concise, actionable output.`;

  for (const model of modelChain) {
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": process.env.APP_BASE_URL || "http://localhost:3000",
          "X-Title": "Artha AI",
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        continue;
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        continue;
      }

      const parsed = JSON.parse(content) as Partial<SummaryPayload>;
      if (!parsed.summary || !parsed.forecastNarrative) {
        continue;
      }

      return {
        summary: parsed.summary,
        opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities.slice(0, 4).map(String) : [],
        risks: Array.isArray(parsed.risks) ? parsed.risks.slice(0, 4).map(String) : [],
        forecastNarrative: parsed.forecastNarrative,
      };
    } catch {
      continue;
    }
  }

  return null;
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await getUserProfile(user.email);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const context: FinanceContext = {
      age: profile.age,
      monthlyIncome: profile.monthlyIncome,
      monthlyExpenses: profile.monthlyExpenses,
      currentSavings: profile.currentSavings,
      investments: profile.investments,
      emi: profile.emi,
      insurance: profile.insurance,
      riskProfile: profile.riskProfile,
    };

    const aiSummary = await callOpenRouterSummary(context);
    const summary = aiSummary ?? defaultSummary(context);

    const annualSavings = Math.max(0, (context.monthlyIncome - context.monthlyExpenses) * 12);
    const expectedReturn = context.riskProfile === "aggressive" ? 0.12 : context.riskProfile === "conservative" ? 0.08 : 0.1;
    const baseCapital = context.currentSavings + context.investments;
    const projected3Years = Math.round(baseCapital * Math.pow(1 + expectedReturn, 3) + annualSavings * ((Math.pow(1 + expectedReturn, 3) - 1) / expectedReturn));
    const projected5Years = Math.round(baseCapital * Math.pow(1 + expectedReturn, 5) + annualSavings * ((Math.pow(1 + expectedReturn, 5) - 1) / expectedReturn));

    return NextResponse.json({
      success: true,
      summary,
      projections: {
        projected3Years,
        projected5Years,
      },
      metrics: {
        savingsRate:
          context.monthlyIncome > 0
            ? Math.round(((context.monthlyIncome - context.monthlyExpenses) / context.monthlyIncome) * 100)
            : 0,
        emergencyMonths:
          context.monthlyExpenses > 0
            ? Number((context.currentSavings / context.monthlyExpenses).toFixed(1))
            : 0,
        debtToIncomePct:
          context.monthlyIncome > 0 ? Math.round((context.emi / context.monthlyIncome) * 100) : 0,
      },
    });
  } catch (error) {
    console.error("Error generating summary insights:", error);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
