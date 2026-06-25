"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Papa = __importStar(require("papaparse"));
const Transaction_model_1 = require("../models/Transaction.model");
const fs_1 = __importDefault(require("fs"));
class TransactionService {
    async processCSVUpload(filePath, userId) {
        const fileContent = fs_1.default.readFileSync(filePath, 'utf-8');
        const transactions = [];
        const errors = [];
        let rowNumber = 0;
        return new Promise((resolve, reject) => {
            Papa.parse(fileContent, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    try {
                        // Process each row
                        for (const row of results.data) {
                            rowNumber++;
                            try {
                                const transaction = this.normalizeTransaction(row, userId);
                                if (this.validateTransaction(transaction)) {
                                    transactions.push(transaction);
                                }
                            }
                            catch (err) {
                                errors.push({ row: rowNumber, error: err.message });
                            }
                        }
                        // Save to database
                        if (transactions.length > 0) {
                            Transaction_model_1.Transaction.insertMany(transactions)
                                .then(() => {
                                resolve({
                                    processed: transactions.length,
                                    errors,
                                    duplicates: 0
                                });
                            })
                                .catch((err) => {
                                reject(err);
                            });
                        }
                        else {
                            resolve({
                                processed: 0,
                                errors,
                                duplicates: 0
                            });
                        }
                    }
                    catch (err) {
                        reject(err);
                    }
                },
                error: (error) => {
                    reject(error);
                }
            });
        });
    }
    normalizeTransaction(row, userId) {
        // Try to find the right columns
        let date = new Date();
        let description = '';
        let amount = 0;
        let type = 'debit';
        let merchant = 'Unknown';
        let category = 'Other';
        // Find date
        const dateKeys = ['Date', 'DATE', 'date', 'Transaction Date', 'Posting Date'];
        for (const key of dateKeys) {
            if (row[key]) {
                date = this.parseDate(row[key]);
                break;
            }
        }
        // Find description
        const descKeys = ['Description', 'DESCRIPTION', 'description', 'Narration', 'Particulars', 'Transaction Details'];
        for (const key of descKeys) {
            if (row[key]) {
                description = String(row[key]);
                break;
            }
        }
        // Find amount and type
        const amountKeys = ['Amount', 'AMOUNT', 'amount', 'Debit', 'Credit', 'Withdrawal', 'Deposit'];
        for (const key of amountKeys) {
            if (row[key] && row[key] !== 0 && row[key] !== '0') {
                const value = String(row[key]).replace(/[^0-9.-]/g, '');
                amount = Math.abs(parseFloat(value));
                if (key === 'Credit' || key === 'Deposit' || key === 'credit' || value.startsWith('+')) {
                    type = 'credit';
                }
                else {
                    type = 'debit';
                }
                break;
            }
        }
        // If no amount found, try checking both debit and credit columns
        if (amount === 0) {
            if (row.Debit && row.Debit !== '0') {
                amount = Math.abs(parseFloat(String(row.Debit).replace(/[^0-9.-]/g, '')));
                type = 'debit';
            }
            else if (row.Credit && row.Credit !== '0') {
                amount = Math.abs(parseFloat(String(row.Credit).replace(/[^0-9.-]/g, '')));
                type = 'credit';
            }
        }
        // Extract merchant name from description
        merchant = this.extractMerchant(description);
        // Auto-categorize
        category = this.autoCategorizeTransaction(description, merchant);
        return {
            date,
            description,
            amount,
            type,
            merchant,
            category,
            userId: new mongoose_1.default.Types.ObjectId(userId)
        };
    }
    parseDate(dateStr) {
        // Remove any extra characters
        dateStr = String(dateStr).trim();
        // Try different date formats
        // DD/MM/YYYY
        if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
            const parts = dateStr.split('/');
            return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
        // MM/DD/YYYY
        if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
            const parts = dateStr.split('/');
            return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
        }
        // YYYY-MM-DD
        if (dateStr.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
            return new Date(dateStr);
        }
        // DD-MM-YYYY
        if (dateStr.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
            const parts = dateStr.split('-');
            return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
        // Default to current date if parsing fails
        return new Date();
    }
    extractMerchant(description) {
        if (!description)
            return 'Unknown';
        // Remove common prefixes
        let merchant = description
            .replace(/^(UPI\/|NEFT\/|RTGS\/|IMPS\/|CARD\/|DEBIT\s*|CREDIT\s*)/i, '')
            .split(' - ')[0]
            .split(' | ')[0]
            .split(',')[0]
            .split(' ').slice(0, 3).join(' ')
            .trim();
        // Common merchant mapping
        const merchantMap = {
            'SWIGGY': 'Swiggy',
            'ZOMATO': 'Zomato',
            'AMAZON': 'Amazon',
            'FLIPKART': 'Flipkart',
            'UBER': 'Uber',
            'OLA': 'Ola',
            'NETFLIX': 'Netflix',
            'SPOTIFY': 'Spotify',
            'AMC': 'Amazon',
            'DMART': 'D-Mart',
            'BIGBASKET': 'BigBasket',
            'RELIANCE': 'Reliance Digital',
            'MCDONALD': "McDonald's",
            'KFC': 'KFC',
            'DOMINOS': "Domino's",
            'PIZZA HUT': 'Pizza Hut',
            'STARBUCKS': 'Starbucks',
            'CAFE COFFEE DAY': 'Cafe Coffee Day'
        };
        const upperMerchant = merchant.toUpperCase();
        for (const [key, value] of Object.entries(merchantMap)) {
            if (upperMerchant.includes(key)) {
                return value;
            }
        }
        return merchant.substring(0, 50) || 'Unknown';
    }
    autoCategorizeTransaction(description, merchant) {
        const text = (description + ' ' + merchant).toLowerCase();
        const categories = {
            'Food & Dining': ['swiggy', 'zomato', 'restaurant', 'cafe', 'starbucks', 'pizza', 'burger', 'kfc', 'mcdonald', 'domino', 'food', 'eatery', 'dining'],
            'Shopping': ['amazon', 'flipkart', 'myntra', 'ajio', 'shopping', 'nykaa', 'pantaloons', 'westside', 'mall', 'store'],
            'Transportation': ['uber', 'ola', 'petrol', 'fuel', 'metro', 'bus', 'train', 'rapido', 'taxi', 'cab', 'auto', 'transport'],
            'Entertainment': ['netflix', 'hotstar', 'prime', 'bookmyshow', 'cinema', 'movie', 'spotify', 'youtube', 'entertainment'],
            'Bills & Utilities': ['electricity', 'water', 'gas', 'internet', 'broadband', 'phone', 'recharge', 'bill', 'utility'],
            'Healthcare': ['pharmacy', 'hospital', 'doctor', 'medicine', 'clinic', 'medicare', 'apollo', 'healthcare', 'medical'],
            'Education': ['course', 'book', 'tuition', 'college', 'university', 'udemy', 'coursera', 'education', 'school'],
            'Rent': ['rent', 'maintenance', 'society', 'housing', 'lease'],
            'Investments': ['mutual fund', 'sip', 'stocks', 'nps', 'ppf', 'investment', 'trading', 'demat'],
            'Salary': ['salary', 'payroll', 'income', 'wages', 'payment received'],
            'Groceries': ['grocery', 'vegetables', 'fruits', 'supermarket', 'd-mart', 'bigbasket']
        };
        for (const [category, keywords] of Object.entries(categories)) {
            for (const keyword of keywords) {
                if (text.includes(keyword)) {
                    return category;
                }
            }
        }
        return 'Other';
    }
    validateTransaction(transaction) {
        if (!transaction.date || isNaN(transaction.date.getTime())) {
            throw new Error('Invalid date format');
        }
        if (!transaction.amount || transaction.amount <= 0) {
            throw new Error('Invalid amount');
        }
        if (!transaction.description) {
            throw new Error('Description is required');
        }
        return true;
    }
}
exports.TransactionService = TransactionService;
exports.default = TransactionService;
//# sourceMappingURL=transaction.service.js.map