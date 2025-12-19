
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface GitHubIssue {
  title: string;
  body: string;
  labels?: string[];
}

/**
 * GitHubTool
 * Gives the Hive Mind access to the 'gh' CLI binary.
 */
export class GitHubTool {
  
  /**
   * Checks if the gh CLI is authenticated and reachable.
   */
  async checkHealth(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('gh auth status');
      console.log('✅ GitHub CLI Connection:', stdout.trim());
      return true;
    } catch (error) {
      console.error('❌ GitHub CLI Offline. Ensure "gh auth login" is run in the IDE.');
      return false;
    }
  }

  /**
   * Creates a GitHub Issue.
   * Useful for the "Safety Guard" or "Planner Bee" to report findings.
   */
  async createIssue(issue: GitHubIssue): Promise<string> {
    const labelsFlag = issue.labels ? `--label "${issue.labels.join(',')}"` : '';
    
    // Sanitize inputs to prevent shell injection (basic sanitation)
    const title = issue.title.replace(/"/g, '\\"');
    const body = issue.body.replace(/"/g, '\\"');

    const command = `gh issue create --title "${title}" --body "${body}" ${labelsFlag}`;

    try {
      const { stdout } = await execAsync(command);
      return stdout.trim(); // Returns the URL of the new issue
    } catch (error: any) {
      throw new Error(`Failed to create issue: ${error.message}`);
    }
  }

  /**
   * Lists the latest open issues.
   */
  async listIssues(limit = 5): Promise<string> {
    try {
      const { stdout } = await execAsync(`gh issue list --limit ${limit} --json number,title,url`);
      return stdout;
    } catch (error: any) {
      throw new Error(`Failed to list issues: ${error.message}`);
    }
  }
}

export const gitHubTool = new GitHubTool();
