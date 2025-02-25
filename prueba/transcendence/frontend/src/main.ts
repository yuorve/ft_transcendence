import { createApp } from "vue";
import App from "./App.vue";
import router from "./router.ts";
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
