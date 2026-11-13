export type MutationOperation = 'INSERT' | 'UPDATE' | 'DELETE';
export type SyncStatus = 'PENDING' | 'RETRYING' | 'SYNCED' | 'FAILED';

export interface OutboxMutation<T = Record<string, unknown>> {
  mutation_id: string; // UUID v4
  table_name: string;
  operation: MutationOperation;
  record_id: string;
  payload: T;
  client_timestamp: string; // ISO 8601 UTC
  sync_status: SyncStatus;
  retry_count: number;
  error_message?: string;
}
