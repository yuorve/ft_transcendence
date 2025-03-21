<script setup>
import { ref, onMounted, computed, inject } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { connectWebSocket, sendMessage } from "../ws";
import { getFriends, getChats, getUser, saveMessage } from "../api";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const auth = inject("auth");

const token = localStorage.getItem("token") || "";
const username = ref(localStorage.getItem("username") || "");
const buddy = ref(route.params.buddy);
const chatId = ref("");
const message = ref("");
const messages = ref([]);
const isOpen = ref(false); // ← para controlar si se muestra el chat
const isAuthenticated = computed(() => !!auth.username);

if (!username.value) {
  router.push("/login");
} else {
  onMounted(async () => {
    try {
      // const response = await getFriends(username.value);
      // const friend = response.friends.find(friend => friend.buddy === buddy.value);
      // if (!friend) {
      //   router.push("/friends");
      //   return;
      // }    //al recargar la pagina redirige a friends

      chatId.value = friend.id;

      const initialChats = await getChats(friend.id);
      messages.value = initialChats.chat.map(msg => ({
        username: msg.sender,
        message: msg.message
      }));

      connectWebSocket(token, chatId.value, (msg) => {
        messages.value.push(msg);
      });
    } catch (error) {
      console.error("Error al cargar los chats:", error);
    }
  });
}

function sendChatMessage() {
  if (!message.value.trim()) return;

  sendMessage(chatId.value, username.value, message.value);
  saveMessage(chatId.value, username.value, message.value);

  messages.value.push({
    username: t("you"),
    message: message.value
  });

  message.value = "";
}
</script>


<template>
  <div class="flex flex-col w-100 justify-center items-center absolute bottom-2 right-2 cursor-pointer" v-if="isAuthenticated">
    <!-- Botón / barra superior del chat -->
    <div class="h-10 content-center bg-amber-200 w-full items-center justify-center flex" :class="isOpen === true ? 'rounded-t-md' : 'rounded-md'" @click="isOpen = !isOpen">
      💬 {{ $t("IRTChat") }}: {{ buddy }}
    </div>
    
      <!-- Contenedor del chat que se muestra o se oculta -->
      <div v-show="isOpen"
        class="chat-container bg-amber-200 w-100 h-100 justify-center items-center flex flex-col rounded-b-md">
        <div class="chat-box border shadow-md h-80 w-90 justify-items-center bg-amber-50 rounded-md">
          <p v-for="(msg, index) in messages" :key="index">
            <strong v-if="msg.system" style="color: gray">{{ msg.message }}</strong>
            <span v-else><strong>{{ msg.username }}:</strong> {{ msg.message }}</span>
          </p>
        </div>
        <div class="flex justify-around h-15 w-90">
          <div class="w-3/4 flex">
            <input
              class="px-auto my-3 border border-gray-400 shadow-md bg-white focus:outline-1 focus:outline-gray-700 rounded-md"
              v-model="message" :placeholder="$t('message')" @keyup.enter="sendChatMessage" />
          </div>
          <div class="flex-grow justify-center flex">
            <button
              class="my-2 px-3 shadow-md active:translate-y-0.5 focus-none bg-green-300 active:bg-green-400 border-1 border-green-600 rounded-xl"
              @click="sendChatMessage">
              Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
</template>

