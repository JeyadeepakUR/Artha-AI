-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "maritalStatus" TEXT NOT NULL,
    "monthlyIncome" REAL NOT NULL,
    "monthlyExpenses" REAL NOT NULL,
    "currentSavings" REAL NOT NULL,
    "investments" REAL NOT NULL,
    "emi" REAL NOT NULL,
    "insurance" REAL NOT NULL,
    "emergencyFund" REAL NOT NULL,
    "riskProfile" TEXT NOT NULL,
    "goals" TEXT NOT NULL DEFAULT '[]',
    "fixedAssets" REAL NOT NULL DEFAULT 0,
    "liquidAssets" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FinancialPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "totalHealthScore" REAL NOT NULL DEFAULT 0,
    "emergencyScore" REAL NOT NULL DEFAULT 0,
    "insuranceScore" REAL NOT NULL DEFAULT 0,
    "debtScore" REAL NOT NULL DEFAULT 0,
    "diversificationScore" REAL NOT NULL DEFAULT 0,
    "taxScore" REAL NOT NULL DEFAULT 0,
    "retirementScore" REAL NOT NULL DEFAULT 0,
    "sipAmount" REAL NOT NULL DEFAULT 0,
    "retirementAge" INTEGER NOT NULL DEFAULT 60,
    "retirementCorpus" REAL NOT NULL DEFAULT 0,
    "allocation" TEXT NOT NULL DEFAULT '{}',
    "projections" TEXT NOT NULL DEFAULT '[]',
    "insights" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FinancialPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_email_key" ON "UserProfile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialPlan_userId_key" ON "FinancialPlan"("userId");

-- CreateIndex
CREATE INDEX "ChatMessage_userId_idx" ON "ChatMessage"("userId");
