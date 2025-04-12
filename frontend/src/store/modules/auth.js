import { auth } from '@/services/api';

// Initialize state from localStorage
const state = {
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user')) || null,
  isAuthenticated: !!localStorage.getItem('token')
};

const mutations = {
  SET_TOKEN(state, token) {
    state.token = token;
    state.isAuthenticated = !!token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  },
  SET_USER(state, user) {
    state.user = user;
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      // Also save boardsTitle separately for faster access
      if (user.boardsTitle) {
        localStorage.setItem('boardsTitle', user.boardsTitle);
      }
      // Also save userId separately for faster access
      if (user.id) {
        localStorage.setItem('userId', user.id);
      }
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('boardsTitle');
      localStorage.removeItem('userId');
    }
  },
  CLEAR_AUTH(state) {
    state.token = null;
    state.user = null;
    state.isAuthenticated = false;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('boardsTitle');
    localStorage.removeItem('userId');
  }
};

const actions = {
  async login({ commit }, credentials) {
    try {
      const response = await auth.login(credentials);
      const { token, user } = response.data;
      commit('SET_TOKEN', token);
      commit('SET_USER', user);
      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  async register({ commit }, userData) {
    try {
      const response = await auth.register(userData);
      const { token, user } = response.data;
      commit('SET_TOKEN', token);
      commit('SET_USER', user);
      return user;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  },

  logout({ commit }) {
    commit('CLEAR_AUTH');
  }
};

const getters = {
  isAuthenticated: state => state.isAuthenticated,
  currentUser: state => state.user,
  token: state => state.token
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}; 