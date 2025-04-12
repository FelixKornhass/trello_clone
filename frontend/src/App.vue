<!-- App.vue - Root component of the application -->
<template>
  <!-- Main app container -->
  <div class="app-container">
    <!-- Navigation bar component -->
    <NavBar />
    <!-- Main content area with router view -->
    <main class="main-content">
      <!-- Router view with transition effect -->
      <router-view v-slot="{ Component }">
        <transition 
          name="fade" 
          mode="out-in"
          @before-enter="() => {}"
          @enter="() => {}"
          @after-enter="() => {}"
          @enter-cancelled="() => {}"
          @before-leave="() => {}"
          @leave="() => {}"
          @after-leave="() => {}"
          @leave-cancelled="() => {}"
        >
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script>
import { onMounted } from 'vue';
import { useStore } from 'vuex';
import NavBar from '@/components/NavBar.vue';

export default {
  name: 'App',
  components: {
    NavBar
  },
  setup() {
    const store = useStore();

    // Initialize the store on app start
    onMounted(() => {
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      
      if (token && user) {
        // Update the store with the user data
        store.commit('auth/SET_TOKEN', token);
        store.commit('auth/SET_USER', user);
        console.log('App initialized with authenticated user:', user.id);
        
        // Ensure userId is set in localStorage
        if (user.id && !localStorage.getItem('userId')) {
          localStorage.setItem('userId', user.id);
        }
        
        // Ensure boardsTitle is set in localStorage
        if (user.boardsTitle && !localStorage.getItem('boardsTitle')) {
          localStorage.setItem('boardsTitle', user.boardsTitle);
        }
      } else {
        console.log('App initialized with no authenticated user');
        
        // Clear any stale data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
        localStorage.removeItem('boardsTitle');
      }
    });
  }
};
</script>

<style>
/* Global styles */
:root {
  /* Light theme variables */
  --background-color: color-mix(#cad9e9, transparent 50%);
  --text-color: #2c3e50;
  --text-secondary: #252525;
  --text-tertiary: #8c8c8c;
  --surface-color: #ffffff;
  --bg-primary: #f5f6f8;
  --bg-secondary: #ffffff;
  --border-color: #ddd;
  --shadow-color: rgba(0, 0, 0, 0.1);
  --hover-color: rgba(0, 0, 0, 0.05);
}

/* Dark theme variables - applied when body has dark-mode class */
body.dark-mode {
  --background-color: #072541;
  --text-color: #ffffff;
  --text-secondary: #cccccc;
  --text-tertiary: #999999;
  --surface-color: #333333;
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --border-color: #ffffff;
  --shadow-color: rgba(0, 0, 0, 0.3);
  --hover-color: rgba(255, 255, 255, 0.05);
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: var(--background-color);
  color: var(--text-color);
  transition: background-color 0.3s, color 0.3s;
}

/* Button styles */
button {
  cursor: pointer;
  transition: background-color 0.2s, transform 0.2s;
}

button:hover {
  transform: translateY(-1px);
}

/* Form element styles */
select {
  background-color: var(--bg-secondary);
  color: var(--text-color);
  border: 1px solid var(--border-color);
  transition: border-color 0.2s, box-shadow 0.2s;
}

input:focus, textarea:focus, select:focus {
  outline: none;
  border-color: #0079bf;
  box-shadow: 0 0 0 2px rgba(0, 121, 191, 0.2);
}

/* Card styles */
.card {
  background-color: var(--surface-color);
  border-radius: 4px;
  box-shadow: 0 2px 4px var(--shadow-color);
  transition: transform 0.2s, box-shadow 0.2s;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px var(--shadow-color);
}

/* Reset default margins and padding */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Ensure html and body take full height */
html, body {
  height: auto;
  overflow: auto;
}

/* Main app container */
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: visible;
}

/* Main content area */
.main-content {
  flex: 1;
  overflow: visible;
  position: relative;
}

/* Page transition animation styles */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
