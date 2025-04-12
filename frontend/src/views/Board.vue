<!-- Board.vue - View for displaying and managing a single board with its lists and tasks -->
<template>
  <div class="board-container">
    <!-- Board header with navigation and actions -->
    <div class="board-header">
      <div class="header-left">
        <!-- Back button to return to boards list -->
        <button class="back-btn" @click="goBack" type="button">
          <div class="back-btn-content">
            <div class="back-btn-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 1024 1024"
                height="25px"
                width="25px"
              >
                <path
                  d="M224 480h640a32 32 0 1 1 0 64H224a32 32 0 0 1 0-64z"
                  fill="currentColor"
                ></path>
                <path
                  d="m237.248 512 265.408 265.344a32 32 0 0 1-45.312 45.312l-288-288a32 32 0 0 1 0-45.312l288-288a32 32 0 1 1 45.312 45.312L237.248 512z"
                  fill="currentColor"
                ></path>
              </svg>
            </div>
            <span>Go Back</span>
          </div>
        </button>
        <!-- Board title -->
        <h1>{{ board.name }}</h1>
      </div>
      <!-- Board action buttons -->
      <div class="board-actions">
        <button @click="showAddListModal = true" class="btn-primary">
          Add List
        </button>
        <button @click="showSettingsModal = true" class="btn-secondary">
          Settings
        </button>
      </div>
    </div>

    <!-- Loading and error states -->
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <!-- Main content: Lists container -->
    <div v-else class="lists-container">
      <!-- Draggable lists container -->
      <draggable
        v-model="board.lists"
        group="lists"
        item-key="id"
        class="lists-wrapper"
        @change="handleListMove"
      >
        <!-- Template for each list -->
        <template #item="{ element: list }">
          <div class="list">
            <!-- List header with title and delete button -->
            <div class="list-header">
              <h3>{{ list.title }}</h3>
              <button @click="deleteList(list.id)" class="btn-icon">
                <i class="fas fa-trash"></i>
              </button>
            </div>
            <!-- Draggable tasks container -->
            <draggable
              v-model="list.tasks"
              group="tasks"
              item-key="id"
              @change="handleTaskMove"
              class="task-list"
            >
              <!-- Template for each task -->
              <template #item="{ element: task }">
                <div class="task" @click="editTask(list.id, task)">
                  <h4>{{ task.title }}</h4>
                  <p v-if="task.description">{{ task.description }}</p>
                  <div class="task-footer">
                    <span :class="['status', task.completed ? 'completed' : '']">
                      {{ task.completed ? 'Completed' : 'In Progress' }}
                    </span>
                  </div>
                </div>
              </template>
            </draggable>
            <!-- Add task button -->
            <button @click="openAddTaskModal(list.id)" class="btn-add-task">
              Add Task
            </button>
          </div>
        </template>
      </draggable>
    </div>

    <!-- Modal for adding a new list -->
    <div v-if="showAddListModal" class="modal">
      <div class="modal-content">
        <h2 style="color: var(--text-color);">Add New List</h2>
        <form @submit.prevent="addList">
          <div class="form-group">
            <label>Title</label>
            <input v-model="newList.title" type="text" required>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showAddListModal = false" class="btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn-primary">Add List</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Add Task Modal -->
    <div v-if="showAddTaskModal" class="modal">
      <div class="modal-content">
        <h2>Add New Task</h2>
        <form @submit.prevent="addTask">
          <div class="form-group">
            <label>Title</label>
            <input v-model="newTask.title" type="text" required>
          </div>
          <div class="form-group">
            <label style="color: var(--text-color);">Description</label>
            <textarea v-model="newTask.description"></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showAddTaskModal = false" class="btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn-primary">Add Task</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Task Modal -->
    <div v-if="showEditTaskModal" class="modal">
      <div class="modal-content">
        <h2>Edit Task</h2>
        <form @submit.prevent="updateTask">
          <div class="form-group">
            <label>Title</label>
            <input v-model="editingTask.title" type="text" required>
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="editingTask.description"></textarea>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" v-model="editingTask.completed">
              Completed
            </label>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showEditTaskModal = false" class="btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn-primary">Update Task</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Board Settings Modal -->
    <div v-if="showSettingsModal" class="modal">
      <div class="modal-content">
        <h2 style="color: var(--text-color);">Board Settings</h2>
        <form @submit.prevent="updateBoard">
          <div class="form-group">
            <label>Board Name</label>
            <input v-model="board.name" type="text" required>
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea 
              v-model="board.description" 
              rows="4"
              placeholder="Enter board description"
            ></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showSettingsModal = false" class="btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn-primary">Save Changes</button>
          </div>
        </form>
        <div class="danger-zone">
          <h3>Danger Zone</h3>
          <button @click="deleteBoard" class="btn-danger">
            Delete Board
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import draggable from 'vuedraggable';
import api from '../services/api';

export default {
  name: 'Board',
  components: {
    draggable
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();
    const board = ref({ lists: [] });
    const loading = ref(true);
    const error = ref(null);
    const showAddListModal = ref(false);
    const showAddTaskModal = ref(false);
    const showEditTaskModal = ref(false);
    const showSettingsModal = ref(false);
    const newList = ref({ title: '' });
    const newTask = ref({ title: '', description: '' });
    const editingTask = ref(null);
    const currentListId = ref(null);

    const goBack = () => {
      router.push('/boards');
    };

    const fetchBoard = async () => {
      try {
        loading.value = true;
        const response = await api.get(`/boards/${route.params.id}`);
        board.value = response.data;
      } catch (err) {
        error.value = 'Error loading board';
        console.error(err);
      } finally {
        loading.value = false;
      }
    };

    const addList = async () => {
      try {
        const response = await api.post(`/boards/${route.params.id}/lists`, newList.value);
        board.value.lists.push(response.data);
        showAddListModal.value = false;
        newList.value = { title: '' };
      } catch (err) {
        console.error(err);
      }
    };

    const deleteList = async (listId) => {
      try {
        await api.delete(`/boards/${route.params.id}/lists/${listId}`);
        board.value.lists = board.value.lists.filter(list => list.id !== listId);
      } catch (err) {
        console.error(err);
      }
    };

    const addTask = async () => {
      try {
        const response = await api.post(
          `/boards/${route.params.id}/lists/${currentListId.value}/tasks`,
          newTask.value
        );
        const list = board.value.lists.find(l => l.id === currentListId.value);
        list.tasks.push(response.data);
        showAddTaskModal.value = false;
        newTask.value = { title: '', description: '' };
      } catch (err) {
        console.error(err);
      }
    };

    const editTask = (listId, task) => {
      editingTask.value = { ...task };
      currentListId.value = listId;
      showEditTaskModal.value = true;
    };

    const updateTask = async () => {
      try {
        await api.put(
          `/boards/${route.params.id}/lists/${currentListId.value}/tasks/${editingTask.value.id}`,
          editingTask.value
        );
        const list = board.value.lists.find(l => l.id === currentListId.value);
        const taskIndex = list.tasks.findIndex(t => t.id === editingTask.value.id);
        list.tasks[taskIndex] = editingTask.value;
        showEditTaskModal.value = false;
      } catch (err) {
        console.error(err);
      }
    };

    const updateBoard = async () => {
      try {
        const response = await api.put(`/boards/${route.params.id}`, {
          name: board.value.name,
          description: board.value.description
        });
        board.value = response.data;
        showSettingsModal.value = false;
      } catch (err) {
        console.error(err);
        error.value = 'Error updating board';
      }
    };

    const handleListMove = async () => {
      try {
        await api.put(`/boards/${route.params.id}`, { lists: board.value.lists });
      } catch (err) {
        console.error(err);
      }
    };

    const handleTaskMove = async () => {
      try {
        await api.put(`/boards/${route.params.id}`, { lists: board.value.lists });
      } catch (err) {
        console.error(err);
      }
    };

    const openAddTaskModal = (listId) => {
      currentListId.value = listId;
      showAddTaskModal.value = true;
    };

    const deleteBoard = async () => {
      if (confirm('Are you sure you want to delete this board? This action cannot be undone.')) {
        try {
          await api.delete(`/boards/${route.params.id}`);
          router.push('/boards');
        } catch (err) {
          console.error(err);
          error.value = 'Error deleting board';
        }
      }
    };

    onMounted(fetchBoard);

    // Add mouse wheel scrolling
    onMounted(() => {
      const listsWrapper = document.querySelector('.lists-wrapper');
      if (listsWrapper) {
        listsWrapper.addEventListener('wheel', (e) => {
          e.preventDefault();
          listsWrapper.scrollLeft += e.deltaY;
        });
      }
    });

    return {
      board,
      loading,
      error,
      showAddListModal,
      showAddTaskModal,
      showEditTaskModal,
      showSettingsModal,
      newList,
      newTask,
      editingTask,
      currentListId,
      goBack,
      addList,
      deleteList,
      addTask,
      editTask,
      updateTask,
      updateBoard,
      handleListMove,
      handleTaskMove,
      openAddTaskModal,
      deleteBoard
    };
  }
};
</script>

<style scoped>
/* Board container */
.board-container {
  max-height: calc(100vh - 10rem);
  min-height: calc(100vh - 10rem);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--background-color);
  box-sizing: border-box;
}

/* Board header */
.board-header {
  padding: 1rem;
  background-color: var(--background-color);
  box-shadow: 0 4px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
  min-height: 5rem;
  max-height: 5rem;
}

/* Lists container */
.lists-container {
  flex: 1;
  overflow: hidden;
  position: relative;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  max-height: 100vh;
}

/* Lists wrapper */
.lists-wrapper {
  display: flex;
  gap: 1rem;
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 1rem;
  scrollbar-width: thin;
  scrollbar-color: rgb(189, 188, 188) transparent;
  position: relative;
}

/* Custom scrollbar styling */
.lists-wrapper::-webkit-scrollbar {
  height: 8px;
}

.lists-wrapper::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 4px;
}

.lists-wrapper::-webkit-scrollbar-thumb {
  background: #026AA7;
  border-radius: 4px;
}

/* List styling */
.list {
  background: var(--surface-color);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 300px;
  min-width: 300px;
  max-height: 100%;
  display: flex;
  flex-direction: column;
}

/* List header */
.list-header {
  padding: 1rem;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-color);
}

/* Task list */
.task-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Task styling */
.task {
  background: var(--surface-color);
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 1rem;
  cursor: pointer;
  transition: transform 0.2s;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.task:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 1;
}

/* Add task button */
.btn-add-task {
  margin: 1rem;
  padding: 0.5rem;
  background: none;
  border: 1px dashed #026AA7;
  color: #026AA7;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-add-task:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 1;
}

/* Modal styling */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: var(--surface-color);
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  color: var(--text-color);
}



/* Button styling */
.btn-primary {
  background-color: #026AA7;
  color: white;
  font-weight: 500;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 1;
}

.btn-secondary {
  background-color: var(--surface-color);
  font-weight: 500;
  color: var(--text-color);
  border: 1px solid #ddb609;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 1;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

/* Loading and error states */
.loading, .error {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  font-size: 1.2rem;
  color: #666;
}

.error {
  color: #dc3545;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.back-btn {
  background-image: url('../assets/images/sunset_v2.jpg');
  background-size: 100%;
  text-align: center;
  width: 192px;
  height: 56px;
  border-radius: 16px;
  position: relative;
  color: white;
  font-size: 20px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  overflow: hidden;
}

.back-btn-content {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.back-btn-icon {
  background: #cad9e9;
  border-radius: 12px;
  height: 48px;
  width: 25%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  left: 4px;
  top: 4px;
  z-index: 10;
  transition: width 0.5s ease;
}

.back-btn:hover .back-btn-icon {
  width: 184px;
}

.board-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
  color: var(--text-color);
  word-wrap: break-word;
  max-width: 500px;
}

.board-actions {
  display: flex;
  gap: 10px;
}

.task h4 {
  margin: 0 0 5px 0;
  font-size: 14px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: var(--text-color);
}

.task p {
  margin: 0;
  font-size: 0.9em;
  color: var(--text-color);
  line-height: 1.4;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.task-footer {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status {
  font-size: 0.8em;
  padding: 2px 6px;
  border-radius: 3px;
  background: #e9ecef;
  color: #495057;
  word-wrap: break-word;
  max-width: 100%;
}

.status.completed {
  background: #d4edda;
  color: #155724;
}


.modal-content h2 {
  margin: 0 0 24px 0;
  font-size: 20px;
  color: #172b4d;
  font-weight: 600;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #172b4d;
  font-weight: 500;
  font-size: 14px;
}

.form-group input[type="text"],
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #dfe1e6;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.form-group input[type="text"]:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #0079bf;
  box-shadow: 0 0 0 2px rgba(0, 121, 191, 0.1);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
}

.danger-zone {
  margin-top: 32px;
  padding-top: 24px;
}

.danger-zone h3 {
  color: #eb5a46;
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
}

.btn-icon {
  background: none;
  border: none;
  color: #6b778c;
  cursor: pointer;
  padding: 4px;
}

.btn-icon:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 1;
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

.form-group label, .from-group h2 {
  display: block;
  margin-bottom: .5rem;
  margin-top: 2rem;
  color: var(--text-color);
  font-size: 1.1rem;
}
</style> 