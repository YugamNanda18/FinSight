import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'budget_alert' | 'recurring_detected' | 'report_ready' | 'goal_achieved';
  isRead: boolean;
  metadata: Map<string, any>;
}

const NotificationSchema = new Schema<INotification>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['budget_alert', 'recurring_detected', 'report_ready', 'goal_achieved'], 
    required: true 
  },
  isRead: { 
    type: Boolean, 
    default: false 
  },
  metadata: { 
    type: Map, 
    of: Schema.Types.Mixed 
  }
}, {
  timestamps: true
});

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);