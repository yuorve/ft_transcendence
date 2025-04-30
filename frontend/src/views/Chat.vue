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
const isMobile = ref(window.innerWidth < 650);
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
    lastMessageTime: number; // Para ordenar por actividad reciente
    unreadCount: number; // Para mostrar notificaciones
    firstUnreadIndex: number; // Nuevo: Índice del primer mensaje no leído
}
const privateChats = ref<PrivateChat[]>([]);

// Array separado para chats minimizados (aparecerán en la barra inferior)
const minimizedChatsVisible = computed(() => {
    return privateChats.value.filter((chat) => chat.minimized);
});

// Array para chats abiertos (aparecerán apilados)
const openChatsVisible = computed(() => {
    return privateChats.value.filter((chat) => !chat.minimized);
});

// Calcular posiciones basadas en el dispositivo y estado del chat global
const chatContainerHeight = computed(() => {
    if (isMobile.value) {
        return isOpen.value ? "calc(90vh - 4rem)" : "3rem";
    }
    return isOpen.value ? "calc(80vh - 2rem)" : "3.5rem";
});

// Calcular posición exacta para los chats minimizados
const minimizedChatsPosition = computed(() => {
    // Si el chat está abierto
    if (isOpen.value) {
        if (isMobile.value) {
            // Para móviles - funciona bien con este valor
            return "calc(80vh)";
        } else if (window.innerWidth < 1024) {
            // Para tablets y pantallas medianas - ajustamos para este tamaño específico
            return "calc(80vh - 180px)";
        } else {
            // Para pantallas grandes - ajustamos ligeramente
            return "calc(80vh - 160px)";
        }
    } else {
        // Cuando el chat está cerrado
        if (isMobile.value) {
            return "70px";
        } else if (window.innerWidth < 1024) {
            return "60px";
        } else {
            return "60px";
        }
    }
});

//Para limpiar el chat global en cada inicio de sesion
watch(isAuthenticated, (newVal) => {
    if (!newVal) {
        messages.value = [];
        websocketState.messages = [];
        websocketState.processedMessages = 0;
        privateChats.value = []; // También limpiamos los chats privados
    }
});

/* TO CLEAN
watch(isOpen, (newValue) => {
    if (newValue) {
        nextTick(() => {
        });
    }
});
*/

// Actualizar la lista de jugadores desde el localStorage
function updatePlayersList() {
    try {
        const storedPlayers = localStorage.getItem("players");
        if (storedPlayers) {
            players.value = JSON.parse(storedPlayers);
        }
    } catch (error) {
        console.error("Error al analizar datos de jugadores:", error);
    }
}

// Función para hacer scroll al último mensaje
function scrollToBottom(element) {
    nextTick(() => {
        if (element) {
            element.scrollTop = element.scrollHeight;
        }
    });
}

// Función para hacer scroll al primer mensaje no leído
function scrollToFirstUnread(element, chat) {
    nextTick(() => {
        if (element && chat.firstUnreadIndex >= 0) {
            // Encontrar todos los elementos de mensaje
            const messageElements = element.querySelectorAll(".message-item");

            // Si tenemos suficientes mensajes y un índice válido
            if (messageElements.length > chat.firstUnreadIndex) {
                const unreadMessage = messageElements[chat.firstUnreadIndex];

                // Scroll al mensaje no leído con un pequeño offset para mejor visibilidad
                if (unreadMessage) {
                    unreadMessage.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                    });

                    // Opcionalmente, resaltar brevemente el mensaje
                    unreadMessage.classList.add("highlight-message");
                    setTimeout(() => {
                        unreadMessage.classList.remove("highlight-message");
                    }, 2000);
                }
            } else {
                // Si no podemos encontrar el mensaje específico, hacer scroll al final
                scrollToBottom(element);
            }

            // Reiniciar el índice después de usarlo
            chat.firstUnreadIndex = -1;
        } else {
            // Si no hay un índice de mensaje no leído, hacer scroll al final
            scrollToBottom(element);
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
                scrollToBottom(chatBoxRef.value);
            }
            // Actualizar lista de jugadores
            else if (data.type === "currentPlayers") {
                updatePlayersList();
            }
            else if (data.type === "privateChat") {
                const from = data.from;
                const chatIndex = privateChats.value.findIndex(
                    (c) => c.username === from
                );

                if (chatIndex >= 0) {
                    // Actualizamos un chat existente
                    const chat = privateChats.value[chatIndex];

                    // Si está minimizado, guardamos el índice del primer mensaje no leído
                    if (chat.minimized && chat.firstUnreadIndex === -1) {
                        chat.firstUnreadIndex = chat.messages.length;
                    }

                    chat.messages.push({
                        from,
                        message: data.message,
                        timestamp: data.timestamp,
                        openChat: false,
                    });
                    chat.lastMessageTime = Date.now();

                    // Si está minimizado, incrementamos contador de no leídos
                    if (chat.minimized) {
                        chat.unreadCount++;
                    } else {
                        // Si el chat está abierto, scroll al final
                        nextTick(() => {
                            const chatElement = document.getElementById(
                                `private-chat-messages-${from}`
                            );
                            scrollToBottom(chatElement);
                        });
                    }

                    // Reordenamos los chats privados para que el más activo esté primero
                    // Sacamos y reinsertamos el chat actualizado al principio
                    const updatedChat = privateChats.value.splice(
                        chatIndex,
                        1
                    )[0];
                    privateChats.value.unshift(updatedChat);
                } else {
                    // Si el chat no existe, lo creamos y agregamos al principio
                    privateChats.value.unshift({
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
                        lastMessageTime: Date.now(),
                        unreadCount: 0,
                        firstUnreadIndex: -1,
                    });

                    // Scroll al final del chat privado recién creado
                    nextTick(() => {
                        const chatElement = document.getElementById(
                            `private-chat-messages-${from}`
                        );
                        scrollToBottom(chatElement);
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
        scrollToBottom(chatBoxRef.value);
    }
}

/* CHAT PRIVADO */
function openPrivateChat(targetUsername: string) {
    // Si ya existe, lo maximiza
    const existingChatIndex = privateChats.value.findIndex(
        (chat) => chat.username === targetUsername
    );

    if (existingChatIndex >= 0) {
        // Si existe, lo movemos al principio y lo maximizamos
        const chat = privateChats.value.splice(existingChatIndex, 1)[0];
        chat.minimized = false;
        const hadUnread = chat.unreadCount > 0;
        chat.unreadCount = 0; // Reiniciamos contador al abrir

        privateChats.value.unshift(chat);

        // Si había mensajes no leídos, hacer scroll al primer mensaje no leído
        if (hadUnread) {
            nextTick(() => {
                const chatElement = document.getElementById(
                    `private-chat-messages-${targetUsername}`
                );
                scrollToFirstUnread(chatElement, chat);
            });
        }
    } else {
        // Si no existe, crea uno nuevo al principio
        privateChats.value.unshift({
            username: targetUsername,
            messages: [],
            minimized: false,
            lastMessageTime: Date.now(),
            unreadCount: 0,
            firstUnreadIndex: -1,
        });
    }
    selectedUser.value = null; // Cerrar tooltip
}

function minimizeChat(chatUsername: string) {
    const chat = privateChats.value.find((c) => c.username === chatUsername);
    if (chat) {
        chat.minimized = true;
    }
}

function maximizeChat(chatUsername: string) {
    const chatIndex = privateChats.value.findIndex(
        (c) => c.username === chatUsername
    );
    if (chatIndex >= 0) {
        // Movemos el chat al principio y lo maximizamos
        const chat = privateChats.value.splice(chatIndex, 1)[0];
        chat.minimized = false;
        const hadUnread = chat.unreadCount > 0;
        chat.unreadCount = 0; // Reiniciamos contador al abrir

        privateChats.value.unshift(chat);

        // Si había mensajes no leídos, hacer scroll al primer mensaje no leído
        if (hadUnread && chat.firstUnreadIndex >= 0) {
            nextTick(() => {
                const chatElement = document.getElementById(
                    `private-chat-messages-${chatUsername}`
                );
                scrollToFirstUnread(chatElement, chat);
            });
        }
    }
}

function closePrivateChat(chatUsername: string) {
    privateChats.value = privateChats.value.filter(
        (chat) => chat.username !== chatUsername
    );
}

function sendPrivateMessage(targetUsername: string, text: string) {
    if (!text.trim()) return;

    // Enviar por WebSocket
    send({
        type: "privateChat",
        to: targetUsername,
        message: text,
    });

    // Buscar el chat y moverlo al inicio si existe
    const chatIndex = privateChats.value.findIndex(
        (c) => c.username === targetUsername
    );

    if (chatIndex >= 0) {
        const chat = privateChats.value.splice(chatIndex, 1)[0];
        chat.lastMessageTime = Date.now();
        chat.messages.push({
            from: auth?.username || "",
            message: text,
            timestamp: new Date().toISOString(),
            openChat: false,
        });
        privateChats.value.unshift(chat);

        // Hacer scroll al final del chat
        nextTick(() => {
            const chatElement = document.getElementById(
                `private-chat-messages-${targetUsername}`
            );
            scrollToBottom(chatElement);
        });
    }
}

// Alternar visibilidad del chat
function toggleChat() {
    isOpen.value = !isOpen.value;
    if (isOpen.value) {
        scrollToBottom(chatBoxRef.value);
    }
}

// Alternar visibilidad de la lista de usuarios (para móvil)
function toggleUserList() {
    showUserList.value = !showUserList.value;
    // Necesitamos hacer scroll automático después de cambiar la vista
    nextTick(() => {
        scrollToBottom(chatBoxRef.value);
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
        scrollToBottom(chatBoxRef.value);

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
        class="z-50 fixed bottom-4 right-4 bg-blue-500 text-white p-3 md:p-4 rounded-full shadow-lg hover:bg-blue-600 transition"
    >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-7 w-7 md:h-6 md:w-6"
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
        <!-- Chats minimizados -->
        <div
            v-show="minimizedChatsVisible.length > 0"
            class="fixed z-50 flex flex-row items-center overflow-x-auto whitespace-nowrap py-1 px-2"
            :style="{
                bottom: minimizedChatsPosition,
                right: '7px',
                width: isMobile ? '93%' : 'calc(100% - 40px)',
                maxWidth: isMobile ? '93%' : '600px',
                background: 'transparent',
                justifyContent: 'flex-end',
                zIndex: 200,
            }"
        >
            <div
                v-for="chat in minimizedChatsVisible.slice().reverse()"
                :key="`min-${chat.username}`"
                class="flex items-center bg-blue-100 hover:bg-blue-200 rounded px-2 py-1 cursor-pointer ml-2 flex-shrink-0"
                @click="maximizeChat(chat.username)"
            >
                <span class="text-xs font-medium text-blue-800">{{ chat.username }}</span>
                <span
                    v-if="chat.unreadCount > 0"
                    class="ml-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center"
                >
                    {{ chat.unreadCount }}
                </span>
            </div>
        </div>

        <!-- Contenedor del chat global -->
        <div
            v-show="isOpen"
            id="liveChatContainer"
            class="z-40 fixed bottom-0 right-2 sm:bottom-4 sm:right-4 w-11/12 sm:w-11/12 max-w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl bg-white shadow-md rounded-none sm:rounded-lg flex flex-col overflow-hidden h-[70vh] md:h-3/5 max-h-screen sm:max-h-[calc(100vh-2rem)]"
        >
            <!-- Encabezado del chat -->
            <div
                class="bg-blue-500 text-white p-2 md:p-3 font-semibold flex justify-between items-center"
            >
                <span class="text-base md:text-lg lg:text-xl">Live Chat</span>
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
                        block: true,
                        'lg:w-1/3': isDesktop,
                        'w-full': !isDesktop,
                    }"
                    class="w-2/6 bg-white p-2 md:p-4 border-b md:border-b-0 md:border-r border-gray-300 overflow-y-auto"
                    :style="{
                        height: !isDesktop && showUserList ? '40%' : 'auto',
                    }"
                >
                    <h3
                        class="text-xs font-semibold text-gray-800 mb-2 md:mb-4 border-b border-gray-300 pb-1 md:pb-2"
                    >
                        Usuarios conectados
                    </h3>
                    <ul
                        id="userList"
                        class="space-y-1 md:space-y-2 w-full text-xs"
                    >
                        <li
                            v-for="(player, id) in players"
                            :key="id"
                            class="relative p-1 md:p-2 hover:bg-gray-100 rounded cursor-pointer flex items-center"
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
                                class="absolute z-50 flex flex-col gap-1 bg-white border border-gray-300 shadow-md p-2 rounded-lg text-xs w-32 sm:w-40 top-full left-0 mt-1 items-center"
                            >
                                <img
                                    :src="player.profileImage"
                                    alt="Avatar"
                                    class="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-gray-300"
                                />
                                <div
                                    class="font-semibold text-xs sm:text-sm text-gray-800 text-center"
                                >
                                    {{ player.username }}
                                </div>
                                <button
                                    v-if="player.username !== auth?.username"
                                    class="w-full bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded text-left text-xs"
                                    @click.stop="openPrivateChat(player.username)"
                                >
                                    💬 Mensaje
                                </button>
                                <button
                                    v-if="player.username !== auth?.username"
                                    class="w-full bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded text-left text-xs"
                                    @click.stop="argo(player.username)"
                                >
                                    🚫 Bloquear
                                </button>
                                <button
                                    v-if="player.username !== auth?.username"
                                    class="w-full bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded text-left text-xs"
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
                    class="md:hidden border-t border-b border-gray-200 bg-blue-300 text-black p-1 text-xs sm:text-sm text-center"
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
                        class="flex-1 overflow-y-auto p-2 md:p-3 space-y-2 md:space-y-3 bg-white text-xs sm:text-sm md:text-base"
                    >
                        <div
                            v-for="(msg, index) in messages"
                            :key="index"
                            class="flex flex-col max-w-full"
                            :class="msg.from === auth?.username ? 'items-end' : 'items-start'"
                        >
                            <div
                                class="rounded-lg px-2 py-1 md:px-3 md:py-2 text-xs sm:text-sm md:text-base break-words"
                                :class="msg.from === auth?.username ? 'bg-blue-100 text-black' : 'bg-green-100 text-black'"
                                style="max-width: 85%; word-break: break-word"
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
                                        new Date(msg.timestamp).toLocaleTimeString([], {
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
            <div
                id="chatInputContainer"
                class="flex p-2 bg-white border-t border-gray-200"
            >
                <textarea
                    id="chatInput"
                    placeholder="Escribe un mensaje..."
                    v-model="message"
                    @keydown="(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                        }
                    }"
                    class="flex-1 border border-gray-200 rounded-l-lg p-2 outline-none focus:ring-2 focus:ring-blue-400 text-black text-xs sm:text-sm md:text-base resize-none"
                    rows="2"
                ></textarea>
                <button
                    id="sendChatBtn"
                    @click="sendMessage"
                    class="bg-blue-500 text-white px-2 sm:px-3 md:px-4 py-2 rounded-r-lg hover:bg-blue-600 transition duration-200 text-xs sm:text-sm md:text-base"
                >
                    Enviar
                </button>
            </div>
        </div>

        <!-- Contenedor para chats privados abiertos -->
        <div class="fixed z-50">
            <!-- Chats abiertos -->
            <div
                v-for="(chat, index) in openChatsVisible"
                :key="`open-${chat.username}`"
                class="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden flex flex-col"
                :style="{
                    position: 'fixed',
                    bottom: isOpen
                        ? `calc(${chatContainerHeight} + ${isMobile ? '-100px' : '-600px'})`
                        : isMobile ? '80px' : '72px',
                    right: isMobile ? '10px' : `${20 + index * 20}px`,
                    width: '250px',
                    height: isMobile ? '50vh' : '370px',
                    maxHeight: isMobile ? '400px' : '500px',
                    zIndex: 60 - index,
                }"
            >
                <!-- Encabezado del chat -->
                <div class="bg-blue-500 text-white p-2 flex justify-between items-center">
                    <span class="font-medium text-sm">{{ chat.username }}</span>
                    <div class="flex items-center space-x-1">
                        <button
                            @click="minimizeChat(chat.username)"
                            class="p-1 hover:bg-blue-600 rounded"
                        >
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                            </svg>
                        </button>
                        <button
                            @click="closePrivateChat(chat.username)"
                            class="p-1 hover:bg-blue-600 rounded"
                        >
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Cuerpo del chat -->
                <div class="flex flex-col flex-1 overflow-hidden">
                    <!-- Mensajes -->
                    <div
                        :id="`private-chat-messages-${chat.username}`"
                        class="flex-1 overflow-y-auto p-2 space-y-2"
                    >
                        <div
                            v-for="(msg, idx) in chat.messages"
                            :key="idx"
                            :class="[
                                msg.from === auth?.username ? 'flex justify-end' : 'flex justify-start',
                                'w-full message-item',
                            ]"
                        >
                            <div
                                :class="[
                                    msg.from === auth?.username ? 'bg-blue-100 text-left' : 'bg-green-100 text-left',
                                    'inline-block p-2 rounded text-xs sm:text-sm max-w-[85%] break-words whitespace-pre-wrap',
                                    idx === chat.firstUnreadIndex ? 'new-message' : '',
                                ]"
                            >
                                <div class="font-semibold text-xs">
                                    {{ msg.from }}
                                </div>
                                <div>{{ msg.message }}</div>
                                <div
                                    v-if="msg.timestamp"
                                    class="text-[10px] text-gray-500 text-right mt-1"
                                >
                                    {{
                                        new Date(msg.timestamp).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })
                                    }}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Input para mensajes privados -->
                    <div class="p-2 border-t border-gray-200 flex-shrink-0">
                        <form
                            @submit.prevent="(e) => {
                                const input = document.getElementById(`privateChatInput-${chat.username}`);
                                if (input?.value) {
                                    sendPrivateMessage(chat.username, input.value);
                                    input.value = '';
                                }
                            }"
                        >
                            <div class="flex w-full">
                                <textarea
                                    :id="`privateChatInput-${chat.username}`"
                                    placeholder="Mensaje..."
                                    rows="1"
                                    class="flex-1 p-2 border rounded-l text-xs resize-none"
                                    @keydown="(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            const input = e.target;
                                            if (input?.value.trim()) {
                                                sendPrivateMessage(chat.username, input.value.trim());
                                                input.value = '';
                                            }
                                        }
                                    }"
                                ></textarea>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Estilos para destacar los mensajes nuevos */
.new-message {
    animation: highlight 2s ease-in-out;
}

.highlight-message {
    animation: highlight 2s ease-in-out;
}

@keyframes highlight {
    0% {
        background-color: rgba(255, 255, 0, 0.2);
    }
    50% {
        background-color: rgba(255, 255, 0, 0.3);
    }
    100% {
        background-color: inherit;
    }
}
</style>
