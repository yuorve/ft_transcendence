<script setup lang="ts">
import {
    ref,
    onMounted,
    computed,
    inject,
    watch,
    nextTick,
    onUnmounted,
} from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { useWebSocket, websocketState } from "../services/websocket";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const auth = inject<{ username: string }>("auth");

// Referencias básicas
const token = localStorage.getItem("token") || "";
const username = ref(localStorage.getItem("username") || "");
const playerId = ref(localStorage.getItem("playerId") || "");
const buddy = ref(route.params.buddy);
const isOpen = ref(false);
const showUserList = ref(false);
const players = ref({});
const messages = ref<
    {
        from: string;
        senderId: string;
        message: string;
        profileImage?: string;
        timestamp?: string;
    }[]
>([]);
const message = ref("");
const isAuthenticated = computed(() => (auth ? !!auth.username : false));
const isDesktop = ref(window.innerWidth >= 768);
const chatBoxRef = ref<HTMLElement | null>(null);
const { connect, send, close } = useWebSocket();

interface PrivateChat {
    username: string;
    messages: {
        from: string;
        message: string;
        timestamp?: string;
        openChat: boolean;
    }[];
    minimized: boolean;
}
const privateChats = ref<PrivateChat[]>([]);

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
            console.log("Jugadores actualizados:", players.value); // Añade este log
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
    console.log(
        "Procesando mensajes WebSocket, total:",
        websocketState.messages.length
    );

    websocketState.messages.forEach((data, index) => {
        if (index >= websocketState.processedMessages) {
            console.log("Mensaje recibido:", data);
            // Manejar mensajes de chat global
            if (data.type === "globalChat") {
                messages.value.push({
                    from: data.username,
                    senderId: data.senderId,
                    message: data.message,
                    timestamp: data.timestamp,
                });

                // Hacer scroll hasta el último mensaje
                scrollToBottom();
            }
            // Actualizar lista de jugadores
            else if (data.type === "currentPlayers") {
                updatePlayersList();
            }
            if (data.type === "privateChat") {
                const from = data.from;
                const chat = privateChats.value.find(
                    (c) => c.username === from
                );

                if (chat) {
                    chat.messages.push({
                        from,
                        message: data.message,
                        timestamp: data.timestamp,
                        openChat: false,
                    });
                } else {
                    // Si el chat no existe, créalo y agrega el primer mensaje
                    privateChats.value.push({
                        username: from,
                        messages: [
                            {
                                from,
                                message: data.message,
                                timestamp: data.timestamp,
                                openChat: true,
                            },
                        ],
                        minimized: false,
                    });
                }
            }
        }
    });

    // Actualizar contador de mensajes procesados
    websocketState.processedMessages = websocketState.messages.length;
}

/* CHAT GLOBAL */
// Función para enviar un mensaje
function sendMessage() {
    if (message.value.trim()) {
        console.log("Enviando mensaje:", message.value);
        send({
            type: "globalChat",
            message: message.value,
        });
        message.value = ""; // Limpiar el campo después de enviar
        // Hacer scroll después de enviar mensaje
        scrollToBottom();
    }
}

/* CHAT PRIVADO */
function openPrivateChat(targetUsername: string) {
    // Si ya existe, lo maximiza
    const existingChat = privateChats.value.find(
        (chat) => chat.username === targetUsername
    );
    if (existingChat) {
        existingChat.minimized = false;
    } else {
        // Si no existe, crea uno nuevo
        privateChats.value.push({
            username: targetUsername,
            messages: [],
            minimized: false,
        });
    }
    selectedUser.value = null; // Cerrar tooltip
}

function sendPrivateMessage(targetUsername: string, text: string) {
    if (!text.trim()) return;

    // Enviar por WebSocket
    send({
        type: "privateChat",
        to: targetUsername,
        message: text,
    });

    // Agregar en el chat localmente
    const chat = privateChats.value.find((c) => c.username === targetUsername);
    if (chat) {
        chat.messages.push({
            from: auth?.username || "",
            message: text,
            timestamp: new Date().toISOString(),
            openChat: false,
        });
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

window.addEventListener("resize", () => {
    isDesktop.value = window.innerWidth >= 768;
});

// Observar cambios en los mensajes WebSocket
watch(
    () => websocketState.messages.length,
    (newLength, oldLength) => {
        if (newLength > oldLength) {
            handleWebSocketMessages();
        }
    }
);

// Inicializar cuando se monta el componentes
onMounted(() => {
    console.log("Componente Chat montado");

    if (!username.value) {
        router.push("/login");
    } else {
        connect(token);
        updatePlayersList();

        // Inicializar contador de mensajes procesados si es necesario
        if (typeof websocketState.processedMessages === "undefined") {
            websocketState.processedMessages = 0;
        }

        // Procesar mensajes existentes
        handleWebSocketMessages();
        // Realizar scroll inicial
        scrollToBottom();

        window.addEventListener("resize", () => {
            isDesktop.value = window.innerWidth >= 768;
        });
        document.addEventListener("click", handleClickOutside);
    }
});

onUnmounted(() => {
    window.removeEventListener("resize", () => {
        isDesktop.value = window.innerWidth >= 768;
    });
    document.removeEventListener("click", handleClickOutside);
    close();
});

const selectedUser = ref<string | null>(null);
const tooltipRefs = ref<Record<string, HTMLElement | null>>({});

function toggleTooltip(username: string) {
    selectedUser.value = selectedUser.value === username ? null : username;
}

// Cierra el tooltip si se hace clic fuera
function handleClickOutside(event: MouseEvent) {
    if (selectedUser.value && tooltipRefs.value[selectedUser.value]) {
        const tooltip = tooltipRefs.value[selectedUser.value];
        if (tooltip && !tooltip.contains(event.target as Node)) {
            selectedUser.value = null;
        }
    }
}

function argo(username: string) {
    alert("Hola " + username);
}
</script>

<template>
    <!-- Botón flotante para abrir el chat -->
    <button
        v-if="isAuthenticated"
        v-show="!isOpen"
        @click="toggleChat"
        class="z-50 fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 transition"
    >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 3.866-3.582 7-8 7a8.22 8.22 0 01-3.313-.7L3 21l1.7-4.054A6.997 6.997 0 013 12c0-3.866 3.582-7 8-7s8 3.134 8 7z"
            />
        </svg>
    </button>

    <div v-if="isAuthenticated" id="chatWrapper" class="relative w-full h-full">
        <!-- Contenedor del chat global -->
        <div
            v-show="isOpen"
            id="liveChatContainer"
            class="z-40 fixed bottom-4 right-4 w-11/12 max-w-lg md:max-w-xl lg:max-w-2xl bg-white shadow-md rounded-lg flex flex-col overflow-hidden h-[80vh] md:h-3/5 max-h-[calc(100vh-2rem)] overflow-y-auto"
        >
            <!-- Encabezado del chat -->
            <div
                class="bg-blue-500 text-white p-3 font-semibold flex justify-between items-center"
            >
                <span class="text-lg md:text-xl">Live Chat</span>
                <button
                    @click="toggleChat"
                    class="text-lg md:text-xl cursor-pointer focus:outline-none"
                >
                    −
                </button>
            </div>

            <!-- Contenedor principal de chat -->
            <div
                class="flex flex-col md:flex-row flex-1 h-full overflow-hidden"
            >
                <!-- Lista de Usuarios -->
                <div
                    id="userListContainer"
                    :class="{
                        hidden: !showUserList && !isDesktop,
                        'flex flex-col': showUserList && !isDesktop,
                        block: isDesktop,
                        'md:w-1/3': isDesktop,
                        'w-full': !isDesktop,
                    }"
                    class="bg-white p-4 border-b md:border-b-0 md:border-r border-gray-300 overflow-y-auto"
                    :style="{
                        height: !isDesktop && showUserList ? '40%' : 'auto',
                    }"
                >
                    <h3
                        class="text-xs font-semibold text-gray-800 mb-4 border-b border-gray-800 pb-2"
                    >
                        Usuarios conectados
                    </h3>
                    <ul id="userList" class="space-y-2 w-full text-xs">
                        <li
                            v-for="(player, id) in players"
                            :key="id"
                            class="relative p-2 hover:bg-gray-100 rounded cursor-pointer flex items-center"
                            @click.stop="toggleTooltip(player.username)"
                        >
                            <span
                                class="w-2 h-2 bg-green-500 rounded-full mr-2"
                            ></span>
                            {{ player.username }}

                            <!-- Tooltip -->
                            <div
                                v-show="selectedUser === player.username"
                                ref="el => tooltipRefs.value[player.username] = el"
                                class="absolute z-50 flex flex-col gap-1 bg-white border border-gray-300 shadow-md p-2 rounded-lg text-xs w-40 top-full left-0 mt-1 items-center"
                            >
                                <img
                                    :src="player.profileImage"
                                    alt="Avatar"
                                    class="w-12 h-12 rounded-full border border-gray-300"
                                />
                                <div
                                    class="font-semibold text-sm text-gray-800 text-center"
                                >
                                    {{ player.username }}
                                </div>
                                <button
                                    v-if="player.username !== auth?.username"
                                    class="w-full bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded text-left"
                                    @click.stop="
                                        openPrivateChat(player.username)
                                    "
                                >
                                    💬 Mensaje
                                </button>
                                <button
                                    v-if="player.username !== auth?.username"
                                    class="w-full bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded text-left"
                                    @click.stop="argo(player.username)"
                                >
                                    🚫 Bloquear
                                </button>
                                <button
                                    v-if="player.username !== auth?.username"
                                    class="w-full bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded text-left"
                                    @click.stop="argo(player.username)"
                                >
                                    🎮 Invitar
                                </button>
                            </div>
                        </li>
                    </ul>
                </div>

                <!-- Botón para toggle en móviles -->
                <button
                    id="toggleUserListButton"
                    @click="toggleUserList"
                    class="md:hidden border-t border-b border-gray-500 bg-blue-300 text-black p-2 text-center"
                >
                    {{ showUserList ? "Ocultar Usuarios" : "Mostrar Usuarios" }}
                </button>

                <!-- Chat -->
                <div
                    id="chatContainer"
                    class="relative w-full flex-1 flex flex-col overflow-hidden"
                    :style="{
                        height: !isDesktop && showUserList ? '50%' : '100%',
                    }"
                >
                    <div
                        id="chatBox"
                        ref="chatBoxRef"
                        class="flex-1 overflow-y-auto p-3 space-y-3 bg-white text-sm md:text-base"
                    >
                        <div
                            v-for="(msg, index) in messages"
                            :key="index"
                            class="flex flex-col max-w-full"
                            :class="
                                msg.from === auth?.username
                                    ? 'items-end'
                                    : 'items-start'
                            "
                        >
                            <div
                                class="rounded-lg px-3 py-2 text-sm md:text-base break-words"
                                :class="
                                    msg.from === auth?.username
                                        ? 'bg-blue-100 text-black self-start'
                                        : 'bg-green-100 text-black self-end'
                                "
                                style="max-width: 80%; word-break: break-word"
                            >
                                <div class="text-xs font-semibold mb-1">
                                    {{ msg.from }}
                                </div>
                                <div class="whitespace-pre-wrap break-words">
                                    {{ msg.message }}
                                </div>
                                <div
                                    v-if="msg.timestamp"
                                    class="text-[10px] text-gray-500 text-right mt-1"
                                >
                                    {{
                                        new Date(
                                            msg.timestamp
                                        ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })
                                    }}
                                </div>
                            </div>
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
                    @keydown="
                        (e) => {
                            // Si presionamos Enter sin Shift, prevenimos el comportamiento por defecto (para enviar el mensaje)
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                            }
                        }
                    "
                    class="flex-1 border border-gray-200 rounded-l-lg p-2 outline-none focus:ring-2 focus:ring-blue-400 text-black text-sm md:text-base resize-none"
                    rows="2"
                ></textarea>
                <button
                    id="sendChatBtn"
                    @click="sendMessage"
                    class="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 transition duration-200"
                >
                    Enviar
                </button>
            </div>
        </div>

        <!-- Chats Privados flotantes -->
        <div
            v-for="chat in privateChats"
            :key="chat.username"
            class="fixed bottom-4 right-2 z-50"
            :style="{ right: `${2 + privateChats.indexOf(chat) * 300}px` }"
        >
            <div
                class="bg-white w-72 shadow-md rounded-lg overflow-hidden flex flex-col"
                :class="{ 'h-10': chat.minimized, 'h-96': !chat.minimized }"
            >
                <!-- Encabezado -->
                <div
                    class="bg-blue-500 text-white p-2 flex justify-between items-center h-10"
                >
                    <span class="font-semibold text-sm">{{
                        chat.username
                    }}</span>
                    <div class="flex gap-2">
                        <!-- Botón para minimizar -->
                        <button
                            @click="chat.minimized = !chat.minimized"
                            class="cursor-pointer"
                        >
                            <svg
                                class="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    :d="
                                        chat.minimized
                                            ? 'M12 4v16M4 12h16'
                                            : 'M20 12H4'
                                    "
                                />
                            </svg>
                        </button>
                        <!-- Botón para cerrar el chat -->
                        <button
                            @click="
                                privateChats = privateChats.filter(
                                    (c) => c.username !== chat.username
                                )
                            "
                            class="cursor-pointer"
                        >
                            <svg
                                class="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Cuerpo del chat -->
                <div
                    v-show="!chat.minimized"
                    class="flex-1 flex flex-col overflow-hidden"
                >
                    <div class="flex-1 overflow-y-auto p-2 space-y-2">
                        <div
                            v-for="(msg, idx) in chat.messages"
                            :key="idx"
                            :class="
                                msg.from === auth?.username
                                    ? 'text-right'
                                    : 'text-left'
                            "
                        >
                            <div
                                class="inline-block bg-gray-100 p-2 rounded text-xs max-w-[80%] break-words whitespace-pre-wrap"
                            >
                                <strong>{{ msg.from }}:</strong>
                                {{ msg.message }}
                            </div>
                        </div>
                    </div>

                    <!-- Input para enviar -->
                    <div
                        v-show="!chat.minimized"
                        class="p-2 border-t border-gray-200"
                    >
                        <form
                            @submit.prevent="
                                (e) => {
                                    const input =
                                        document.getElementById(
                                            'PrivateChatInput'
                                        );
                                    if (input?.value) {
                                        sendPrivateMessage(
                                            chat.username,
                                            input.value
                                        );
                                        input.value = '';
                                    }
                                }
                            "
                        >
                            <textarea
                                id="PrivateChatInput"
                                placeholder="Mensaje..."
                                rows="2"
                                class="w-full p-1 border rounded text-sm resize-none"
                                @keydown="
                                    (e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            const input = e.target;
                                            if (input?.value.trim()) {
                                                sendPrivateMessage(
                                                    chat.username,
                                                    input.value.trim()
                                                );
                                                input.value = '';
                                            }
                                        }
                                    }
                                "
                            ></textarea>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
