<script setup>
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
</style>
