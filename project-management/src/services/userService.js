import api from './api';

export const userService = {
  async searchByEmail(email) {
    console.log('🔍 Searching for user by email:', email);
    try {
      const response = await api.get(`/users/search?email=${encodeURIComponent(email)}`);
      console.log('✅ User search response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ User search error:', error);
      throw error;
    }
  },

  async getCurrentUser() {
    console.log('👤 Fetching current user');
    try {
      const response = await api.get('/users/me');
      console.log('✅ Current user:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Get current user error:', error);
      throw error;
    }
  }
};