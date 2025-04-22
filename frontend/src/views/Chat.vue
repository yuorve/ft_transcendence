<script setup lang="ts">
import { ref, onMounted, computed, inject } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { useWebSocket, websocketState} from "../services/websocket";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const auth = inject<{ username: string }>("auth");
const logoutFunc = inject("logout");

const token = localStorage.getItem("token") || "";
const username = ref(localStorage.getItem("username") || "");
const buddy = ref(route.params.buddy);
const isOpen = ref(false); // ← para controlar si se muestra el chat
const messages = ref<{ from: string; message: string }[]>([]);
const message = ref("");
const isAuthenticated = computed(() => auth ? !!auth.username : false);
const { connect, send, close } = useWebSocket();

if (!username.value) {
  router.push("/login");
} else {
	onMounted(() => {
		connect(token);
	});
}

function toggleChat() {
	isOpen.value = !isOpen.value;
}
</script>

<template>
	<!-- Botón flotante para abrir el chat -->
	<button v-if="isAuthenticated" v-show="!isOpen"
		@click="isOpen = true"
		class="z-50 fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 transition">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none"
			viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round"
			d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 3.866-3.582 7-8 7a8.22 8.22 0 01-3.313-.7L3 21l1.7-4.054A6.997 6.997 0 013 12c0-3.866 3.582-7 8-7s8 3.134 8 7z" />
			</svg>
	</button>

	<div v-if="isAuthenticated" id="chatWrapper" class="relative w-full h-full">
		<!-- Contenedor de chats minimizados -->
		<div id="minimizedChatsContainer"
			class="hidden absolute z-50 left-0 top-0 
			w-full max-w-lg md:max-w-xl lg:max-w-2xl 
			flex overflow-x-auto space-x-2 px-2 py-1 
			bg-red backdrop-blur-sm transition-all duration-300">
		</div>

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
			<div class="flex flex-col md:flex-row flex-1 overflow-hidden">
				<!-- Lista de Usuarios (izquierda) -->
				<div id="userListContainer"
					class="hidden md:block bg-white p-4 w-full md:w-1/3 max-w-xs h-full border-r border-gray-300 overflow-y-auto">
					<h3 class="text-xs font-semibold text-gray-800 mb-4 border-b border-gray-800 pb-2">Usuarios</h3>
					<ul id="userList" class="space-y-2 w-full text-xs"></ul>
				</div>

				<!-- Botón para Toggle en móviles -->
				<button id="toggleUserListButton"
					class="md:hidden border-t border-b border-gray-500 bg-blue-300 text-black p-2 text-center">
					Mostrar Usuarios
				</button>

				<!-- Chat principal -->
				<div id="chatContainer" class="relative w-full h-full flex flex-col">
					<div id="chatBox"
						class="flex-1 overflow-y-auto p-3 space-y-3 bg-white text-sm md:text-base max-h-[60vh]">
						<div
							v-for="(msg, index) in messages"
							:key="index"
							class="p-2 rounded-md bg-gray-100 shadow text-black"
						>
							<strong>{{ msg.from }}:</strong> {{ msg.message }}
						</div>
					</div>
					<!-- Chats privados -->
					<div id="privateChatsContainer" 
						class="absolute top-0 right-0 w-full md:w-[350px] h-[70vh] overflow-visible pointer-events-none z-0">
					</div>

				</div>
			</div>

			<!-- Input de mensajes -->
			<div id="chatInputContainer" class="flex p-2 bg-white">
				<textarea
					id="chatInput"
					placeholder="Escribe un mensaje..."
					v-model="message"
					class="flex-1 border border-gray-200 rounded-l-lg p-2 outline-none focus:ring-2 focus:ring-blue-400 text-black text-sm md:text-base resize-none"
					rows="2"
				></textarea>
				<button @click="send" id="sendChatBtn"
					class="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 transition duration-200">
					Enviar
				</button>
			</div>
		</div>
	</div>
</template>

