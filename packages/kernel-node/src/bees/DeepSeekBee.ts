
import { neurosphere, DeepSeekMessage } from '../lib/ai/deepseek';

interface Task {
  id: string;
  type: 'content_advice' | 'moderation' | 'strategy';
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

/**
 * DeepSeekBee: The Specialized Forager
 * Responsibility: Process text-heavy tasks using the DeepSeek V3 model.
 * * Biomimetic Role: Forager
 */
export class DeepSeekBee {
  private isAwake = false;
  private pollInterval = 5000; // 5 seconds heartbeat
  private beeId = 'bee_deepseek_v3_01';

  constructor() {
    console.log(`🐝 [${this.beeId}] Larva stage complete. Metamorphosis initializing...`);
  }

  /**
   * Awakens the agent to start its metabolic loop.
   */
  public wakeUp() {
    if (this.isAwake) return;
    this.isAwake = true;
    console.log(`🐝 [${this.beeId}] Awake and foraging.`);
    
    // Start the heartbeat
    setInterval(() => this.forage(), this.pollInterval);
  }

  /**
   * The "Forage" Loop: Looks for pollen (tasks) in the database.
   */
  private async forage() {
    try {
      // 1. SENSE: Look for pending tasks (Mocking DB connection for Phase 3 start)
      // In Phase 4, we connect this to Supabase 'tasks' table
      const task = await this.findPollen(); 

      if (!task) {
        // No pollen found, conserve energy.
        return;
      }

      console.log(`🐝 [${this.beeId}] Pollen found: [${task.type}]`);

      // 2. THINK: Process with Neurosphere
      const nectar = await this.processTask(task);

      // 3. ACT: Deposit Honey (Save result)
      await this.depositHoney(task.id, nectar);

    } catch (error) {
      console.error(`🐝 [${this.beeId}] Wing damage (Error):`, error);
    }
  }

  private async processTask(task: Task): Promise<string> {
    let systemPrompt = '';
    let userContent = '';

    switch (task.type) {
      case 'content_advice':
        systemPrompt = "You are Ti-Guy, a helpful Quebecois social media expert. Speak in 'Joual' and give short, punchy tips to improve this post.";
        userContent = JSON.stringify(task.payload);
        break;
      case 'moderation':
        systemPrompt = "You are the Colony Guard. Analyze this text for toxicity, hate speech, or harassment. Return strictly JSON: { isSafe: boolean, confidence: number, reason: string }.";
        userContent = task.payload.text;
        break;
      default:
        return 'Unknown pollen type';
    }

    const messages: DeepSeekMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ];

    return await neurosphere.think(messages);
  }

  // --- Mock Colony Interfaces (To be replaced with DB Calls) ---
  
  private async findPollen(): Promise<Task | null> {
    // Randomly find a task 10% of the time for testing purposes
    if (Math.random() > 0.9) {
      return {
        id: `task_${Date.now()}`,
        type: 'content_advice',
        payload: { text: "Check out my new poutine recipe! #yum" },
        status: 'pending'
      };
    }
    return null;
  }

  private async depositHoney(taskId: string, result: string) {
    console.log(`🍯 [${this.beeId}] Honey deposited for Task ${taskId}:`);
    console.log(result);
    console.log('---------------------------------------------------');
  }
}
