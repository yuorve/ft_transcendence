import { createRouter, createWebHistory } from "vue-router";
import type { RouteLocationNormalized, NavigationGuardNext } from "vue-router";
import Home from "./views/Home.vue";
import Login from "./views/Login.vue";
import Profile from "./views/Profile.vue";
import Games from "./views/Games.vue";
import Register from "./views/Register.vue";
import Update from "./views/Update.vue";
import Password from "./views/Password.vue";
import Chat from "./views/Chat.vue";
import Pong from "./views/Pong.vue";
import PongOnline from "./views/Pong-online.vue";
import TicTacToe from "./views/TicTacToe.vue";
import TTTOnline from "./views/TicTacToe-online.vue";
import Tournament from "./views/Tournament.vue";
import Friends from "./views/Friends.vue";
import ConnectionLost from "./views/ConnectionLost.vue";
// @ts-ignore
import { CharacterSupportedState } from "@babylonjs/core";

const routes = [
  { path: "/", component: Home },
  { path: "/login", component: Login },
  { path: "/connection-lost", component: ConnectionLost},
  { path: "/pong-online", 
    component: PongOnline,   
    name: 'PongOnline',
    props: true,
    beforeEnter: (_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
      const token = localStorage.getItem("token");
      if (!token) {
        next("/login");
      } else {
        next();
      }
    },
  },
  { path: "/TicTacToe-online", 
    component: TTTOnline,   
    name: 'TTTOnline',
    props: true,
    beforeEnter: (_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
      const token = localStorage.getItem("token");
      if (!token) {
        next("/login");
      } else {
        next();
      }
    },
  },
  { path: "/tournament", 
    component: Tournament,
    beforeEnter: (_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
      const token = localStorage.getItem("token");
      if (!token) {
        next("/login");
      } else {
        next();
      }
    },
  },
  { path: "/register", 
    component: Register, 
    beforeEnter: (_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
      const token = localStorage.getItem("token");
      if (!token) {
        next("/login");
      } else {
        next();
      }
    },
  },
  {
    path: "/profile",
    component: Profile,
    beforeEnter: (_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
      const token = localStorage.getItem("token");
      if (!token) {
        next("/login");
      } else {
        next();
      }
    },
  },
  {
    path: "/update",
    component: Update,
    beforeEnter: (_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
      const token = localStorage.getItem("token");
      if (!token) {
        next("/login");
      } else {
        next();
      }
    },
  },
  {
    path: "/password",
    component: Password,
    beforeEnter: (_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
      const token = localStorage.getItem("token");
      if (!token) {
        next("/login");
      } else {
        next();
      }
    },
  },
  {
    path: "/chat/:buddy",
    name: 'Chats',
    component: Chat,
    props: true,
    beforeEnter: (_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
      const token = localStorage.getItem("token");
      if (!token) {
        next("/login");
      } else {
        next();
      }
    },
  },
  {
    path: "/games",
    component: Games,
    beforeEnter: (_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
      const token = localStorage.getItem("token");
      if (!token) {
        next("/login");
      } else {
        next();
      }
    },
  },
  {
    path: "/pong",
    component: Pong,
    beforeEnter: (_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
      const token = localStorage.getItem("token");
      if (!token) {
        next("/login");
      } else {
        next();
      }
    },
  },
  {
    path: "/tictactoe",
    component: TicTacToe,
    beforeEnter: (_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
      const token = localStorage.getItem("token");
      if (!token) {
        next("/login");
      } else {
        next();
      }
    },
  },
  {
    path: "/friends",
    component: Friends,
    beforeEnter: (_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
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