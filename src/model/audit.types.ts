export interface ParseResponse {
  processed_files: string[];
  failed_files: Array<Record<string, unknown>>;
  total_chunks: number;
}

export interface GeneralLedgerResponse {
  success: boolean;
}

export interface AuditResult {
  sourceDocs: ParseResponse;
  generalLedger: GeneralLedgerResponse;
} 