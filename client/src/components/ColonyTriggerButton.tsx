/**
 * Colony OS Worker Bee Trigger Button
 * 
 * Admin-only component that allows triggering Colony OS tasks from Zyeuté UI
 */

import React, { useState } from 'react';
// import { createColonyTask, getColonyTaskStatus, getRecentColonyTasks, type ColonyTask } from '@/integrations/colony/zyeute-trigger';
// import { isAdmin } from '@/lib/admin';
import { toast } from './Toast';

export const ColonyTriggerButton: React.FC = () => {
  const [command, setCommand] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'critical'>('normal');
  const [isAdminUser, setIsAdminUser] = React.useState(false);
  const [recentTasks, setRecentTasks] = React.useState<any[]>([]); // ColonyTask type
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    // checkAdmin();
    // loadRecentTasks();
  }, []);

  // const checkAdmin = async () => {
  //   const admin = await isAdmin();
  //   setIsAdminUser(admin);
  // };

  // const loadRecentTasks = async () => {
  //   const tasks = await getRecentColonyTasks(5);
  //   setRecentTasks(tasks);
  // };

  const handleSendTask = async () => {
    if (!command.trim()) {
      toast.error('Please enter a command');
      return;
    }

    setLoading(true);
    try {
      // Colony integration disabled temporarily
      toast.info('Colony integration coming soon');
      // const task = await createColonyTask({
      //   command: command.trim(),
      //   origin: 'Zyeute',
      //   priority,
      //   metadata: {
      //     triggered_by: 'admin_ui',
      //     timestamp: new Date().toISOString()
      //   }
      // });
      // if (task) {
      //   toast.success(`Task created: ${task.id}`);
      //   setCommand('');
      // }
    } catch (error) {
      console.error('Error sending task:', error);
      toast.error('Error sending task');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdminUser) {
    return null; // Only show to admins
  }

  return (
    <div className="p-6 border-2 border-gold-500/30 rounded-xl bg-black/60 backdrop-blur-md leather-card">
      <h3 className="text-xl font-bold mb-4 text-gold-400 flex items-center gap-2">
        <span>🐝</span> Colony Worker Bee Control
      </h3>

      <div className="space-y-4">
        {/* Command Input */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-stone-300">
            Task Command
          </label>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="e.g., npm run build, task-netlify-refresh.sh, echo 'Hello Colony'"
            className="w-full px-4 py-2 bg-neutral-800 border border-gold-500/30 rounded-lg text-white placeholder-stone-500 focus:outline-none focus:border-gold-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !loading) {
                handleSendTask();
              }
            }}
          />
        </div>

        {/* Priority Selector */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-stone-300">
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="w-full px-4 py-2 bg-neutral-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {/* Send Button */}
        <button
          onClick={handleSendTask}
          disabled={loading || !command.trim()}
          className="w-full px-6 py-3 bg-gold-500 hover:bg-gold-600 disabled:bg-neutral-700 disabled:cursor-not-allowed text-black font-bold rounded-lg transition-colors"
        >
          {loading ? 'Sending...' : '🐝 Send Task to Worker Bee'}
        </button>

        {/* Recent Tasks */}
        {recentTasks.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gold-500/20">
            <h4 className="text-sm font-semibold mb-2 text-stone-400">Recent Tasks</h4>
            <div className="space-y-2">
              {recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 bg-neutral-800/50 rounded-lg text-xs font-mono"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gold-400">{task.id.substring(0, 8)}...</span>
                    <span
                      className={`px-2 py-1 rounded ${
                        task.status === 'done'
                          ? 'bg-green-500/20 text-green-400'
                          : task.status === 'error'
                          ? 'bg-red-500/20 text-red-400'
                          : task.status === 'running'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-neutral-500/20 text-neutral-400'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                  <div className="text-stone-400 truncate">{task.command}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

