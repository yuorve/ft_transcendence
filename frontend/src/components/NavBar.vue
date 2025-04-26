<script setup lang="ts">
import { ref, computed, watch, inject } from 'vue'
import { useRouter, RouterLink, RouterView } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { API_URL, getUser } from '../api'        // tu helper que llama a GET /user/:username
import { initLanguage } from '../i18n'  // función para fijar el idioma global

// Inyectamos el auth (p.ej. desde App.vue provide) y logout
const auth = inject<{ username: string }>('auth')
const logout = inject<() => void>('logout')
const router = useRouter()

// i18n
const { t, locale } = useI18n()

// Estado local del usuario
const userName = ref<string>(t("login"))
const profileImage = ref<string>('/src/assets/default-profile.png')
const favLang = ref<string>('')

// Computed para saber si hay sesión
const isAuthenticated = computed(() => !!auth?.username)

// Desconexión
function handleLogout() {
  logout && logout()
  localStorage.removeItem('language')  // 🔥 Borrar idioma guardado
  initLanguage(null)                   // 🔥 Resetear idioma a navegador o 'en'
  userName.value = t("login") // 🔥 Resetear nombre de usuario
  router.push('/login')
}

// Cuando cambie el estado de autenticación, o al montar, cargamos perfil
watch(isAuthenticated, async (loggedIn) => {
  if (loggedIn && auth) {
    try {
      const { user } = await getUser(auth.username)
      userName.value = user.username
      profileImage.value = user.profileImage
        ? `${API_URL}${user.profileImage}`
        : '/src/assets/default-profile.png'
      favLang.value = user.favlang || ''
      initLanguage(favLang.value)
    } catch (err) {
      console.error('Error cargando datos de usuario:', err)
    }
  } else {
    // 🔥 Si NO estamos logeados, volver a poner idioma del navegador o 'en'
    initLanguage(null)
  }
}, { immediate: true })

// Para el icono de la bandera
const changeFlag = computed(() => {
  switch (locale.value) {
    case 'es': return '/src/ico/spain.png'
    case 'hy': return '/src/ico/Armenian.png'
    default: return '/src/ico/UK.png'
  }
})

const movSel = computed(() => {
  return router.currentRoute.value.path == '/' ? t('start') :
    router.currentRoute.value.path == '/friends' ? t('friend') :
      router.currentRoute.value.path == '/Pong' ? t('pong') :
        router.currentRoute.value.path == '/Tictactoe' ? t('tictac') :
          router.currentRoute.value.path == '/profile' ? t('profile') :
            "unkown";
});
</script>

<template>
  <nav v-if="isAuthenticated"
    class="bg-gradient-to-r from-blue-500 to-blue-900 flex w-full h-18 p-3 px-0 border-amber-300 border">
    <div class="hidden justify-evenly items-center w-3/4 sm:flex" v-if="isAuthenticated">
      <RouterLink class="bg-red-600 p-3 rounded-xl text-white text-center" to="/">{{ t('start') }}</RouterLink>
      <RouterLink class="bg-red-600 p-3 rounded-xl text-white text-center" to="/friends">Amigos</RouterLink>
      <RouterLink class="bg-red-600 p-3 rounded-xl text-white text-center" to="/Pong">{{ t('pong') }}</RouterLink>
      <RouterLink class="bg-red-600 p-3 rounded-xl text-white text-center" to="/Tictactoe">{{ t('tictac') }}
      </RouterLink>
      <RouterLink class="bg-yellow-400 p-3 rounded-xl text-white text-center" to="/tournament">{{ t('tournament') }}
      </RouterLink>
    </div>
    <!-- <div class="flex ml-8 items-center w-400" v-else>
      <RouterLink class="bg-green-600 p-3 rounded-xl text-white" to="/login">{{ t('start') }}</RouterLink>
    </div> -->
    <details v-if="isAuthenticated" class="flex items-center w-3/4 sm:hidden relative z-50">
      <summary class="list-none cursor-pointer bg-red-600 p-3 w-fit rounded-xl text-white ml-3">
        <p>{{ movSel }}</p>
      </summary>
      <div
        class="absolute top-full left-4 z-50 flex flex-col border-1 p-2 mt-1 w-auto -translate-x-1 gap-2 bg-gray-300 rounded-lg">
        <RouterLink class="bg-red-600 p-3 rounded-xl text-white text-center" to="/">{{ t('start') }}</RouterLink>
        <RouterLink class="bg-red-600 p-3 rounded-xl text-white text-center" to="/friends">Amigos</RouterLink>
        <RouterLink class="bg-red-600 p-3 rounded-xl text-white text-center" to="/Pong">{{ t('pong') }}</RouterLink>
        <RouterLink class="bg-red-600 p-3 rounded-xl text-white text-center" to="/Tictactoe">{{ t('tictac') }}
        </RouterLink>
        <RouterLink class="bg-yellow-400 p-3 rounded-xl text-white text-center" to="/tournament">{{ t('tournament') }}
        </RouterLink>
      </div>
    </details>
    <div class="flex flex-1 justify-center items-center sm:gap-5 gap-1">
      <div v-if="isAuthenticated"
        class="h-12 flex gap-2 mr-5 sm:pr-2 sm:w-auto items-center justify-center bg-red-600 rounded-l-4xl rounded-r-md text-white">
        <RouterLink class="h-12 w-12 rounded-full flex justify-center items-center" to="/profile">
          <img :src="profileImage" alt="Profile image" class="w-12 h-12 rounded-full cursor-pointer border-1">
        </RouterLink>
        <RouterLink class="sm:block" to="/profile">{{ userName }}</RouterLink>
        <ul v-if="isAuthenticated"><button @click="handleLogout"> 🚪 </button></ul>
      </div>
      <!-- <div v-else class="h-12 flex mr-10 px-2 w-auto items-center bg-green-600 rounded-xl text-white">
      <RouterLink to="/login">{{ userName }}</RouterLink>
    </div> -->
      <!-- <details class="rounded-lg relative z-50 mr-2">
        <summary class="cursor-pointer w-14 h-14 list-none flex items-center justify-center">
          <img :src="changeFlag" alt="Current flag" class="rounded-full w-12 h-12 border-2">
        </summary>
        <div
          class="absolute top-full left-0 z-50 flex flex-col border-1 p-2 mt-1 w-16 -translate-x-1 gap-2 bg-gray-300 rounded-lg">
          <img src="/src/ico/spain.png" alt="SpanishFlag" @click="changeLanguage('es')"
            class="rounded-full w-12 h-12 border-2">
          <img src="/src/ico/UK.png" alt="UKFlag" @click="changeLanguage('en')" class="rounded-full w-12 h-12 border-2">
          <img src="/src/ico/Armenian.png" alt="ArmenianFlag" @click="changeLanguage('hy')"
            class="rounded-full w-12 h-12 border-2">
        </div>
      </details> -->
    </div>
  </nav>

  <RouterView />
</template>