import { createClient } from '@supabase/supabase-js';
import { BeeType } from './types';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export class ColonyClient {
  /**
   * Submits a task to the Colony OS queue via Supabase
   */
  async submitTask(task: {
    description: string;
    beeType: BeeType;
    origin?: string;
    priority?: 'normal' | 'high';
  }): Promise<string | null> {
    try {
      // Create the task payload matching "NIC-1" specs
      const { data, error } = await supabase
        .from('colony_tasks')
        .insert({
          command: task.description, 
          origin: task.origin || 'Ti-Guy Swarm',
          priority: task.priority || 'normal',
          status: 'pending',
          metadata: {
            target_bee: task.beeType,
            swarm_mode: true
          }
        })
        .select('id')
        .single();

      if (error) {
        console.error('Supabase Error:', error);
        throw error;
      }
      return data.id;
    } catch (error) {
      console.error('Failed to submit task to Colony:', error);
      return null;
    }
  }

  /**
   * Listens for updates on a specific task (Real-time feedback)
   */
  subscribeToTask(taskId: string, onUpdate: (status: string, result?: any) => void) {
    return supabase
      .channel(`task-${taskId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'colony_tasks', filter: `id=eq.${taskId}` },
        (payload) => {
          onUpdate(payload.new.status, payload.new.result);
        }
      )
      .subscribe();
  }
}

export const colonyClient = new ColonyClient();
