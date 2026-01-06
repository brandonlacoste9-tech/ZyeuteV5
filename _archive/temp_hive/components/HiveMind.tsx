'use client'

import { useState } from 'react'
import { Sparkles, Wand2, Plus, Trash2 } from 'lucide-react'
import { estimateTask, polishTask } from '@/lib/gemini'

interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'in-progress' | 'done'
  estimate?: string
  priority: 'low' | 'medium' | 'high'
}

export default function HiveMind() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Implement 3D Neurosphere',
      description: 'Create interactive 3D visualization with Fibonacci sphere distribution',
      status: 'done',
      estimate: '8 hours',
      priority: 'high',
    },
    {
      id: '2',
      title: 'Integrate Gemini AI',
      description: 'Add AI-powered task estimation and polishing features',
      status: 'done',
      estimate: '4 hours',
      priority: 'high',
    },
    {
      id: '3',
      title: 'Build Kanban Board',
      description: 'Create drag-and-drop task management interface',
      status: 'in-progress',
      estimate: '6 hours',
      priority: 'medium',
    },
  ])

  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const addTask = () => {
    if (!newTaskTitle.trim()) return

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      description: newTaskDescription,
      status: 'todo',
      priority: 'medium',
    }

    setTasks([...tasks, newTask])
    setNewTaskTitle('')
    setNewTaskDescription('')
  }

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id))
  }

  const moveTask = (id: string, newStatus: Task['status']) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, status: newStatus } : task)))
  }

  const handleEstimate = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    setIsProcessing(true)
    setSelectedTask(taskId)

    try {
      const estimate = await estimateTask(task.title, task.description)
      setTasks(tasks.map((t) => (t.id === taskId ? { ...t, estimate } : t)))
    } catch (error) {
      console.error('Error estimating task:', error)
      alert('Failed to estimate task. Check your Gemini API key in .env.local')
    } finally {
      setIsProcessing(false)
      setSelectedTask(null)
    }
  }

  const handlePolish = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    setIsProcessing(true)
    setSelectedTask(taskId)

    try {
      const polished = await polishTask(task.title, task.description)
      setTasks(
        tasks.map((t) =>
          t.id === taskId
            ? { ...t, title: polished.title, description: polished.description }
            : t
        )
      )
    } catch (error) {
      console.error('Error polishing task:', error)
      alert('Failed to polish task. Check your Gemini API key in .env.local')
    } finally {
      setIsProcessing(false)
      setSelectedTask(null)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'low':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  const columns: { status: Task['status']; title: string; color: string }[] = [
    { status: 'todo', title: 'To Do', color: 'border-blue-500/30' },
    { status: 'in-progress', title: 'In Progress', color: 'border-yellow-500/30' },
    { status: 'done', title: 'Done', color: 'border-green-500/30' },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-yellow-900/50 to-orange-900/50 rounded-lg p-6 border border-yellow-500/30">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-8 h-8 text-yellow-400" />
          <div>
            <h2 className="text-2xl font-bold">Hive Mind - The Will</h2>
            <p className="text-sm text-gray-400">AI-Powered Kanban Board with Task Management</p>
          </div>
        </div>

        {/* Add New Task */}
        <div className="bg-black/30 rounded-lg p-4 border border-purple-500/20 mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Plus className="w-5 h-5 text-purple-400" />
            Add New Task
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Task title..."
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
            <textarea
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              placeholder="Task description..."
              rows={3}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
            />
            <button
              onClick={addTask}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
            >
              Add Task
            </button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((column) => (
            <div key={column.status} className={`bg-black/30 rounded-lg p-4 border ${column.color}`}>
              <h3 className="text-lg font-semibold mb-4 text-center">{column.title}</h3>
              <div className="space-y-3 min-h-[400px]">
                {tasks
                  .filter((task) => task.status === column.status)
                  .map((task) => (
                    <div
                      key={task.id}
                      className="bg-gray-900/70 rounded-lg p-4 border border-gray-700 hover:border-purple-500/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-white flex-1">{task.title}</h4>
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}></div>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">{task.description}</p>
                      
                      {task.estimate && (
                        <div className="text-xs text-purple-400 mb-3 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Estimate: {task.estimate}</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        {task.status !== 'todo' && (
                          <button
                            onClick={() => moveTask(task.id, 'todo')}
                            className="px-2 py-1 text-xs bg-blue-600/30 hover:bg-blue-600/50 rounded border border-blue-500/50 transition-colors"
                          >
                            ← To Do
                          </button>
                        )}
                        {task.status !== 'in-progress' && (
                          <button
                            onClick={() => moveTask(task.id, 'in-progress')}
                            className="px-2 py-1 text-xs bg-yellow-600/30 hover:bg-yellow-600/50 rounded border border-yellow-500/50 transition-colors"
                          >
                            In Progress
                          </button>
                        )}
                        {task.status !== 'done' && (
                          <button
                            onClick={() => moveTask(task.id, 'done')}
                            className="px-2 py-1 text-xs bg-green-600/30 hover:bg-green-600/50 rounded border border-green-500/50 transition-colors"
                          >
                            Done ✓
                          </button>
                        )}
                        <button
                          onClick={() => handleEstimate(task.id)}
                          disabled={isProcessing && selectedTask === task.id}
                          className="px-2 py-1 text-xs bg-purple-600/30 hover:bg-purple-600/50 rounded border border-purple-500/50 transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          {isProcessing && selectedTask === task.id ? 'Estimating...' : 'Estimate'}
                        </button>
                        <button
                          onClick={() => handlePolish(task.id)}
                          disabled={isProcessing && selectedTask === task.id}
                          className="px-2 py-1 text-xs bg-pink-600/30 hover:bg-pink-600/50 rounded border border-pink-500/50 transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          <Wand2 className="w-3 h-3" />
                          {isProcessing && selectedTask === task.id ? 'Polishing...' : 'Polish'}
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="px-2 py-1 text-xs bg-red-600/30 hover:bg-red-600/50 rounded border border-red-500/50 transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-500/20">
          <p className="text-sm text-gray-400 mb-1">Total Tasks</p>
          <p className="text-2xl font-bold text-purple-300">{tasks.length}</p>
        </div>
        <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-500/20">
          <p className="text-sm text-gray-400 mb-1">To Do</p>
          <p className="text-2xl font-bold text-blue-300">{tasks.filter((t) => t.status === 'todo').length}</p>
        </div>
        <div className="bg-yellow-900/30 rounded-lg p-4 border border-yellow-500/20">
          <p className="text-sm text-gray-400 mb-1">In Progress</p>
          <p className="text-2xl font-bold text-yellow-300">{tasks.filter((t) => t.status === 'in-progress').length}</p>
        </div>
        <div className="bg-green-900/30 rounded-lg p-4 border border-green-500/20">
          <p className="text-sm text-gray-400 mb-1">Completed</p>
          <p className="text-2xl font-bold text-green-300">{tasks.filter((t) => t.status === 'done').length}</p>
        </div>
      </div>
    </div>
  )
}
