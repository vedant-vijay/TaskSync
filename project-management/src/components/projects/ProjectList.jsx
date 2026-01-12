import React from 'react';
import { ProjectCard } from './ProjectCard';
import { LoadingSpinner } from '../common/LoadingSpinner';

export const ProjectList = ({ projects, loading, onProjectClick }) => {
  if (loading) {
    return <LoadingSpinner size="lg" className="py-12" />;
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">No projects yet</p>
        <p className="text-gray-500 text-sm mt-2">
          Create a project to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => {
        const projectId = project._id || project.id;

        return (
          <ProjectCard
            key={projectId}
            project={project}
            onClick={() => onProjectClick(projectId)}
          />
        );
      })}

    </div>
  );
};