/**
 * API Route: POST /api/calculate/fire-plan
 * Calculates FIRE plan for given user data
 */

import { NextRequest, NextResponse } from "next/server";
import { calculateFirePlan } from "@/lib/finance";

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

    const firePlan = calculateFirePlan({
      age: data.age,
      monthlyIncome: data.monthlyIncome,
      monthlyExpenses: data.monthlyExpenses || 0,
      currentSavings: data.currentSavings || 0,
      investments: data.investments || 0,
      riskProfile: data.riskProfile || "moderate",
    });

    return NextResponse.json({ success: true, ...firePlan });
  } catch (error) {
    console.error("Error calculating FIRE plan:", error);
    return NextResponse.json(
      { error: "Failed to calculate FIRE plan" },
      { status: 500 }
    );
  }
}
