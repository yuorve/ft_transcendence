import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import GoogleLogin from "vue3-google-login";

const app = createApp(App);

app.use(router);

app.use(GoogleLogin, {
  clientId: '356337767077-dhh05bogfvl9bg7jc16r815fv8o8gkdi.apps.googleusercontent.com'
});

app.mount("#app");
