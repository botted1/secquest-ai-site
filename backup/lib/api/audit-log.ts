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
  console.log(JSON.stringify({ ts: new Date().toISOString(), ...event }))
}
