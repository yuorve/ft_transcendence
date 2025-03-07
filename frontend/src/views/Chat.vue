<script setup>
import { ref, onMounted } from "vue";
import { connectWebSocket, sendMessage } from "../ws";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

const username = ref(localStorage.getItem("username") || "");
const message = ref("");
const messages = ref([]);
const router = useRouter();
const { t } = useI18n();

// Si no hay usuario, redirigir al login
if (!username.value) {
  router.push("/login");
} else {
  onMounted(() => {
    connectWebSocket(username.value, (msg) => {
      messages.value.push(msg);
    });
  });
}

function sendChatMessage() {
  if (!message.value.trim()) return;
  sendMessage(username.value, message.value);
  console.log("el valor  es " + t("you"));
  messages.value.push({ username: t("you"), message: message.value });
  message.value = "";
}
</script>

<template>
  <div class="flex justify-center items-center mt-20">
    <div class="chat-container bg-amber-200 w-100 h-100 justify-center items-center flex flex-col rounded-md">
      <div class="h-10 content-center">
        <h2>💬 {{$t("IRTChat")}}</h2>
      </div>
      <div class="chat-box border shadow-md h-75 w-90 justify-items-center bg-amber-50 rounded-md">
        <p v-for="(msg, index) in messages" :key="index">
          <strong v-if="msg.system" style="color: gray">{{ msg.message }}</strong>
          <span v-else><strong>{{ msg.username }}:</strong> {{ msg.message }}</span>
        </p>
      </div>
      <div class="flex justify-around h-15 w-90">
        <div class="w-3/4 flex">
          <input class="px-auto my-3 border border-gray-400 shadow-md bg-white focus:outline-1 focus:outline-gray-700 rounded-md" v-model="message" :placeholder="$t('message')" @keyup.enter="sendChatMessage"/>
        </div>
        <div class="flex-grow justify-center flex">
          <button class="my-2 px-3 shadow-md active:translate-y-0.5 focus-none bg-green-300 active:bg-green-400 border-1 border-green-600 rounded-xl" @click="sendChatMessage">Enviar</button>
        </div>
      </div>
    </div>
                
  </div>
</template>

<style>
/* .chat-container {
  max-width: 400px;
  margin: auto;
  text-align: center;
}

.chat-box {
  border: 1px solid #ccc;
  height: 250px;
  overflow-y: auto;
  padding: 10px;
  margin-bottom: 10px;
}

input {
  padding: 8px;
  width: 80%;
  margin-right: 5px;
} */

/* button {
  background: #42b883;
  color: white;
  padding: 8px 15px;
  border: none;
  cursor: pointer;
} */
</style>
