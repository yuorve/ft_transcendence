<template>
  <div class="flex justify-center items-center h-full w-full" v-if="user">
    <div class="w-180 h-auto flex flex-col justify-center bg-gray-500 items-center rounded-4xl p-4">
      <div class="flex w-full">
        <div class="w-1/2 h-80 flex gap-8 flex-col justify-center items-center">
          <img :src="imageSrc" alt="Profile image" class="text-center items-center rounded-full w-30 h-30">
          <RouterLink to="/update" class="bg-blue-700 text-center mt-0 m-10 p-3 rounded-2xl shadow-md active:bg-blue-800 active:translate-y-0.5">{{ $t('changeImg') }}</RouterLink>
        </div>
        <div class="w-1/2 flex gap-8 flex-col justify-center items-center">
          <p class="text-2xl">{{ user.username }}</p>
          <button class="bg-blue-700 mt-0 m-10 p-3 rounded-2xl shadow-md">{{ $t('changeName') }}</button>
        </div>
      </div>
      <div class="w-full rounded-md">
        <div class="flex justify-around m-2">
          <div class="flex w-50 justify-center items-center bg-gray-600 rounded-md p-2">{{ user.email }}</div>
          <div class="flex w-50 justify-center items-center bg-gray-600 rounded-full p-2">cambiar email</div>
        </div>
        <div class="flex justify-around m-2">
          <div class="flex w-50 justify-center items-center bg-gray-600 rounded-md p-2">contraseña ****</div>
          <RouterLink class="flex w-50 justify-center items-center bg-gray-600 rounded-full p-2" to="/password">Actualizar Contraseña</RouterLink>
        </div>
        <div class="flex items-center justify-around">
          <RouterLink class="bg-gray-600 p-2 rounded-full" to="/games">Partidas Jugadas</RouterLink>
          <RouterLink class="bg-gray-600 p-2 rounded-full" to="/">Borrar cuenta</RouterLink>
        </div>
        <p class="text-gray-50 text-sm">🕒 Registrado el: {{ formattedDate }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getProfile, API_URL } from '../api';

const router = useRouter();
// user arranca en null para controlar con v-if
const user = ref<{ username: string; email: string; profileImage: string; created_at: string } | null>(null);

// Fallback mientras no hay imagen propia
const defaultProfileImage = '/src/assets/default-profile.png';
// Aquí guardaremos la URL final (API_URL+profileImage o fallback)
const imageSrc = ref(defaultProfileImage);

const formattedDate = computed(() => {
  if (!user.value) return '';
  return new Date(user.value.created_at).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

onMounted(async () => {
  try {
    // getProfile() ya devuelve directamente el objeto usuario
    const me = await getProfile();
    user.value = me;

    // Construimos la URL de la imagen o usamos el fallback
    imageSrc.value = me.profileImage
      ? `${API_URL}${me.profileImage}`
      : defaultProfileImage;
  } catch (err) {
    console.error('Error al cargar perfil:', err);
    // Si no está autenticado, redirigimos
    router.push('/login');
  }
});
</script>

<style scoped>
/* Tus estilos aquí */
</style>
