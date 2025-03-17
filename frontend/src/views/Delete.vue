<template>
	<div class="register-container">
	  <h2>Actualizar Contraseña</h2>
	  <form @submit.prevent="register" enctype="multipart/form-data">
		<label>Usuario</label>
  
		<label>Contraseña</label>
		<input type="password" v-model="password" required placeholder="*******" />
  
		<button type="submit" :disabled="!isFormValid">Eliminar Cuenta</button>
	  </form>
  
	</div>
  </template>
  
  <script setup>
  import { ref, computed, watch } from "vue";
  import { useRouter } from "vue-router";
  import { deleteAccount } from "../api";
  
  const router = useRouter();
  const logout = inject("logout");
  const password = ref("");
  const username = ref(localStorage.getItem("username") || "");
  
  const isFormValid = computed(() => {
	return (
	  password.value.trim() !== "" &&
	  newpassword.value.trim() !== ""
	);
  });
  
  const register = async () => {
	try {
	  const formData = new FormData();
	  formData.append("username", username.value);
	  formData.append("password", password.value);
  
	  const response = await deleteAccount(formData);
	   if (response.data.success) {
		alert(response.data.message);
        logout();
  
		router.push("/login");
	  } else {
		alert('Error al eliminar la cuenta: ' + respuesta.data.message);
	  }
	} catch (error) {
	  console.error("Error en al eliminar:", error);
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
  button:disabled {
	background: #cccccc; /* Color gris cuando está deshabilitado */
	cursor: not-allowed;
  }
  button:hover:not(:disabled) {
	background: #218838; /* Solo aplica hover cuando no está deshabilitado */
  }
  button:hover {
	background: #218838;
  }
  p {
	text-align: center;
	margin-top: 15px;
  }
  .error {
	color: #d9534f;
  }
  .success {
	color: #5cb85c;
  }
  </style>