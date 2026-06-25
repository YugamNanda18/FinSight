import mongoose, { Document, Schema } from 'mongoose';

export interface ISavingsGoal extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  priority: 'low' | 'medium' | 'high';
  category: string;
  contributions: Array<{
    amount: number;
    date: Date;
    description: string;
  }>;
  isCompleted: boolean;
}

const SavingsGoalSchema = new Schema<ISavingsGoal>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  targetAmount: { 
    type: Number, 
    required: true,
    min: [0.01, 'Target amount must be positive']
  },
  currentAmount: { 
    type: Number, 
    default: 0 
  },
  targetDate: { 
    type: Date, 
    required: true 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    default: 'medium' 
  },
  category: String,
  contributions: [{
    amount: Number,
    date: { type: Date, default: Date.now },
    description: String
  }],
  isCompleted: { 
    type: Boolean, 
    default: false 
  }
}, {
  timestamps: true
});

export const SavingsGoal = mongoose.model<ISavingsGoal>('SavingsGoal', SavingsGoalSchema);