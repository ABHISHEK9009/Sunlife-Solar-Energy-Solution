import { prisma } from "@/lib/prisma";

export interface AuditLogParams {
  entityType: string;
  entityId: string;
  fieldChanged: string;
  previousValue?: string | null;
  newValue?: string | null;
  action: "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE";
  actorId: string;
  actorType?: "ADMIN" | "EMPLOYEE" | "CUSTOMER" | "SYSTEM";
  source?: "CRM" | "APP" | "API" | "WEBHOOK" | "IMPORT";
  ipAddress?: string | null;
  userAgent?: string | null;
  client?: any; // Allows passing interactive transaction `tx` if called inside transaction
}

/**
 * Enterprise Audit Logger for tracking all state changes,
 * status transitions, and data modifications across the CRM.
 */
export async function logAuditEvent(params: AuditLogParams) {
  try {
    const db = params.client || prisma;
    return await db.auditLog.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        fieldChanged: params.fieldChanged,
        previousValue: params.previousValue ? String(params.previousValue) : null,
        newValue: params.newValue ? String(params.newValue) : null,
        action: params.action,
        actorId: params.actorId,
        actorType: params.actorType || "SYSTEM",
        source: params.source || "CRM",
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (error) {
    // Non-blocking error logging for audit logs so operations don't fail if logging has issues
    console.error("[AuditLogger Error]:", error);
    return null;
  }
}
