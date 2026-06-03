import mongoose from 'mongoose';

const apiUsageSchema = new mongoose.Schema(
  {
    endpoint: { type: String, required: true },
    method: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    tokensUsed: { type: Number, default: 0 },
    latencyMs: { type: Number },
    statusCode: { type: Number },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

apiUsageSchema.index({ timestamp: -1 });

export default mongoose.model('ApiUsage', apiUsageSchema);
