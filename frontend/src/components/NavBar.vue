<!-- NavBar.vue - Navigation component for the application -->
<template>
  <!-- Main navigation bar -->
  <nav class="navbar">
    <!-- Brand/logo section -->
    <div class="navbar-brand">
      <router-link to="/boards" class="logo">PlanOps</router-link>
    </div>
    <!-- Navigation menu for authenticated users -->
    <div class="navbar-menu" v-if="isAuthenticated">
      <!-- Home link -->
      <router-link to="/boards" class="nav-link">
        <i class="fas fa-home mr-2"></i>Home
      </router-link>
      <!-- User menu with dropdown -->
      <div class="user-menu">
        <div class="username-container">
          <!-- Username with dropdown toggle -->
          <span class="username" @click="toggleDropdown">{{ currentUser?.name }}</span>
          <!-- Dropdown menu for user settings -->
          <div class="dropdown-menu" v-if="showDropdown">
            <div class="theme-toggle">
              <div class="theme-control">
                <label class="switch">
                  <input type="checkbox" v-model="isDarkMode" @change="toggleTheme">
                  <span class="slider">
                    <span class="star star_1"></span>
                    <span class="star star_2"></span>
                    <span class="star star_3"></span>
                    <span class="cloud">
                      <i class="fas fa-cloud"></i>
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Logout button -->
      <button @click="handleLogout" class="logout-btn">Logout</button>
    </div>
    <!-- Navigation menu for non-authenticated users -->
    <div class="navbar-menu" v-else>
      <router-link to="/login" class="nav-link">Login</router-link>
      <router-link to="/register" class="nav-link">Register</router-link>
    </div>
  </nav>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default {
  name: 'NavBar',
  setup() {
    // Initialize store and router
    const store = useStore();
    const router = useRouter();
    
    // Reactive state variables
    const showDropdown = ref(false);
    const isDarkMode = ref(localStorage.getItem('darkMode') === 'true');

    // Computed properties from Vuex store
    const isAuthenticated = computed(() => store.getters['auth/isAuthenticated']);
    const currentUser = computed(() => store.getters['auth/currentUser']);

    // Handle user logout
    const handleLogout = async () => {
      await store.dispatch('auth/logout');
      router.push('/login');
    };

    // Toggle user dropdown menu
    const toggleDropdown = () => {
      showDropdown.value = !showDropdown.value;
    };

    // Close dropdown when clicking outside
    const closeDropdown = (event) => {
      if (!event.target.closest('.username-container')) {
        showDropdown.value = false;
      }
    };

    // Toggle theme function
    const toggleTheme = () => {
      if (isDarkMode.value) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'true');
      } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'false');
      }
    };

    // Initialize component
    onMounted(() => {
      // Add click event listener for dropdown
      document.addEventListener('click', closeDropdown);
      
      // Apply dark mode on initial load
      if (isDarkMode.value) {
        document.body.classList.add('dark-mode');
      }
    });

    // Clean up event listeners on component unmount
    onUnmounted(() => {
      document.removeEventListener('click', closeDropdown);
    });

    // Return reactive variables and functions for template use
    return {
      isAuthenticated,
      currentUser,
      handleLogout,
      showDropdown,
      toggleDropdown,
      isDarkMode,
      toggleTheme
    };
  }
};
</script>

<style scoped>
/* Main navigation bar styling */
.navbar {
  background-image: url('../assets/images/sunset_v2.JPG');
  background-size: 100% auto;
  background-position: center;
  padding: 0.75rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-height: 10rem;
  max-height: 10rem;
}

/* Brand/logo section styling */
.navbar-brand {
  display: flex;
  align-items: center;
}

.logo {
  color: rgb(46, 3, 95);
  font-size: 5rem;
  padding-left: 1rem;
  font-weight: bold;
  font-family: "Brush Script MT", cursive;
  text-decoration: none;
  text-shadow: 
    -1px -1px 0 #ddb609,  
     1px -1px 0 #ddb609,
    -1px  1px 0 #ddb609,
     1px  1px 0 #ddb609;
}

/* Navigation menu styling */
.navbar-menu {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-right: 0.5rem;
}

/* Navigation link styling */
.nav-link {
  color: rgb(0, 0, 0);
  font-size: 1.5rem;
  font-weight: 500;
  text-decoration: none;
  border-radius: 4px;
  padding: 0.5rem;
  transition: background-color 0.2s;
}

.nav-link:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

/* User menu styling */
.user-menu {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.username-container {
  position: relative;
}

/* Username styling */
.username {
  color: rgb(0, 0, 0);
  font-size: 1.5rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.username:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

/* Dropdown menu styling */
.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 0.5rem;
  z-index: 100;
  color: #333;
  width: 100%;
  margin-top: 5px;
}

/* Logout button styling */
.logout-btn {
  background-color: transparent;
  font-size: 1.5rem;
  font-weight: 500;
  color: rgb(0, 0, 0);
  border: 2px solid rgb(0, 0, 0);
  padding: 0.3rem 0.8rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  background-color: rgb(214, 42, 42);
  color: #000000;
}

/* Dark mode toggle styling */
.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-control {
  align-items: center;
  justify-content: center;
}

/* Theme Switch */
/* The switch - the box around the slider */
.switch {
  font-size: 14px;
  position: relative;
  display: inline-block;
  width: 3.5em;
  height: 2em;
  border-radius: 30px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

/* Hide default HTML checkbox */
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

/* The slider */
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #2a2a2a;
  transition: 0.4s;
  border-radius: 30px;
  overflow: hidden;
}

.slider:before {
  position: absolute;
  content: "";
  height: 1em;
  width: 1em;
  border-radius: 20px;
  left: 0.4em;
  bottom: 0.4em;
  transition: 0.4s;
  transition-timing-function: cubic-bezier(0.81, -0.04, 0.38, 1.5);
  box-shadow: inset 8px -4px 0px 0px #fff;
}

.switch input:checked + .slider {
  background-color: #00a6ff;
}

.switch input:checked + .slider:before {
  transform: translateX(1.7em);
  box-shadow: inset 15px -4px 0px 15px #ffcf48;
}

.star {
  background-color: #fff;
  border-radius: 50%;
  position: absolute;
  width: 4px;
  transition: all 0.4s;
  height: 4px;
}

.star_1 {
  left: 2.2em;
  top: 0.4em;
}

.star_2 {
  left: 1.9em;
  top: 1em;
}

.star_3 {
  left: 2.6em;
  top: 0.7em;
}

.switch input:checked ~ .slider .star {
  opacity: 0;
}

.cloud {
  width: 3em;
  position: absolute;
  bottom: -1.2em;
  left: -0.9em;
  opacity: 0;
  transition: all 0.4s;
}

.switch input:checked ~ .slider .cloud {
  opacity: 1;
}
</style> 