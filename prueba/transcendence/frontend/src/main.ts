import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import GoogleLogin from "vue3-google-login";
import i18n from './i18n';

const app = createApp(App);

app.use(router);
app.use(i18n);
// app.mount('#app');

app.use(GoogleLogin, {
  clientId: '356337767077-dhh05bogfvl9bg7jc16r815fv8o8gkdi.apps.googleusercontent.com'
});

app.mount("#app");
