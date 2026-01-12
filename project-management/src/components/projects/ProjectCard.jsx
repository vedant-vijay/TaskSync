// ============================================
// src/components/projects/ProjectCard.jsx
// ============================================
import React from 'react';
import { Users } from 'lucide-react';

export const ProjectCard = ({ project, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition transform hover:-translate-y-1"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-xl font-semibold text-gray-900">
          {project.name}
        </h3>
        {project.isLeader && (
          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-medium">
            Leader
          </span>
        )}
      </div>
      <p className="text-gray-600 mb-4 line-clamp-2">
        {project.description || 'No description'}
      </p>
      <div className="flex items-center text-sm text-gray-500">
        <Users size={16} className="mr-1" />
        <span>{project.memberCount || 0} members</span>
      </div>
    </div>
  );
};

