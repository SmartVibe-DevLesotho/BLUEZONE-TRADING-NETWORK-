export type AuditEventType =
  | 'SIGNAL_GENERATED'
  | 'SIGNAL_APPROVED'
  | 'SIGNAL_REJECTED'
  | 'RISK_BLOCKED'
  | 'ORDER_SUBMITTED'
  | 'ORDER_ACCEPTED'
  | 'ORDER_REJECTED'
  | 'ORDER_MODIFIED'
  | 'ORDER_CANCELLED'
  | 'POSITION_OPENED'
  | 'POSITION_MODIFIED'
  | 'POSITION_CLOSED'
  | 'BROKER_DISCONNECTED'
  | 'EMERGENCY_STOP_ACTIVATED';

export type AuditEvent = {
  type: AuditEventType;
  timestamp: string;
  actor: 'SMARTVIBE' | 'BROKER' | 'USER' | 'SYSTEM';
  entityId?: string;
  symbol?: string;
  metadata?: Record<string, unknown>;
};

export type AuditSink = (event: AuditEvent) => void;

export function emitAuditEvent(sink: AuditSink | undefined, event: AuditEvent): void {
  sink?.(event);
}
