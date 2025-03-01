<script>
import { ref, onMounted } from "vue";
import { getProfile, API_URL } from "../api";
import defaultProfileImage from "../assets/default-profile.png"; // Imagen predeterminada en caso de que no haya foto
import { useI18n } from "vue-i18n";
import { RouterLink } from "vue-router";

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
        //console.log(this.user);
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

<template>
  <div class="flex justify-center h-full w-full">
    <div class="w-2/5 bg-gradient-to-l from-gray-500 via-transparent to-transparent"></div>
    <div class="w-3/5 flex flex-col bg-gray-500 items-center">
      <div class="flex w-full">
        <div class="w-1/2 h-80 flex gap-8 flex-col justify-center items-center">
          <img :src=user.profileImage alt="Profile image" class="text-center items-center rounded-full w-30 h-30">
          <!-- <button class="bg-blue-700 mt-0 m-10 p-3 rounded-2xl shadow-md active:bg-blue-800 active:translate-y-0.5">{{ $t('changeImg') }}</button> -->
          <RouterLink to="/update" class="bg-blue-700 text-center mt-0 m-10 p-3 rounded-2xl shadow-md active:bg-blue-800 active:translate-y-0.5">{{ $t('changeImg') }}</RouterLink>
        </div>
        <div class="w-1/2 flex gap-8 flex-col justify-center items-center">
          <p class="text-2xl">{{ user.username }}</p>
          <button class="bg-blue-700 mt-0 m-10 p-3 rounded-2xl shadow-md">{{ $t('changeName') }}</button>
        </div>
      </div>
      <div class="border-2 w-full h-full rounded-md">
        <div class="flex border-3">
          <div class="flex justify-center items-center w-1/2 border-3">{{ user.email }}</div>
          <div class="flex justify-center items-center flex-1 border-3">cambiar email</div>
        </div>
        <div class="flex border-3">
          <div class="flex justify-center items-center w-1/2 border-3">contraseña ****</div>
          <RouterLink to="/password">Actualizar Contraseña</RouterLink>
        </div>
        opciones
        <p class="text-gray-50 text-sm">🕒 Registrado el: {{ formatDate(user.created_at) }}</p>
      </div>
    </div>
    <div class="w-2/5 bg-gradient-to-r from-gray-500 via-transparent to-transparent"></div>
  </div>
</template>