/**
 * API Route: POST /api/profile
 * Handles user profile creation and updates
 */

import { NextRequest, NextResponse } from "next/server";
import { upsertUserProfile } from "@/lib/db";
import { calculateHealthScore, calculateFirePlan } from "@/lib/finance";
import { saveFinancialPlan } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.name || data.age === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Save to database
    const profile = await upsertUserProfile({
      email: user.email,
      name: data.name,
      age: data.age,
      maritalStatus: data.maritalStatus || "single",
      monthlyIncome: data.monthlyIncome || 0,
      monthlyExpenses: data.monthlyExpenses || 0,
      currentSavings: data.currentSavings || 0,
      investments: data.investments || 0,
      emi: data.emi || 0,
      insurance: data.insurance || 0,
      emergencyFund: data.emergencyFund || 0,
      riskProfile: data.riskProfile || "moderate",
      goals: data.goals || [],
      fixedAssets: data.fixedAssets || 0,
      liquidAssets: data.liquidAssets || 0,
    });

    // Calculate health score and FIRE plan
    const healthScoreResult = calculateHealthScore({
      age: data.age,
      monthlyIncome: data.monthlyIncome || 0,
      monthlyExpenses: data.monthlyExpenses || 0,
      currentSavings: data.currentSavings || 0,
      investments: data.investments || 0,
      emi: data.emi || 0,
      insurance: data.insurance || 0,
      riskProfile: data.riskProfile || "moderate",
    });

    const fireplanResult = calculateFirePlan({
      age: data.age,
      monthlyIncome: data.monthlyIncome || 0,
      monthlyExpenses: data.monthlyExpenses || 0,
      currentSavings: data.currentSavings || 0,
      investments: data.investments || 0,
      riskProfile: data.riskProfile || "moderate",
    });

    // Save financial plan
    await saveFinancialPlan(profile.id, {
      totalHealthScore: healthScoreResult.totalScore,
      emergencyScore: healthScoreResult.breakdown.emergencyScore,
      insuranceScore: healthScoreResult.breakdown.insuranceScore,
      debtScore: healthScoreResult.breakdown.debtScore,
      diversificationScore: healthScoreResult.breakdown.diversificationScore,
      taxScore: healthScoreResult.breakdown.taxScore,
      retirementScore: healthScoreResult.breakdown.retirementScore,
      sipAmount: fireplanResult.monthlySIP,
      retirementAge: fireplanResult.retirementAge,
      retirementCorpus: fireplanResult.retirementCorpus,
      allocation: fireplanResult.allocation,
      projections: fireplanResult.projections,
      insights: healthScoreResult.insights,
    });

    return NextResponse.json(
      {
        success: true,
        profile,
        healthScore: healthScoreResult,
        firePlan: fireplanResult,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in profile creation:", error);
    return NextResponse.json(
      { error: "Failed to create profile" },
      { status: 500 }
    );
  }
}

/**
 * API Route: GET /api/profile
 * Fetch user profile
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

    const profile = await (await import("@/lib/db")).getUserProfile(user.email);

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
