<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import { useI18n } from 'vue-i18n';
import { setLanguage } from './i18n';

const { t } = useI18n();
const changeLanguage = (lang: string) => {
  setLanguage(lang);
};
</script>

<template>
  <nav class="bg-gradient-to-r from-blue-500 to-blue-900 flex w-full h-[7%] p-3 px-0 border-amber-300 border">
    <div class="flex justify-evenly items-center w-[80%]">
      <RouterLink class="bg-red-600 p-3 rounded-xl text-white" to="/">{{ t('start') }}</RouterLink>
      <RouterLink class="bg-red-600 p-3 rounded-xl text-white" to="/chat">{{ t('chat') }}</RouterLink>
      <RouterLink class="bg-red-600 p-3 rounded-xl text-white" to="/Pong">{{ t('pong') }}</RouterLink>
      <RouterLink class="bg-red-600 p-3 rounded-xl text-white" to="/login">{{ t('tictac') }}</RouterLink>
      <RouterLink class="bg-yellow-400 p-3 rounded-xl text-white" to="/login">{{ t('tournament') }}</RouterLink>
    </div>
    <div class="flex justify-end items-center w-[20%]">
      <div class="flex items-center mr-4 bg-red-600 rounded-l-4xl rounded-r-md text-white pr-3">
        <img src="../space.jpg" alt="Profile image" class="rounded-full w-12 h-12 mr-2">
        <RouterLink to="/profile">{{t("profile")}}</RouterLink>
      </div>
      <img src="/src/ico/spain.png" alt="spanishFlag" @click="changeLanguage('es')" class="rounded-full w-12 h-12 mr-2">
      <img src="/src/ico/UK.png" alt="UKFlag" @click="changeLanguage('en')" class="rounded-full w-12 h-12 mr-2">
      <img src="/src/ico/Armenian.png" alt="ArmenianFlag" @click="changeLanguage('es')" class="rounded-full w-12 h-12 mr-2">
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
