import React from 'react';
import { TaskColumn } from './TaskColumn';
import { TASK_STATUS } from '../../utils/constants';

export const TaskBoard = ({ tasks = [], onTaskClick, viewers = {}, editors = {} }) => {
  // ✅ Changed viewers and editors default from [] to {}
  
  if (!Array.isArray(tasks)) {
    console.warn('TaskBoard: tasks is not an array', tasks);
    return null;
  }

  const tasksByStatus = {
    [TASK_STATUS.TODO]: tasks.filter(t => t.status === TASK_STATUS.TODO),
    [TASK_STATUS.IN_PROGRESS]: tasks.filter(t => t.status === TASK_STATUS.IN_PROGRESS),
    [TASK_STATUS.REVIEW]: tasks.filter(t => t.status === TASK_STATUS.REVIEW),
    [TASK_STATUS.DONE]: tasks.filter(t => t.status === TASK_STATUS.DONE)
  };

  const STATUSES = [
    TASK_STATUS.TODO,
    TASK_STATUS.IN_PROGRESS,
    TASK_STATUS.REVIEW,
    TASK_STATUS.DONE
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {STATUSES.map(status => (
        <TaskColumn
          key={status}
          status={status}
          tasks={tasksByStatus[status]}
          onTaskClick={onTaskClick}
          viewers={viewers}
          editors={editors}
        />
      ))}
    </div>
  );
}