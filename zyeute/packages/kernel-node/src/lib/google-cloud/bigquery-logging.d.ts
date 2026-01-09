/**
 * BigQuery Logging - The Wax Ledger
 * Streams Infantry Logs to BigQuery for searchable war-ledger
 */
export interface InfantryLog {
  timestamp: string;
  unit:
    | "SWAT-ELITE"
    | "QUEEN"
    | "INFANTRY"
    | "SCOUT"
    | "SIEGE_ENGINE"
    | "WAX_BUILDER";
  message: string;
  action?: string;
  tool_call?: string;
  success?: boolean;
  iteration?: number;
  mission_id?: string;
}
export declare class WaxLedger {
  private bigquery;
  private datasetId;
  private tableId;
  constructor(projectId: string, datasetId?: string, tableId?: string);
  /**
   * Initialize the Wax Ledger (create dataset and table if needed)
   */
  initialize(): Promise<void>;
  /**
   * Stream a log entry to BigQuery
   */
  log(entry: InfantryLog): Promise<void>;
  /**
   * Query the war-ledger
   */
  query(whereClause: string, limit?: number): Promise<any[]>;
  /**
   * Get mission summary
   */
  getMissionSummary(missionId: string): Promise<any>;
}
//# sourceMappingURL=bigquery-logging.d.ts.map
