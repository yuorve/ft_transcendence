<script setup>
import { onMounted, onUnmounted, reactive, watch, provide, computed, ref } from "vue";
import NavBar from "./components/NavBar.vue";
import chat from "./views/Chat.vue";
import Profile from "./views/Profile.vue";
import { getProfile, API_URL } from "./api"
import { useWebSocket } from './services/websocket';

const auth = reactive({
  username: localStorage.getItem("username") || "",
  token: localStorage.getItem('token') || "",
});

const isAuthenticated = computed(() => !!auth.username);
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

const defaultProfileImage = "/src/assets/default-profile.png";

// Estado Reactivo para la Imagen de Perfil
const profileImage = ref(defaultProfileImage);

// Función para CARGAR la imagen de perfil actual
const loadProfileImage = async () => {
  if (isAuthenticated.value) {
    try {
      const response = await getProfile();
      if (response && response.length > 0 && response[0].profileImage) {
        profileImage.value = `${API_URL}${response[0].profileImage}`;
      } else {
        profileImage.value = defaultProfileImage;
      }
    } catch (error) {
      console.error("Error al obtener la imagen de perfil:", error);
      profileImage.value = defaultProfileImage;
    }
  } else {
    profileImage.value = defaultProfileImage;
  }
};

// Función para ESTABLECER una NUEVA imagen de perfil
function setProfileImage(newFullUrl) {
    if (newFullUrl) {
        profileImage.value = newFullUrl;
    } else {
        profileImage.value = defaultProfileImage;
    }
}

// Proporcionar el estado y la función de actualización
provide('profileImage', profileImage);         // Proporciona la ref reactiva
provide('setProfileImage', setProfileImage);   // Proporciona la función para actualizar

// Cargar la imagen inicial al montar el componente
onMounted(() => {
  loadProfileImage();
});

onUnmounted(() => {
    close();
});

watch(isAuthenticated, async (newValue) => {
   await loadProfileImage();
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