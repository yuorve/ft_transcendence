<script setup>
import { RouterLink, RouterView, useRouter } from "vue-router";
import { getProfile, API_URL } from "../api";
import { useI18n } from 'vue-i18n';
import { setLanguage } from '../i18n';
import { ref, watch, inject, computed, onMounted } from "vue";

const { t } = useI18n();
const changeLanguage = (lang) => {
  setLanguage(lang);
};

const router = useRouter();
const auth = inject("auth");
const logout = inject("logout");
const { locale } = useI18n();
const profileImage = ref("");

// Computamos el estado del usuario en tiempo real
const isAuthenticated = computed(() => !!auth.username);

const handleLogout = () => {
  logout();
  router.push("/login");
};

const updateProfileImage = async () => {
  const defaultProfileImage = "/src/assets/default-profile.png";
  if (isAuthenticated.value) {
    try {
      const response = await getProfile();
      profileImage.value = response[0].profileImage
        ? `${API_URL}${response[0].profileImage}`
        : defaultProfileImage;
    } catch (error) {
      console.error("Error al obtener la imagen de perfil:", error);
      profileImage.value = defaultProfileImage;
    }
  } else {    
    profileImage.value = defaultProfileImage;
  }
};

const isLogin = computed(() => {
  return isAuthenticated.value ? auth.username : t("login");
});

const movSel = computed(() => {
  return router.currentRoute.value.path == '/' ? t('start') :
   router.currentRoute.value.path =='/friends' ? t('friend') :
   router.currentRoute.value.path == '/Pong' ? t('pong') :
   router.currentRoute.value.path == '/Tictactoe' ? t('tictac') :
   router.currentRoute.value.path == '/profile' ? t('profile') :
  "unkown";
});

//const changeFlag = computed(() => {
//  return locale.value == 'es' ? "/assets/spain-quSWND2q.png" :
//  locale.value == 'en' ? "/assets/UK-CamCehN9.png" :
//  "/assets/Armenian-Ms0dSK-F.png";
//});
const changeFlag = computed(() => {
  return locale.value == 'es' ? "/src/ico/spain.png" :
  locale.value == 'en' ? "/src/ico/UK.png" :
  "/src/ico/Armenian.png";
});

// Obtener la imagen de perfil desde la API cuando el componente se monta
onMounted(async () => {
  await updateProfileImage();
});

// Cuando isAuthenticated cambie, actualiza la imagen de perfil
watch(isAuthenticated, async (newValue) => {
  await updateProfileImage();
});
</script>

<template>
   <nav class="bg-gradient-to-r from-blue-500 to-blue-900 flex w-full h-18 p-3 px-0 border-amber-300 border">
    <div class="hidden justify-evenly items-center w-400 sm:flex" v-if="isAuthenticated">
      <RouterLink class="bg-red-600 p-3 rounded-xl text-white text-center" to="/">{{ t('start') }}</RouterLink>
      <RouterLink class="bg-red-600 p-3 rounded-xl text-white text-center" to="/friends">Amigos</RouterLink>
      <RouterLink class="bg-red-600 p-3 rounded-xl text-white text-center" to="/Pong">{{ t('pong') }}</RouterLink>
      <RouterLink class="bg-red-600 p-3 rounded-xl text-white text-center" to="/Tictactoe">{{ t('tictac') }}</RouterLink>
      <RouterLink class="bg-yellow-400 p-3 rounded-xl text-white text-center" to="/tournament">{{ t('tournament') }}</RouterLink>
    </div>
    <div class="flex ml-8 items-center w-400" v-else>
      <RouterLink class="bg-green-600 p-3 rounded-xl text-white" to="/login">{{ t('start') }}</RouterLink></div>
    <details v-if="isAuthenticated" class="flex items-center w-400 sm:hidden relative z-50">
      <summary class="list-none cursor-pointer bg-red-600 p-3 w-fit rounded-xl text-white ml-3">
        <p>{{ movSel }}</p>
      </summary>
        <div class="absolute top-full left-4 z-50 flex flex-col border-1 p-2 mt-1 w-auto -translate-x-1 gap-2 bg-gray-300 rounded-lg">
          <RouterLink class="bg-red-600 p-3 rounded-xl text-white text-center" to="/">{{ t('start') }}</RouterLink>
          <RouterLink class="bg-red-600 p-3 rounded-xl text-white text-center" to="/friends">Amigos</RouterLink>
          <RouterLink class="bg-red-600 p-3 rounded-xl text-white text-center" to="/Pong">{{ t('pong') }}</RouterLink>
          <RouterLink class="bg-red-600 p-3 rounded-xl text-white text-center" to="/Tictactoe">{{ t('tictac') }}</RouterLink>
          <RouterLink class="bg-yellow-400 p-3 rounded-xl text-white text-center" to="/tournament">{{ t('tournament') }}</RouterLink>
      </div>
    </details>
    <div class="flex flex-1 justify-end items-center sm:gap-5 gap-1">
      <div v-if="isAuthenticated" class="h-12 flex gap-2 sm:pr-2 sm:w-auto items-center bg-red-600 rounded-l-4xl rounded-r-md text-white">
        <RouterLink class="h-12 w-12 rounded-full flex justify-center items-center" to="/profile">
          <img :src="profileImage" alt="Profile image"
            class="w-12 h-12 rounded-full cursor-pointer border-1">
        </RouterLink>
        <RouterLink class="sm:block" to="/profile">{{ isLogin }}</RouterLink>
        <ul v-if="isAuthenticated"><button @click="handleLogout"> 🚪 </button></ul>
      </div>
      <div v-else class="h-12 flex px-2 w-auto items-center bg-green-600 rounded-xl text-white">
        <RouterLink to="/login">{{ isLogin }}</RouterLink></div>
      <details class="rounded-lg relative z-50 mr-2">
        <summary class="cursor-pointer w-14 h-14 list-none flex items-center justify-center">
          <img :src="changeFlag" alt="Current flag" class="rounded-full w-12 h-12 border-2">
        </summary>
        <div class="absolute top-full left-0 z-50 flex flex-col border-1 p-2 mt-1 w-16 -translate-x-1 gap-2 bg-gray-300 rounded-lg">
          <img src="/src/ico/spain.png" alt="SpanishFlag" @click="changeLanguage('es')"
            class="rounded-full w-12 h-12 border-2">
          <img src="/src/ico/UK.png" alt="UKFlag" @click="changeLanguage('en')" class="rounded-full w-12 h-12 border-2">
          <img src="/src/ico/Armenian.png" alt="ArmenianFlag" @click="changeLanguage('hy')"
            class="rounded-full w-12 h-12 border-2">
        </div>
      </details>
    </div>
  </nav>

  <RouterView/>
</template>