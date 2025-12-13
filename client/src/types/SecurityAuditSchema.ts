/**
 * Security Audit Schema
 * JSON schema for security vulnerability findings from security audits
 * Used by IntegrityForeman and security scanning tools
 */

export const SecurityAuditSchema = {
  type: 'object',
  properties: {
    issueId: { 
      type: 'string', 
      description: 'Unique identifier for the finding (e.g., RLS-001).' 
    },
    module: { 
      type: 'string', 
      description: 'The specific file or module affected (e.g., finance_bee.py).' 
    },
    severity: {
      type: 'string',
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL'],
      description: 'Severity level of the vulnerability.'
    },
    lineStart: { 
      type: 'number', 
      description: 'Starting line number of the code issue.' 
    },
    lineEnd: { 
      type: 'number', 
      description: 'Ending line number of the code issue.' 
    },
    summary: { 
      type: 'string', 
      description: 'A brief, clear description of the vulnerability.' 
    },
    remediation: { 
      type: 'string', 
      description: 'Recommended fix or action for the IntegrityForeman.' 
    }
  },
  required: ['issueId', 'module', 'severity', 'summary']
} as const;

/**
 * TypeScript type definition for Security Audit findings
 */
export interface SecurityAuditFinding {
  issueId: string;
  module: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
  lineStart?: number;
  lineEnd?: number;
  summary: string;
  remediation?: string;
}
