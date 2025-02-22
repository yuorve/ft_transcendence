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
  <div class="flex h-full">
    <div class="w-1/6 bg-gradient-to-b from-blue-400 to-transparent ">
      jugador 1
    </div>
    <div class="flex flex-col flex-1 m-0 p-0 h-full border-l-3 border-l-blue-700 border-r-3 border-r-amber-700">
      <div class="border-b-3 border-b-gray-700 h-3/4">
        <canvas id="renderCanvasP" class="w-full h-full outline-none"></canvas>
      </div>
      <div class="bg-gradient-to-b from-gray-400 to-transparent w-full h-1/4">
        contador
      </div>
    </div>
    <div class="w-1/6 bg-gradient-to-b from-amber-400 to-transparent ">
      jugador 2
    </div>
  </div>
</template>

<!-- <div class="flex h-full w-full border-3 border-blue-600">
  <div class="flex flex-col w-3/4 h-full border-3 border-white">
    <div class="w-full h-1/6 border-2 border-red-200">
      jugador 1
    </div>
    <div class="border-3 border-red-900 h-3/4">
      <canvas id="renderCanvasP" class="w-full h-full outline-none"></canvas>
    </div>
    <div class="w-auto h-1/6 border-2 border-red-200">
      jugador 2
    </div>
  </div>
  <div class="border-3 border-amber-400 w-1/4 h-full">
    contador
  </div>
</div> -->
  