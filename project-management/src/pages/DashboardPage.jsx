import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Header } from '../components/common/Header';
import { ProjectList } from '../components/projects/ProjectList';
import { CreateProjectModal } from '../components/projects/CreateProjectModal';
import { useProjects } from '../hooks/useProjects';
import { useAuth } from '../hooks/useAuth';
import { USER_ROLE } from '../utils/constants';

export const DashboardPage = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { projects, loading: projectsLoading, refetch, error } = useProjects();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // ✅ EXTENSIVE DEBUGGING
  console.log('🏠 Dashboard Render');
  console.log('🏠 Dashboard - Auth Loading:', authLoading);
  console.log('🏠 Dashboard - Projects Loading:', projectsLoading);
  console.log('🏠 Dashboard - User:', user);
  console.log('🏠 Dashboard - Projects:', projects);
  console.log('🏠 Dashboard - Projects Length:', projects?.length);
  console.log('🏠 Dashboard - Error:', error);

  const handleProjectClick = (projectId) => {
    console.log('🎯 Project clicked - ID:', projectId);
    navigate(`/projects/${projectId}`);
  };

  const handleCreateSuccess = () => {
    console.log('✅ Project created, refetching...');
    refetch();
  };

  // ✅ Show loading for auth
  if (authLoading) {
    console.log('⏳ Showing auth loading...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading user...</p>
      </div>
    );
  }

  // ✅ Show error if exists
  if (error) {
    console.error('❌ Dashboard error:', error);
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

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* ✅ Leader-only Create Project button */}
        {user?.role?.trim().toUpperCase() === USER_ROLE.LEADER && (
          <button
            onClick={() => {
              console.log('➕ Opening create project modal');
              setShowCreateModal(true);
            }}
            className="mb-6 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-md"
          >
            <Plus size={20} />
            Create Project
          </button>
        )}

        {/* Project list */}
        <ProjectList
          projects={projects}
          loading={projectsLoading}
          onProjectClick={handleProjectClick}
        />
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => {
            console.log('❌ Closing create project modal');
            setShowCreateModal(false);
          }}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
};