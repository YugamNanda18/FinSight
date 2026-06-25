import { Request } from 'express';
import { Document, Types } from 'mongoose';

// User Types
export interface IUserDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  avatar?: string;
  preferences: {
    currency: string;
    theme: 'light' | 'dark';
    monthlyBudget: number;
    notificationEnabled: boolean;
  };
  isEmailVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpiry?: Date;
  failedLoginAttempts: number;
  isLocked: boolean;
  lockUntil?: Date;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Request with User
export interface AuthRequest extends Request {
  user?: IUserDocument;
}

// Transaction Types
export interface TransactionData {
  amount: number;
  type: 'credit' | 'debit';
  category: string;
  subcategory?: string;
  description: string;
  merchant: string;
  date: Date;
  tags?: string[];
  receiptUrl?: string;
}

// Budget Types
export interface BudgetData {
  category: string;
  amount: number;
  month: number;
  year: number;
  alerts?: boolean;
  alertThreshold?: number;
}

// Analytics Types
export interface SpendingInsights {
  totalIncome: number;
  totalExpenses: number;
  savings: number;
  savingsRate: number;
  topCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    income: number;
    expenses: number;
  }>;
  recommendations: string[];
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// JWT Payload
export interface JwtPayload {
  id: string;
  email: string;
  role?: string;
}

// Email Types
export interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

// Report Types
export interface ReportData {
  period: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    transactionCount: number;
  };
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  topMerchants: Array<{
    merchant: string;
    amount: number;
  }>;
  dailySpending: Array<{
    date: string;
    amount: number;
  }>;
}

// WebSocket Events
export interface WebSocketEvents {
  BUDGET_ALERT: 'budget_alert';
  TRANSACTION_ADDED: 'transaction_added';
  GOAL_ACHIEVED: 'goal_achieved';
  RECURRING_DETECTED: 'recurring_detected';
}

// Configuration Types
export interface Config {
  port: number;
  mongodbUri: string;
  jwtSecret: string;
  jwtExpire: string;
  redisUrl: string;
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
  email: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
  ai: {
    apiKey: string;
    model: string;
  };
}

// Error Types
export interface AppError extends Error {
  status?: number;
  code?: string;
  keyValue?: Record<string, any>;
}