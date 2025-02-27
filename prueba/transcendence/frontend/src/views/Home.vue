<script setup>
// import { RouterLink, RouterView } from "vue-router";
// import { useI18n } from 'vue-i18n';
// import { setLanguage } from '../i18n';

// import { inject, computed } from "vue";
// import { useRouter } from "vue-router";
// const router = useRouter();
// const auth = inject("auth");
// const logout = inject("logout");

// // Computamos el estado del usuario en tiempo real
// const isAuthenticated = computed(() => !!auth.username);
</script>

<template>
  <div class="justify-items-center bg-amber-300 text-center">
    <h1 class="text-green-600">Bienvenido a FT-Transcendence</h1>
    <p>Aquí irán cosas chulas</p>
  </div>
  <!-- <div class="w-full h-20 bg-green-400" v-if="isAuthenticated"></div>
  <div class="w-full h-20 bg-red-400" v-else="isAuthenticated"></div> -->
  <div class="bg-gray-300 flex items-center justify-center">
    ultimas partidas
  </div>
</template>
