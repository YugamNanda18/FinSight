import mongoose, { Document, Schema } from 'mongoose';

export interface IReport extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  period: {
    startDate: Date;
    endDate: Date;
  };
  data: any;
  format: 'json' | 'pdf';
  generatedAt: Date;
  fileUrl?: string;
}

const ReportSchema = new Schema<IReport>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  type: { 
    type: String, 
    enum: ['monthly', 'quarterly', 'yearly', 'custom'], 
    required: true 
  },
  period: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },
  data: { 
    type: Schema.Types.Mixed, 
    required: true 
  },
  format: { 
    type: String, 
    enum: ['json', 'pdf'], 
    default: 'json' 
  },
  generatedAt: { 
    type: Date, 
    default: Date.now 
  },
  fileUrl: String
});

ReportSchema.index({ userId: 1, generatedAt: -1 });

export const Report = mongoose.model<IReport>('Report', ReportSchema);