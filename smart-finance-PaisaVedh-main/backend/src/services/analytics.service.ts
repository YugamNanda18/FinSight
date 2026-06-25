import { Transaction } from '../models/Transaction.model';
import { Budget } from '../models/Budget.model';
import { SavingsGoal } from '../models/SavingsGoal.model';
import { cacheService } from '../config/redis';
import mongoose from 'mongoose';
import logger from '../utils/logger';

interface TimeRange {
  startDate: Date;
  endDate: Date;
}

interface SpendingPattern {
  category: string;
  averageSpending: number;
  medianSpending: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  volatility: number;
  seasonalFactor: number;
}

interface FinancialHealthScore {
  overall: number;
  savings: number;
  budgeting: number;
  debtManagement: number;
  investment: number;
  recommendations: string[];
}

export class AnalyticsService {
  async getFinancialHealthScore(userId: string): Promise<FinancialHealthScore> {
    try {
      const cacheKey = `health_score:${userId}`;
      const cached = await cacheService.get(cacheKey);
      if (cached) return cached as FinancialHealthScore;

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const transactions = await Transaction.find({
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: sixMonthsAgo },
      });

      const monthlyData = this.calculateMonthlyMetrics(transactions);
      const savingsGoals = await SavingsGoal.find({
        userId: new mongoose.Types.ObjectId(userId),
      });
      const budgets = await Budget.find({
        userId: new mongoose.Types.ObjectId(userId),
      });

      const savingsScore = this.calculateSavingsScore(monthlyData);
      const budgetingScore = this.calculateBudgetingScore(budgets, transactions);
      const debtScore = this.calculateDebtScore(transactions);
      const investmentScore = this.calculateInvestmentScore(transactions);

      const overall = (savingsScore + budgetingScore + debtScore + investmentScore) / 4;

      const recommendations = this.generateHealthRecommendations({
        savingsScore,
        budgetingScore,
        debtScore,
        investmentScore,
        monthlyData,
      });

      const healthScore = {
        overall: Math.round(overall),
        savings: Math.round(savingsScore),
        budgeting: Math.round(budgetingScore),
        debtManagement: Math.round(debtScore),
        investment: Math.round(investmentScore),
        recommendations,
      };

      await cacheService.set(cacheKey, healthScore, 21600);
      return healthScore;
    } catch (error) {
      logger.error('Get financial health score error:', error);
      throw error;
    }
  }

  async getSpendingPatterns(userId: string): Promise<SpendingPattern[]> {
    try {
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const transactions = await Transaction.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            type: 'debit',
            date: { $gte: twelveMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              category: '$category',
              month: { $month: '$date' },
              year: { $year: '$date' },
            },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: '$_id.category',
            monthlySpending: {
              $push: {
                month: '$_id.month',
                year: '$_id.year',
                amount: '$total',
              },
            },
            allAmounts: { $push: '$total' },
          },
        },
      ]);

      const patterns: SpendingPattern[] = [];

      for (const transaction of transactions) {
        const amounts = transaction.allAmounts;
        const sortedAmounts = [...amounts].sort((a, b) => a - b);

        const average =
          amounts.reduce((a: number, b: number) => a + b, 0) / amounts.length;
        const median = sortedAmounts[Math.floor(sortedAmounts.length / 2)];
        const trend = this.calculateTrend(
          transaction.monthlySpending.map((m: any) => m.amount)
        );
        const volatility = this.calculateVolatility(amounts);
        const seasonalFactor = this.calculateSeasonalFactor(
          transaction.monthlySpending
        );

        patterns.push({
          category: transaction._id,
          averageSpending: average,
          medianSpending: median,
          trend,
          volatility,
          seasonalFactor,
        });
      }

      return patterns;
    } catch (error) {
      logger.error('Get spending patterns error:', error);
      throw error;
    }
  }

  private calculateMonthlyMetrics(transactions: any[]): any {
    const monthlyMap = new Map();

    for (const transaction of transactions) {
      const key = `${transaction.date.getFullYear()}-${transaction.date.getMonth()}`;
      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, { income: 0, expenses: 0, savings: 0 });
      }

      const month = monthlyMap.get(key);
      if (transaction.type === 'credit') {
        month.income += transaction.amount;
      } else {
        month.expenses += transaction.amount;
      }
      month.savings = month.income - month.expenses;
    }

    const monthlyStats = Array.from(monthlyMap.values());
    const avgSavings =
      monthlyStats.reduce((sum, m) => sum + m.savings, 0) / monthlyStats.length;
    const savingsRate =
      monthlyStats.reduce((sum, m) => sum + (m.savings / m.income), 0) /
      monthlyStats.length;

    return {
      monthlyStats,
      averageSavings: avgSavings,
      averageSavingsRate: savingsRate,
      monthsWithPositiveSavings: monthlyStats.filter((m) => m.savings > 0).length,
    };
  }

  private calculateSavingsScore(monthlyData: any): number {
    const { averageSavingsRate, monthsWithPositiveSavings, monthlyStats } =
      monthlyData;

    let score = 0;

    if (averageSavingsRate >= 0.2) score += 30;
    else if (averageSavingsRate >= 0.1) score += 20;
    else if (averageSavingsRate >= 0.05) score += 10;
    else score += 5;

    const consistency = monthsWithPositiveSavings / monthlyStats.length;
    score += consistency * 40;

    const savingsTrend = this.calculateTrend(
      monthlyStats.map((m: any) => m.savings)
    );
    if (savingsTrend === 'increasing') score += 30;
    else if (savingsTrend === 'stable') score += 15;

    return score;
  }

  private calculateBudgetingScore(budgets: any[], transactions: any[]): number {
    if (budgets.length === 0) return 50;

    let totalBudget = 0;
    let totalOverspend = 0;

    for (const budget of budgets) {
      totalBudget += budget.amount;
      const spent = transactions
        .filter((t) => t.category === budget.category && t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);

      if (spent > budget.amount) {
        totalOverspend += spent - budget.amount;
      }
    }

    const overspendRatio = totalOverspend / totalBudget;
    const score = Math.max(0, 100 - overspendRatio * 100);

    return score;
  }

  private calculateDebtScore(transactions: any[]): number {
    const debtTransactions = transactions.filter(
      (t) => t.category === 'Loan Payment' || t.category === 'Credit Card Payment'
    );

    if (debtTransactions.length === 0) return 80;

    const totalDebtPayments = debtTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );
    const totalIncome = transactions
      .filter((t) => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);

    const debtToIncomeRatio = totalDebtPayments / totalIncome;

    if (debtToIncomeRatio < 0.2) return 90;
    if (debtToIncomeRatio < 0.3) return 70;
    if (debtToIncomeRatio < 0.4) return 50;
    if (debtToIncomeRatio < 0.5) return 30;
    return 10;
  }

  private calculateInvestmentScore(transactions: any[]): number {
    const investmentTransactions = transactions.filter(
      (t) => t.category === 'Investments'
    );

    if (investmentTransactions.length === 0) return 0;

    const totalInvestments = investmentTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );
    const totalIncome = transactions
      .filter((t) => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);

    const investmentRate = totalInvestments / totalIncome;

    if (investmentRate >= 0.15) return 100;
    if (investmentRate >= 0.1) return 80;
    if (investmentRate >= 0.05) return 60;
    if (investmentRate >= 0.02) return 40;
    return 20;
  }

  private generateHealthRecommendations(metrics: any): string[] {
    const recommendations = [];

    if (metrics.savingsScore < 60) {
      recommendations.push(
        'Increase your savings rate to at least 20% of your income'
      );
      recommendations.push(
        'Set up automatic transfers to a savings account each month'
      );
    }

    if (metrics.budgetingScore < 60) {
      recommendations.push(
        'Create and stick to a monthly budget using the 50/30/20 rule'
      );
      recommendations.push(
        'Review your expenses weekly to identify overspending areas'
      );
    }

    if (metrics.debtScore < 60) {
      recommendations.push(
        'Focus on paying off high-interest debt first (avalanche method)'
      );
      recommendations.push('Consider debt consolidation for better interest rates');
    }

    if (metrics.investmentScore < 40) {
      recommendations.push(
        'Start investing at least 15% of your income for retirement'
      );
      recommendations.push('Explore low-cost index funds for beginner investors');
    }

    return recommendations.slice(0, 5);
  }

  private calculateTrend(data: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (data.length < 2) return 'stable';

    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));

    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const change = ((avgSecond - avgFirst) / avgFirst) * 100;

    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  private calculateVolatility(numbers: number[]): number {
    if (numbers.length < 2) return 0;

    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const variance =
      numbers.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numbers.length;

    return Math.sqrt(variance) / mean;
  }

  private calculateSeasonalFactor(data: any[]): number {
    const monthlyAverages = new Array(12).fill(0);
    const monthlyCounts = new Array(12).fill(0);

    for (const item of data) {
      monthlyAverages[item.month - 1] += item.amount;
      monthlyCounts[item.month - 1]++;
    }

    for (let i = 0; i < 12; i++) {
      if (monthlyCounts[i] > 0) {
        monthlyAverages[i] /= monthlyCounts[i];
      }
    }

    const overallAverage = monthlyAverages.reduce((a, b) => a + b, 0) / 12;
    const currentMonth = new Date().getMonth();

    return monthlyAverages[currentMonth] / overallAverage;
  }
}

export const analyticsService = new AnalyticsService();