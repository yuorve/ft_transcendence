<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { googleTokenLogin } from "vue3-google-login";
import { login, googleLogin } from "../api";

const message = ref("");
const username = ref("");
const password = ref("");
const router = useRouter(); // Para redirigir después del login

// Login con Google
async function handleGoogleSuccess(response) {
  console.log("Token de Google recibido:", response.credential);

  try {
    const res = await fetch("http://localhost:4000/google-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: response.credential }),
    });

    const data = await res.json();
    console.log("Respuesta del backend:", data);

    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);
      message.value = "Inicio de sesión exitoso con Google!";

      // Esperar un poco antes de redirigir
      setTimeout(() => {
        router.push("/");
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
      message.value = "Inicio de sesión exitoso!";

      setTimeout(() => {
        router.push("/");
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
  <div class="login-container bg-amber-300">
    <h2>Iniciar Sesión</h2>

    <!-- Formulario de Login con Usuario y Contraseña -->
    <div class="login-form">
      <input v-model="username" type="text" placeholder="Usuario" class="bg-white"/>
      <input v-model="password" type="password" placeholder="Contraseña"  class="bg-white"/>
      <button @click="handleLogin" class="active:translate-y-0.5">Iniciar Sesión</button>
    </div>

    <p class="separator">O</p>

    <!-- Botón de Google Sign-In -->
    <GoogleLogin :callback="callback"/>

    <p class="text-red-500 mt-3">{{ message }}</p>
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
/* .message {
  margin-top: 15px;
  color: red;
  font-size: 14px;
} */
</style>
