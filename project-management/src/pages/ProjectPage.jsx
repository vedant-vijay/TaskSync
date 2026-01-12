import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, UserPlus } from 'lucide-react';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';
import { TaskBoard } from '../components/tasks/TaskBoard';
import { TaskDetailModal } from '../components/tasks/TaskDetailModal';
import { CreateTaskModal } from '../components/tasks/CreateTaskModal';
import { AddMemberModal } from '../components/projects/AddMemberModal';
import { ToastContainer } from '../components/common/Toast';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useWebSocket } from '../hooks/useWebSocket';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { WS_EVENTS } from '../utils/constants';

export const ProjectPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [viewers, setViewers] = useState({});
  const [editors, setEditors] = useState({});
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const { send, subscribe, connected } = useWebSocket();
  const { toasts, addToast, removeToast } = useToast();
  const { user } = useAuth();

  // Check if current user is a leader
  const isLeader = project && user && (project.leaderId === (user._id || user.id));

  useEffect(() => {
    if (connected && projectId) {
      console.log('🔌 Connected to WebSocket, joining project:', projectId);
      send(WS_EVENTS.JOIN_PROJECT, { projectId });

      const unsubscribers = [
        subscribe(WS_EVENTS.PROJECT_JOINED, (payload) => {
          console.log('✅ Project joined:', payload);
          setProject(payload.project);
          setTasks(payload.tasks || []);
          setMembers(payload.members || []);
          setOnlineUsers(payload.onlineUsers || []);
          setLoading(false);
        }),

        subscribe(WS_EVENTS.USER_CONNECTED, (payload) => {
          console.log('👤 User connected:', payload.user);
          setOnlineUsers(prev => {
            const userId = payload.user._id || payload.user.id;
            const filtered = prev.filter(u => (u._id || u.id) !== userId);
            return [...filtered, payload.user];
          });
          addToast(`${payload.user.name} joined the project`, 'info');
        }),

        subscribe(WS_EVENTS.USER_DISCONNECTED, (payload) => {
          console.log('👋 User disconnected:', payload.userId);
          setOnlineUsers(prev => prev.filter(u => (u._id || u.id) !== payload.userId));
        }),

        subscribe(WS_EVENTS.TASK_CREATED, (payload) => {
          console.log('🎯 Task created:', payload.task);
          setTasks(prev => [...prev, payload.task]);
          addToast('New task created', 'success');
        }),

        subscribe(WS_EVENTS.TASK_STATUS_UPDATED, (payload) => {
          console.log('📊 Task status updated:', payload);
          setTasks(prev => prev.map(t => {
            const taskId = t._id || t.id;
            return taskId === payload.taskId ? { ...t, status: payload.status } : t;
          }));
        }),

        subscribe(WS_EVENTS.TASK_ASSIGNED, (payload) => {
          console.log('👥 Task assigned:', payload);
          setTasks(prev => prev.map(t => {
            const taskId = t._id || t.id;
            return taskId === payload.taskId ? { ...t, assignedTo: payload.assignedTo } : t;
          }));
        }),

        subscribe(WS_EVENTS.TASK_COMMENT_ADDED, (payload) => {
          console.log('💬 Comment added:', payload);
          setTasks(prev => prev.map(t => {
            const taskId = t._id || t.id;
            return taskId === payload.taskId
              ? { ...t, commentCount: (t.commentCount || 0) + 1 }
              : t;
          }));
        }),

        subscribe(WS_EVENTS.TASK_VIEWER_JOINED, (payload) => {
          console.log('👁️ Viewer joined:', payload);
          setViewers(prev => ({
            ...prev,
            [payload.taskId]: [
              ...(prev[payload.taskId] || []).filter(u => (u._id || u.id) !== (payload.user._id || payload.user.id)),
              payload.user
            ]
          }));
        }),

        subscribe(WS_EVENTS.TASK_VIEWER_LEFT, (payload) => {
          console.log('👁️ Viewer left:', payload);
          setViewers(prev => ({
            ...prev,
            [payload.taskId]: (prev[payload.taskId] || []).filter(u => (u._id || u.id) !== payload.userId)
          }));
        }),

        subscribe(WS_EVENTS.TASK_EDITOR_JOINED, (payload) => {
          console.log('✏️ Editor joined:', payload);
          setEditors(prev => ({
            ...prev,
            [payload.taskId]: [
              ...(prev[payload.taskId] || []).filter(u => (u._id || u.id) !== (payload.user._id || payload.user.id)),
              payload.user
            ]
          }));
        }),

        subscribe(WS_EVENTS.TASK_EDITOR_LEFT, (payload) => {
          console.log('✏️ Editor left:', payload);
          setEditors(prev => ({
            ...prev,
            [payload.taskId]: (prev[payload.taskId] || []).filter(u => (u._id || u.id) !== payload.userId)
          }));
        }),

        subscribe(WS_EVENTS.ERROR, (payload) => {
          console.error('❌ WebSocket error:', payload);
          addToast(payload.message || 'An error occurred', 'error');
        })
      ];

      return () => {
        console.log('🚪 Leaving project:', projectId);
        send(WS_EVENTS.LEAVE_PROJECT, { projectId });
        unsubscribers.forEach(unsub => unsub());
      };
    }
  }, [connected, projectId, send, subscribe, addToast]);

  const selectedTask = selectedTaskId 
    ? tasks.find(t => (t._id || t.id) === selectedTaskId) 
    : null;

  const handleMemberAdded = () => {
    addToast('Member added successfully', 'success');
    // Re-join project to get updated member list
    send(WS_EVENTS.LEAVE_PROJECT, { projectId });
    setTimeout(() => {
      send(WS_EVENTS.JOIN_PROJECT, { projectId });
    }, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-2">Connecting to server...</p>
          <LoadingSpinner size="md" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <Header
        title={project?.name || 'Project'}
        showBack
        onBack={() => navigate('/dashboard')}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {project?.description && (
          <p className="text-gray-600 mb-6">{project.description}</p>
        )}

        <div className="flex gap-6">
          <Sidebar members={members} onlineUsers={onlineUsers} />

          <main className="flex-1">
            <div className="mb-4 flex gap-3">
              <button
                onClick={() => setShowCreateTask(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-md"
              >
                <Plus size={20} />
                Create Task
              </button>

              {/* ✅ Add Member button - Only for leaders */}
              {isLeader && (
                <button
                  onClick={() => setShowAddMember(true)}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition shadow-md"
                >
                  <UserPlus size={20} />
                  Add Member
                </button>
              )}
            </div>

            <TaskBoard
              tasks={tasks}
              onTaskClick={setSelectedTaskId}
              viewers={viewers}
              editors={editors}
            />
          </main>
        </div>
      </div>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTaskId(null)}
          projectId={projectId}
          members={members}
          isLeader={isLeader} // ✅ Pass isLeader prop
        />
      )}

      {showCreateTask && (
        <CreateTaskModal
          onClose={() => setShowCreateTask(false)}
          projectId={projectId}
          members={members}
          onSuccess={() => {
            console.log('✅ Task creation acknowledged');
          }}
        />
      )}

      {showAddMember && (
        <AddMemberModal
          projectId={projectId}
          existingMembers={members}
          onClose={() => setShowAddMember(false)}
          onSuccess={handleMemberAdded}
        />
      )}
    </div>
  );
};