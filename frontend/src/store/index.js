/**
 * Vuex Store Configuration
 * 
 * This module configures the Vuex store for the application, managing state
 * for boards, lists, and cards. It includes mutations for state changes,
 * actions for async operations, and getters for accessing state.
 */

import { createStore } from 'vuex';
import auth from './modules/auth';
import board from './modules/board';
import theme from './modules/theme';

// Mutation types for consistent state changes
const types = {
  ADD_BOARD: 'ADD_BOARD',
  ADD_LIST: 'ADD_LIST',
  ADD_CARD: 'ADD_CARD',
  UPDATE_CARD: 'UPDATE_CARD',
  DELETE_CARD: 'DELETE_CARD',
  MOVE_CARD: 'MOVE_CARD'
};

// Board module for managing board-related state
const boardModule = {
  namespaced: true,
  // Initial state with sample data
  state: {
    boards: [
      {
        id: 1,
        name: 'Project Board',
        lists: [
          { id: 1, title: 'To Do', cards: [{ id: 1, text: 'Learn Vue 3' }] },
          { id: 2, title: 'In Progress', cards: [{ id: 2, text: 'Build Trello Clone' }] }
        ]
      }
    ]
  },
  // Mutations for direct state changes
  mutations: {
    // Add a new board to the state
    [types.ADD_BOARD](state, { name }) {
      state.boards.push({ 
        id: Date.now(), 
        name, 
        lists: [],
        createdAt: new Date().toISOString()
      });
    },
    // Add a new list to a specific board
    [types.ADD_LIST](state, { boardId, title }) {
      const board = state.boards.find(b => b.id === boardId);
      if (board) {
        board.lists.push({ 
          id: Date.now(), 
          title, 
          cards: [],
          createdAt: new Date().toISOString()
        });
      }
    },
    // Add a new card to a specific list
    [types.ADD_CARD](state, { boardId, listId, text }) {
      const board = state.boards.find(b => b.id === boardId);
      if (board) {
        const list = board.lists.find(l => l.id === listId);
        if (list) {
          list.cards.push({
            id: Date.now(),
            text,
            createdAt: new Date().toISOString()
          });
        }
      }
    },
    // Update an existing card's text
    [types.UPDATE_CARD](state, { boardId, listId, cardId, text }) {
      const board = state.boards.find(b => b.id === boardId);
      if (board) {
        const list = board.lists.find(l => l.id === listId);
        if (list) {
          const card = list.cards.find(c => c.id === cardId);
          if (card) {
            card.text = text;
            card.updatedAt = new Date().toISOString();
          }
        }
      }
    },
    // Delete a card from a list
    [types.DELETE_CARD](state, { boardId, listId, cardId }) {
      const board = state.boards.find(b => b.id === boardId);
      if (board) {
        const list = board.lists.find(l => l.id === listId);
        if (list) {
          list.cards = list.cards.filter(c => c.id !== cardId);
        }
      }
    },
    // Move a card from one list to another
    [types.MOVE_CARD](state, { boardId, sourceListId, targetListId, cardId, targetIndex }) {
      const board = state.boards.find(b => b.id === boardId);
      if (board) {
        const sourceList = board.lists.find(l => l.id === sourceListId);
        const targetList = board.lists.find(l => l.id === targetListId);
        
        if (sourceList && targetList) {
          const cardIndex = sourceList.cards.findIndex(c => c.id === cardId);
          if (cardIndex !== -1) {
            const [card] = sourceList.cards.splice(cardIndex, 1);
            targetList.cards.splice(targetIndex, 0, card);
          }
        }
      }
    }
  },
  // Actions for handling async operations and committing mutations
  actions: {
    // Add a new board if name is provided
    addBoard({ commit }, name) {
      if (name) commit(types.ADD_BOARD, { name });
    },
    // Add a new list if title is provided
    addList({ commit }, { boardId, title }) {
      if (title) commit(types.ADD_LIST, { boardId, title });
    },
    // Add a new card if text is provided
    addCard({ commit }, { boardId, listId, text }) {
      if (text) commit(types.ADD_CARD, { boardId, listId, text });
    },
    // Update a card if text is provided
    updateCard({ commit }, { boardId, listId, cardId, text }) {
      if (text) commit(types.UPDATE_CARD, { boardId, listId, cardId, text });
    },
    // Delete a card
    deleteCard({ commit }, { boardId, listId, cardId }) {
      commit(types.DELETE_CARD, { boardId, listId, cardId });
    },
    // Move a card between lists
    moveCard({ commit }, { boardId, sourceListId, targetListId, cardId, targetIndex }) {
      commit(types.MOVE_CARD, { boardId, sourceListId, targetListId, cardId, targetIndex });
    }
  },
  // Getters for accessing state
  getters: {
    // Get a board by ID
    getBoard: state => id => state.boards.find(board => board.id === id),
    // Get a list by board ID and list ID
    getList: state => (boardId, listId) => {
      const board = state.boards.find(b => b.id === boardId);
      return board ? board.lists.find(l => l.id === listId) : null;
    },
    // Get a card by board ID, list ID, and card ID
    getCard: state => (boardId, listId, cardId) => {
      const list = state.boards
        .find(b => b.id === boardId)
        ?.lists.find(l => l.id === listId);
      return list ? list.cards.find(c => c.id === cardId) : null;
    }
  }
};

// Create and export the Vuex store with auth, board, and theme modules
export default createStore({
  modules: {
    auth,
    board,
    theme
  }
});
