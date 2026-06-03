import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userEmail: String,
    role: String,
    action: { type: String, required: true },
    resource: String,
    resourceId: String,
    details: { type: mongoose.Schema.Types.Mixed },
    ip: String,
    userAgent: String,
    status: { type: String, enum: ['success', 'failure'], default: 'success' },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ userId: 1 });

export default mongoose.model('AuditLog', auditLogSchema);
