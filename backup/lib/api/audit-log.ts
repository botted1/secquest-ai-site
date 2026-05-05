export type AuditAction =
  | "upload"
  | "extract"
  | "analyze"
  | "knowledge.ingest"
  | "auth.fail"
  | "rate_limit.hit"
  | "validation.fail"

export interface AuditEvent {
  action: AuditAction
  userId?: string
  ip?: string
  meta?: Record<string, unknown>
}

export function audit(event: AuditEvent): void {
  try {
    console.log(JSON.stringify({ ts: new Date().toISOString(), ...event }))
  } catch {
    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      action: event.action,
      userId: event.userId,
      ip: event.ip,
      meta: { _serializationError: true },
    }))
  }
}
