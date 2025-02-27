<script setup>
import { ref, inject } from "vue";
import { useRouter } from "vue-router";
import { googleTokenLogin } from "vue3-google-login";
import { login, loginWithGoogle } from "../api";

const message = ref("");
const username = ref("");
const password = ref("");
const setUsername = inject("setUsername"); 
const router = useRouter(); // Para redirigir después del login

// Login con Google
async function handleGoogleSuccess(response) {
  console.log("Token de Google recibido:", response.credential);

  try {
    const data = await loginWithGoogle(response.credential);
    
    console.log("Respuesta del backend:", data);

    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);
      setUsername(data.username);
      message.value = "Inicio de sesión exitoso con Google!";

      // Esperar un poco antes de redirigir
      setTimeout(() => {
        router.push("/profile");
      }, 1000);
    } else {
      message.value = "Error en autenticación con Google";
    }
  } catch (error) {
    console.error("Error en la solicitud:", error);
    message.value = "Error en el login con Google";
  }
}

// Login con Usuario y Contraseña
async function handleLogin() {
  if (!username.value || !password.value) {
    message.value = "Usuario y contraseña son obligatorios.";
    return;
  }

  try {
    const data = await login(username.value, password.value);
    console.log("Respuesta del backend:", data);

    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", username.value);
      setUsername(username.value);
      message.value = "Inicio de sesión exitoso!";

      setTimeout(() => {
        router.push("/profile");
      }, 1000);
    } else {
      message.value = data.error || "Error en autenticación";
    }
  } catch (error) {
    console.error("Error en la solicitud:", error);
    message.value = "Error en el login";
  }
}

const callback = (response) => {
  handleGoogleSuccess(response)
}
</script>

<template>
  <div class="login-container flex flex-col justify-center items-center p-5 bg-amber-300">
    <h2>{{$t("login")}}</h2>

    <!-- Formulario de Login con Usuario y Contraseña -->
    <div class="login-form flex flex-col gap-7 w-70 items-center mt-4">
      <input id="userLog" v-model="username" type="text" :placeholder="$t('user')" class="bg-white h-10 rounded-md text-m border-1 border-gray-300 shadow-md focus:outline-1 focus:outline-gray-700"/>
      <input id="passLog" v-model="password" type="password" :placeholder="$t('password')" class="bg-white h-10 rounded-md text-m border-1 border-gray-300 shadow-md focus:outline-1 focus:outline-gray-700"/>
      <button @click="handleLogin" class="active:translate-y-0.5 bg-green-400 active:bg-green-500 w-35 h-10 rounded-md border-1 border-green-600 shadow-md">{{$t("login")}}</button>
    </div>

    <p class="separator m-3 text-md text-gray-500">O</p>

    <!-- Botón de Google Sign-In -->
    <GoogleLogin :callback="callback" class="shadow-md"/>
    <p class="text-sm text-center mt-4">
      ¿No tienes cuenta?
      <router-link to="/register" class="text-blue-500 hover:underline">Regístrate aquí</router-link>
    </p>

    <p class="text-red-500 mt-3">{{ message }}</p>
  </div>
</template>
