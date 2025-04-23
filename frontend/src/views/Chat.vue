<script setup lang="ts">
import { ref, onMounted, computed, inject, watch, nextTick, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { useWebSocket, websocketState } from "../services/websocket";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const auth = inject<{ username: string }>("auth");
const logoutFunc = inject("logout");

// Referencias básicas
const token = localStorage.getItem("token") || "";
const username = ref(localStorage.getItem("username") || "");
const playerId = ref(localStorage.getItem("playerId") || "");
const buddy = ref(route.params.buddy);
const isOpen = ref(false);
const showUserList = ref(false);
const players = ref({});
const messages = ref<{ from: string; senderId: string; message: string; timestamp?: string }[]>([]);
const message = ref("");
const isAuthenticated = computed(() => auth ? !!auth.username : false);
const isDesktop = ref(window.innerWidth >= 768);
const chatBoxRef = ref<HTMLElement | null>(null);
const { connect, send, close } = useWebSocket();

//Para limpiar el chat global en cada inicio de sesion
watch(isAuthenticated, (newVal) => {
  if (!newVal) {
    // Usuario cerró sesión → limpiamos el chat
    messages.value = [];
    websocketState.messages = [];
    websocketState.processedMessages = 0;
  }
});

// Actualizar la lista de jugadores desde el localStorage
function updatePlayersList() {
  try {
    const storedPlayers = localStorage.getItem("players");
    if (storedPlayers) {
      players.value = JSON.parse(storedPlayers);
      console.log("Lista de jugadores actualizada:", players.value);
    }
  } catch (error) {
    console.error("Error al analizar datos de jugadores:", error);
  }
}

// Función para hacer scroll al último mensaje
function scrollToBottom() {
  nextTick(() => {
    if (chatBoxRef.value) {
      chatBoxRef.value.scrollTop = chatBoxRef.value.scrollHeight;
    }
  });
}

// Manejar los mensajes recibidos del WebSocket
function handleWebSocketMessages() {
  console.log("Procesando mensajes WebSocket, total:", websocketState.messages.length);
  
  websocketState.messages.forEach((data, index) => {
    if (index >= websocketState.processedMessages) {
      console.log("Procesando mensaje:", data);
      
      // Manejar mensajes de chat global
      if (data.type === 'globalChat') {
        console.log("Añadiendo mensaje de chat:", data);
        messages.value.push({
          from: data.username,
          senderId: data.senderId,
          message: data.message,
          timestamp: data.timestamp
        });
        
        // Hacer scroll hasta el último mensaje
        scrollToBottom();
      } 
      // Actualizar lista de jugadores
      else if (data.type === 'currentPlayers') {
        updatePlayersList();
      }
    }
  });
  
  // Actualizar contador de mensajes procesados
  websocketState.processedMessages = websocketState.messages.length;
}

// Función para enviar un mensaje
function sendMessage() {
  if (message.value.trim()) {
    console.log("Enviando mensaje:", message.value);
    send({
      type: 'globalChat',
      message: message.value
    });
    message.value = ""; // Limpiar el campo después de enviar
    // Hacer scroll después de enviar mensaje
    scrollToBottom();
  }
}

// Alternar visibilidad del chat
function toggleChat() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    scrollToBottom();
  }
}

// Alternar visibilidad de la lista de usuarios (para móvil)
function toggleUserList() {
  showUserList.value = !showUserList.value;
  // Necesitamos hacer scroll automático después de cambiar la vista
  nextTick(() => {
    scrollToBottom();
  });
}

// Observar cambios en los mensajes WebSocket
watch(() => websocketState.messages.length, (newLength, oldLength) => {
  if (newLength > oldLength) {
    handleWebSocketMessages();
  }
});

// Inicializar cuando se monta el componente
onMounted(() => {
  console.log("Componente Chat montado");
  
  if (!username.value) {
    router.push("/login");
  } 
  else {
    connect(token);
    updatePlayersList();
    
    // Inicializar contador de mensajes procesados si es necesario
    if (typeof websocketState.processedMessages === 'undefined') {
      websocketState.processedMessages = 0;
    }
    
    // Procesar mensajes existentes
    handleWebSocketMessages();
	  // Realizar scroll inicial
  	scrollToBottom();
	
    window.addEventListener('resize', () => {
      isDesktop.value = window.innerWidth >= 768;
    });
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', () => {
    isDesktop.value = window.innerWidth >= 768;
  });
});

</script>

<template>
  <!-- Botón flotante para abrir el chat -->
  <button v-if="isAuthenticated" v-show="!isOpen"
    @click="toggleChat"
    class="z-50 fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 transition">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none"
      viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 3.866-3.582 7-8 7a8.22 8.22 0 01-3.313-.7L3 21l1.7-4.054A6.997 6.997 0 013 12c0-3.866 3.582-7 8-7s8 3.134 8 7z" />
    </svg>
  </button>

  <div v-if="isAuthenticated" id="chatWrapper" class="relative w-full h-full">
    <!-- Contenedor del chat global -->
    <div v-show="isOpen" id="liveChatContainer"
      class="z-40 fixed bottom-4 right-4 
        w-11/12 max-w-lg md:max-w-xl lg:max-w-2xl 
        bg-white shadow-md rounded-lg 
        flex flex-col overflow-hidden 
        h-[80vh] md:h-3/5">

      <!-- Encabezado del chat -->
      <div class="bg-blue-500 text-white p-3 font-semibold flex justify-between items-center">
        <span class="text-lg md:text-xl">Live Chat</span>
        <button @click="toggleChat" class="text-lg md:text-xl cursor-pointer focus:outline-none">−</button>
      </div>

      <!-- Contenedor principal de chat -->
      <div class="flex flex-col md:flex-row flex-1 h-full overflow-hidden">
        <!-- Lista de Usuarios -->
        <div
          id="userListContainer"
          :class="{
            'hidden': !showUserList && !isDesktop,
            'flex flex-col': showUserList && !isDesktop,
            'block': isDesktop,
            'md:w-1/3': isDesktop,
            'w-full': !isDesktop
          }"
          class="bg-white p-4 border-b md:border-b-0 md:border-r border-gray-300 overflow-y-auto"
          :style="{ height: !isDesktop && showUserList ? '50%' : 'auto' }"
        >
          <h3 class="text-xs font-semibold text-gray-800 mb-4 border-b border-gray-800 pb-2">Usuarios conectados</h3>
          <ul id="userList" class="space-y-2 w-full text-xs">
            <li
              v-for="(player, id) in players"
              :key="id"
              class="p-2 hover:bg-gray-100 rounded cursor-pointer flex items-center"
            >
              <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              {{ player.username }}
            </li>
          </ul>
        </div>

        <!-- Botón para toggle en móviles -->
        <button
          id="toggleUserListButton"
          @click="toggleUserList"
          class="md:hidden border-t border-b border-gray-500 bg-blue-300 text-black p-2 text-center"
        >
          {{ showUserList ? 'Ocultar Usuarios' : 'Mostrar Usuarios' }}
        </button>

        <!-- Chat -->
        <div
          id="chatContainer"
          class="relative w-full flex-1 flex flex-col overflow-hidden"
          :style="{ height: !isDesktop && showUserList ? '50%' : '100%' }"
        >
          <div
            id="chatBox"
            ref="chatBoxRef"
            class="flex-1 overflow-y-auto p-3 space-y-3 bg-white text-sm md:text-base"
          >
            <div
              v-for="(msg, index) in messages"
              :key="index"
              class="p-2 rounded-md mb-2"
              :class="msg.senderId === playerId ? 'bg-blue-100 ml-auto max-w-[80%]' : 'bg-gray-100 max-w-[80%]'"
            >
              <div class="flex justify-between items-center mb-1">
                <strong class="text-xs">{{ msg.from }}</strong>
                <span v-if="msg.timestamp" class="text-xs text-gray-500">
                  {{ new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
                </span>
              </div>
              <div>{{ msg.message }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Input de mensajes -->
      <div id="chatInputContainer" class="flex p-2 bg-white">
        <textarea
          id="chatInput"
          placeholder="Escribe un mensaje..."
          v-model="message"
          @keyup.enter.prevent="sendMessage"
          class="flex-1 border border-gray-200 rounded-l-lg p-2 outline-none focus:ring-2 focus:ring-blue-400 text-black text-sm md:text-base resize-none"
          rows="2"
        ></textarea>
        <button 
          id="sendChatBtn"
          @click="sendMessage"
          class="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 transition duration-200">
          Enviar
        </button>
      </div>
    </div>
  </div>
</template>