import { useCallback, useState } from 'react';

import {
  AuditProgress,
  checkGeneralLedgerStatus,
  startGeneralLedger,
} from '@/services/audit.service';
import { AuditResult } from '@/model/audit.types';

interface UseAuditReturn {
  isAuditing: boolean;
  auditStatus: string;
  auditProgress: AuditProgress;
  auditResult: AuditResult | null;
  handleGeneralLedgerAudit: (projectPath: string) => Promise<void>;
}

export const useAudit = (): UseAuditReturn => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditStatus, setAuditStatus] = useState('');
  const [auditProgress, setAuditProgress] = useState<AuditProgress>({});
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);

  const handleGeneralLedgerAudit = useCallback(async (projectPath: string) => {
    if (!projectPath) return;

    setIsAuditing(true);
    setAuditStatus('Starting general ledger parsing...');
    setAuditProgress({});
    setAuditResult(null);

    try {
      await startGeneralLedger(`${projectPath}/General Ledger/`);

      // Poll for general ledger status
      let generalLedgerResult = null;
      while (!generalLedgerResult) {
        const status = await checkGeneralLedgerStatus(`${projectPath}/General Ledger/`);
        if (status.status === 'error') {
          throw new Error(status.error);
        }
        if (status.status === 'success') {
          generalLedgerResult = status.result;
          break;
        }
        // Report progress
        setAuditProgress({
          currentFile: status.current_file,
          progressPercentage: status.progress_percentage,
          currentStage: status.current_stage,
        });

        // Update status message with both stage and file information
        let statusMessage = '';
        if (status.current_file) {
          statusMessage = `Processing ${status.current_file}`;
        }
        if (status.current_stage) {
          statusMessage += statusMessage ? ` - ${status.current_stage}` : `${status.current_stage}`;
        }
        if (statusMessage) {
          setAuditStatus(statusMessage);
        }

        // Wait for 5 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      setAuditResult({
        sourceDoc: null,
        generalLedger: generalLedgerResult,
      });
      setAuditStatus('General ledger parsing completed successfully');
    } catch (error) {
      console.error('General ledger parsing failed:', error);
      setAuditStatus(`General ledger parsing failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsAuditing(false);
      setAuditProgress({});
    }
  }, []);

  return {
    isAuditing,
    auditStatus,
    auditProgress,
    auditResult,
    handleGeneralLedgerAudit,
  };
};
