import React, { useState, useEffect } from 'react';
import { X, Eye, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { TASK_STATUS, WS_EVENTS } from '../../utils/constants';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAuth } from '../../hooks/useAuth';

export const TaskDetailModal = ({ task, onClose, projectId, members = [], isLeader }) => {
  const [comment, setComment] = useState('');
  const [localTask, setLocalTask] = useState(task);
  const [viewers, setViewers] = useState([]);
  const [editors, setEditors] = useState([]);
  const { send, subscribe } = useWebSocket();
  const { user } = useAuth();

  const taskId = task._id || task.id;
  const userId = user?._id || user?.id;

  useEffect(() => {
    setLocalTask(task);
  }, [task]);

  useEffect(() => {
    if (!taskId) {
      console.error('❌ TaskDetailModal: No task ID found!', task);
      return;
    }

    console.log('👁️ Starting to view task:', taskId);
    send(WS_EVENTS.START_VIEWING_TASK, { taskId, projectId });

    const unsubscribers = [
      subscribe(WS_EVENTS.TASK_VIEWER_JOINED, (payload) => {
        if (payload.taskId === taskId) {
          setViewers(prev => {
            const viewerUserId = payload.user._id || payload.user.id;
            const filtered = prev.filter(u => (u._id || u.id) !== viewerUserId);
            return [...filtered, payload.user];
          });
        }
      }),

      subscribe(WS_EVENTS.TASK_VIEWER_LEFT, (payload) => {
        if (payload.taskId === taskId) {
          setViewers(prev => prev.filter(u => (u._id || u.id) !== payload.userId));
        }
      }),

      subscribe(WS_EVENTS.TASK_EDITOR_JOINED, (payload) => {
        if (payload.taskId === taskId) {
          setEditors(prev => {
            const editorUserId = payload.user._id || payload.user.id;
            const filtered = prev.filter(u => (u._id || u.id) !== editorUserId);
            return [...filtered, payload.user];
          });
        }
      }),

      subscribe(WS_EVENTS.TASK_EDITOR_LEFT, (payload) => {
        if (payload.taskId === taskId) {
          setEditors(prev => prev.filter(u => (u._id || u.id) !== payload.userId));
        }
      }),

      subscribe(WS_EVENTS.TASK_COMMENT_ADDED, (payload) => {
        if (payload.taskId === taskId) {
          setLocalTask(prev => ({
            ...prev,
            comments: [...(prev.comments || []), payload.comment]
          }));
        }
      }),

      subscribe(WS_EVENTS.TASK_STATUS_UPDATED, (payload) => {
        if (payload.taskId === taskId) {
          setLocalTask(prev => ({ ...prev, status: payload.status }));
        }
      }),

      subscribe(WS_EVENTS.TASK_ASSIGNED, (payload) => {
        if (payload.taskId === taskId) {
          setLocalTask(prev => ({ ...prev, assignedTo: payload.assignedTo }));
        }
      })
    ];

    return () => {
      console.log('🚪 Stopping viewing task:', taskId);
      send(WS_EVENTS.STOP_VIEWING_TASK, { taskId, projectId });
      unsubscribers.forEach(unsub => unsub());
    };
  }, [taskId, projectId, send, subscribe]);

  const handleAddComment = (e) => {
    e.preventDefault();
    if (comment.trim()) {
      send(WS_EVENTS.ADD_COMMENT, {
        taskId,
        text: comment,
        projectId
      });
      setComment('');
    }
  };

  const handleStatusChange = (newStatus) => {
    send(WS_EVENTS.UPDATE_TASK_STATUS, {
      taskId,
      status: newStatus,
      projectId
    });
  };

  const handleAssign = (assignedUserId) => {
    if (!isLeader) {
      console.warn('❌ Only leaders can assign tasks');
      return;
    }
    // ✅ Convert empty string to null
    const userId = assignedUserId && assignedUserId.trim() !== '' ? assignedUserId : null;
    
    console.log('👥 Assigning task to:', userId);
    
    send(WS_EVENTS.ASSIGN_TASK, {
      taskId,
      assignedTo: userId,
      projectId
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {localTask.title}
              </h2>
              <p className="text-gray-600">{localTask.description}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 ml-4"
            >
              <X size={24} />
            </button>
          </div>

          {(viewers.length > 0 || editors.length > 0) && (
            <div className="mt-4 space-y-2">
              {viewers.filter(v => (v._id || v.id) !== userId).length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Eye size={16} />
                  <span>
                    Viewing: {viewers.filter(v => (v._id || v.id) !== userId).map(v => v.name).join(', ')}
                  </span>
                </div>
              )}
              {editors.filter(e => (e._id || e.id) !== userId).length > 0 && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Edit size={16} />
                  <span>
                    Editing: {editors.filter(e => (e._id || e.id) !== userId).map(e => e.name).join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={localTask.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={TASK_STATUS.TODO}>To Do</option>
                <option value={TASK_STATUS.IN_PROGRESS}>In Progress</option>
                <option value={TASK_STATUS.REVIEW}>Review</option>
                <option value={TASK_STATUS.DONE}>Done</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigned To
              </label>
              <select
                value={
                  typeof localTask.assignedTo === 'string' 
                    ? localTask.assignedTo 
                    : (localTask.assignedTo?._id || localTask.assignedTo?.id || '')
                }
                onChange={(e) => handleAssign(e.target.value)}
                disabled={!isLeader} // ✅ Disable for non-leaders
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Unassigned</option>
                {members.map(member => {
                  const memberId = member._id || member.id || member.userId;
                  return (
                    <option key={memberId} value={memberId}>
                      {member.name}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Comments</h3>
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {(localTask.comments || []).map((comment, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{comment.user?.name || 'Unknown'}</span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  <p className="text-gray-700">{comment.text}</p>
                </div>
              ))}
              {(!localTask.comments || localTask.comments.length === 0) && (
                <p className="text-gray-500 text-sm">No comments yet</p>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    handleAddComment(e);
                  }
                }}
                placeholder="Add a comment..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleAddComment}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};