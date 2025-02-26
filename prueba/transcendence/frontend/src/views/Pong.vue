<script setup>
import { onMounted } from "vue";
import initPong from "../games/pong";

onMounted(() => {
    try {
        initPong(); // Llamamos la función del juego
    } catch (error) {
        console.error("Error al inicializar Pong:", error);
    }
});
</script>

<template>
  <div class="pong-container">
    <h2>🎮 Pong</h2>
    <canvas id="renderCanvas"></canvas>
  </div>
</template>

<style scoped>
.pong-container {
  text-align: center;
}

canvas {
  width: 100%;
  height: 400px;
  border: 2px solid #000;
}
</style>
