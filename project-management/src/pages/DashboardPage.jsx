
// ============================================
// FILE 2: DashboardPage.jsx
// ============================================
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Header } from '../components/common/Header';
import { ProjectList } from '../components/projects/ProjectList';
import { CreateProjectModal } from '../components/projects/CreateProjectModal';
import { useProjects } from '../hooks/useProjects';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import { USER_ROLE } from '../utils/constants';

export const DashboardPage = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { projects, loading: projectsLoading, refetch, error } = useProjects();
  const { user, loading: authLoading } = useAuth();
  const { connected, authenticated } = useWebSocket();
  const navigate = useNavigate();

  const handleProjectClick = (projectId) => {
    console.log('🎯 Project clicked - ID:', projectId);
    console.log('🔍 WebSocket status:', { connected, authenticated });
    
    // ✅ Don't navigate if WebSocket not ready
    if (!connected || !authenticated) {
      console.warn('⚠️ WebSocket not ready yet, please wait...');
      return;
    }
    
    navigate(`/projects/${projectId}`);
  };

  const handleCreateSuccess = () => {
    console.log('✅ Project created, refetching...');
    refetch();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading user...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-2">Error loading projects</p>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={refetch}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="My Projects" />
      
      {/* ✅ WebSocket Status Banner */}
      {(!connected || !authenticated) && (
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
            <div className="animate-spin h-5 w-5 border-2 border-yellow-600 border-t-transparent rounded-full"></div>
            <div>
              <p className="text-yellow-800 font-medium">
                {!connected ? 'Connecting to server...' : 'Authenticating...'}
              </p>
              <p className="text-yellow-600 text-sm">
                Please wait a moment before accessing projects
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8">
        {user?.role?.trim().toUpperCase() === USER_ROLE.LEADER && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="mb-6 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-md"
          >
            <Plus size={20} />
            Create Project
          </button>
        )}

        <ProjectList
          projects={projects}
          loading={projectsLoading}
          onProjectClick={handleProjectClick}
        />
      </main>

      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
};

