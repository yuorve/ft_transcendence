<script setup>
import { ref, onMounted } from "vue";
import { connectWebSocket, sendMessage } from "../ws";
import { useRouter } from "vue-router";

const username = ref(localStorage.getItem("username") || "");
const message = ref("");
const messages = ref([]);
const router = useRouter();

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
  messages.value.push({ username: "Tú", message: message.value });
  message.value = "";
}
</script>

<template>
  <div class="chat-container">
    <h2>💬 Chat en Tiempo Real</h2>

    <div class="chat-box">
      <p v-for="(msg, index) in messages" :key="index">
        <strong v-if="msg.system" style="color: gray">{{ msg.message }}</strong>
        <span v-else><strong>{{ msg.username }}:</strong> {{ msg.message }}</span>
      </p>
    </div>
    <input v-model="message" placeholder="Escribe un mensaje..." @keyup.enter="sendChatMessage" />
    <button @click="sendChatMessage">Enviar</button>
  </div>
</template>

<style>
.chat-container {
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
}

button {
  background: #42b883;
  color: white;
  padding: 8px 15px;
  border: none;
  cursor: pointer;
}
</style>
