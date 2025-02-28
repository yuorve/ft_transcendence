<script setup>
  import { reactive, provide } from "vue";
  import NavBar from "./components/NavBar.vue";

  const auth = reactive({
    username: localStorage.getItem("username") || "",
  });

  const setUsername = (name) => {
    auth.username = name;
    localStorage.setItem("username", name);
  };

  const logout = () => {
    auth.username = "";
    localStorage.removeItem("username");
    localStorage.removeItem("token");
  };

  // Proveemos `auth` y funciones globales
  provide("auth", auth);
  provide("setUsername", setUsername);
  provide("logout", logout);
</script>

<template>
  <NavBar />
  <!-- <router-view /> -->
</template>
