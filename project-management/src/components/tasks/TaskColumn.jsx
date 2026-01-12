import React from 'react';
import { Clock, PlayCircle, AlertCircle, CheckCircle } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { TASK_STATUS } from '../../utils/constants';

export const TaskColumn = ({
  status,
  tasks = [],
  onTaskClick,
  viewers = {},
  editors = {}
}) => {
  const config = {
    [TASK_STATUS.TODO]: {
      title: 'To Do',
      icon: Clock,
      color: 'text-gray-600'
    },
    [TASK_STATUS.IN_PROGRESS]: {
      title: 'In Progress',
      icon: PlayCircle,
      color: 'text-blue-600'
    },
    [TASK_STATUS.REVIEW]: {
      title: 'Review',
      icon: AlertCircle,
      color: 'text-yellow-600'
    },
    [TASK_STATUS.DONE]: {
      title: 'Done',
      icon: CheckCircle,
      color: 'text-green-600'
    }
  };

  const columnConfig = config[status];

  // SAFETY GUARD
  if (!columnConfig) return null;

  const { title, icon: Icon, color } = columnConfig;

  return (
    <div className="bg-gray-50 rounded-lg p-4 min-h-[500px]">
      <div className={`flex items-center gap-2 mb-4 ${color}`}>
        <Icon size={20} />
        <h3 className="font-semibold">{title}</h3>
        <span className="text-sm">({tasks.length})</span>
      </div>

      <div className="space-y-3">
        {tasks.map(task => (
          <TaskCard
            key={task._id}
            task={task}
            onClick={() => onTaskClick(task._id)}
            viewers={viewers[task._id] || []}
            editors={editors[task._id] || []}
          />
        ))}
      </div>
    </div>
  );
};
