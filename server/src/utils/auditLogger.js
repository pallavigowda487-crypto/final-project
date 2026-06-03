import AuditLog from '../models/AuditLog.js';
import { maskSensitive } from './maskSensitive.js';

export const logAudit = async ({
  userId,
  userEmail,
  role,
  action,
  resource,
  resourceId,
  details,
  req,
  status = 'success',
}) => {
  try {
    await AuditLog.create({
      userId,
      userEmail,
      role,
      action,
      resource,
      resourceId,
      details: maskSensitive(details),
      ip: req?.ip || req?.headers?.['x-forwarded-for'],
      userAgent: req?.headers?.['user-agent'],
      status,
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};
