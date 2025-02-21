<script setup>
import { ref, onMounted } from "vue";
import { getProfile } from "../api";
import { useI18n } from "vue-i18n";

const profile = ref(null);
const message = ref("");
const { t } = useI18n();

onMounted(async () => {
  const data = await getProfile();
  if (data.user) {
    profile.value = data.user;
  } else {
    message.value = t("profError");
  }
});
</script>

<template>
  <div>
    <h2>👤 {{t("profUser")}}</h2>
    <p v-if="profile">Bienvenido, {{ profile.username }}!</p>
    <p v-else>{{ message }}</p>
  </div>
</template>
