<script setup>
import { RouterLink, RouterView } from "vue-router";
</script>

<template>
  <nav class="bg-gradient-to-r from-blue-500 to-blue-900 flex w-full p-3 pl-0 pr-0">
    <div class="flex justify-evenly items-center w-[80%]">
      <RouterLink class="bg-red-600 p-3 rounded-xl text-white" to="/">Inicio</RouterLink>
      <RouterLink class="bg-red-600 p-3 rounded-xl text-white" to="/chat">Chat</RouterLink>
      <RouterLink class="bg-red-600 p-3 rounded-xl text-white" to="/Pong">Pong</RouterLink>
      <RouterLink class="bg-red-600 p-3 rounded-xl text-white" to="/login">3 en raya</RouterLink>
      <RouterLink class="bg-yellow-400 p-3 rounded-xl text-white" to="/login">TORNEO</RouterLink>
    </div>
    <div class="flex justify-end items-center w-[20%]">
      <div class="flex items-center mr-4 bg-red-600 rounded-l-4xl rounded-r-md text-white pr-3">
        <img src="../space.jpg" alt="Profile image" class="rounded-full w-12 h-12 mr-2">
        <RouterLink to="/profile">Perfil</RouterLink>
      </div>
      <select class="bg-blue-200 p-2 mr-4 rounded-2xl">
        <option value="Español">Español</option>
        <option value="Inglés">Inglés</option>
        <option value="Armenio">Armenio</option>
      </select>
    </div>
  </nav>
  
  <RouterView />
</template>

<style>
/* nav {
  margin-bottom: 20px;
  font-size: 20px;
} */
</style>
