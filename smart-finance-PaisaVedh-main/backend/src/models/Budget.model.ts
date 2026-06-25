import mongoose, { Document, Schema } from 'mongoose';

export interface IBudget extends Document {
  userId: mongoose.Types.ObjectId;
  category: string;
  amount: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
  status: 'on_track' | 'warning' | 'exceeded';
  month: number;
  year: number;
  alerts: boolean;
  alertThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  category: { 
    type: String, 
    required: true,
    enum: ['food', 'groceries', 'shopping', 'entertainment', 'transportation', 
           'utilities', 'healthcare', 'education', 'travel', 'rent', 
           'insurance', 'subscriptions', 'other'],
    index: true 
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0
  },
  spent: { 
    type: Number, 
    default: 0,
    min: 0
  },
  remaining: { 
    type: Number, 
    default: 0
  },
  percentageUsed: { 
    type: Number, 
    default: 0
  },
  status: { 
    type: String, 
    enum: ['on_track', 'warning', 'exceeded'],
    default: 'on_track'
  },
  month: { 
    type: Number, 
    required: true,
    min: 0,
    max: 11
  },
  year: { 
    type: Number, 
    required: true 
  },
  alerts: { 
    type: Boolean, 
    default: true 
  },
  alertThreshold: { 
    type: Number, 
    default: 80,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Pre-save middleware
BudgetSchema.pre('save', function(next) {
  this.remaining = this.amount - this.spent;
  this.percentageUsed = this.amount > 0 ? (this.spent / this.amount) * 100 : 0;
  
  if (this.percentageUsed >= 100) {
    this.status = 'exceeded';
  } else if (this.percentageUsed >= 80) {
    this.status = 'warning';
  } else {
    this.status = 'on_track';
  }
  
  next();
});

// Compound unique index
BudgetSchema.index({ userId: 1, category: 1, month: 1, year: 1 }, { unique: true });

export const Budget = mongoose.model<IBudget>('Budget', BudgetSchema);