import { boards } from '@/services/api';

const state = {
  boards: [],
  currentBoard: null,
  loading: false,
  error: null
};

const mutations = {
  SET_BOARDS(state, boards) {
    state.boards = boards;
  },
  SET_CURRENT_BOARD(state, board) {
    state.currentBoard = board;
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
  ADD_BOARD(state, board) {
    state.boards.push(board);
  },
  UPDATE_BOARD(state, updatedBoard) {
    const index = state.boards.findIndex(b => b._id === updatedBoard._id);
    if (index !== -1) {
      state.boards.splice(index, 1, updatedBoard);
    }
    if (state.currentBoard?._id === updatedBoard._id) {
      state.currentBoard = updatedBoard;
    }
  },
  DELETE_BOARD(state, boardId) {
    state.boards = state.boards.filter(b => b._id !== boardId);
    if (state.currentBoard?._id === boardId) {
      state.currentBoard = null;
    }
  }
};

const actions = {
  async fetchBoards({ commit }) {
    try {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      const response = await boards.getAll();
      commit('SET_BOARDS', response.data);
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch boards');
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async fetchBoard({ commit }, boardId) {
    try {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      const response = await boards.getOne(boardId);
      commit('SET_CURRENT_BOARD', response.data);
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch board');
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async createBoard({ commit }, boardData) {
    try {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      const response = await boards.create(boardData);
      commit('ADD_BOARD', response.data);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to create board');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async updateBoard({ commit }, { boardId, boardData }) {
    try {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      const response = await boards.update(boardId, boardData);
      commit('UPDATE_BOARD', response.data);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to update board');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async deleteBoard({ commit }, boardId) {
    try {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      await boards.delete(boardId);
      commit('DELETE_BOARD', boardId);
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to delete board');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  }
};

const getters = {
  boards: state => state.boards,
  currentBoard: state => state.currentBoard,
  loading: state => state.loading,
  error: state => state.error
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}; 