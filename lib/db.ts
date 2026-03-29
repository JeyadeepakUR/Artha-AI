/**
 * Database Service
 * Handles all Prisma operations for user profiles, plans, and chats
 */

import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// Singleton pattern for Prisma client
let prisma: PrismaClient;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("Missing DATABASE_URL environment variable");
    }

    const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}

/**
 * Create or update user profile
 */
export async function upsertUserProfile(userData: {
  email: string;
  name: string;
  age: number;
  maritalStatus: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  currentSavings: number;
  investments: number;
  emi: number;
  insurance: number;
  emergencyFund: number;
  riskProfile: string;
  goals?: Array<{ name: string; target: number; deadline: number }>;
  fixedAssets?: number;
  liquidAssets?: number;
}) {
  const client = getPrismaClient();

  return client.userProfile.upsert({
    where: { email: userData.email },
    create: {
      name: userData.name,
      email: userData.email,
      age: userData.age,
      maritalStatus: userData.maritalStatus,
      monthlyIncome: userData.monthlyIncome,
      monthlyExpenses: userData.monthlyExpenses,
      currentSavings: userData.currentSavings,
      investments: userData.investments,
      emi: userData.emi,
      insurance: userData.insurance,
      emergencyFund: userData.emergencyFund,
      riskProfile: userData.riskProfile,
      goals: JSON.stringify(userData.goals || []),
      fixedAssets: userData.fixedAssets || 0,
      liquidAssets: userData.liquidAssets || 0,
    },
    update: {
      name: userData.name,
      age: userData.age,
      maritalStatus: userData.maritalStatus,
      monthlyIncome: userData.monthlyIncome,
      monthlyExpenses: userData.monthlyExpenses,
      currentSavings: userData.currentSavings,
      investments: userData.investments,
      emi: userData.emi,
      insurance: userData.insurance,
      emergencyFund: userData.emergencyFund,
      riskProfile: userData.riskProfile,
      goals: JSON.stringify(userData.goals || []),
      fixedAssets: userData.fixedAssets || 0,
      liquidAssets: userData.liquidAssets || 0,
    },
  });
}

/**
 * Get user profile by email
 */
export async function getUserProfile(email: string) {
  const client = getPrismaClient();

  const profile = await client.userProfile.findUnique({
    where: { email },
    include: { financialPlan: true },
  });

  if (profile) {
    return {
      ...profile,
      goals: typeof profile.goals === "string" ? JSON.parse(profile.goals) : profile.goals,
    };
  }

  return null;
}

/**
 * Update or create financial plan
 */
export async function saveFinancialPlan(
  userId: string,
  planData: {
    totalHealthScore: number;
    emergencyScore: number;
    insuranceScore: number;
    debtScore: number;
    diversificationScore: number;
    taxScore: number;
    retirementScore: number;
    sipAmount: number;
    retirementAge: number;
    retirementCorpus: number;
    allocation: unknown;
    projections: unknown;
    insights: unknown;
  }
) {
  const client = getPrismaClient();

  return client.financialPlan.upsert({
    where: { userId },
    create: {
      userId,
      totalHealthScore: planData.totalHealthScore,
      emergencyScore: planData.emergencyScore,
      insuranceScore: planData.insuranceScore,
      debtScore: planData.debtScore,
      diversificationScore: planData.diversificationScore,
      taxScore: planData.taxScore,
      retirementScore: planData.retirementScore,
      sipAmount: planData.sipAmount,
      retirementAge: planData.retirementAge,
      retirementCorpus: planData.retirementCorpus,
      allocation: JSON.stringify(planData.allocation),
      projections: JSON.stringify(planData.projections),
      insights: JSON.stringify(planData.insights),
    },
    update: {
      totalHealthScore: planData.totalHealthScore,
      emergencyScore: planData.emergencyScore,
      insuranceScore: planData.insuranceScore,
      debtScore: planData.debtScore,
      diversificationScore: planData.diversificationScore,
      taxScore: planData.taxScore,
      retirementScore: planData.retirementScore,
      sipAmount: planData.sipAmount,
      retirementAge: planData.retirementAge,
      retirementCorpus: planData.retirementCorpus,
      allocation: JSON.stringify(planData.allocation),
      projections: JSON.stringify(planData.projections),
      insights: JSON.stringify(planData.insights),
    },
  });
}

/**
 * Get financial plan for user
 */
export async function getFinancialPlan(userId: string) {
  const client = getPrismaClient();

  const plan = await client.financialPlan.findUnique({
    where: { userId },
  });

  if (plan) {
    return {
      ...plan,
      allocation: typeof plan.allocation === "string" ? JSON.parse(plan.allocation) : plan.allocation,
      projections: typeof plan.projections === "string" ? JSON.parse(plan.projections) : plan.projections,
      insights: typeof plan.insights === "string" ? JSON.parse(plan.insights) : plan.insights,
    };
  }

  return null;
}

/**
 * Save chat message
 */
export async function saveChatMessage(
  userId: string,
  role: "user" | "assistant",
  content: string,
  metadata?: unknown
) {
  const client = getPrismaClient();

  return client.chatMessage.create({
    data: {
      userId,
      role,
      content,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}

/**
 * Get chat history for user
 */
export async function getChatHistory(userId: string, limit: number = 50) {
  const client = getPrismaClient();

  const messages = await client.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return messages
    .reverse()
    .map((msg: { metadata: string | null } & Record<string, unknown>) => ({
      ...msg,
      metadata: msg.metadata ? JSON.parse(msg.metadata) : null,
    }));
}

/**
 * Clear chat history
 */
export async function clearChatHistory(userId: string) {
  const client = getPrismaClient();

  return client.chatMessage.deleteMany({
    where: { userId },
  });
}
