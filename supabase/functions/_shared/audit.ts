import { getServiceClient } from './auth.ts';

export interface AuditLogEntry {
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  const supabase = getServiceClient();

  await supabase.from('audit_logs').insert({
    actor_id: entry.actorId,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    metadata: entry.metadata || {},
    ip_address: entry.ipAddress,
  });
}
