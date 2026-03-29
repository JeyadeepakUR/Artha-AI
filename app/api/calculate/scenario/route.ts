/**
 * API Route: POST /api/calculate/scenario
 * Simulates a what-if scenario
 */

import { NextRequest, NextResponse } from "next/server";
import { simulateScenario, AVAILABLE_SCENARIOS } from "@/lib/finance";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (data.age === undefined || data.monthlyIncome === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!data.scenarioName) {
      return NextResponse.json(
        { error: "Scenario name required" },
        { status: 400 }
      );
    }

    // Find or create scenario
    let scenario = AVAILABLE_SCENARIOS.find((s) => s.name === data.scenarioName);

    if (!scenario && data.customScenario) {
      // Support custom scenarios
      scenario = {
        name: data.scenarioName,
        description: data.customScenario.description || "",
        icon: data.customScenario.icon || "settings",
        impacts: data.customScenario.impacts || {},
      };
    }

    if (!scenario) {
      return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
    }

    const result = simulateScenario(
      {
        age: data.age,
        monthlyIncome: data.monthlyIncome,
        monthlyExpenses: data.monthlyExpenses || 0,
        currentSavings: data.currentSavings || 0,
        investments: data.investments || 0,
        emi: data.emi || 0,
        insurance: data.insurance || 0,
        riskProfile: data.riskProfile || "moderate",
      },
      scenario
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Error simulating scenario:", error);
    return NextResponse.json(
      { error: "Failed to simulate scenario" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/calculate/scenario?scenarios=true
 * List all available scenarios
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    if (searchParams.get("scenarios") === "true") {
      return NextResponse.json({
        success: true,
        scenarios: AVAILABLE_SCENARIOS,
      });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Error fetching scenarios:", error);
    return NextResponse.json(
      { error: "Failed to fetch scenarios" },
      { status: 500 }
    );
  }
}
