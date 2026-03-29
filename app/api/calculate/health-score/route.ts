/**
 * API Route: POST /api/calculate/health-score
 * Calculates financial health score for given user data
 */

import { NextRequest, NextResponse } from "next/server";
import { calculateHealthScore } from "@/lib/finance";

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

    const healthScoreResult = calculateHealthScore({
      age: data.age,
      monthlyIncome: data.monthlyIncome,
      monthlyExpenses: data.monthlyExpenses || 0,
      currentSavings: data.currentSavings || 0,
      investments: data.investments || 0,
      emi: data.emi || 0,
      insurance: data.insurance || 0,
      riskProfile: data.riskProfile || "moderate",
    });

    return NextResponse.json({ success: true, ...healthScoreResult });
  } catch (error) {
    console.error("Error calculating health score:", error);
    return NextResponse.json(
      { error: "Failed to calculate health score" },
      { status: 500 }
    );
  }
}
