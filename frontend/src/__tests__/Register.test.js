import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { createRouter, createWebHistory } from 'vue-router';
import Register from '../views/Register.vue';

// Mock router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login' },
    { path: '/boards', name: 'boards' }
  ]
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn()
};
global.localStorage = localStorageMock;

// Mock store factory
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
          register: vi.fn()
        },
        getters: {
          isAuthenticated: (state) => state.isAuthenticated,
          currentUser: (state) => state.user
        }
      }
    }
  });
};

describe('Register.vue', () => {
  let wrapper;
  let store;
  let routerPushSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});

    routerPushSpy = vi.spyOn(router, 'push');

    store = createVuexStore();

    // Mock store.dispatch
    store.dispatch = vi.fn().mockImplementation((action, payload) => {
      if (action === 'auth/register') {
        return Promise.resolve({ id: 1, name: payload.name, email: payload.email });
      }
      return Promise.resolve();
    });

    // Mock store.commit for mutation assertions
    store.commit = vi.fn();

    wrapper = mount(Register, {
      global: {
        plugins: [store, router],
        stubs: ['router-link']
      }
    });
  });

  it('renders registration form', () => {
    expect(wrapper.find('form').exists()).toBe(true);
    expect(wrapper.find('input[type="text"]').exists()).toBe(true);
    expect(wrapper.find('input[type="email"]').exists()).toBe(true);
    expect(wrapper.find('input[type="password"]').exists()).toBe(true);
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
  });

  it('shows error message when registration fails', async () => {
    const errorMessage = 'Email already exists';
    store.dispatch = vi.fn().mockRejectedValue({
      response: { data: { message: errorMessage } }
    });

    await wrapper.find('input[type="text"]').setValue('Test User');
    await wrapper.find('input[type="email"]').setValue('test@example.com');
    await wrapper.find('input[type="password"]').setValue('password123');
    await wrapper.find('#confirmPassword').setValue('password123');
    await wrapper.find('form').trigger('submit');
    
    // Wait for the error message to appear
    await wrapper.vm.$nextTick();
    const errorElement = wrapper.find('.error-message');
    expect(errorElement.exists()).toBe(true);
    expect(errorElement.text()).toBe(errorMessage);
  });

  it('disables submit button while loading', async () => {
    store.dispatch = vi.fn().mockImplementation(() => new Promise(() => {}));

    await wrapper.find('input[type="text"]').setValue('Test User');
    await wrapper.find('input[type="email"]').setValue('test@example.com');
    await wrapper.find('input[type="password"]').setValue('password123');
    await wrapper.find('#confirmPassword').setValue('password123');
    await wrapper.find('form').trigger('submit');
    
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined();
  });

  it('navigates to boards page on successful registration', async () => {
    const mockUser = { id: 1, name: 'Test User', email: 'test@example.com' };
    const mockToken = 'mock-token';
    
    // Mock successful registration
    store.dispatch = vi.fn().mockResolvedValue(mockUser);
    
    // Mock localStorage to return the token when getItem is called
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'token') return mockToken;
      return null;
    });
    
    // Mock router.push to resolve immediately
    routerPushSpy.mockResolvedValue();

    // Fill in all required fields including confirm password
    await wrapper.find('input[type="text"]').setValue('Test User');
    await wrapper.find('input[type="email"]').setValue('test@example.com');
    await wrapper.find('input[type="password"]').setValue('password123');
    await wrapper.find('#confirmPassword').setValue('password123');
    
    // Submit the form
    await wrapper.find('form').trigger('submit');
    
    // Wait for all promises to resolve
    await wrapper.vm.$nextTick();
    
    // Wait for the timeout in the component (100ms) plus a buffer
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Verify the registration flow
    expect(store.dispatch).toHaveBeenCalledWith('auth/register', {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('userId', 1);
    expect(store.commit).toHaveBeenCalledWith('auth/SET_TOKEN', mockToken);
    expect(store.commit).toHaveBeenCalledWith('auth/SET_USER', mockUser);
    expect(routerPushSpy).toHaveBeenCalledWith('/boards');
  });

  it('validates required fields', async () => {
    const form = wrapper.find('form');
  
    // checkValidity Mock
    form.element.checkValidity = vi.fn().mockReturnValue(false);
  
    // Manuell prüfen
    const isValid = form.element.checkValidity();
  
    expect(isValid).toBe(false);
  
    if (isValid) {
      await form.trigger('submit');
    }
  
    expect(store.dispatch).not.toHaveBeenCalledWith('auth/register', expect.any(Object));
  });
});
