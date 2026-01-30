
// ============================================
// FILE 3: ProjectPage.jsx (Already looks good, minor improvements)
// ============================================
import React, { useState, useEffect, useRef } from 'react';
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
  const { send, subscribe, connected, authenticated } = useWebSocket();
  const { toasts, addToast, removeToast } = useToast();
  const { user } = useAuth();
  
  const hasJoinedRef = useRef(false);

  const isLeader = project && user && (project.leaderId === (user._id || user.id));

  useEffect(() => {
    console.log('🔄 ProjectPage effect:', { connected, authenticated, projectId, hasJoined: hasJoinedRef.current });

    if (!connected || !authenticated) {
      console.log('⏳ Waiting for WebSocket...');
      return;
    }

    if (projectId && !hasJoinedRef.current) {
      console.log('✅ Joining project');
      hasJoinedRef.current = true;

      const unsubscribers = [
        subscribe(WS_EVENTS.PROJECT_JOINED, (payload) => {
          console.log('✅ Project joined');
          setProject(payload.project);
          setTasks(payload.tasks || []);
          setMembers(payload.members || []);
          setOnlineUsers(payload.onlineUsers || []);
          setLoading(false);
        }),

        subscribe(WS_EVENTS.USER_CONNECTED, (payload) => {
          setOnlineUsers(prev => {
            const userId = payload.user._id || payload.user.id;
            const filtered = prev.filter(u => (u._id || u.id) !== userId);
            return [...filtered, payload.user];
          });
          addToast(`${payload.user.name} joined`, 'info');
        }),

        subscribe(WS_EVENTS.USER_DISCONNECTED, (payload) => {
          setOnlineUsers(prev => prev.filter(u => (u._id || u.id) !== payload.userId));
        }),

        subscribe(WS_EVENTS.TASK_CREATED, (payload) => {
          setTasks(prev => [...prev, payload.task]);
          addToast('New task created', 'success');
        }),

        subscribe(WS_EVENTS.TASK_STATUS_UPDATED, (payload) => {
          setTasks(prev => prev.map(t => {
            const taskId = t._id || t.id;
            return taskId === payload.taskId ? { ...t, status: payload.status } : t;
          }));
        }),

        subscribe(WS_EVENTS.TASK_ASSIGNED, (payload) => {
          setTasks(prev => prev.map(t => {
            const taskId = t._id || t.id;
            return taskId === payload.taskId ? { ...t, assignedTo: payload.assignedTo } : t;
          }));
        }),

        subscribe(WS_EVENTS.TASK_COMMENT_ADDED, (payload) => {
          setTasks(prev => prev.map(t => {
            const taskId = t._id || t.id;
            if (taskId === payload.taskId) {
              return { 
                ...t, 
                comments: [...(t.comments || []), payload.comment],
                commentCount: (t.commentCount || 0) + 1 
              };
            }
            return t;
          }));
        }),

        subscribe(WS_EVENTS.TASK_VIEWER_JOINED, (payload) => {
          setViewers(prev => ({
            ...prev,
            [payload.taskId]: [
              ...(prev[payload.taskId] || []).filter(u => (u._id || u.id) !== (payload.user._id || payload.user.id)),
              payload.user
            ]
          }));
        }),

        subscribe(WS_EVENTS.TASK_VIEWER_LEFT, (payload) => {
          setViewers(prev => ({
            ...prev,
            [payload.taskId]: (prev[payload.taskId] || []).filter(u => (u._id || u.id) !== payload.userId)
          }));
        }),

        subscribe(WS_EVENTS.TASK_EDITOR_JOINED, (payload) => {
          setEditors(prev => ({
            ...prev,
            [payload.taskId]: [
              ...(prev[payload.taskId] || []).filter(u => (u._id || u.id) !== (payload.user._id || payload.user.id)),
              payload.user
            ]
          }));
        }),

        subscribe(WS_EVENTS.TASK_EDITOR_LEFT, (payload) => {
          setEditors(prev => ({
            ...prev,
            [payload.taskId]: (prev[payload.taskId] || []).filter(u => (u._id || u.id) !== payload.userId)
          }));
        }),

        subscribe(WS_EVENTS.ERROR, (payload) => {
          console.error('❌ WebSocket error:', payload);
          setLoading(false);
          
          if (payload.message?.toLowerCase().includes('not a member')) {
            addToast('You are not a member of this project', 'error');
            setTimeout(() => navigate('/dashboard'), 2000);
            return;
          }
          
          addToast(payload.message || 'An error occurred', 'error');
        })
      ];

      // ✅ Send JOIN_PROJECT after all subscribers are set up
      send(WS_EVENTS.JOIN_PROJECT, { projectId });

      return () => {
        console.log('🧹 Cleanup');
        hasJoinedRef.current = false;
        send(WS_EVENTS.LEAVE_PROJECT, { projectId });
        unsubscribers.forEach(unsub => unsub());
      };
    }
  }, [connected, authenticated, projectId, send, subscribe, navigate, addToast]);

  const selectedTask = selectedTaskId 
    ? tasks.find(t => (t._id || t.id) === selectedTaskId) 
    : null;

  const handleMemberAdded = () => {
    addToast('Member added successfully', 'success');
    send(WS_EVENTS.LEAVE_PROJECT, { projectId });
    hasJoinedRef.current = false;
    setTimeout(() => {
      send(WS_EVENTS.JOIN_PROJECT, { projectId });
      hasJoinedRef.current = true;
    }, 100);
  };

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="md" />
          <p className="text-gray-600 mt-2">Connecting to server...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="md" />
          <p className="text-gray-600 mt-2">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 mt-4">Loading project...</p>
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
          isLeader={isLeader}
        />
      )}

      {showCreateTask && (
        <CreateTaskModal
          onClose={() => setShowCreateTask(false)}
          projectId={projectId}
          members={members}
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