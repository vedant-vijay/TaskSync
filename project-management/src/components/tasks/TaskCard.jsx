import React from 'react';
import { User, MessageSquare, Eye, Edit } from 'lucide-react';
import { TASK_STATUS } from '../../utils/constants';

export const TaskCard = ({ task, onClick, viewers = [], editors = [] }) => {
  console.log('🎯 TaskCard render:', task);
  
  const statusColors = {
    [TASK_STATUS.TODO]: 'border-gray-300',
    [TASK_STATUS.IN_PROGRESS]: 'border-blue-400',
    [TASK_STATUS.REVIEW]: 'border-yellow-400',
    [TASK_STATUS.DONE]: 'border-green-400'
  };

  if (!task) {
    console.error('❌ TaskCard: No task provided');
    return null;
  }

  const handleClick = () => {
    // ✅ Support both _id and id (backend inconsistency)
    const taskId = task._id || task.id;
    console.log('🖱️ TaskCard clicked - Task ID:', taskId);
    console.log('🖱️ TaskCard clicked - Task:', task);
    
    if (onClick && taskId) {
      onClick(taskId);
    } else {
      console.error('❌ No task ID found!', task);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition border-l-4 ${statusColors[task.status] || 'border-gray-300'}`}
    >
      <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
        {task.title}
      </h4>
      
      {task.assignedTo && (
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <User size={14} className="mr-1" />
          <span className="truncate">{task.assignedTo.name}</span>
        </div>
      )}
      
      <div className="flex items-center gap-3 text-sm text-gray-500">
        {task.commentCount > 0 && (
          <span className="flex items-center">
            <MessageSquare size={14} className="mr-1" />
            {task.commentCount}
          </span>
        )}
        {viewers.length > 0 && (
          <span className="flex items-center">
            <Eye size={14} className="mr-1" />
            {viewers.length}
          </span>
        )}
        {editors.length > 0 && (
          <span className="flex items-center text-blue-600">
            <Edit size={14} className="mr-1" />
            {editors.length}
          </span>
        )}
      </div>
    </div>
  );
};