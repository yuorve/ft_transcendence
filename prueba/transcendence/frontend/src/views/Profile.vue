<script setup>
import { ref, onMounted } from "vue";
import { getProfile } from "../api";

const profile = ref(null);
const message = ref("");

onMounted(async () => {
  const data = await getProfile();
  if (data.user) {
    profile.value = data.user;
  } else {
    message.value = "Error obteniendo perfil";
  }
});
</script>

<template>
  <div>
    <h2>👤 Perfil de Usuario</h2>
    <p v-if="profile">Bienvenido, {{ profile.username }}!</p>
    <p v-else>{{ message }}</p>
  </div>
</template>
