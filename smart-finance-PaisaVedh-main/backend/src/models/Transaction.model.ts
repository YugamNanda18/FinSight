import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  type: 'credit' | 'debit';
  category: string;
  subcategory?: string;
  description: string;
  merchant: string;
  date: Date;
  isRecurring: boolean;
  recurringId?: mongoose.Types.ObjectId;
  receiptUrl?: string;
  tags: string[];
  notes?: string;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  metadata: Map<string, any>;
}

const TransactionSchema = new Schema<ITransaction>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  amount: { 
    type: Number, 
    required: true,
    min: [0.01, 'Amount must be positive']
  },
  type: { 
    type: String, 
    enum: ['credit', 'debit'], 
    required: true 
  },
  category: { 
    type: String, 
    required: true,
    index: true
  },
  subcategory: String,
  description: { 
    type: String, 
    required: true,
    trim: true
  },
  merchant: { 
    type: String, 
    required: true,
    index: true
  },
  date: { 
    type: Date, 
    required: true,
    default: Date.now,
    index: true
  },
  isRecurring: { type: Boolean, default: false },
  recurringId: { type: Schema.Types.ObjectId, ref: 'RecurringExpense' },
  receiptUrl: String,
  tags: [String],
  notes: String,
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  metadata: { type: Map, of: Schema.Types.Mixed }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, category: 1 });
TransactionSchema.index({ userId: 1, merchant: 1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);