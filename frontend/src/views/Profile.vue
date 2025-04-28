<!-- <template>
  <div class="flex justify-center items-center h-full w-full" v-if="user">
    <div class="w-fit transition-[width] h-[80%] flex flex-col justify-center bg-red-600 items-center rounded-4xl p-4">
      <div class="flex w-full h-fit">
        <div class="w-1/2 h-full flex gap-8 flex-col justify-center items-center">
          <img :src="imageSrc" alt="Profile image" class="text-center aspect-square max-h-60 items-center rounded-full">
          <RouterLink to="/update"
            class="bg-blue-700 text-center p-3 mt-0 rounded-2xl shadow-md active:bg-blue-800 active:translate-y-0.5">
            {{ $t('changeImg') }}</RouterLink>
        </div>
        <div class="w-1/2 flex gap-4 flex-col justify-center items-center">
          <p class="bg-blue-700 p-3 rounded-2xl shadow-md">{{ $t('user') }}</p>
          <p class="text-2xl">{{ user.username }}</p>
        </div>
      </div>
      <div class="w-full h-fit rounded-md">
        <div class="flex justify-around m-2">
          <div class="flex w-50 justify-center items-center bg-gray-600 rounded-md p-2">Correo:</div>
          <div class="flex w-50 justify-center items-center bg-gray-600 rounded-md p-2">{{ user.email }}</div>
        </div>
        <div class="flex justify-around m-2">
          <RouterLink class="flex w-50 justify-center items-center bg-gray-600 rounded-full p-2" to="/password">
            Actualizar Contraseña</RouterLink>
          <div class="flex items-center space-x-2">
            <label for="favlang" class="font-semibold">Idioma:</label>
            <select id="favlang" v-model="favLang" @change="onFavLangChange" class="border rounded p-1">
              <option disabled value="">Seleccione un idioma</option>
              <option v-for="opt in languages" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
        </div>
        <div class="flex items-center justify-around">
          <RouterLink class="bg-gray-600 p-2 rounded-full" to="/games">Partidas Jugadas</RouterLink>
          <RouterLink class="bg-gray-600 p-2 rounded-full" to="/">Borrar cuenta</RouterLink>
        </div>
        <p class=" text-sm">🕒 Registrado el: {{ formattedDate }}</p>
      </div>
    </div>
  </div>
</template> -->

<template>
  <div class="w-screen  h-full py-2 flex items-center justify-center" v-if="user">
    <div class="flex flex-col landscape:flex-row landscape:lg:flex-col w-full h-full items-center justify-center gap-2">
      <div
        class="flex flex-col justify-center items-center gap-3 p-2 portrait:p-3 transition-[width, hight] duration-500 portrait:w-[90%] bg-white rounded-2xl lg:p-4">
        <img :src="imageSrc" alt="Profile image"
          class="text-center aspect-square w-20 lg:w-20 portrait:w-full portrait:max-w-20 items-center rounded-full border">
        <RouterLink to="/update"
          class="bg-blue-500 text-center hover:bg-blue-700 transition duration-500 active:translate-y-0.5 rounded-md lg:p-2 p-1 portrait:p-2 shadow-2xl lg:rounded-2xl">
          {{ t('changeImg') }}</RouterLink>
        <p class="lg:text-xl portrait:text-2xl lg:p-2 p-1 rounded lg:rounded-2xl"><strong><i> {{ t('username') }}</i></strong></p>
        <p class="border-2 p-1 rounded-xl lg:text-2xl portrait:text-2xl bg-gray-200">{{ user.username }}</p>
      </div>
      <div
        class="flex flex-col justify-center items-center gap-3 p-2 portrait:p-3 transition-[width, hight] duration-500 portrait:w-[90%] bg-white rounded-2xl lg:p-4">
        <p class="flex p-1 w-fit justify-center items-center"> <strong><i>{{t('mail')}}:</i></strong></p>
        <div class="border-2 p-1 rounded-xl lg:text-2xl portrait:text-2xl bg-gray-200">{{ user.email }}</div>
      </div>
      <div
        class="flex flex-col justify-center items-center gap-3 p-2 portrait:p-3 transition-[width, hight] duration-500 portrait:w-[90%] bg-white rounded-2xl lg:p-4">
        <RouterLink
          class="bg-blue-500 text-center hover:bg-blue-700 transition duration-500 active:translate-y-0.5 rounded-md lg:p-2 p-1 portrait:p-2 shadow-2xl lg:rounded-2xl"
          to="/password">
          {{t('changePass')}}</RouterLink>
        <div class="flex items-center">
          <label for="favlang" class="font-semibold">{{t('lang')}}:</label>
          <select id="favlang" v-model="favLang" @change="onFavLangChange" class="border rounded p-1 w-fit">
            <option disabled value="">{{t('selectLang')}}</option>
            <option v-for="opt in languages" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
      </div>
      <div
        class="flex flex-col justify-center items-center gap-3 p-2 portrait:p-3 transition-[width, hight] duration-500 portrait:w-[90%] bg-white rounded-2xl lg:p-4">
        <RouterLink class="bg-blue-500 text-center hover:bg-blue-700 transition duration-500 active:translate-y-0.5 rounded-md lg:p-2 p-1 portrait:p-2 shadow-2xl lg:rounded-2xl" to="/games">{{t('matchHistory')}}</RouterLink>
        <RouterLink class="bg-red-500 text-center hover:bg-red-700 transition duration-500 active:translate-y-0.5 rounded-md lg:p-2 p-1 portrait:p-2 shadow-2xl lg:rounded-2xl" to="/">{{t('deleteAcc')}}</RouterLink>
        <p class=" text-sm">🕒 {{t('registerDate')}}: {{ formattedDate }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getProfile, API_URL, updateFavLang } from '../api';
import { initLanguage } from '../i18n';
import { useI18n } from 'vue-i18n';

const { t } = useI18n(); // Importa la función t de vue-i18n para traducciones

interface UserProfile {
  username: string;
  email: string;
  profileImage: string;
  favlang: string | null;
  created_at: string;
}
// 1) Define la lista de idiomas que ofreces
const user = ref<UserProfile | null>(null);
const favLang = ref<string>('');
const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'hy', label: 'Հայերեն' },
];

const router = useRouter();
// user arranca en null para controlar con v-if

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
    const profile = await getProfile();
    user.value = profile;
    if (user.value) {
      imageSrc.value = user.value.profileImage
        ? `${API_URL}${user.value.profileImage}`
        : defaultProfileImage;
    }
    // Preselecciona su favlang si existe
    console.log('favLang inicial:', favLang.value);
    if (profile.favlang && languages.some(l => l.value === profile.favlang)) {
      favLang.value = profile.favlang;
    }
    console.log('favLang inicial:', favLang.value);
  } catch (err) {
    console.error('Error cargando perfil:', err);
    router.push('/login');
  }
});

async function onFavLangChange() {
  if (!user.value) return;
  try {
    await updateFavLang(user.value.username, favLang.value);
    // Re-inicializa el idioma en toda la app
    initLanguage(favLang.value);
  } catch (err) {
    console.error('Error actualizando idioma favorito:', err);
    alert('No se pudo guardar tu idioma favorito.');
  }
}
</script>
