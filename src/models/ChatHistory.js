import mongoose from 'mongoose';

const ChatHistorySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  messages: [{
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  language: { type: String, default: 'javascript' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ChatHistorySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.ChatHistory || mongoose.model('ChatHistory', ChatHistorySchema);