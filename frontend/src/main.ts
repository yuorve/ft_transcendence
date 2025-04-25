import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import GoogleLogin from "vue3-google-login";
import i18n from './i18n';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const app = createApp(App);

app.use(router);
app.use(i18n);

app.use(GoogleLogin, {
  clientId: googleClientId 
});

app.mount("#app");



// // src/main.ts
// import { createApp } from 'vue'
// import App from './App.vue'
// import router from './router'
// import GoogleLogin from 'vue3-google-login'
// import i18n, { initLanguage } from './i18n'
// import { getProfile } from './api'

// const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
// const app = createApp(App)

// // 1️⃣ Instala los plugins
// app.use(router)
// app.use(i18n)
// app.use(GoogleLogin, { clientId: googleClientId })

// // 2️⃣ Antes de montar, carga el perfil y decide el idioma
// getProfile()
//   .then(profile => {
//     // Si profile.favlang es un string válido, initLanguage lo usará
//     initLanguage(profile.favlang)
//   })
//   .catch(err => {
//     console.warn('No se pudo cargar perfil; usando idioma por defecto.', err)
//     // Llama sin argumentos para que initLanguage elija localStorage→navigator→'en'
//     initLanguage()
//   })
//   .finally(() => {
//     // 3️⃣ Monta la aplicación una vez que el idioma ya está inicializado
//     app.mount('#app')
//   })