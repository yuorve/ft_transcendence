<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue';
import { CreateScene } from '/src/pong';  // Ajusta la ruta según la ubicación de tu archivo pong.ts

import * as BABYLON from '@babylonjs/core';

let engine: BABYLON.Engine;
let scene: BABYLON.Scene | null = null;

onMounted(() => {
  const canvas = document.getElementById('renderCanvasP') as HTMLCanvasElement;
  engine = new BABYLON.Engine(canvas, true);  // true para habilitar el antialiasing
  
  // Creamos una nueva escena
  scene = CreateScene(engine);
  
  // Llamamos al motor para renderizar la escena en el loop
  engine.runRenderLoop(() => {
    scene?.render();
  });

  // Aseguramos que el canvas se ajuste al cambiar el tamaño de la ventana
  window.addEventListener('resize', () => {
    engine.resize();
  });
});

// Limpiar la escena cuando el componente se desmonte
onBeforeUnmount(() => {
  if (scene) {
    scene.dispose();  // Destruye la escena cuando el componente se desmonta
  }
  if (engine) {
    engine.dispose();  // Destruye el motor cuando el componente se desmonta
  }
});
</script>

<template>
    <div class="h-[92.6%] m-0 p-0">
      <canvas id="renderCanvasP" class="p-0 m-0 w-full h-full outline-none"></canvas>
    </div>
  </template>
  