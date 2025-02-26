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
  <div class="login-container">
    <h2>Iniciar Sesión</h2>

    <!-- Formulario de Login con Usuario y Contraseña -->
    <div class="login-form">
      <input v-model="username" type="text" placeholder="Usuario" />
      <input v-model="password" type="password" placeholder="Contraseña" />
      <button @click="handleLogin">Iniciar Sesión</button>
    </div>

    <p class="separator">O</p>

    <!-- Botón de Google Sign-In -->
    <GoogleLogin :callback="callback"/>

    <p v-if="message" class="message">{{ message }}</p>
    <p class="text-sm text-center mt-4">
      ¿No tienes cuenta?
      <router-link to="/register" class="text-blue-500 hover:underline">Regístrate aquí</router-link>
    </p>
  </div>
</template>

<style>
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}
.login-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 250px;
}
.login-form input {
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 5px;
}
.login-form button {
  background-color: #42b883;
  color: white;
  border: none;
  padding: 10px;
  font-size: 16px;
  cursor: pointer;
  border-radius: 5px;
}
.separator {
  margin: 20px 0;
  font-size: 14px;
  color: #666;
}
.message {
  margin-top: 15px;
  color: red;
  font-size: 14px;
}
</style>
