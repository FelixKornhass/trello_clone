<!-- Register.vue - User registration view -->
<template>
  <!-- Main registration container -->
  <div class="register-container">
    <!-- Registration form box -->
    <div class="register-box">
      <h2>Register</h2>
      <!-- Registration form with submit handler -->
      <form @submit.prevent="handleRegister">
        <!-- Name input field -->
        <div class="form-group">
          <label for="name">Name</label>
          <input
            type="text"
            id="name"
            v-model="name"
            required
            placeholder="Enter your name"
          />
        </div>
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
        <!-- Confirm password input field -->
        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            v-model="confirmPassword"
            required
            placeholder="Confirm your password"
          />
        </div>
        <!-- Error message display -->
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        <!-- Submit button with loading state -->
        <button type="submit" :disabled="loading">
          {{ loading ? 'Registering...' : 'Register' }}
        </button>
      </form>
      <!-- Login link -->
      <p class="login-link">
        Already have an account? <router-link to="/login?from=register">Login</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import { ref, nextTick } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default {
  name: 'Register',
  setup() {
    // Initialize store and router
    const store = useStore();
    const router = useRouter();
    
    // Reactive state variables
    const name = ref('');
    const email = ref('');
    const password = ref('');
    const confirmPassword = ref('');
    const error = ref('');
    const loading = ref(false);

    // Handle registration form submission
    const handleRegister = async () => {
      // Validate password match
      if (password.value !== confirmPassword.value) {
        error.value = 'Passwords do not match';
        return;
      }

      try {
        loading.value = true;
        error.value = '';
        // Dispatch register action to Vuex store
        const user = await store.dispatch('auth/register', {
          name: name.value,
          email: email.value,
          password: password.value
        });
        
        // Save user ID to localStorage
        localStorage.setItem('userId', user.id);
        
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
        
        // Redirect to boards page on successful registration
        await router.push('/boards');
      } catch (err) {
        // Display error message if registration fails
        error.value = err.response?.data?.message || 'An error occurred during registration';
        console.error('Registration error:', err);
      } finally {
        loading.value = false;
      }
    };

    // Return reactive variables and functions for template use
    return {
      name,
      email,
      password,
      confirmPassword,
      error,
      loading,
      handleRegister
    };
  }
};
</script>

<style scoped>
/* Main container styling */
.register-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: calc(100vh - 10rem); /* 10rem for navbar (0.75rem * 2 + content) */
  height: calc(100vh - 10rem);
  background-color: color-mix(in srgb, #cad9e9 50%, transparent);
  padding: 1rem;
  overflow-y: auto;
  position: relative;
  box-sizing: border-box;
}

/* Registration form box styling */
.register-box {
  background: white;
  padding: 4rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-width: calc(100vw / 4);
  /* max-width: calc(100vw / 4); */
  min-height: 500px;
  margin: 2rem auto;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
  box-sizing: border-box;
}

/* Heading styling */
h2 {
  text-align: center;
  font-weight: 500;
  margin-bottom: 1.5rem;
  font-size: 2.2rem;
  font-weight: bold;
  color: #333;
}

/* Form group styling */
.form-group {
  margin-bottom: 1.5rem;
}

/* Label styling */
label {
  display: block;
  margin-bottom: 0.5rem;
  color: #444040;
  font-size: 1.8rem;
}

/* Input field styling */
input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
  font-size: 1.5rem;
  margin-bottom: 1rem;
  margin-top: 0.4rem;
}

input:focus {
  outline: none;
  border-color: #026AA7;
  box-shadow: 0 0 0 2px rgba(2, 106, 167, 0.1);
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
  transition: all 0.2s;
  margin-top: 2rem;
  align-self: center;
  display: block;
  margin-left: auto;
  margin-right: auto;
}

/* Button hover state */
button:hover {
  background-color: #01589b;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Button disabled state */
button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Error message styling */
.error-message {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  text-align: center;
}

/* Link styling */
.login-link {
  text-align: center;
  margin-top: 1.2rem;
  font-size: 1.2rem;
}

a {
  color: #026AA7;
  text-decoration: none;
  font-weight: bold;
}

a:hover {
  text-decoration: underline;
}


/* Responsive adjustments */
@media (max-width: 480px) {
  .register-container {
    padding: 0.5rem;
  }

  .register-box {
    padding: 1.5rem;
    margin: 1rem auto;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  input {
    padding: 0.5rem;
  }

  button {
    padding: 0.5rem;
  }
}
</style> 