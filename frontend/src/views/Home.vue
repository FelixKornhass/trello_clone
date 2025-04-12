<!-- Home.vue - Landing page view displaying user's boards -->
<template>
  <!-- Main boards list container -->
  <div class="boards-list">
    <h1>My Boards</h1>
    <!-- Grid layout for board cards -->
    <div class="boards-grid">
      <!-- Loop through boards and display each as a card -->
      <div 
        v-for="board in boards" 
        :key="board.id" 
        class="board-card"
        @click="navigateToBoard(board.id)"
      >
        <h3>{{ board.name }}</h3>
        <p>{{ board.lists.length }} lists</p>
      </div>
      <!-- Special card for creating a new board -->
      <div class="board-card add-board" @click="createBoard">
        <h3>+ Create New Board</h3>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default {
  name: 'Home',
  setup() {
    // Initialize store and router
    const store = useStore();
    const router = useRouter();

    // Get boards from Vuex store
    const boards = computed(() => store.state.board.boards);

    // Navigate to a specific board
    const navigateToBoard = (boardId) => {
      router.push(`/board/${boardId}`);
    };

    // Create a new board
    const createBoard = () => {
      // Prompt user for board name
      const name = prompt('Enter board name:');
      if (name) {
        // Dispatch action to add board to store
        store.dispatch('board/addBoard', name);
        // Get the newly created board and navigate to it
        const newBoard = boards.value[boards.value.length - 1];
        navigateToBoard(newBoard.id);
      }
    };

    // Return reactive variables and functions for template use
    return {
      boards,
      navigateToBoard,
      createBoard
    };
  }
};
</script>

<style scoped>
/* Main container styling */
.boards-list {
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Heading styling */
.boards-list h1 {
  margin-bottom: 30px;
  color: var(--text-color);
  font-size: 28px;
}

/* Board card styling */
.board-card {
  background: #fff;
  border-radius: 3px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 0 var(--shadow-color);
}

/* Board card hover effect */
.board-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px var(--shadow-color);
}

/* Board card title styling */
.board-card h3 {
  color: var(--text-color);
  margin-bottom: 8px;
}

/* Board card meta info styling */
.board-card p {
  color: var(--text-secondary);
  font-size: 14px;
}

/* Create board card styling */
.add-board {
  background: var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
}

/* Create board card title styling */
.add-board h3 {
  color: var(--text-secondary);
  font-weight: 500;
}

/* Create board card hover effect */
.add-board:hover {
  background: #e2e4e6;
}
</style>
