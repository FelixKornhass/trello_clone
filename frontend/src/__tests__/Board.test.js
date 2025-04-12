import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { createRouter, createWebHistory } from 'vue-router';
import { flushPromises } from '@vue/test-utils';
import Board from '../views/Board.vue';
import api from '../services/api';

// Mock API
vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

// Mock localStorage
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key) => {
    if (key === 'token') return 'mock-token';
    if (key === 'userId') return '1';
    if (key === 'user') return JSON.stringify({ id: 1, name: 'Test User' });
    if (key === 'darkMode') return 'false';
    return null;
  }),
  setItem: vi.fn(),
  clear: vi.fn()
});

// Router setup
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/boards', name: 'boards' },
    { path: '/boards/:id', name: 'board', component: Board },
    { path: '/login', name: 'login' }
  ]
});

// Store setup
const createVuexStore = (isAuthenticated = true) => {
  return createStore({
    modules: {
      auth: {
        namespaced: true,
        state: {
          isAuthenticated,
          user: isAuthenticated ? { id: 1, name: 'Test User' } : null,
          token: isAuthenticated ? 'mock-token' : null
        },
        mutations: {
          SET_USER(state, user) {
            state.user = user;
            state.isAuthenticated = !!user;
          },
          SET_TOKEN(state, token) {
            state.token = token;
          }
        },
        getters: {
          isAuthenticated: state => state.isAuthenticated,
          currentUser: state => state.user,
          token: state => state.token
        }
      }
    }
  });
};

describe('Board.vue', () => {
  let wrapper;
  let store;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup store
    store = createVuexStore();

    // Mount component
    wrapper = mount(Board, {
      global: {
        plugins: [store, router],
        stubs: ['draggable']
      },
      data() {
        return {
          board: {
            id: 1,
            name: 'Test Board',
            description: 'Test Description',
            lists: [
              {
                id: 1,
                title: 'List 1',
                tasks: [
                  {
                    id: 1,
                    title: 'Task 1',
                    description: 'Description 1',
                    completed: false
                  }
                ]
              }
            ]
          },
          loading: false,
          error: null,
          showAddListModal: false,
          showAddTaskModal: false,
          showEditTaskModal: false,
          showSettingsModal: false,
          newList: { title: '' },
          newTask: { title: '', description: '' },
          editingTask: null,
          currentListId: null
        };
      },
      mocks: {
        $route: {
          params: {
            id: '1'
          }
        }
      }
    });
  });

  // it('renders board name', async () => {
  //   expect(wrapper.find('h1').text()).toBe('Test Board');
  // });

  it('shows loading state', () => {
    const localWrapper = mount(Board, {
      global: {
        plugins: [store, router],
        stubs: ['draggable']
      },
      data() {
        return {
          board: null,
          loading: true,
          error: null
        };
      }
    });
    
    expect(localWrapper.find('.loading').exists()).toBe(true);
    expect(localWrapper.find('.loading').text()).toBe('Loading...');
  });

  it('shows add list button', () => {
    const addListBtn = wrapper.find('.btn-primary');
    expect(addListBtn.exists()).toBe(true);
    expect(addListBtn.text()).toBe('Add List');
  });

  it('shows settings button', () => {
    const settingsBtn = wrapper.find('.btn-secondary');
    expect(settingsBtn.exists()).toBe(true);
    expect(settingsBtn.text()).toBe('Settings');
  });

  it('shows back button', () => {
    const backBtn = wrapper.find('.back-btn');
    expect(backBtn.exists()).toBe(true);
    expect(backBtn.text()).toBe('Go Back');
  });
}); 