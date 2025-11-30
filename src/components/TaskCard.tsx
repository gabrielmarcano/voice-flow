import { Calendar, Check, Loader2 } from 'lucide-react';
import type { Task } from '../types';
import { clsx } from 'clsx';

export function TaskCard({ task }: { task: Task }) {
  const dateDisplay = task.event_date 
    ? new Date(task.event_date).toLocaleString(undefined, { 
        dateStyle: 'medium', 
        timeStyle: 'short' 
      })
    : 'Pending date...';

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition duration-200">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-gray-800">
            {task.title || "Processing..."}
          </h3>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {dateDisplay}
          </p>
        </div>
        <div className={clsx(
          "px-2 py-1 rounded text-xs font-medium flex items-center gap-1",
          task.status === 'synced' && "bg-green-100 text-green-700",
          task.status === 'processing' && "bg-indigo-100 text-indigo-700",
          task.status === 'failed' && "bg-red-100 text-red-700"
        )}>
          {task.status === 'processing' && <Loader2 className="w-3 h-3 animate-spin" />}
          {task.status === 'synced' && <Check className="w-3 h-3" />}
          {task.status.toUpperCase()}
        </div>
      </div>
      {task.transcription && (
        <div className="mt-3 text-xs text-gray-400 bg-gray-50 p-2 rounded border border-gray-100 italic">
          "{task.transcription}"
        </div>
      )}
    </div>
  );
}