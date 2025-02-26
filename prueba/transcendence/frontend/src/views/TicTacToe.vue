<script setup>
import { onMounted } from "vue";
import initTicTacToe from "../games/tictactoe";

onMounted(() => {
    try {
        initTicTacToe(); // Llamamos la función del juego
    } catch (error) {
        console.error("Error al inicializar Tic Tac Toe:", error);
    }
});
</script>

<template>
  <div class="tictactoe-container">
    <h2>🎮 Tic-Tac-Toe</h2>
    <canvas id="renderCanvas"></canvas>
  </div>
</template>

<style scoped>
.tictactoe-container {
  text-align: center;
}

canvas {
  width: 100%;
  height: 400px;
  border: 2px solid #000;
}
</style>
