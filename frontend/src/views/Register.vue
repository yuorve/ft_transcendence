<template>
	<div class="flex items-center justify-center p-5 bg-amber-300">
		<div class="register-container">
		<h2>Registro</h2>
		<form @submit.prevent="register">
			<label>Usuario</label>
			<input type="text" v-model="username" required placeholder="Nombre de usuario" />
	
			<label>Correo Electrónico</label>
			<input type="email" v-model="email" required placeholder="correo@ejemplo.com" />
	
			<label>Contraseña</label>
			<input type="password" v-model="password" required placeholder="*******" />
	
			<label>Foto de perfil</label>
			<input type="file" @change="handleFileUpload" accept="image/*" />
	
			<button type="submit">Registrarse</button>
		</form>
	
		<p>¿Ya tienes cuenta? <router-link to="/login">Iniciar sesión</router-link></p>
		</div>
	</div>
  </template>
  
  <script setup>
  import { ref } from "vue";
  import { useRouter } from "vue-router";
  import { registerUser } from "../api";
  
  const router = useRouter();
  const username = ref("");
  const email = ref("");
  const password = ref("");
  const profileImage = ref(null);
  
  const handleFileUpload = (event) => {
	profileImage.value = event.target.files[0];
  };
  
  const register = async () => {
	try {
	  const formData = new FormData();
	  formData.append("username", username.value);
	  formData.append("email", email.value);
	  formData.append("password", password.value);
	  if (profileImage.value) {
		formData.append("profileImage", profileImage.value, profileImage.value.name);
	  }
  
	  await registerUser(formData);
	  // Mensaje de éxito
	  alert("Registro completado con éxito.");
	  
	  router.push("/login"); // Redirige al login tras registrarse
	} catch (error) {
	  console.error("Error en el registro:", error);
	}
  };
  </script>
  
  <style scoped>
  .register-container {
	max-width: 400px;
	margin: auto;
	padding: 20px;
	background: #f8f8f8;
	border-radius: 8px;
	box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
  h2 {
	text-align: center;
	color: #333;
  }
  form {
	display: flex;
	flex-direction: column;
  }
  label {
	margin-top: 10px;
	font-weight: bold;
  }
  input {
	padding: 10px;
	margin-top: 5px;
	border: 1px solid #ccc;
	border-radius: 5px;
  }
  button {
	margin-top: 15px;
	padding: 10px;
	background: #28a745;
	color: white;
	border: none;
	border-radius: 5px;
	cursor: pointer;
  }
  button:hover {
	background: #218838;
  }
  p {
	text-align: center;
	margin-top: 15px;
  }
  </style>