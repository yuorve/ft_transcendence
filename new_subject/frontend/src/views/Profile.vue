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
  <div class="flex justify-center h-full w-full">
    <div class="w-2/5 bg-gradient-to-l from-gray-500 via-transparent to-transparent"></div>
    <div class="w-3/5 flex flex-col bg-gray-500 items-center">
      <div class="flex w-full">
        <div class="w-1/2 h-80 flex gap-8 flex-col justify-center items-center">
          <img src="../../space.jpg" alt="Profile image" class="rounded-full w-30 h-30">
          <button class="bg-blue-700 mt-0 m-10 p-3 rounded-2xl shadow-md active:bg-blue-800 active:translate-y-0.5">{{ t('changeImg') }}</button>
        </div>
        <div class="w-1/2 flex gap-8 flex-col justify-center items-center">
          <p class="text-2xl">User Name</p>
          <button class="bg-blue-700 mt-0 m-10 p-3 rounded-2xl shadow-md active:bg-blue-800 active:translate-y-0.5">{{ t('changeName') }}</button>
        </div>
      </div>
      <div class="border-2 w-full h-full rounded-md">
        opciones
      </div>
    </div>
    <div class="w-2/5 bg-gradient-to-r from-gray-500 via-transparent to-transparent"></div>
  </div>
</template>

<!-- <h2>👤 {{t("profUser")}}</h2>
<p v-if="profile">Bienvenido, {{ profile.username }}!</p>
<p v-else>{{ message }}</p>
</div> -->