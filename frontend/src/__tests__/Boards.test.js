import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { createRouter, createWebHistory } from 'vue-router';
import { flushPromises } from '@vue/test-utils';
import Boards from '../views/Boards.vue';
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
    if (key === 'boardsTitle') return 'My Boards';
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
    { path: '/boards', name: 'boards', component: Boards },
    { path: '/board/:id', name: 'board' },
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

describe('Boards.vue', () => {
  let wrapper;
  let store;
  let routerPushSpy;
  let testBoard;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup router spy
    routerPushSpy = vi.spyOn(router, 'push');
    
    // Setup store
    store = createVuexStore();

    // Create a test board for reuse in tests
    testBoard = {
      id: 1,
      name: 'Test Board',
      description: 'Test Description',
      lists: []
    };

    // Mock API responses
    api.get.mockImplementation((url) => {
      if (url === '/users/1') {
        return Promise.resolve({
          data: {
            id: 1,
            name: 'Test User',
            boardsTitle: 'My Boards'
          }
        });
      } else if (url === '/boards') {
        return Promise.resolve({
          data: [testBoard]
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    // Mount component
    wrapper = mount(Boards, {
      global: {
        plugins: [store, router],
        stubs: ['draggable']
      }
    });
  });

  it('renders boards title', async () => {
    await wrapper.vm.$nextTick();
    await flushPromises();
    
    const title = wrapper.find('h1');
    expect(title.text()).toBe('My Boards');
  });

  it('can edit boards title', async () => {
    await wrapper.vm.$nextTick();
    await flushPromises();
    
    // Start editing
    const title = wrapper.find('h1');
    await title.trigger('click');
    expect(wrapper.vm.isEditingTitle).toBe(true);
    
    // Edit title
    const titleInput = wrapper.find('.title-input');
    await titleInput.setValue('Updated Title');
    
    // Save title
    await titleInput.trigger('blur');
    expect(wrapper.vm.title).toBe('Updated Title');
  });

  it('can create a new board', async () => {
    // Mock API response for creating a new board
    api.post.mockResolvedValue({
      data: {
        id: 2,
        name: 'New Board',
        description: 'New Description',
        lists: []
      }
    });

    // Click create board button
    const createBoardBtn = wrapper.find('.create-board-btn');
    await createBoardBtn.trigger('click');
    expect(wrapper.vm.showCreateModal).toBe(true);

    // Fill form
    const boardNameInput = wrapper.find('#boardName');
    const boardDescriptionInput = wrapper.find('#boardDescription');
    await boardNameInput.setValue('New Board');
    await boardDescriptionInput.setValue('New Description');

    // Submit form
    const form = wrapper.find('form');
    await form.trigger('submit.prevent');

    // Wait for API calls and DOM updates
    await wrapper.vm.$nextTick();
    await flushPromises();

    // Verify API call
    expect(api.post).toHaveBeenCalledWith('/boards', {
      name: 'New Board',
      description: 'New Description',
      position: expect.any(Number)
    });

    // Verify modal was closed
    expect(wrapper.vm.showCreateModal).toBe(false);
  });

  // it('can delete a board', async () => {
  //   // Mock confirm dialog
  //   global.confirm = vi.fn(() => true);
    
  //   // Mock API response for deleting a board
  //   api.delete.mockResolvedValue({ data: { success: true } });
    
  //   // Manually set the boards array to ensure it's populated
  //   wrapper.vm.boards = [testBoard];
  //   await wrapper.vm.$nextTick();
    
  //   // Find the delete button and click it
  //   const deleteBtn = wrapper.find("delete-board-btn");
  //   await deleteBtn.trigger('click');
    
  //   // Verify API call
  //   expect(api.delete).toHaveBeenCalledWith('/boards/1');
  // });
}); 