import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { createRouter, createWebHistory } from 'vue-router';
import NavBar from '../components/NavBar.vue';

// Mock router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login' },
    { path: '/register', name: 'register' },
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

// Mock document
const documentMock = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  createElement: vi.fn(() => ({
    style: {},
    classList: {
      add: vi.fn(),
      remove: vi.fn()
    },
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    insertBefore: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    contains: vi.fn(() => false),
    nextSibling: null,
    previousSibling: null,
    parentNode: null,
    childNodes: [],
    children: [],
    getBoundingClientRect: vi.fn(() => ({
      top: 0,
      left: 0,
      width: 0,
      height: 0
    }))
  })),
  createTextNode: vi.fn(() => ({
    textContent: '',
    nextSibling: null,
    previousSibling: null,
    parentNode: null
  })),
  querySelector: vi.fn(() => null),
  querySelectorAll: vi.fn(() => []),
  getElementById: vi.fn(() => null),
  getElementsByClassName: vi.fn(() => []),
  getElementsByTagName: vi.fn(() => []),
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    insertBefore: vi.fn(),
    classList: {
      add: vi.fn(),
      remove: vi.fn()
    },
    nextSibling: null,
    previousSibling: null,
    parentNode: null,
    childNodes: [],
    children: [],
    getBoundingClientRect: vi.fn(() => ({
      top: 0,
      left: 0,
      width: 0,
      height: 0
    }))
  }
};
global.document = documentMock;

// Mock window
const windowMock = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  document: documentMock
};
global.window = windowMock;

// Mock store
const createVuexStore = (isAuthenticated = false, user = null) => {
  return createStore({
    modules: {
      auth: {
        namespaced: true,
        state: {
          isAuthenticated,
          user
        },
        mutations: {
          SET_USER(state, user) {
            state.user = user;
            state.isAuthenticated = !!user;
          }
        },
        actions: {
          logout: vi.fn()
        },
        getters: {
          isAuthenticated: state => state.isAuthenticated,
          currentUser: state => state.user
        }
      },
      theme: {
        namespaced: true,
        state: {
          isDarkMode: false
        },
        mutations: {
          TOGGLE_THEME(state) {
            state.isDarkMode = !state.isDarkMode;
          }
        },
        actions: {
          toggleTheme: vi.fn()
        },
        getters: {
          isDarkMode: state => state.isDarkMode
        }
      }
    }
  });
};

describe('NavBar.vue', () => {
  let wrapper;
  let store;
  let routerPushSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create router spy
    routerPushSpy = vi.spyOn(router, 'push');
    
    // Mock localStorage
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.clear.mockImplementation(() => {});
  });

  describe('When user is not authenticated', () => {
    beforeEach(() => {
      // Create store with unauthenticated state
      store = createVuexStore(false, null);
      
      // Mount component
      wrapper = mount(NavBar, {
        global: {
          plugins: [store, router],
          stubs: ['router-link']
        }
      });
    });

    it('renders login and register links', () => {
      // Find all router-links
      const links = wrapper.findAll('router-link-stub');
      
      // Check if we have at least 2 links (login and register)
      expect(links.length).toBeGreaterThanOrEqual(2);
      
      // Check if the links have the correct to attributes
      const hasLoginLink = links.some(link => link.attributes('to') === '/login');
      const hasRegisterLink = links.some(link => link.attributes('to') === '/register');
      
      expect(hasLoginLink).toBe(true);
      expect(hasRegisterLink).toBe(true);
    });

    it('does not render user info or logout button', () => {
      // Check that user info and logout button are not present
      expect(wrapper.find('.user-menu').exists()).toBe(false);
      expect(wrapper.find('.logout-btn').exists()).toBe(false);
    });

    it('does not show theme toggle', () => {
      // Check that theme toggle is not present
      expect(wrapper.find('.theme-toggle').exists()).toBe(false);
    });
  });

  describe('When user is authenticated', () => {
    const mockUser = { id: 1, name: 'Test User' };

    beforeEach(() => {
      // Create store with authenticated state
      store = createVuexStore(true, mockUser);
      
      // Mount component
      wrapper = mount(NavBar, {
        global: {
          plugins: [store, router],
          stubs: ['router-link']
        }
      });
    });

    it('renders user info and logout button', () => {
      // Check that user info and logout button are present
      expect(wrapper.find('.user-menu').exists()).toBe(true);
      expect(wrapper.find('.logout-btn').exists()).toBe(true);
    });

    it('displays the user name', () => {
      // Check that the username is displayed
      const username = wrapper.find('.username');
      expect(username.exists()).toBe(true);
      expect(username.text()).toContain(mockUser.name);
    });

    it('adds event listener for dropdown on mount', () => {
      // Check that event listener is added on mount
      expect(documentMock.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });
  });
}); 