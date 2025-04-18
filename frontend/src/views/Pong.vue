<!-- <script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref, watch } from "vue";
import initPong from "../games/pong";
import { puntuation } from "../games/pong";
import { Engine, Scene } from "@babylonjs/core";
import { useRoute, useRouter } from "vue-router";
import { API_URL, createGame, generateId, getProfile, updateGame, getGame, noPlayer } from "../api";
import type { Game } from "../api";

let scene: Scene | null = null;
let engine: Engine | null = null;
const auth = inject<{ username: string }>("auth");
const route = useRoute();
const hasQueryParams = Object.keys(route.query).length > 0;
const profileImage = ref("");
const gameid = String(
  Array.isArray(route.query.gameid)
    ? route.query.gameid[0]
    : route.query.gameid || generateId()
  );
const gameidWinner = computed<string>(() => {
  const raw = route.query.gameidWinner
  if (typeof raw === 'string') {
    return raw
  }
  if (Array.isArray(raw)) {
    // raw[0] es string|undefined → coalescemos a ''
    return raw[0] ?? ''
  }
  return ''  // cubrimos null/undefined
})
const { game: thisGame }: { game: Game } = await getGame(gameid);
const { game: winnerGame }: { game: Game } = await getGame(gameidWinner.value);
const username = ref("");
const player1 = thisGame.player1 || auth?.username;
const player2 = thisGame.player2 || "Invitado";
if (!auth) {
  throw new Error("No se encontró al usuario");
}

// Obtener la imagen de perfil desde la API cuando el componente se monta
onMounted(async () => {
  const defaultProfileImage = "../assets/default-profile.png";
  try {
    const profileData = await getProfile(); // Llamada a la API
    profileImage.value = profileData[0].profileImage
      ? `${API_URL}${profileData[0].profileImage}` 
      : defaultProfileImage;
	  username.value = profileData[0].username;
  } catch (error) {
    console.error("Error al obtener la imagen de perfil:", error);
    profileImage.value = defaultProfileImage;
	username.value = "Usuario";
  }
});

onMounted(() => {
  try {
    const result = initPong(); // Llamamos la función del juego
    scene = result.scene;
    engine = result.engine;
    if (!hasQueryParams)
    {
      console.log("crando juego");
      createGame(gameid, "pong", 0, player1 as string, player2 as string, "0", "0");
    }
  } catch (error) {
    console.error("Error al inicializar Pong:", error);
  }
});

onUnmounted(() => {
  if (scene) {
    scene.dispose(); // Eliminar la escena de Babylon.js
    scene = null;
  }
  if (engine) {
    engine.dispose(); // Apagar el motor de Babylon.js
    engine = null;
  }
  puntuation.pr = 0;  //sin estas dos lineas la puntuación se guarda aunque se cambie de vista
  puntuation.pl = 0;
});

const sendrouter = useRouter();
const sendPunt = (winner: string) => {
  console.log("id de la partida del ganador es", gameidWinner.value)
  console.log("el ganador es", winner)
  
  // Primero actualizas la partida actual:
  updateGame(thisGame.game, player1 as string, player2 as string, String(puntuation.pl), String(puntuation.pr))

  // Luego la partida siguiente, si realmente hay query params y un id válido:
  if (hasQueryParams && gameidWinner.value) {
    if (winnerGame.player1 == noPlayer)
      updateGame(gameidWinner.value, winner, winnerGame.player2 as string, "", "");
    else if (winnerGame.player2 == noPlayer)
      updateGame(gameidWinner.value, winnerGame.player1, winner, "", "");
    else
      console.warn("Error al actualizar ganador.");
  }

  setTimeout(() => {
    sendrouter.push({ path: "/Tournament" })
  }, 2000)
}

// Observa la puntuación del lado izquierdo
watch(
  () => puntuation.pl,
  (newVal) => {
    if (newVal >= 5) {
      console.log("¡La puntuación del jugador izquierdo ha llegado a 5!");
      sendPunt(player1 as string);
    }
  }
);

// Observa la puntuación del lado derecho
watch(
  () => puntuation.pr,
  (newVal) => {
    if (newVal >= 5) {
      console.log("¡La puntuación del jugador derecho ha llegado a 5!");
      sendPunt(player2 as string);
    }
  }
);
</script>

<template>
  <div class="flex flex-col m-0 p-0 h-full">
    <div class="border-b-3 border-b-gray-700 h-3/4">
      <canvas id="renderCanvas" class="w-full h-full outline-none"></canvas>
    </div>
    <div class="flex justify-center items-center bg-gradient-to-r from-blue-700 to-amber-400 w-full h-1/4">
      <div class="w-1/3 h-full flex justify-center gap-5 items-center">
        <img :src="profileImage" alt="" class=" w-30 h-30 rounded-full shadow-2xl border-2">
        <p class="text-5xl bg-blue-200 border-1 p-2 border-blue-700 shadow-2xl rounded-md">{{ player1 }}</p>
      </div>
      <div class="w-1/3 flex justify-around">
        <h1 class="sm:text-8xl text-6xl">{{ puntuation.pl }} - {{ puntuation.pr }}</h1>
      </div>
      <div class="w-1/3 h-full flex justify-center gap-5 items-center">
        <p class="text-5xl bg-amber-200 border-1 p-2 border-amber-700 shadow-2xl rounded-md">{{ player2 }}</p>
        <img src="../../space.jpg" alt="" class=" w-25 h-25 rounded-full shadow-2xl border-2">
      </div>
    </div>
  </div>
  <div class="absolute w-full h-full text-9xl flex flex-col text-center items-center justify-center pointer-events-none"
    v-if="puntuation.pr >= 5 || puntuation.pr >= 5">
    <h1>FIN DE LA PARTIDA</h1>
    <h2 v-if="puntuation.pl >= 5">GANADOR {{ player1 }}</h2>
    <h2 v-else>GANADOR {{ player2 }}</h2>
  </div>

</template> -->



<template>
  <div class="flex flex-col m-0 p-0 h-full">
    <div class="border-b-3 border-b-gray-700 h-3/4">
      <canvas id="renderCanvas" class="w-full h-full outline-none"></canvas>
    </div>
    <div class="flex justify-center items-center bg-gradient-to-r from-blue-700 to-amber-400 w-full h-1/4">
      <div class="w-1/3 h-full flex justify-center gap-5 items-center">
        <img :src="profileImage" alt="" class="w-30 h-30 rounded-full shadow-2xl border-2" />
        <p class="text-5xl bg-blue-200 border-1 p-2 border-blue-700 shadow-2xl rounded-md">{{ player1 }}</p>
      </div>
      <div class="w-1/3 flex justify-around">
        <h1 class="sm:text-8xl text-6xl">{{ puntuation.pl }} - {{ puntuation.pr }}</h1>
      </div>
      <div class="w-1/3 h-full flex justify-center gap-5 items-center">
        <p class="text-5xl bg-amber-200 border-1 p-2 border-amber-700 shadow-2xl rounded-md">{{ player2 }}</p>
        <img src="../../space.jpg" alt="" class="w-25 h-25 rounded-full shadow-2xl border-2" />
      </div>
    </div>
  </div>
  <div
    class="absolute w-full h-full text-9xl flex flex-col text-center items-center justify-center pointer-events-none"
    v-if="puntuation.pl >= 5 || puntuation.pr >= 5"
  >
    <h1>FIN DE LA PARTIDA</h1>
    <h2 v-if="puntuation.pl >= 5">GANADOR {{ player1 }}</h2>
    <h2 v-else>GANADOR {{ player2 }}</h2>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import initPong, { puntuation } from "../games/pong"
import { Engine, Scene } from "@babylonjs/core"
import type { Game } from "../api"
import { getGame, getProfile, API_URL, generateId, createGame, updateGame, noPlayer } from "../api"

const route = useRoute()
// const router = useRouter()

let scene: Scene | null = null
let engine: Engine | null = null

const gameid = ref<string>("")
const gameidWinner = ref<string>("")

const thisGame = ref<Game | null>(null)
const winnerGame = ref<Game | null>(null)

const player1 = ref<string>("")
const player2 = ref<string>("Invitado")

const profileImage = ref<string>("")
const username = ref<string>("")

onMounted(async () => {
  // Obtener IDs de query o generar
  const raw = route.query.gameid
  if (typeof raw === "string") gameid.value = raw
  else if (Array.isArray(raw) && raw[0]) gameid.value = raw[0]
  else gameid.value = generateId()

  const rawW = route.query.gameidWinner
  if (typeof rawW === "string") gameidWinner.value = rawW
  else if (Array.isArray(rawW) && rawW[0]) gameidWinner.value = rawW[0]
  else gameidWinner.value = ""

  // Cargar partida actual
  try {
    const resp1 = await getGame(gameid.value)
    thisGame.value = resp1.game
  } catch (e) {
    console.error("Error fetching thisGame:", e)
  }

  // Cargar partida siguiente si existe
  if (gameidWinner.value) {
    try {
      const resp2 = await getGame(gameidWinner.value)
      winnerGame.value = resp2.game
    } catch (e) {
      console.error("Error fetching winnerGame:", e)
    }
  }

  // Asignar jugadores de partida actual
  player1.value = thisGame.value?.player1 ?? username.value ?? "Tú"
  player2.value = thisGame.value?.player2 ?? "Invitado"

  // Registrar partida si no venimos con query
  if (!route.query.gameid) {
    createGame(gameid.value, "pong", 0, player1.value, player2.value, "", "")
  }

  // Cargar perfil
  const defaultProfileImage = "../assets/default-profile.png"
  try {
    const profileData = await getProfile()
    profileImage.value = profileData[0].profileImage
      ? `${API_URL}${profileData[0].profileImage}`
      : defaultProfileImage
    username.value = profileData[0].username      //ERROR, no carga el usuario
  } catch (e) {
    console.error("Error loading profile:", e)    //ERROR, da error si el usuario no esta en la base de datos(probar con los que esten)
    profileImage.value = defaultProfileImage
    username.value = "Usuario"
  }

  // Inicializar escena
  try {
    const result = initPong()
    scene = result.scene
    engine = result.engine
  } catch (e) {
    console.error("Error initializing Pong:", e)
  }
})

onUnmounted(() => {
  if (scene) scene.dispose()
  if (engine) engine.dispose()
  puntuation.pl = 0
  puntuation.pr = 0
})

const sendRouter = useRouter()
const sendPunt = async (winner: string) => {
  // Actualizar partida actual
  await updateGame(
    gameid.value,
    player1.value,
    player2.value,
    String(puntuation.pl),
    String(puntuation.pr)
  )

  // Actualizar partida siguiente según placeholder
  if (winnerGame.value) {
    const next = winnerGame.value
    console.log("id partida siguiente " + next.game, " palyer 1 " + next.player1, " player2 " + next.player2);
    if (next.player1 === noPlayer) {
      await updateGame(next.game, winner, next.player2, "", "")
    } else if (next.player2 === noPlayer) {
      await updateGame(next.game, next.player1, winner, "", "")
    } else {
      console.error("No slot available for winner in next game")
    }
  }

  setTimeout(() => {
    sendRouter.push({ path: "/Tournament" })
  }, 2000)
}

watch(
  () => puntuation.pl,
  (newVal) => newVal >= 5 && sendPunt(player1.value)
)
watch(
  () => puntuation.pr,
  (newVal) => newVal >= 5 && sendPunt(player2.value)
)
</script>
