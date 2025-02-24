<script setup lang="ts">
// import { onMounted, onBeforeUnmount } from 'vue';
// import { CreateScene } from '/src/tictactoe';  // Ajusta la ruta según la ubicación de tu archivo pong.ts

// import * as BABYLON from '@babylonjs/core';
</script>

<template>
	<div class="flex h-full">
		<div class="w-1/6 flex flex-col bg-gradient-to-b from-blue-400 to-transparent">
			<div class="w-full h-80 flex flex-col gap-10 justify-center items-center">
				<img src="../../space.jpg" alt="" class=" w-30 h-30 rounded-full shadow-2xl border-2">
				<p class="bg-blue-200 border-1 border-blue-700 shadow-2xl rounded-md p-1">Jugador 1</p>
			</div>
			<div class="border-3 w-full flex-1 flex justify-center">stadistics</div>
		</div>
		<div class="flex flex-col flex-1 m-0 p-0 h-full border-l-3 border-l-blue-700 border-r-3 border-r-amber-700">
			<div class="border-b-3 border-b-gray-700 h-3/4">
				<canvas id="renderCanvasT" class="w-full h-full outline-none"></canvas>
			</div>
			<div class="bg-gradient-to-b from-gray-400 to-transparent w-full h-1/4">
			contador 3 en raya
			</div>
		</div>
		<div class="w-1/6 flex flex-col bg-gradient-to-b from-amber-400 to-transparent ">
			<div class="w-full h-80 flex flex-col gap-10 justify-center items-center">
				<img src="../../space.jpg" alt="" class=" w-30 h-30 rounded-full shadow-2xl border-2">
				<p class="bg-amber-200 border-1 border-amber-700 shadow-2xl rounded-md p-1">Jugador 2</p>
			</div>
			<div class="border-3 w-full flex-1 flex justify-center">stadistics</div>
			</div>
		</div>
</template>