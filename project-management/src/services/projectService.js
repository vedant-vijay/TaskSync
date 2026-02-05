import api from './api';

export const projectService = {

  async getProjects() {
    console.log('🔍 projectService.getProjects() called');
    try {
      const response = await api.get('/projects');
      console.log('✅ getProjects response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getProjects error:', error);
      throw error;
    }
  },

  async getAll() {
    try {
      const response = await api.get('/projects');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch projects');
    }
  },

  async getProject(id) {
    console.log('🔍 projectService.getProject() called with id:', id);
    try {
      const response = await api.get(`/projects/${id}`);
      console.log('✅ getProject response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getProject error:', error);
      throw error;
    }
  },

  async getById(projectId) {
    try {
      const response = await api.get(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch project');
    }
  },

  async createProject(name, description) {
    console.log('➕ projectService.createProject() called:', { name, description });
    try {
      const response = await api.post('/projects', { name, description });
      console.log('✅ createProject response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ createProject error:', error);
      throw error;
    }
  },

  async create(projectData) {
    try {
      const response = await api.post('/projects', projectData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to create project');
    }
  },

  async update(projectId, updates) {
    try {
      const response = await api.put(`/projects/${projectId}`, updates);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update project');
    }
  },

  async delete(projectId) {
    try {
      const response = await api.delete(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to delete project');
    }
  },

  async addMember(projectId, userId, role = 'MEMBER') {
    console.log('👥 projectService.addMember() called:', { projectId, userId, role });
    try {
      const response = await api.post(`/projects/${projectId}/members`, {
        userId,
        role
      });
      console.log('✅ addMember response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ addMember error:', error);
      throw error;
    }
  },

  async getMembers(projectId) {
    try {
      const response = await api.get(`/projects/${projectId}/members`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch members');
    }
  },

  async removeMember(projectId, userId) {
    try {
      const response = await api.delete(`/projects/${projectId}/members/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to remove member');
    }
  },

  async updateMemberRole(projectId, userId, role) {
    try {
      const response = await api.put(`/projects/${projectId}/members/${userId}`, {
        role
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update member role');
    }
  }
};
