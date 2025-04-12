/**
 * Theme Module for Vuex Store
 * 
 * This module manages the application's theme settings, including dark mode.
 */

const state = {
  isDarkMode: localStorage.getItem('darkMode') === 'true'
};

const mutations = {
  TOGGLE_DARK_MODE(state) {
    state.isDarkMode = !state.isDarkMode;
    localStorage.setItem('darkMode', state.isDarkMode);
    
    // Apply dark mode class to body
    if (state.isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  },
  
  SET_DARK_MODE(state, value) {
    state.isDarkMode = value;
    localStorage.setItem('darkMode', value);
    
    // Apply dark mode class to body
    if (value) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }
};

const actions = {
  toggleDarkMode({ commit }) {
    commit('TOGGLE_DARK_MODE');
  },
  
  initializeTheme({ commit, state }) {
    // Apply dark mode class on app initialization
    if (state.isDarkMode) {
      document.body.classList.add('dark-mode');
    }
  }
};

const getters = {
  isDarkMode: state => state.isDarkMode
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}; 