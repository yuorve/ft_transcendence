import { createRouter, createWebHistory } from "vue-router";
import Home from "./views/Home.vue";
import Login from "./views/Login.vue";
import Profile from "./views/Profile.vue";
import Chat from "./views/Chat.vue";
import Pong from "./views/Pong.vue";
import Tictactoe from "./views/Tictactoe.vue";

const routes = [
  { path: "/", component: Home },
  { path: "/login", component: Login },
  { path: "/pong", component: Pong },
  { path: "/tictactoe", component: Tictactoe },
  {
    path: "/profile",
    component: Profile,
    beforeEnter: (to, from, next) => {
      const token = localStorage.getItem("token");
      if (!token) {
        next("/login");
      } else {
        next();
      }
    },
  },
  {
    path: "/chat",
    component: Chat,
    beforeEnter: (to, from, next) => {
      const token = localStorage.getItem("token");
      if (!token) {
        next("/login");
      } else {
        next();
      }
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
