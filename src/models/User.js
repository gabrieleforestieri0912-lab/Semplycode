import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  // firstName and lastName are optional to support OAuth providers that may not provide them
  firstName: { type: String, required: false },
  lastName: { type: String, required: false },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  googleId: { type: String, unique: true, sparse: true },
  image: { type: String },
  createdAt: { type: Date, default: Date.now },
  stripeCustomerId: { type: String },
  subscriptionId: { type: String },
  subscriptionStatus: { type: String, default: 'inactive' },
  plan: { type: String, default: 'free' },
  subscriptionEndDate: { type: Date },
  dailyAnalyses: {
    count: { type: Number, default: 0 },
    lastReset: { type: Date, default: Date.now },
  },
  resetToken: { type: String },
  resetTokenExpiry: { type: Date },
  // One-time login code for magic link / code login
  loginCode: { type: String },
  loginCodeExpiry: { type: Date },
});

// Hash the password before saving
UserSchema.pre('save', async function () {
  if (!this.password || !this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Helper method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model('User', UserSchema);
