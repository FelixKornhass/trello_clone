<!-- Boards.vue - Main view for displaying and managing boards -->
<template>
  <div class="boards-container">
    <!-- Header section with title and create button -->
    <div class="boards-header">
      <div class="header-left">
        <h1 
          v-if="!isEditingTitle" 
          @click="canEditTitle && startEditingTitle()" 
          class="editable-title"
          :class="{ 'not-editable': !canEditTitle }"
        >
          {{ title }}
        </h1>
        <input
          v-else
          ref="titleInput"
          v-model="title"
          @blur="saveTitle"
          @keyup.enter="saveTitle"
          @keyup.esc="cancelEditing"
          class="title-input"
          type="text"
          placeholder="Enter board name"
        />
      </div>
      <div class="header-right">
        <button @click="showCreateModal = true" class="create-board-btn">
          <i class="fas fa-plus"></i>
          Create New Board
        </button>
      </div>
    </div>

    <!-- Loading state display -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading boards...</p>
    </div>

    <!-- Error state display -->
    <div v-else-if="error" class="error">
      <i class="fas fa-exclamation-circle"></i>
      {{ error }}
    </div>

    <!-- Main content: Grid of board cards -->
    <div v-else class="boards-grid">
      <!-- Draggable boards -->
      <draggable 
        v-model="boards" 
        :group="{ name: 'boards' }"
        item-key="id"
        class="boards-grid-draggable"
        @start="dragStart"
        @end="dragEnd"
        :animation="150"
        ghost-class="ghost"
        chosen-class="chosen"
      >
        <template #item="{ element: board }">
          <div
            class="board-card"
            @click="navigateToBoard(board.id)"
          >
            <div class="board-content">
              <div class="board-header">
                <h3 v-if="!board.isEditingName" 
                    @dblclick.stop="startEditingName(board)"
                    class="board-name">
                  {{ board.name }}
                </h3>
                <input
                  v-else
                  v-model="board.editingName"
                  class="board-name-edit"
                  @blur="saveName(board)"
                  @keydown.enter.prevent="saveName(board)"
                  @keydown.esc="cancelEditingName(board)"
                  ref="nameInput"
                  @click.stop
                  :data-board-id="board.id"
                />
                <button 
                  class="delete-board-btn" 
                  @click.stop="confirmDeleteBoard(board)"
                  title="Delete board"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
              <div class="board-description-container">
                <p v-if="!board.isEditingDescription && board.description && board.description.trim()" 
                  class="board-description"
                  @click.stop="startEditingDescription(board)">
                  {{ board.description }}
                </p>

                <textarea
                  v-else
                  v-model="board.editingDescription"
                  class="board-description-edit"
                  @blur="saveDescription(board)"
                  @keydown.enter.prevent="saveDescription(board)"
                  @keydown.esc="cancelEditingDescription(board)"
                  ref="descriptionInput"
                  placeholder="Add a description..."
                  rows="3"
                  maxlength="200"
                  :data-board-id="board.id"
                  @click.stop
                ></textarea>
              </div>
              <p class="board-meta">
                <i class="fas fa-list"></i>
                {{ board.lists?.length || 0 }} lists
              </p>
            </div>
          </div>
        </template>
      </draggable>

      <!-- Special card for creating a new board (not draggable) -->
      <div class="board-card create-board" @click="showCreateModal = true">
        <div class="create-board-content">
          <i class="fas fa-plus"></i>
          <h3>Create New Board</h3>
        </div>
      </div>
    </div>

    <!-- Modal for creating a new board -->
    <div v-if="showCreateModal" class="modal-overlay" @click="handleCancel">
      <div class="modal" @click.stop>
        <h2 style="color: var(--text-color); margin-bottom: 2rem; font-size: 2rem;">Create New Board</h2>
        <form @submit.prevent="handleCreateBoard">
          <div class="form-group">
            <label for="boardName">Board Name</label>
            <input
              type="text"
              id="boardName"
              v-model="newBoardName"
              required
              placeholder="Enter board name"
            />
          </div>
          <div class="form-group">
            <label for="boardDescription">Description (Optional)</label>
            <textarea
              id="boardDescription"
              v-model="newBoardDescription"
              placeholder="Enter board description"
              rows="3"
            ></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" @click="handleCancel" class="cancel-btn">
              Cancel
            </button>
            <button type="submit" :disabled="loading">
              {{ loading ? 'Creating...' : 'Create Board' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useStore } from 'vuex';
import api from '../services/api';
import draggable from 'vuedraggable';

export default {
  name: 'Boards',
  components: {
    draggable
  },
  setup() {
    // Initialize store and router
    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    
    // Reactive state variables
    const showCreateModal = ref(false);
    const newBoardName = ref('');
    const newBoardDescription = ref('');
    const boards = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const isDarkMode = ref(localStorage.getItem('darkMode') === 'true');
    const userId = localStorage.getItem('userId') || 'default';
    const title = ref(localStorage.getItem('boardsTitle') || 'My Boards');
    const isEditingTitle = ref(false);
    const titleInput = ref(null);
    const isDragging = ref(false);
    const canEditTitle = ref(true); // Default to true, will be updated based on user permissions
    const initializationAttempted = ref(false);
    const isInitialized = ref(false);

    // Combined initialization logic
    onMounted(async () => {
      if (initializationAttempted.value) return;
      initializationAttempted.value = true;
      
      try {
        // Überprüfe, ob der Benutzer authentifiziert ist
        const isAuthenticated = store.getters['auth/isAuthenticated'];
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        
        if (!isAuthenticated || !token || !user) {
          console.error('Benutzer ist nicht authentifiziert');
          error.value = 'Authentifizierung erforderlich. Bitte melden Sie sich an.';
          router.push('/login');
          return;
        }
        
        // Stelle sicher, dass der Token und der Benutzer im Store gesetzt sind
        if (token && !store.getters['auth/token']) {
          store.commit('auth/SET_TOKEN', token);
        }
        
        if (user && !store.getters['auth/currentUser']) {
          store.commit('auth/SET_USER', user);
        }
        
        // Initialisiere Komponentenstatus
        loading.value = true;
        error.value = null;

        // Warte einen Moment, um sicherzustellen, dass die Authentifizierung vollständig initialisiert ist
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Lade Titel und Benutzereinstellungen
        await loadTitle();
        
        // Prüfe, ob Boards bereits im Store vorhanden sind
        const storeBoards = store.getters['board/boards'];
        if (storeBoards && storeBoards.length > 0) {
          console.log('Boards bereits im Store vorhanden, verwende diese');
          boards.value = storeBoards;
        } else {
          // Lade Boards nur, wenn sie nicht im Store sind
          console.log('Keine Boards im Store, lade von der API');
          await fetchBoards();
        }
        
        // Wende Dark Mode an, falls erforderlich
        if (isDarkMode.value) {
          document.body.classList.add('dark-mode');
        }

        // Überprüfe, ob der Benutzer die Berechtigung hat, den Titel zu bearbeiten
        const currentUserId = localStorage.getItem('userId');
        const boardOwnerId = localStorage.getItem('boardOwnerId');
        canEditTitle.value = currentUserId === boardOwnerId || !boardOwnerId;

        // Markiere als initialisiert
        isInitialized.value = true;
      } catch (err) {
        console.error('Fehler bei der Initialisierung:', err);
        error.value = err.response?.data?.message || 'Fehler bei der Initialisierung der Komponente';
        
        // Bei Unauthorized-Fehler zur Login-Seite weiterleiten
        if (err.response?.status === 401) {
          router.push('/login');
        }
      } finally {
        loading.value = false;
      }
    });

    // Function to load title from store or fetch from API
    const loadTitle = async () => {
      try {
        // Überprüfe, ob der Benutzer authentifiziert ist
        const isAuthenticated = store.getters['auth/isAuthenticated'];
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        
        if (!isAuthenticated || !token || !user) {
          console.error('Benutzer ist nicht authentifiziert');
          error.value = 'Authentifizierung erforderlich. Bitte melden Sie sich an.';
          router.push('/login');
          return;
        }
        
        // Stelle sicher, dass der Token und der Benutzer im Store gesetzt sind
        if (token && !store.getters['auth/token']) {
          store.commit('auth/SET_TOKEN', token);
        }
        
        if (user && !store.getters['auth/currentUser']) {
          store.commit('auth/SET_USER', user);
        }
        
        // Versuche zuerst, den Titel aus dem Store zu erhalten
        const currentUser = store.getters['auth/currentUser'];
        if (currentUser && currentUser.boardsTitle) {
          title.value = currentUser.boardsTitle;
          localStorage.setItem('boardsTitle', currentUser.boardsTitle);
          return;
        }
        
        // Wenn nicht im Store, versuche von der API zu laden
        await fetchUserSettings();
      } catch (err) {
        console.error('Error loading title:', err);
        // Fallback to localStorage
        const savedTitle = localStorage.getItem('boardsTitle');
        if (savedTitle) {
          title.value = savedTitle;
        }
      }
    };

    // Function to fetch user settings including title
    const fetchUserSettings = async () => {
      try {
        // Überprüfe, ob der Benutzer authentifiziert ist
        const isAuthenticated = store.getters['auth/isAuthenticated'];
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        
        if (!isAuthenticated || !token || !user) {
          console.error('Benutzer ist nicht authentifiziert');
          error.value = 'Authentifizierung erforderlich. Bitte melden Sie sich an.';
          router.push('/login');
          return;
        }
        
        // Stelle sicher, dass der Token und der Benutzer im Store gesetzt sind
        if (token && !store.getters['auth/token']) {
          store.commit('auth/SET_TOKEN', token);
        }
        
        if (user && !store.getters['auth/currentUser']) {
          store.commit('auth/SET_USER', user);
        }
        
        // Get the current user ID
        const currentUserId = localStorage.getItem('userId');
        if (!currentUserId) {
          title.value = 'My Boards';
          return;
        }
        
        // Warte einen Moment, um sicherzustellen, dass die Authentifizierung vollständig initialisiert ist
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Try to get the title from the database
        try {
          const userResponse = await api.get(`/users/${currentUserId}`);
          if (userResponse.data && userResponse.data.boardsTitle) {
            title.value = userResponse.data.boardsTitle;
            // Save to localStorage as backup
            localStorage.setItem('boardsTitle', userResponse.data.boardsTitle);
            
            // Update the store
            const updatedUser = { ...store.getters['auth/currentUser'], boardsTitle: userResponse.data.boardsTitle };
            store.commit('auth/SET_USER', updatedUser);
          } else {
            // Fallback to localStorage
            const savedTitle = localStorage.getItem('boardsTitle');
            if (savedTitle) {
              title.value = savedTitle;
            }
          }
        } catch (err) {
          console.error('Error fetching user settings:', err);
          // Fallback to localStorage
          const savedTitle = localStorage.getItem('boardsTitle');
          if (savedTitle) {
            title.value = savedTitle;
          }
        }
      } catch (err) {
        console.error('Error in fetchUserSettings:', err);
        error.value = err.response?.data?.message || 'Error fetching user settings';
      }
    };

    // Function to fetch all boards from the API
    const fetchBoards = async () => {
      try {
        loading.value = true;
        error.value = null;
        console.log('Fetching boards...');
        
        // Überprüfe, ob der Benutzer authentifiziert ist
        const isAuthenticated = store.getters['auth/isAuthenticated'];
        const token = localStorage.getItem('token');
        
        if (!isAuthenticated || !token) {
          console.error('Benutzer ist nicht authentifiziert');
          error.value = 'Authentifizierung erforderlich. Bitte melden Sie sich an.';
          router.push('/login');
          return;
        }
        
        // Stelle sicher, dass der Token im Store gesetzt ist
        if (token && !store.getters['auth/token']) {
          store.commit('auth/SET_TOKEN', token);
        }
        
        // Warte einen Moment, um sicherzustellen, dass die Authentifizierung vollständig initialisiert ist
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const response = await api.get('/boards');
        console.log('Boards response:', response.data);
        boards.value = response.data;
      } catch (err) {
        console.error('Error fetching boards:', err);
        if (err.response?.status === 401) {
          // Unauthorized, redirect to login
          error.value = 'Sitzung abgelaufen. Bitte melden Sie sich erneut an.';
          router.push('/login');
        } else {
          error.value = err.response?.data?.message || 'Fehler beim Laden der Boards';
        }
      } finally {
        loading.value = false;
      }
    };

    // Function to navigate to a specific board
    const navigateToBoard = (boardId) => {
      router.push(`/board/${boardId}`);
    };

    // Function to handle modal cancellation
    const handleCancel = () => {
      showCreateModal.value = false;
      newBoardName.value = '';
      newBoardDescription.value = '';
    };

    // Function to confirm and delete a board
    const confirmDeleteBoard = async (board) => {
      if (confirm(`Are you sure you want to delete the board "${board.name}"? This action cannot be undone.`)) {
        try {
          loading.value = true;
          await api.delete(`/boards/${board.id}`);
          boards.value = boards.value.filter(b => b.id !== board.id);
        } catch (err) {
          console.error('Error deleting board:', err);
          error.value = 'Error deleting board';
        } finally {
          loading.value = false;
        }
      }
    };

    // Function to update board description
    const updateBoardDescription = async (board, newDescription) => {
      try {
        loading.value = true;
        await api.put(`/boards/${board.id}/description`, {
          description: newDescription
        });
        
        // Update the board in the local state
        const index = boards.value.findIndex(b => b.id === board.id);
        if (index !== -1) {
          boards.value[index].description = newDescription;
        }
      } catch (err) {
        console.error('Error updating board description:', err);
        error.value = 'Error updating board description';
      } finally {
        loading.value = false;
      }
    };

    // Function to create a new board
    const handleCreateBoard = async () => {
      if (!newBoardName.value.trim()) return;
      
      try {
        loading.value = true;
        console.log('Creating board:', newBoardName.value);
        const response = await api.post('/boards', { 
          name: newBoardName.value.trim(),
          description: newBoardDescription.value.trim() || null,
          position: boards.value.length // Add position at the end of the list
        });
        console.log('Board created:', response.data);
        boards.value.push(response.data);
        showCreateModal.value = false;
        newBoardName.value = '';
        newBoardDescription.value = '';
      } catch (err) {
        console.error('Error creating board:', err);
        error.value = 'Error creating board';
      } finally {
        loading.value = false;
      }
    };

    // Function to toggle dark mode
    const toggleDarkMode = () => {
      document.body.classList.toggle('dark-mode');
      localStorage.setItem('darkMode', isDarkMode.value);
    };

    const startEditingTitle = () => {
      isEditingTitle.value = true;
      // Focus the input after it's rendered
      setTimeout(() => {
        if (titleInput.value) {
          titleInput.value.focus();
          titleInput.value.select();
        }
      }, 0);
    };

    const saveTitle = async () => {
      try {
        if (!title.value.trim()) {
          title.value = 'My Boards';
        }
        
        // Get the current user ID
        const currentUserId = localStorage.getItem('userId');
        if (!currentUserId) {
          isEditingTitle.value = false;
          return;
        }
        
        // Save to localStorage immediately for better UX
        localStorage.setItem('boardsTitle', title.value);
        
        // Update the store immediately
        const currentUser = store.getters['auth/currentUser'];
        if (currentUser) {
          const updatedUser = { ...currentUser, boardsTitle: title.value };
          store.commit('auth/SET_USER', updatedUser);
        }
        
        // Update the title in the database
        await api.put(`/users/${currentUserId}`, {
          boardsTitle: title.value
        });
        
        isEditingTitle.value = false;
      } catch (err) {
        console.error('Error saving title:', err);
        error.value = err.response?.data?.message || 'Error saving title';
      }
    };

    const cancelEditing = () => {
      isEditingTitle.value = false;
    };

    // Drag and drop functions
    const dragStart = () => {
      isDragging.value = true;
    };

    const dragEnd = async (evt) => {
      isDragging.value = false;
      
      // If the order hasn't changed, do nothing
      if (evt.oldIndex === evt.newIndex) return;
      
      // Get the board that was moved
      const movedBoard = boards.value[evt.newIndex];
      
      // Create a copy of the boards array to avoid reactivity issues
      const boardsCopy = [...boards.value];
      
      // Update the order in the backend
      try {
        await api.put(`/boards/${movedBoard.id}/position`, {
          position: evt.newIndex
        });
      } catch (err) {
        console.error('Error updating board position:', err);
        error.value = 'Error updating board position';
        
        // Revert the order if the API call fails
        boards.value = boardsCopy;
      }
    };

    // Function to start editing name
    const startEditingName = (board) => {
      board.isEditingName = true;
      board.editingName = board.name;
      // Wait for the next tick to focus the input
      nextTick(() => {
        const inputs = document.querySelectorAll('.board-name-edit');
        const input = Array.from(inputs).find(input => input.dataset.boardId === board.id);
        if (input) {
          input.focus();
          input.select();
        }
      });
    };

    // Function to save name
    const saveName = async (board) => {
      if (board.editingName !== undefined && board.editingName.trim() !== '') {
        try {
          loading.value = true;
          console.log('Updating board name:', board.id, board.editingName);
          const response = await api.put(`/boards/${board.id}`, {
            name: board.editingName.trim(),
            description: board.description
          });
          console.log('Board updated:', response.data);
          board.name = response.data.name;
          board.description = response.data.description;
          board.isEditingName = false;
          delete board.editingName;
        } catch (err) {
          console.error('Error updating board name:', err);
          error.value = 'Error updating board name';
          // Revert changes on error
          board.name = board.editingName;
          board.isEditingName = false;
          delete board.editingName;
        } finally {
          loading.value = false;
        }
      } else {
        // If empty, just cancel editing
        cancelEditingName(board);
      }
    };

    // Function to cancel editing name
    const cancelEditingName = (board) => {
      board.isEditingName = false;
      delete board.editingName;
    };

    // Function to start editing description
    const startEditingDescription = (board) => {
      board.isEditingDescription = true;
      board.editingDescription = board.description || '';
      // Wait for the next tick to focus the textarea
      nextTick(() => {
        const textareas = document.querySelectorAll('.board-description-edit');
        const textarea = Array.from(textareas).find(textarea => textarea.dataset.boardId === board.id);
        if (textarea) {
          textarea.focus();
        }
      });
    };

    // Function to save description
    const saveDescription = async (board) => {
      if (board.editingDescription !== undefined) {
        try {
          loading.value = true;
          console.log('Updating board description:', board.id, board.editingDescription);
          const response = await api.put(`/boards/${board.id}`, {
            name: board.name,
            description: board.editingDescription.trim()
          });
          console.log('Board updated:', response.data);
          board.name = response.data.name;
          board.description = response.data.description;
          board.isEditingDescription = false;
          delete board.editingDescription;
        } catch (err) {
          console.error('Error updating board description:', err);
          error.value = 'Error updating board description';
          // Revert changes on error
          board.description = board.editingDescription;
          board.isEditingDescription = false;
          delete board.editingDescription;
        } finally {
          loading.value = false;
        }
      } else {
        // If empty, just cancel editing
        cancelEditingDescription(board);
      }
    };

    // Function to cancel editing description
    const cancelEditingDescription = (board) => {
      board.isEditingDescription = false;
      delete board.editingDescription;
    };

    // Return all reactive variables and functions for template use
    return {
      boards,
      loading,
      error,
      showCreateModal,
      newBoardName,
      newBoardDescription,
      navigateToBoard,
      handleCreateBoard,
      handleCancel,
      confirmDeleteBoard,
      updateBoardDescription,
      startEditingDescription,
      saveDescription,
      cancelEditingDescription,
      startEditingName,
      saveName,
      cancelEditingName,
      isDarkMode,
      toggleDarkMode,
      title,
      isEditingTitle,
      titleInput,
      startEditingTitle,
      saveTitle,
      cancelEditing,
      dragStart,
      dragEnd,
      isDragging,
      canEditTitle
    };
  }
};
</script>

<style scoped>
/* Main container styling */
.boards-container {
  padding: 2rem;
  max-height: calc(100vh - 10rem);
  min-height: calc(100vh - 10rem);
  background-color: var(--background-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
  position: relative;
}

/* Header section styling */
.boards-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

h1 {
  margin: 0;
  font-size: 3rem;
  font-weight: 500;
  color: rgb(46, 3, 95);
  text-shadow: 
    -1px -1px 0 #ddb609,  
     1px -1px 0 #ddb609,
    -1px  1px 0 #ddb609,
     1px  1px 0 #ddb609;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Create board button styling */
.create-board-btn {
  background-image: url('../assets/images/sunset_v2.JPG');
  background-size: 500% auto;
  background-position: center;
  color: rgb(0, 0, 0);
  border: none;
  padding: 1rem 1.7rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  font-size: 1.5rem;
  transition: background-color 0.2s;
  text-shadow: 
    -1px -1px 0 #ddb609,  
     1px -1px 0 #ddb609,
    -1px  1px 0 #ddb609,
     1px  1px 0 #ddb609;
}

.create-board-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 1; /* Ensure hovered card appears above others */
}

/* Grid layout for boards */
.boards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  width: 100%;
  padding-bottom: 1rem;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: rgb(189, 188, 188) transparent;
  position: relative;
  margin-bottom: 1rem;
  height: fit-content;
}

.boards-grid-draggable {
  display: contents;
}

/* .boards-grid::-webkit-scrollbar {
  height: 8px;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: transparent;
} */

/* .boards-grid::-webkit-scrollbar-track {
  background: transparent;
} */

/* .boards-grid::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
} */

/* Individual board card styling */
.board-card {
  width: 100%;
  min-height: 220px;
  background-color: var(--surface-color);
  border-radius: 0.5rem;
  padding: 1.25rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 4px var(--shadow-color);
  margin-top: 2px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  user-select: none;
  position: relative;
  z-index: 1;
  overflow: hidden;
}

.board-card.chosen {
  opacity: 0.8;
  transform: scale(1.05);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

.board-card.ghost {
  opacity: 0.5;
  background: #c8ebfb;
  border: 2px dashed #026AA7;
}

.board-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 2; /* Ensure hovered card appears above others */
}

.board-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  height: 100%;
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  font-size: 1.2rem;
}

.board-content h3 {
  margin: 0;
  color: var(--text-color);
  font-size: 1.5rem;
  font-weight: 600;
}

.delete-board-btn {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-board-btn:hover {
  background-color: rgba(220, 53, 69, 0.1);
}

.board-description-container {
  flex: 1;
  min-height: 60px;
  max-height: 60px;
  margin: 8px 0;
  position: relative;
  overflow: hidden;
  color: var(--text-secondary);
}

.board-description {
  margin: 0;
  font-size: 1.3rem;
  color: var(--text-secondary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  max-height: 60px;
  word-break: break-word;
}

.board-description-edit {
  width: 100%;
  height: 60px;
  max-height: 60px;
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.9em;
  line-height: 1.4;
  resize: none;
  margin: 0;
  overflow-y: auto;
}

.board-description-placeholder {
  margin: 0;
  font-size: 0.9em;
  color: var(--text-tertiary);
  font-style: italic;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.board-description-placeholder:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.board-meta {
  color: var(--text-secondary);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: auto;
  font-size: 1.2rem;
}

/* Create board card styling */
.create-board {
  background-color: var(--bg-secondary);
  border: 2px dashed var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  max-height: 180px;
}

.create-board-content {
  text-align: center;
  color: var(--text-secondary);
}

.create-board-content i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

/* Modal styling */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background-color: var(--surface-color);
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 6px var(--shadow-color);
  z-index: 1000;
  font-size: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 1rem;
  background-color: var(--bg-secondary);
  color: var(--text-color);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.modal-actions button {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.cancel-btn {
  background-color: var(--bg-secondary);
  border: none;
  color: var(--text-secondary);
}

.modal-actions button[type="submit"] {
  background-color: #0079bf;
  color: white;
  border: none;
}

.modal-actions button[type="submit"]:hover {
  background-color: #026aa7;
}

/* Loading spinner styling */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #0079bf;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error message styling */
.error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #dc3545;
  padding: 1rem;
  background-color: var(--surface-color);
  border-radius: 8px;
  box-shadow: 0 2px 4px var(--shadow-color);
}

/* Editable title styling */
.editable-title {
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.editable-title:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.title-input {
  font-size: 2rem;
  font-weight: bold;
  padding: 0.5rem;
  border: 2px solid #026AA7;
  border-radius: 4px;
  width: 100%;
  max-width: 300px;
  background: var(--surface-color);
  color: var(--text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-sizing: border-box;
}

.title-input:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(2, 106, 167, 0.2);
}

.board-name {
  margin: 0;
  color: var(--text-color);
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  word-break: break-word;
}

.board-name-edit {
  margin: 0;
  padding: 4px 8px;
  font-size: 1.2rem;
  font-weight: 600;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  width: 100%;
  max-width: 200px;
}

/* Add style for non-editable title */
.editable-title.not-editable {
  cursor: default;
}

.editable-title.not-editable:hover {
  background-color: transparent;
}
</style> 