import mongoose from 'mongoose';
import * as Papa from 'papaparse';
import { Transaction } from '../models/Transaction.model';
import fs from 'fs';

interface ParsedTransaction {
  date: Date;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  merchant: string;
  category: string;
  userId: mongoose.Types.ObjectId;
}

interface ProcessResult {
  processed: number;
  errors: Array<{ row: number; error: string }>;
  duplicates: number;
}

export class TransactionService {
  
  async processCSVUpload(filePath: string, userId: string): Promise<ProcessResult> {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const transactions: ParsedTransaction[] = [];
    const errors: Array<{ row: number; error: string }> = [];
    let rowNumber = 0;

    return new Promise((resolve, reject) => {
      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: (results: Papa.ParseResult<any>) => {
          try {
            // Process each row
            for (const row of results.data) {
              rowNumber++;
              try {
                const transaction = this.normalizeTransaction(row, userId);
                if (this.validateTransaction(transaction)) {
                  transactions.push(transaction);
                }
              } catch (err) {
                errors.push({ row: rowNumber, error: (err as Error).message });
              }
            }
            
            // Save to database
            if (transactions.length > 0) {
              Transaction.insertMany(transactions)
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
            } else {
              resolve({
                processed: 0,
                errors,
                duplicates: 0
              });
            }
          } catch (err) {
            reject(err);
          }
        },
        error: (error: Error) => {
          reject(error);
        }
      });
    });
  }

  private normalizeTransaction(row: any, userId: string): ParsedTransaction {
    // Try to find the right columns
    let date = new Date();
    let description = '';
    let amount = 0;
    let type: 'credit' | 'debit' = 'debit';
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
        } else {
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
      } else if (row.Credit && row.Credit !== '0') {
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
      userId: new mongoose.Types.ObjectId(userId)
    };
  }

  private parseDate(dateStr: string): Date {
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

  private extractMerchant(description: string): string {
    if (!description) return 'Unknown';
    
    // Remove common prefixes
    let merchant = description
      .replace(/^(UPI\/|NEFT\/|RTGS\/|IMPS\/|CARD\/|DEBIT\s*|CREDIT\s*)/i, '')
      .split(' - ')[0]
      .split(' | ')[0]
      .split(',')[0]
      .split(' ').slice(0, 3).join(' ')
      .trim();
    
    // Common merchant mapping
    const merchantMap: { [key: string]: string } = {
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

  private autoCategorizeTransaction(description: string, merchant: string): string {
    const text = (description + ' ' + merchant).toLowerCase();
    
    const categories: { [key: string]: string[] } = {
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

  private validateTransaction(transaction: ParsedTransaction): boolean {
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

export default TransactionService;