/**
 * BigQuery Logging - The Wax Ledger
 * Streams Infantry Logs to BigQuery for searchable war-ledger
 */
import { BigQuery } from '@google-cloud/bigquery';
export class WaxLedger {
    bigquery;
    datasetId;
    tableId;
    constructor(projectId, datasetId = 'colony_os', tableId = 'infantry_logs') {
        this.bigquery = new BigQuery({ projectId });
        this.datasetId = datasetId;
        this.tableId = tableId;
    }
    /**
     * Initialize the Wax Ledger (create dataset and table if needed)
     */
    async initialize() {
        console.log('📊 [WAX LEDGER] Initializing BigQuery...');
        try {
            // Create dataset if it doesn't exist
            const [dataset] = await this.bigquery.dataset(this.datasetId).get({ autoCreate: true });
            console.log(`✅ [WAX LEDGER] Dataset: ${this.datasetId}`);
            // Create table if it doesn't exist
            const [table] = await dataset.table(this.tableId).get({ autoCreate: true });
            if (!table) {
                const schema = [
                    { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
                    { name: 'unit', type: 'STRING', mode: 'REQUIRED' },
                    { name: 'message', type: 'STRING', mode: 'REQUIRED' },
                    { name: 'action', type: 'STRING' },
                    { name: 'tool_call', type: 'STRING' },
                    { name: 'success', type: 'BOOLEAN' },
                    { name: 'iteration', type: 'INTEGER' },
                    { name: 'mission_id', type: 'STRING' },
                ];
                await dataset.createTable(this.tableId, { schema });
                console.log(`✅ [WAX LEDGER] Table created: ${this.tableId}`);
            }
            else {
                console.log(`✅ [WAX LEDGER] Table exists: ${this.tableId}`);
            }
        }
        catch (error) {
            console.error('❌ [WAX LEDGER] Initialization failed:', error);
            throw error;
        }
    }
    /**
     * Stream a log entry to BigQuery
     */
    async log(entry) {
        try {
            const row = {
                timestamp: entry.timestamp || new Date().toISOString(),
                unit: entry.unit,
                message: entry.message,
                action: entry.action || null,
                tool_call: entry.tool_call || null,
                success: entry.success ?? null,
                iteration: entry.iteration || null,
                mission_id: entry.mission_id || null,
            };
            await this.bigquery
                .dataset(this.datasetId)
                .table(this.tableId)
                .insert([row]);
            console.log(`📊 [WAX LEDGER] Logged: ${entry.unit} - ${entry.message.substring(0, 50)}...`);
        }
        catch (error) {
            console.error('❌ [WAX LEDGER] Logging failed:', error);
            // Don't throw - logging failures shouldn't break the mission
        }
    }
    /**
     * Query the war-ledger
     */
    async query(whereClause, limit = 100) {
        const query = `
      SELECT *
      FROM \`${this.bigquery.projectId}.${this.datasetId}.${this.tableId}\`
      WHERE ${whereClause}
      ORDER BY timestamp DESC
      LIMIT ${limit}
    `;
        const [rows] = await this.bigquery.query({ query });
        return rows;
    }
    /**
     * Get mission summary
     */
    async getMissionSummary(missionId) {
        const query = `
      SELECT 
        COUNT(*) as total_actions,
        COUNTIF(success = true) as successful_actions,
        COUNTIF(success = false) as failed_actions,
        COUNT(DISTINCT unit) as units_involved,
        MIN(timestamp) as mission_start,
        MAX(timestamp) as mission_end
      FROM \`${this.bigquery.projectId}.${this.datasetId}.${this.tableId}\`
      WHERE mission_id = @missionId
    `;
        const [rows] = await this.bigquery.query({
            query,
            params: { missionId },
        });
        return rows[0];
    }
}
//# sourceMappingURL=bigquery-logging.js.map