import api from './api';

export const projectService = {
  /**
   * Get all projects for current user (alias for getAll)
   * @returns {Promise<Object>} Response with projects
   */
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

  /**
   * Get all projects for current user
   * @returns {Promise<Array>} Array of projects
   */
  async getAll() {
    try {
      const response = await api.get('/projects');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch projects');
    }
  },

  /**
   * Get project by ID (alias for getById)
   * @param {string} id - Project ID
   * @returns {Promise<Object>} Project object
   */
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

  /**
   * Get project by ID
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Project object
   */
  async getById(projectId) {
    try {
      const response = await api.get(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch project');
    }
  },

  /**
   * Create a new project (alias for create)
   * @param {string} name - Project name
   * @param {string} description - Project description
   * @returns {Promise<Object>} Created project
   */
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

  /**
   * Create a new project
   * @param {Object} projectData - { name, description }
   * @returns {Promise<Object>} Created project
   */
  async create(projectData) {
    try {
      const response = await api.post('/projects', projectData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to create project');
    }
  },

  /**
   * Update project
   * @param {string} projectId - Project ID
   * @param {Object} updates - { name?, description? }
   * @returns {Promise<Object>} Updated project
   */
  async update(projectId, updates) {
    try {
      const response = await api.put(`/projects/${projectId}`, updates);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update project');
    }
  },

  /**
   * Delete project
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Success message
   */
  async delete(projectId) {
    try {
      const response = await api.delete(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to delete project');
    }
  },

  /**
   * Add member to project
   * @param {string} projectId - Project ID
   * @param {string} userId - User ID to add
   * @param {string} role - Role (MEMBER or LEADER)
   * @returns {Promise<Object>} Success message
   */
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

  /**
   * Get project members with details
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} Array of members with user details
   */
  async getMembers(projectId) {
    try {
      const response = await api.get(`/projects/${projectId}/members`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch members');
    }
  },

  /**
   * Remove member from project
   * @param {string} projectId - Project ID
   * @param {string} userId - User ID to remove
   * @returns {Promise<Object>} Success message
   */
  async removeMember(projectId, userId) {
    try {
      const response = await api.delete(`/projects/${projectId}/members/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to remove member');
    }
  },

  /**
   * Update member role
   * @param {string} projectId - Project ID
   * @param {string} userId - User ID
   * @param {string} role - New role (MEMBER or LEADER)
   * @returns {Promise<Object>} Success message
   */
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