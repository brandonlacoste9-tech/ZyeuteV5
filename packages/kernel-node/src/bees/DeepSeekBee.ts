
import { neurosphere, DeepSeekMessage } from '../lib/ai/deepseek';
import { db } from '../lib/db';
import { gitHubTool } from '../lib/tools/github';

interface ColonyTask {
  id: string;
  type: string;
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  created_at: string;
}

export class DeepSeekBee {
  private isAwake = false;
  private isForaging = false;
  private pollInterval = 5000;
  private beeId = 'bee_deepseek_v3_01';

  constructor() {
    console.log(`🐝 [${this.beeId}] Initialized. Waiting for signal...`);
  }

  public wakeUp() {
    if (this.isAwake) return;
    this.isAwake = true;
    console.log(`🐝 [${this.beeId}] Hive Link Established. Polling for tasks...`);
    
    // Start the heartbeat
    setInterval(() => this.forage(), this.pollInterval);
  }

  /**
   * The Safe Forage Loop
   * Replaces Math.random() with specific DB queries.
   */
  private async forage() {
    if (this.isForaging) return;
    this.isForaging = true;

    try {
      // 1. SENSE: Query the database for pending tasks
      const task = await this.findPollen(); 

      if (!task) {
        // No tasks found. The Bee sleeps safely. No spam.
        // console.log('zzz...'); 
        this.isForaging = false;
        return;
      }

      console.log(`🐝 [${this.beeId}] 🌸 Task Detected: [${task.type}] - ID: ${task.id}`);

      // 2. DIGEST: Lock the task so other bees don't take it
      await this.claimTask(task.id);

      try {
        // 3. THINK & ACT: Process logic
        const result = await this.processTask(task);
        
        // 4. MEMORIZE: Save result
        await this.depositHoney(task.id, result);
      } catch (processingError: any) {
        console.error(`🐝 [${this.beeId}] Processing Error:`, processingError);
        await this.failTask(task.id, processingError.message || String(processingError));
      }

    } catch (error) {
      console.error(`🐝 [${this.beeId}] Loop Error:`, error);
    } finally {
      this.isForaging = false;
    }
  }

  // --- Database Interactions ---

  private async findPollen(): Promise<ColonyTask | null> {
    const { data, error } = await db
      .from('colony_tasks')
      .select('*')
      .eq('status', 'pending')
      .in('type', ['content_advice', 'moderation', 'bug_report']) // Whitelisted task types
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // Ignore "no rows found"
      console.error('Error finding pollen:', error.message);
    }
    return data;
  }

  private async claimTask(taskId: string) {
    await db.from('colony_tasks')
      .update({ status: 'processing', assigned_to: this.beeId, started_at: new Date() })
      .eq('id', taskId);
  }

  private async depositHoney(taskId: string, result: string) {
    await db.from('colony_tasks')
      .update({ 
        status: 'completed', 
        result: { output: result }, 
        completed_at: new Date() 
      })
      .eq('id', taskId);
    
    console.log(`🍯 [${this.beeId}] Task ${taskId} completed successfully.`);
  }

  // --- Cognitive Processing ---

  private async processTask(task: ColonyTask): Promise<string> {
    const payload = typeof task.payload === 'string' ? JSON.parse(task.payload) : task.payload;

    if (task.type === 'bug_report') {
        console.log('🐞 [Bee] Initiating GitHub Protocol...');
        const messages: DeepSeekMessage[] = [
          { role: 'system', content: 'You are a QA Lead. Summarize this error for a GitHub Issue. Return strictly JSON: { "title": "...", "body": "..." }' },
          { role: 'user', content: JSON.stringify(payload) }
        ];
        
        const aiResponse = await neurosphere.think(messages);
        try {
          // Clean markdown code blocks if present
          const cleanJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
          const issueData = JSON.parse(cleanJson);
          
          const issueUrl = await gitHubTool.createIssue({
            title: issueData.title,
            body: `${issueData.body}\n\n*Reported automatically by DeepSeekBee*`,
            labels: ['bug', 'automated']
          });
          return `Issue created: ${issueUrl}`;
        } catch (e: any) {
          return `Failed to create issue: ${e.message}`;
        }
    }

    // Handle other types (content_advice, moderation)
    let systemPrompt = '';
    let userContent = '';

    if (task.type === 'content_advice') {
       systemPrompt = "You are Ti-Guy, a helpful Quebecois social media expert. Speak in 'Joual'. Give 3 short, punchy tips to improve this post.";
       userContent = JSON.stringify(payload);
    } else if (task.type === 'moderation') {
      systemPrompt = "You are the Colony Guard. Analyze this text for toxicity. Return strictly JSON: { isSafe: boolean, confidence: number, reason: string }.";
      userContent = payload.text || payload.content;
    }

    if (systemPrompt) {
       const messages: DeepSeekMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ];
      return await neurosphere.think(messages);
    }

    return "Task type processed (placeholder result)";
  }
}
