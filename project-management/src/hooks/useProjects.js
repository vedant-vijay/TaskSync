import { useState, useEffect } from 'react';
import { projectService } from '../services/projectService';

export const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);

      const response = await projectService.getProjects();

      // ✅ GUARANTEE ARRAY
      const projectsArray = Array.isArray(response)
        ? response
        : response?.projects || response?.data || [];

      setProjects(projectsArray);
      setError(null);
    } catch (err) {
      console.error('Fetch projects failed:', err);
      setError(err.message);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return { projects, loading, error, refetch: fetchProjects };
};
