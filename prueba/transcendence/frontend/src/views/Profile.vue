<template>
  <div class="container mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg max-w-md">
    <h2 class="text-2xl font-semibold text-center mb-4">Perfil de Usuario</h2>

    <div class="flex flex-col items-center">
      <!-- Imagen de perfil -->
      <img
        :src="user.profileImage || defaultProfileImage"
        alt="Foto de perfil"
        class="w-32 h-32 rounded-full shadow-md mb-4 object-cover"
      />

      <!-- Información del usuario -->
      <p class="text-lg font-semibold">👤 {{ user.username }}</p>
      <p class="text-gray-600">📧 {{ user.email }}</p>
      <p class="text-gray-500 text-sm">🕒 Registrado el: {{ formatDate(user.created_at) }}</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { getProfile, API_URL } from "../api";
import defaultProfileImage from "../assets/default-profile.png"; // Imagen predeterminada en caso de que no haya foto

export default {
  data() {
    return {
      user: {
        username: "",
        email: "",
        profileImage: "",
        createdAt: "",
      },
      defaultProfileImage,
    };
  },
  async created() {
    try {
      const response = await getProfile();
      this.user = response[0];
      // Asegurar que la URL de la imagen sea accesible desde el frontend
      this.user.profileImage = this.user.profileImage
        ? `${API_URL}${this.user.profileImage}` 
        : this.defaultProfileImage; 
        console.log(this.user);
    } catch (error) {
      console.error("Error al cargar el perfil:", error);
    }
  },
  methods: {
    formatDate(dateString) {
      if (!dateString) return "Fecha desconocida";
      const options = { year: "numeric", month: "long", day: "numeric" };
      return new Date(dateString).toLocaleDateString("es-ES", options);
    },
  },
};
</script>

<style scoped>
.container {
  background-color: #f8f9fa;
}
</style>
