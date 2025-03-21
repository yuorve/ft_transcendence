<script setup>
import { onMounted, onUnmounted, reactive, watch, provide } from "vue";
import NavBar from "./components/NavBar.vue";
import chat from "./views/Chat.vue";
import Profile from "./views/Profile.vue";
import { useWebSocket } from './services/websocket';

const auth = reactive({
  username: localStorage.getItem("username") || "",
  token: localStorage.getItem('token') || "",
});

const { connect, close } = useWebSocket();

watch(
    () => auth.token,
    (newToken) => {
        if (newToken) {
            console.log("conect with watch");
            console.log(newToken);
            connect(newToken);
        } else {
            close();
        }
    },
    { immediate: true } // Ejecutar el watch inmediatamente para manejar el token inicial
);

const setUsername = (name, token) => {
  auth.username = name;
  auth.token = token;
  localStorage.setItem("username", name);
  localStorage.setItem("token", token);
};

const logout = () => {
  auth.username = "";
  auth.token = "";
  localStorage.removeItem("username");
  localStorage.removeItem("token");
  close();
};

onUnmounted(() => {
    close();
});

// Proveemos `auth` y funciones globales
provide("auth", auth);
provide("setUsername", setUsername);
provide("logout", logout);
</script>

<template>
  <NavBar />
  <chat/>
  <!-- <router-view /> -->
</template>

<!-- <style>
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
  background: #f4f4f4;
}
</style> -->
