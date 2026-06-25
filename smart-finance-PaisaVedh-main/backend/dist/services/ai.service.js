"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = exports.AIService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Transaction_model_1 = require("../models/Transaction.model");
class AIService {
    async generateSpendingInsights(userId) {
        try {
            // Get last 6 months transactions
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            const transactions = await Transaction_model_1.Transaction.aggregate([
                {
                    $match: {
                        userId: new mongoose_1.default.Types.ObjectId(userId),
                        date: { $gte: sixMonthsAgo },
                        type: 'debit'
                    }
                },
                {
                    $group: {
                        _id: {
                            category: '$category',
                            month: { $month: '$date' },
                            year: { $year: '$date' }
                        },
                        totalAmount: { $sum: '$amount' },
                        transactionCount: { $sum: 1 }
                    }
                },
                {
                    $sort: { '_id.year': 1, '_id.month': 1 }
                }
            ]);
            // Detect patterns
            const patterns = this.detectSpendingPatterns(transactions);
            // Generate recommendations
            const recommendations = this.generateRecommendations(patterns);
            // Find savings opportunities
            const savingsOpportunities = await this.findSavingsOpportunities(userId);
            // Predict next month expenses
            const predictedNextMonthExpenses = await this.predictNextMonthExpenses(userId);
            return {
                patterns,
                recommendations,
                savingsOpportunities,
                predictedNextMonthExpenses
            };
        }
        catch (error) {
            console.error('AI Service Error:', error);
            return {
                patterns: [],
                recommendations: [
                    "Track your expenses regularly to get personalized insights",
                    "Set up monthly budgets for your top spending categories",
                    "Save at least 20% of your income each month"
                ],
                savingsOpportunities: [],
                predictedNextMonthExpenses: 0
            };
        }
    }
    detectSpendingPatterns(transactions) {
        const patterns = [];
        const categoryMap = new Map();
        // Group amounts by category
        for (const transaction of transactions) {
            const category = transaction._id.category;
            if (!categoryMap.has(category)) {
                categoryMap.set(category, []);
            }
            categoryMap.get(category).push(transaction.totalAmount);
        }
        // Analyze each category
        for (const [category, amounts] of categoryMap.entries()) {
            const averageSpending = amounts.reduce((a, b) => a + b, 0) / amounts.length;
            const trend = this.calculateTrend(amounts);
            patterns.push({
                category,
                averageSpending,
                trend,
                recommendations: this.getCategoryRecommendations(category, trend)
            });
        }
        return patterns;
    }
    calculateTrend(amounts) {
        if (amounts.length < 2)
            return 'stable';
        const firstHalf = amounts.slice(0, Math.floor(amounts.length / 2));
        const secondHalf = amounts.slice(Math.floor(amounts.length / 2));
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100;
        if (percentChange > 10)
            return 'increasing';
        if (percentChange < -10)
            return 'decreasing';
        return 'stable';
    }
    getCategoryRecommendations(category, trend) {
        const recommendations = {
            'Food & Dining': {
                increasing: [
                    'Your food expenses are rising. Consider meal prepping to save money',
                    'Try reducing dining out to twice per week',
                    'Use grocery delivery with subscription for discounts'
                ],
                decreasing: [
                    'Great job reducing food expenses! Consider investing the savings',
                    'Keep tracking portion sizes to avoid waste'
                ],
                stable: [
                    'Your food spending is consistent. Look for loyalty programs for additional savings'
                ]
            },
            'Shopping': {
                increasing: [
                    'Create a 24-hour rule before non-essential purchases',
                    'Unsubscribe from marketing emails to reduce impulse buys',
                    'Use price tracking tools for big purchases'
                ],
                decreasing: [
                    'Excellent work reducing shopping expenses!',
                    'Consider setting up automatic savings with the money saved'
                ],
                stable: [
                    'Your shopping habits are consistent. Review if all purchases are necessary'
                ]
            },
            'Entertainment': {
                increasing: [
                    'Review unused subscriptions (average person wastes ₹500/month)',
                    'Look for free local events instead of paid ones',
                    'Share streaming service costs with family'
                ],
                decreasing: [
                    'Great job cutting entertainment costs!',
                    'Use the savings for other financial goals'
                ],
                stable: [
                    'Your entertainment spending is under control. Keep it up!'
                ]
            },
            'Transportation': {
                increasing: [
                    'Consider public transportation to save on fuel costs',
                    'Car pool with colleagues to reduce expenses',
                    'Regular vehicle maintenance can improve fuel efficiency'
                ],
                decreasing: [
                    'Excellent work reducing transportation costs!',
                    'Continue using cost-effective travel methods'
                ],
                stable: [
                    'Your transportation costs are well managed'
                ]
            }
        };
        const defaultRecommendations = [
            `Consider setting a monthly budget cap for ${category}`,
            `Review ${category} expenses for potential savings of 15-20%`,
            `Track ${category} spending weekly to stay within budget`
        ];
        const categoryRecommendations = recommendations[category];
        if (categoryRecommendations) {
            return categoryRecommendations[trend] || defaultRecommendations;
        }
        return defaultRecommendations;
    }
    generateRecommendations(patterns) {
        const recommendations = [];
        // Add high-priority recommendations based on patterns
        for (const pattern of patterns) {
            if (pattern.trend === 'increasing' && pattern.averageSpending > 5000) {
                recommendations.push(`⚠️ Your ${pattern.category} spending is increasing. Review and reduce expenses in this category.`);
            }
        }
        // Add general recommendations if none specific
        if (recommendations.length === 0) {
            recommendations.push("Set up automatic savings of 20% of your income each month", "Review and cancel unused subscriptions to save ₹1000-2000 monthly", "Use the 50/30/20 rule: 50% needs, 30% wants, 20% savings", "Build an emergency fund covering 6 months of expenses", "Track every expense for one month to identify spending patterns");
        }
        return recommendations.slice(0, 5);
    }
    async findSavingsOpportunities(userId) {
        try {
            const opportunities = [];
            // Find recurring subscriptions
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            const subscriptions = await Transaction_model_1.Transaction.aggregate([
                {
                    $match: {
                        userId: new mongoose_1.default.Types.ObjectId(userId),
                        date: { $gte: threeMonthsAgo },
                        type: 'debit',
                        amount: { $lte: 2000 } // Subscriptions are usually small amounts
                    }
                },
                {
                    $group: {
                        _id: '$merchant',
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$amount' },
                        averageAmount: { $avg: '$amount' }
                    }
                },
                {
                    $match: {
                        count: { $gte: 3 } // At least 3 times in 3 months
                    }
                }
            ]);
            for (const sub of subscriptions) {
                opportunities.push({
                    type: 'subscription',
                    merchant: sub._id,
                    potentialSavings: sub.averageAmount * 12,
                    description: `Consider canceling ${sub._id} subscription if not needed`,
                    priority: 'medium'
                });
            }
            return opportunities;
        }
        catch (error) {
            console.error('Find savings opportunities error:', error);
            return [];
        }
    }
    async predictNextMonthExpenses(userId) {
        try {
            const last3Months = await Transaction_model_1.Transaction.aggregate([
                {
                    $match: {
                        userId: new mongoose_1.default.Types.ObjectId(userId),
                        type: 'debit'
                    }
                },
                {
                    $group: {
                        _id: {
                            month: { $month: '$date' },
                            year: { $year: '$date' }
                        },
                        total: { $sum: '$amount' }
                    }
                },
                {
                    $sort: { '_id.year': -1, '_id.month': -1 }
                },
                {
                    $limit: 3
                }
            ]);
            if (last3Months.length === 0)
                return 0;
            // Simple moving average prediction
            const sum = last3Months.reduce((acc, curr) => acc + curr.total, 0);
            const average = sum / last3Months.length;
            // Add 10% buffer for inflation/uncertainty
            return Math.round(average * 1.1);
        }
        catch (error) {
            console.error('Predict expenses error:', error);
            return 0;
        }
    }
}
exports.AIService = AIService;
exports.aiService = new AIService();
//# sourceMappingURL=ai.service.js.map