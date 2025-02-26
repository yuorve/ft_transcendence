<!-- <script setup>
import { inject, computed } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const auth = inject("auth");
const logout = inject("logout");

// Computamos el estado del usuario en tiempo real
const isAuthenticated = computed(() => !!auth.username);

const handleLogout = () => {
  logout();
  router.push("/login");
};
</script>

<template>
  <nav class="navbar">
    <ul class="nav-links">
      <div class="nav-left">
        <li><router-link to="/">🏠 Inicio</router-link></li>
        <li v-if="isAuthenticated"><router-link to="/chat">💬 Chat</router-link></li>
        <li v-if="isAuthenticated"><router-link to="/pong">🎮 Pong</router-link></li>
        <li v-if="isAuthenticated"><router-link to="/tictactoe">🎮 Tic-Tac-Toe</router-link></li>
        <li v-if="isAuthenticated"><router-link to="/profile">👤 Profile</router-link></li>
      </div>
      <div class="nav-right">
        <li v-if="!isAuthenticated"><router-link to="/login">🔑 Iniciar Sesión</router-link></li>
        <li v-if="isAuthenticated"><button @click="handleLogout">{{ auth.username }} 🚪 Cerrar Sesión</button></li>
      </div>
    </ul>
  </nav>
</template>

<style scoped>
.navbar {
  background: #333;
  padding: 10px;
  text-align: center;
}

.nav-links {
  display: flex;
  justify-content: space-between; /* Distribuye los elementos */
  align-items: center; /* Centra verticalmente */
  width: 100%;
  padding: 0;
  list-style: none;
}

.nav-left {
  display: flex;
  gap: 20px; /* Espaciado entre enlaces */
}

.nav-right {
  display: flex;
  align-items: center;
}

.navbar ul li a,
.navbar ul li button {
  color: white;
  text-decoration: none;
  font-weight: bold;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px 12px;
}

.navbar ul li a:hover,
.navbar ul li button:hover {
  text-decoration: underline;
}
</style> -->


<script setup>
import { RouterLink, RouterView } from "vue-router";
import { useI18n } from 'vue-i18n';
import { setLanguage } from '../i18n';

import { inject, computed } from "vue";
import { useRouter } from "vue-router";

const { t } = useI18n();
const changeLanguage = (lang) => {
  setLanguage(lang);
};

const router = useRouter();
const auth = inject("auth");
const logout = inject("logout");

// Computamos el estado del usuario en tiempo real
const isAuthenticated = computed(() => !!auth.username);

const handleLogout = () => {
  logout();
  router.push("/login");
};

let isLogin = computed(() =>
{
  console.log("aqui es isLogin");
  console.log(isAuthenticated.value);
 return isAuthenticated.value ?  auth.username  : t("login");
});

</script>

<template>
  <nav class="bg-gradient-to-r from-blue-500 to-blue-900 flex w-full h-18 p-3 px-0 border-amber-300 border">
    <div class="flex justify-evenly items-center w-400" v-if="isAuthenticated">
      <RouterLink class="bg-red-600 p-3 rounded-xl text-white" to="/">{{ t('start') }}</RouterLink>
      <RouterLink class="bg-red-600 p-3 rounded-xl text-white" to="/chat">{{ t('chat') }}</RouterLink>
      <RouterLink class="bg-red-600 p-3 rounded-xl text-white" to="/Pong">{{ t('pong') }}</RouterLink>
      <RouterLink class="bg-red-600 p-3 rounded-xl text-white" to="/Tictactoe">{{ t('tictac') }}</RouterLink>
      <RouterLink class="bg-yellow-400 p-3 rounded-xl text-white" to="/login">{{ t('tournament') }}</RouterLink>
    </div>
    <div class="flex items-center ml-10 w-400" v-else="isAuthenticated">
      <RouterLink class="bg-gray-600 p-3 rounded-xl text-white" to="/">{{ t('start') }}</RouterLink>
    </div>
    <div class="flex flex-1 justify-end items-center sm:gap-5 gap-1">
      <div class="h-12 flex gap-2 sm:pr-2 sm:w-auto items-center sm:bg-red-600 sm:rounded-l-4xl sm:rounded-r-md text-white">
        <RouterLink class=" h-12 w-12 rounded-full flex justify-center items-center" to="/login">
          <img src="../../space.jpg" alt="Profile image" class="w-12 h-12 rounded-full cursor-pointer border-2 sm:border-0">
        </RouterLink>
        <RouterLink class="hidden sm:block" to="/profile">{{ isLogin }}</RouterLink>
        <li v-if="isAuthenticated"><button @click="handleLogout"> 🚪 </button></li>
      </div>
      <details class="rounded-lg relative z-50 mr-2">
        <summary class="cursor-pointer w-14 h-14 list-none flex items-center justify-center">
          <img src="/src/ico/spain.png" alt="SpanishFlag" class="rounded-full w-12 h-12 border-2">
        </summary>
        <div class="absolute top-full left-0 z-50 flex flex-col border-1 p-2 mt-1 w-16 -translate-x-1 gap-2 bg-gray-300 rounded-lg">
          <img src="/src/ico/spain.png" alt="SpanishFlag" @click="changeLanguage('es')" class="rounded-full w-12 h-12 border-2">
          <img src="/src/ico/UK.png" alt="UKFlag" @click="changeLanguage('en')" class="rounded-full w-12 h-12 border-2">
          <img src="/src/ico/Armenian.png" alt="ArmenianFlag" @click="changeLanguage('hy')" class="rounded-full w-12 h-12 border-2">
        </div>
      </details>
    </div>
  </nav>
  
  <RouterView/>
</template>