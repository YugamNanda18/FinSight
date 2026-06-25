import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  parentCategory?: string;
  keywords: string[];
  isSystem: boolean;
  isActive: boolean;
}

const CategorySchema = new Schema<ICategory>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['income', 'expense'], 
    required: true 
  },
  icon: { 
    type: String, 
    default: 'default' 
  },
  color: { 
    type: String, 
    default: '#000000' 
  },
  parentCategory: String,
  keywords: [String],
  isSystem: { 
    type: Boolean, 
    default: false 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, {
  timestamps: true
});

CategorySchema.index({ userId: 1, name: 1 }, { unique: true });

export const Category = mongoose.model<ICategory>('Category', CategorySchema);