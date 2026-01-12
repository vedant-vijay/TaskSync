import React, { useState } from 'react';
import { X } from 'lucide-react';
import { TASK_STATUS, WS_EVENTS } from '../../utils/constants';
import { useWebSocket } from '../../hooks/useWebSocket';

export const CreateTaskModal = ({ onClose, projectId, members = [], onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    status: TASK_STATUS.TODO
  });
  const [loading, setLoading] = useState(false);
  const { send } = useWebSocket();

  console.log('📋 CreateTaskModal - Members received:', members);
  console.log('📋 CreateTaskModal - Members count:', members.length);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const taskData = {
        projectId,
        title: formData.title,
        description: formData.description,
        status: formData.status
      };

      // Only add assignedTo if it has a valid value
      if (formData.assignedTo && formData.assignedTo.trim() !== '') {
        taskData.assignedTo = formData.assignedTo;
      }

      console.log('📤 Creating task with data:', taskData);
      send(WS_EVENTS.CREATE_TASK, taskData);

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        onClose();
      }, 100);
    } catch (error) {
      console.error('Error creating task:', error);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Create New Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              autoFocus
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the task..."
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign To {members.length === 0 && <span className="text-red-500">(No members available)</span>}
            </label>
            <select
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="">Unassigned</option>
              {members.map(member => {
                // Support multiple ID formats
                const memberId = member._id || member.id || member.userId;
                const memberName = member.name || member.userName || 'Unknown';
                
                console.log('👤 Member option:', { memberId, memberName, fullMember: member });
                
                if (!memberId) {
                  console.error('❌ Member has no valid ID:', member);
                  return null;
                }
                
                return (
                  <option key={memberId} value={memberId}>
                    {memberName}
                  </option>
                );
              })}
            </select>
            {members.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                Add members to the project first to assign tasks
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value={TASK_STATUS.TODO}>To Do</option>
              <option value={TASK_STATUS.IN_PROGRESS}>In Progress</option>
              <option value={TASK_STATUS.REVIEW}>Review</option>
              <option value={TASK_STATUS.DONE}>Done</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !formData.title.trim()}
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
