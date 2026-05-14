import mongoose from 'mongoose';
import crypto from 'crypto';

const ShareLinkSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true, index: true },
  userId: { type: String },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: true },
});

// TTL index on expiresAt (ensure in code); Mongo will remove expired docs
ShareLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

ShareLinkSchema.statics.createLink = async function ({ payload, userId, days = 7 }) {
  const token = crypto.randomBytes(8).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const doc = await this.create({ token, userId, payload, expiresAt });
  return doc;
};

export default mongoose.models.ShareLink || mongoose.model('ShareLink', ShareLinkSchema);
