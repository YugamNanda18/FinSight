import mongoose, { Document, Schema } from 'mongoose';

export interface IRecurringExpense extends Document {
  userId: mongoose.Types.ObjectId;
  merchant: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  category: string;
  nextExpectedDate: Date;
  lastDetectedDate: Date;
  isActive: boolean;
  confidence: number;
  transactionHistory: mongoose.Types.ObjectId[];
}

const RecurringExpenseSchema = new Schema<IRecurringExpense>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  merchant: { 
    type: String, 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  frequency: { 
    type: String, 
    enum: ['daily', 'weekly', 'monthly', 'yearly'], 
    required: true 
  },
  category: { 
    type: String, 
    required: true 
  },
  nextExpectedDate: { 
    type: Date, 
    required: true 
  },
  lastDetectedDate: Date,
  isActive: { 
    type: Boolean, 
    default: true 
  },
  confidence: { 
    type: Number, 
    default: 0 
  },
  transactionHistory: [{
    type: Schema.Types.ObjectId,
    ref: 'Transaction'
  }]
}, {
  timestamps: true
});

RecurringExpenseSchema.index({ userId: 1, nextExpectedDate: 1 });

export const RecurringExpense = mongoose.model<IRecurringExpense>('RecurringExpense', RecurringExpenseSchema);