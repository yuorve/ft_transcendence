<!-- <script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import { useI18n } from 'vue-i18n';
import { setLanguage } from './i18n';

const { t } = useI18n();
const changeLanguage = (lang: string) => {
  setLanguage(lang);
};
</script>

<template>
  <nav class="bg-gradient-to-r from-blue-500 to-blue-900 flex w-full h-18 p-3 px-0 border-amber-300 border">
    <div class="flex justify-evenly items-center w-400">
      <RouterLink class="bg-red-600 p-3 rounded-xl text-white" to="/">{{ t('start') }}</RouterLink>
      <RouterLink class="bg-red-600 p-3 rounded-xl text-white" to="/chat">{{ t('chat') }}</RouterLink>
      <RouterLink class="bg-red-600 p-3 rounded-xl text-white" to="/Pong">{{ t('pong') }}</RouterLink>
      <RouterLink class="bg-red-600 p-3 rounded-xl text-white" to="/Tictactoe">{{ t('tictac') }}</RouterLink>
      <RouterLink class="bg-yellow-400 p-3 rounded-xl text-white" to="/login">{{ t('tournament') }}</RouterLink>
    </div>
    <div class="flex flex-1 justify-end items-center sm:gap-5 gap-1">
      <div class="h-12 flex gap-2 sm:pr-2 sm:w-auto items-center sm:bg-red-600 sm:rounded-l-4xl sm:rounded-r-md text-white">
        <RouterLink class=" h-12 w-12 rounded-full flex justify-center items-center" to="/login">
          <img src="../space.jpg" alt="Profile image" class="w-12 h-12 rounded-full cursor-pointer border-2 sm:border-0">
        </RouterLink>
        <RouterLink class="hidden sm:block" to="/profile">{{t("profile")}}</RouterLink>
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
</template> -->

<script setup>
import { reactive, provide } from "vue";
import NavBar from "./components/NavBar.vue";

const auth = reactive({
  username: localStorage.getItem("username") || "",
});

const setUsername = (name) => {
  auth.username = name;
  localStorage.setItem("username", name);
};

const logout = () => {
  auth.username = "";
  localStorage.removeItem("username");
  localStorage.removeItem("token");
};

// Proveemos `auth` y funciones globales
provide("auth", auth);
provide("setUsername", setUsername);
provide("logout", logout);
</script>

<template>
  <NavBar />
  <!-- <router-view /> -->
</template>
