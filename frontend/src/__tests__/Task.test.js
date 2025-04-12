import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { createRouter, createWebHistory } from 'vue-router';
import Board from '../views/Board.vue';

// Mock API module first
vi.mock('../services/api', () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    }
  };
});

// Import the mocked API
import api from '../services/api';

// Mock router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/boards', name: 'boards' },
    { path: '/login', name: 'login' }
  ]
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn()
};
global.localStorage = localStorageMock;

// Mock store
const createVuexStore = () => {
  return createStore({
    modules: {
      auth: {
        namespaced: true,
        state: {
          isAuthenticated: true,
          user: { id: 1 }
        },
        getters: {
          isAuthenticated: state => state.isAuthenticated
        }
      }
    }
  });
};

describe('Task Functionality in Board.vue', () => {
  let wrapper;
  let store;
  let routerPushSpy;

  beforeEach(() => {
    store = createVuexStore();
    routerPushSpy = vi.spyOn(router, 'push');
    
    // Mock localStorage to return a token
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'token') return 'mock-token';
      return null;
    });
    
    // Mock route params
    vi.mock('vue-router', async () => {
      const actual = await vi.importActual('vue-router');
      return {
        ...actual,
        useRoute: () => ({
          params: { id: '1' }
        })
      };
    });
    
    // Mock API responses
    api.get.mockResolvedValue({
      data: {
        id: 1,
        name: 'Test Board',
        description: 'Test Description',
        lists: [
          {
            id: 'list1',
            title: 'To Do',
            tasks: [
              { id: 'task1', title: 'Task 1', description: 'Description 1', completed: false },
              { id: 'task2', title: 'Task 2', description: 'Description 2', completed: true }
            ]
          }
        ]
      }
    });
    
    api.post.mockImplementation((url, data) => {
      if (url.includes('/tasks')) {
        return Promise.resolve({ data: { id: 'new-task', ...data } });
      }
      return Promise.resolve({ data: { id: 'new-list', ...data } });
    });
    
    api.put.mockResolvedValue({ data: { success: true } });
    api.delete.mockResolvedValue({ data: { success: true } });
    
    wrapper = mount(Board, {
      global: {
        plugins: [store, router],
        stubs: ['router-link']
      }
    });
    
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  it('renders tasks in a list', async () => {
    // Wait for the component to load data
    await wrapper.vm.$nextTick();
    
    const tasks = wrapper.findAll('.task');
    expect(tasks.length).toBe(2);
    expect(tasks[0].find('h4').text()).toBe('Task 1');
    expect(tasks[1].find('h4').text()).toBe('Task 2');
  });

  it('displays task descriptions when available', async () => {
    // Wait for the component to load data
    await wrapper.vm.$nextTick();
    
    const tasks = wrapper.findAll('.task');
    expect(tasks[0].find('p').text()).toBe('Description 1');
    expect(tasks[1].find('p').text()).toBe('Description 2');
  });

  it('shows correct task status', async () => {
    // Wait for the component to load data
    await wrapper.vm.$nextTick();
    
    const tasks = wrapper.findAll('.task');
    const statuses = tasks.map(task => task.find('.status').text());
    expect(statuses[0]).toBe('In Progress');
    expect(statuses[1]).toBe('Completed');
  });

  it('opens edit task modal when task is clicked', async () => {
    // Wait for the component to load data
    await wrapper.vm.$nextTick();
    
    const task = wrapper.findAll('.task')[0];
    await task.trigger('click');
    
    // Wait for the modal to appear
    await wrapper.vm.$nextTick();
    
    expect(wrapper.find('.modal-content h2').text()).toBe('Edit Task');
    expect(wrapper.find('input[type="text"]').element.value).toBe('Task 1');
    expect(wrapper.find('textarea').element.value).toBe('Description 1');
    expect(wrapper.find('input[type="checkbox"]').element.checked).toBe(false);
  });

  it('adds a new task when form is submitted', async () => {
    // Wait for the component to load data
    await wrapper.vm.$nextTick();
    
    // Open add task modal
    await wrapper.find('.btn-add-task').trigger('click');
    
    // Wait for the modal to appear
    await wrapper.vm.$nextTick();
    
    // Fill in the form
    const titleInput = wrapper.find('.modal-content input[type="text"]');
    const descriptionInput = wrapper.find('.modal-content textarea');
    await titleInput.setValue('New Task');
    await descriptionInput.setValue('New Description');
    
    // Submit the form
    await wrapper.find('.modal-content form').trigger('submit');
    
    // Wait for the API call to complete
    await wrapper.vm.$nextTick();
    
    // Check if the API was called with the correct parameters
    expect(api.post).toHaveBeenCalledWith(
      '/boards/1/lists/list1/tasks',
      { title: 'New Task', description: 'New Description' }
    );
  });

  it('updates task when edit form is submitted', async () => {
    // Wait for the component to load data
    await wrapper.vm.$nextTick();
    
    // Open edit task modal
    const task = wrapper.findAll('.task')[0];
    await task.trigger('click');
    
    // Wait for the modal to appear
    await wrapper.vm.$nextTick();
    
    // Update the form
    const titleInput = wrapper.find('.modal-content input[type="text"]');
    const descriptionInput = wrapper.find('.modal-content textarea');
    const completedCheckbox = wrapper.find('.modal-content input[type="checkbox"]');
    
    await titleInput.setValue('Updated Task');
    await descriptionInput.setValue('Updated Description');
    await completedCheckbox.setChecked();
    
    // Submit the form
    await wrapper.find('.modal-content form').trigger('submit');
    
    // Wait for the API call to complete
    await wrapper.vm.$nextTick();
    
    // Check if the API was called with the correct parameters
    expect(api.put).toHaveBeenCalledWith(
      '/boards/1/lists/list1/tasks/task1',
      {
        id: 'task1',
        title: 'Updated Task',
        description: 'Updated Description',
        completed: true
      }
    );
  });

  it('handles task drag and drop', async () => {
    // Wait for the component to load data
    await wrapper.vm.$nextTick();
    
    const draggable = wrapper.findComponent({ name: 'draggable' });
    expect(draggable.exists()).toBe(true);
    
    // Simulate drag and drop event
    await draggable.vm.$emit('change', {
      added: {
        element: { id: 'task1', title: 'Task 1', description: 'Description 1', completed: false },
        newIndex: 0
      },
      removed: {
        element: { id: 'task1', title: 'Task 1', description: 'Description 1', completed: false },
        oldIndex: 0
      }
    });
    
    // Wait for the API call to complete
    await wrapper.vm.$nextTick();
    
    // Check if the API was called with the correct parameters
    expect(api.put).toHaveBeenCalledWith(
      '/boards/1',
      expect.objectContaining({ lists: expect.any(Array) })
    );
  });
}); 