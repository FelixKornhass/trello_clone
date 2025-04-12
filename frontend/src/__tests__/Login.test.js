import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';

// Mock router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/boards', name: 'boards' },
    { path: '/register', name: 'register' }
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
        state: {},
        mutations: {
          SET_TOKEN(state, token) {
            state.token = token;
          },
          SET_USER(state, user) {
            state.user = user;
          }
        },
        actions: {
          login: vi.fn()
        }
      }
    }
  });
};

describe('Login.vue', () => {
  let wrapper;
  let store;
  let routerPushSpy;

  beforeEach(() => {
    store = createVuexStore();
    routerPushSpy = vi.spyOn(router, 'push');
    
    wrapper = mount(Login, {
      global: {
        plugins: [store, router],
        stubs: ['router-link']
      }
    });
    
    // Reset all mocks before each test
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
  });

  it('renders login form', () => {
    expect(wrapper.find('form').exists()).toBe(true);
    expect(wrapper.find('input[type="email"]').exists()).toBe(true);
    expect(wrapper.find('input[type="password"]').exists()).toBe(true);
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
  });

  it('shows error message when login fails', async () => {
    const errorMessage = 'Invalid credentials';
    store.dispatch = vi.fn().mockRejectedValue({
      response: { data: { message: errorMessage } }
    });

    await wrapper.find('input[type="email"]').setValue('test@example.com');
    await wrapper.find('input[type="password"]').setValue('password123');
    await wrapper.find('form').trigger('submit');

    // Wait for the error message to appear
    await wrapper.vm.$nextTick();
    const errorElement = wrapper.find('.error-message');
    expect(errorElement.exists()).toBe(true);
    expect(errorElement.text()).toBe(errorMessage);
  });

  it('disables submit button while loading', async () => {
    store.dispatch = vi.fn().mockImplementation(() => new Promise(() => {}));

    await wrapper.find('input[type="email"]').setValue('test@example.com');
    await wrapper.find('input[type="password"]').setValue('password123');
    await wrapper.find('form').trigger('submit');

    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined();
  });

  it('navigates to boards page on successful login', async () => {
    const mockUser = { id: 1, boardsTitle: 'My Boards' };
    const mockToken = 'mock-token';
    
    // Mock successful login
    store.dispatch = vi.fn().mockResolvedValue(mockUser);
    
    // Mock localStorage to return the token when getItem is called
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'token') return mockToken;
      return null;
    });
    
    // Mock router.push to resolve immediately
    routerPushSpy.mockResolvedValue();

    await wrapper.find('input[type="email"]').setValue('test@example.com');
    await wrapper.find('input[type="password"]').setValue('password123');
    await wrapper.find('form').trigger('submit');

    // Wait for all promises to resolve
    await wrapper.vm.$nextTick();
    
    // Wait for the timeout in the component
    await new Promise(resolve => setTimeout(resolve, 150));

    expect(routerPushSpy).toHaveBeenCalledWith('/boards');
  });
}); 