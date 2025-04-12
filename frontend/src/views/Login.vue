<!-- Login.vue - User authentication view -->
<template>
  <!-- Main login container -->
  <div class="login-container">
    <!-- Login form box -->
    <div class="login-box">
      <h2>Login</h2>
      <!-- Login form with submit handler -->
      <form @submit.prevent="handleLogin">
        <!-- Email input field -->
        <div class="form-group">
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            v-model="email"
            required
            placeholder="Enter your email"
          />
        </div>
        <!-- Password input field -->
        <div class="form-group">
          <label for="password">Password</label>
          <input
            type="password"
            id="password"
            v-model="password"
            required
            placeholder="Enter your password"
          />
        </div>
        <!-- Error message display -->
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        <!-- Submit button with loading state -->
        <button type="submit" :disabled="loading">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
      </form>
      <!-- Registration link -->
      <p class="register-link">
        Don't have an account? <router-link to="/register">Register</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import { ref, nextTick, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';

export default {
  name: 'Login',
  setup() {
    // Initialize store and router
    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    
    // Reactive state variables
    const email = ref('');
    const password = ref('');
    const error = ref('');
    const loading = ref(false);

    // Check if we're coming from the register page
    onMounted(() => {
      // Reset any previous state
      error.value = '';
      loading.value = false;
    });

    // Handle login form submission
    const handleLogin = async () => {
      try {
        loading.value = true;
        error.value = '';
        // Dispatch login action to Vuex store
        const user = await store.dispatch('auth/login', {
          email: email.value,
          password: password.value
        });
        
        // Save user ID to localStorage
        localStorage.setItem('userId', user.id);
        
        // Save boards title to localStorage if available
        if (user.boardsTitle) {
          localStorage.setItem('boardsTitle', user.boardsTitle);
        }
        
        // Ensure token is set before navigation
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication failed: No token received');
        }
        
        // Wait for the next tick to ensure Vue has updated the DOM
        await nextTick();
        
        // Force a store update to ensure isAuthenticated is true
        store.commit('auth/SET_TOKEN', token);
        store.commit('auth/SET_USER', user);
        
        // Warte einen Moment, um sicherzustellen, dass die Authentifizierung vollständig initialisiert ist
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Lade die Boards, bevor zur Boards-Seite navigiert wird
        await store.dispatch('board/fetchBoards');
        
        // Redirect to boards page on successful login
        await router.push('/boards');
      } catch (err) {
        // Display error message if login fails
        error.value = err.response?.data?.message || 'An error occurred during login';
        console.error('Login error:', err);
      } finally {
        loading.value = false;
      }
    };

    // Return reactive variables and functions for template use
    return {
      email,
      password,
      error,
      loading,
      handleLogin
    };
  }
};
</script>

<style scoped>
/* Main container styling */
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  min-height: calc(100vh - 10rem); /* 4.5rem for navbar (0.75rem * 2 + content) */
  height: calc(100vh - 19rem);
  
  padding-top: clamp(2rem, 2vh, 8rem);
  padding-bottom: clamp(2rem, 5vh, 8rem);
  padding-left: 2rem;
  padding-right: 2rem;

  background-color: color-mix(in srgb, #cad9e9 50%, transparent);
  overflow-y: auto;
  box-sizing: border-box;
}

/* Login form box styling */
.login-box {
  background: white;
  padding: 4rem;
  border-radius: 8px;
  box-shadow: 0 6px 100px rgba(0, 0, 0, 0.1);
  min-width: calc(100vw / 4);
  /* max-width: calc(100vw / 4); */
  min-height: 500px;
  max-height: calc(100vh - 15rem);
  margin: auto;
  display: flex;
  flex-direction: column;
}

/* Heading styling */
h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: #504c4c;
  font-weight: bold;
  font-size: 2.2rem;
  
}

/* Form styling */
form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
}

/* Form group styling */
.form-group {
  margin-bottom: 0.5rem;
}

/* Label styling */
label {
  display: block;
  margin-bottom: 0.5rem;
  color: #444040;
  font-weight: 500;
  font-size: 1.8rem;
}

/* Input field styling */
input {
  width: 100%;
  padding: 0.75rem;
  border: 1.5px solid #ddd;
  border-radius: 4px;
  font-size: 1.5rem;
  margin-bottom: 1rem;
  margin-top: 0.4rem;
}

/* Button styling */
button {
  width: 50%;
  padding: 0.75rem;
  background-color: #026AA7;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1.8rem;
  cursor: pointer;
  transition: background-color 0.2s;
  align-self: center;
  margin-top: 2rem;
}

/* Button hover state */
button:hover {
  background-color: #01589b;
}

/* Button disabled state */
button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

/* Error message styling */
.error-message {
  color: #dc3545;
  margin-bottom: 1rem;
  text-align: center;
}

/* Registration link styling */
.register-link {
  text-align: center;
  margin-top: 1rem;
  font-size: 1.2rem;
}

/* Link styling */
a {
  color: #026AA7;
  text-decoration: none;
  font-weight: bold;
}

/* Link hover state */
a:hover {
  text-decoration: underline;
}
</style> 