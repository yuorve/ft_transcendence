<script setup lang="ts">
import { ref, watch, onMounted } from "vue";

const number = ref<number>(localStorage.getItem("number") ? parseInt(localStorage.getItem("number")!) : 0);


onMounted(() => {
  window.addEventListener("beforeunload", handleBeforeUnload);
});

function handleBeforeUnload() {
  localStorage.removeItem("number");
}

watch(number, (newValue) => {
  if (newValue !== 0) {
    localStorage.setItem("number", newValue.toString());
  }
});

const increment = () => {
  number.value++;
};

</script>

<template>
  <div class="justify-items-center bg-amber-300 text-center">
    <h1 class="text-green-600">Bienvenido a FT-Transcendence</h1>
    <p>Aquí irán cosas chulas</p>
  </div>
  <div class="bg-gray-300 flex items-center justify-center">
    ultimas partidas
  </div>
  <div class="bg-violet-700 h-1/2">
    <label for="numPl" class="bg-green-500">num jugadres</label>
    <input for="numPl" type="number" class="bg-white border-3" v-model="number">
    <button @click="increment" class="bg-red-400 cursor-pointer w-20">sumar {{ number }}</button>
  </div>
  <div class=""></div>
</template>
