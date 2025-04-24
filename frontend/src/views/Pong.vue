<template>
  <div class="flex flex-col m-0 p-0 h-full">
    <!-- VENTANA DE SETUP -->
    <div v-if="showSetup" class="setup-overlay">
      <h2>Preparar partida</h2>
      <label>
        Nombre del contrincante:
        <input v-model="player2" placeholder="Escribe su nombre" />
      </label>
      <button :disabled="!player2" @click="showSetup = false; initGame();">
        Iniciar partida
      </button>
    </div>

    <!-- Lienzo de Pong, solo se inserta tras pulsar “Iniciar partida” -->
    <div v-else class="border-b-3 border-b-gray-700 h-3/4">

      <div >
        <canvas id="renderCanvas" class="w-full h-full outline-none"></canvas>
      </div>
      <div class="flex items-center justify-center bg-gradient-to-r from-blue-700 to-amber-400 w-full h-1/4 p-2">
        <div class="w-1/3 h-full flex justify-center gap-5 items-center">
          <img :src="profileImage" alt="Profile image"
            class="w-30 h-30 rounded-full shadow-2xl border-2 hidden sm:block" />
          <p class="sm:text-5xl text-2xl bg-blue-200 border-1 p-2 border-blue-700 shadow-2xl rounded-md">{{ player1 }}</p>
        </div>
        <div class="w-1/3 flex justify-around">
          <h1 class=" sm:text-8xl text-4xl">{{ puntuation.pl }} - {{ puntuation.pr }}</h1>
        </div>
        <div class="w-1/3 h-full flex justify-center gap-5 items-center">
          <p class="sm:text-5xl text-2xl bg-amber-200 border-1 p-2 border-amber-700 shadow-2xl rounded-md">{{ player2 }}
          </p>
          <img :src="defaultProfile" alt="2nd player"
            class="w-25 h-25 rounded-full shadow-2xl border-2 hidden sm:block" />
        </div>
      </div>
    </div>
    <div class="absolute w-full h-full text-9xl flex flex-col text-center items-center justify-center pointer-events-none"
      v-if="puntuation.pl >= 5 || puntuation.pr >= 5">
      <h1>FIN DE LA PARTIDA</h1>
      <h2 v-if="puntuation.pl >= 5">GANADOR {{ player1 }}</h2>
      <h2 v-else>GANADOR {{ player2 }}</h2>
    </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue"
import { useRoute, useRouter } from "vue-router"
import initPong, { puntuation } from "../games/pong"
import { Engine, Scene } from "@babylonjs/core"
import type { Game } from "../api"
import { getGame, getProfile, API_URL, generateId, createGame, updateGame, noPlayer, deleteGame } from "../api"
import defaultProfile from '../assets/default-profile.png' // se podria poner las imagenes en public/assets para no tener que importar

const route = useRoute()
const sendRouter = useRouter()

let scene: Scene | null = null
let engine: Engine | null = null

const gameid = ref<string>("")
const isTournament = ref(false)
const gameidWinner = ref<string>("")

const showSetup = ref(true);
const thisGame = ref<Game | null>(null)
const winnerGame = ref<Game | null>(null)

const player1 = ref<string>("")
const player2 = ref<string>("Invitado")

const profileImage = ref<string>("")
const username = ref<string>("")

onMounted(async () => {
  // 1. Cargar perfil y usuario (redirige al login si no hay token válido)
  try {
    const me = await getProfile();
    username.value = me.username;
    profileImage.value = me.profileImage
      ? `${API_URL}${me.profileImage}`
      : defaultProfile;
  } catch (err) {
    console.error("No autenticado o perfil no encontrado:", err);
    return sendRouter.push("/login");
  }

  // 2. Determinar gameid y gameidWinner a partir de la query
  const raw = route.query.gameid;
  if (typeof raw === "string") {
    gameid.value = raw;
    isTournament.value = true;
  } else if (Array.isArray(raw) && raw[0]) {
    gameid.value = raw[0];
    isTournament.value = true;
  } else {
    gameid.value = generateId();
    isTournament.value = false;
  }

  const rawW = route.query.gameidWinner;
  if (typeof rawW === "string") {
    gameidWinner.value = rawW;
  } else if (Array.isArray(rawW) && rawW[0]) {
    gameidWinner.value = rawW[0];
  } else {
    gameidWinner.value = "";
  }

  // 3. Si no venimos de torneo, creamos la partida en la API
  if (!route.query.gameid) {
    try {
      await createGame(
        gameid.value,
        "pong",
        -1,
        username.value,      // YA tenemos username cargado
        player2.value,
        "",
        ""
      );
      console.log('Partida ' + gameid.value + ' creada con exito');
    } catch (err) {
      console.error("Error al crear partida:", err);
      // aquí podrías mostrar un mensaje al usuario o redirigir
    }
  }

  // 4. Cargar la partida actual
  try {
    const resp1 = await getGame(gameid.value);
    thisGame.value = resp1.game;
    // Asignar jugadores desde la partida
    if (thisGame.value) {
      player1.value = thisGame.value.player1;
      player2.value = thisGame.value.player2;
    }
  } catch (e) {
    console.error("Error fetch thisGame:", e);
  }

  // 5. Si existe gameidWinner, cargar la partida siguiente
  if (gameidWinner.value) {
    try {
      const resp2 = await getGame(gameidWinner.value);
      winnerGame.value = resp2.game;
    } catch (e) {
      console.error("Error fetch winnerGame:", e);
    }
  }

  // 6. Inicializar la escena de Pong
  // try {
  //   const { scene: s, engine: eng } = initPong();
  //   scene = s;
  //   engine = eng;
  // } catch (e) {
  //   console.error("Error initializing Pong:", e);
  // }
});


onUnmounted(() => {
  if (scene) scene.dispose()
  if (engine) engine.dispose()
  if (!isTournament.value && puntuation.pl < 5 && puntuation.pr < 5) {
    console.log("pl es " + puntuation.pl + " pr es " + puntuation.pr + " al destruir la partida");
    deleteGame(gameid.value)
      .then(() => console.log('Partida eliminada al salir sin terminar'))
      .catch(err => console.error('Error al eliminar partida:', err))
  } else {
    console.log("Partida no eliminada (terminada o de torneo)")
  }
  puntuation.pl = 0
  puntuation.pr = 0
})

function initGame() {

  nextTick(() => {
    try {
      const { scene: s, engine: eng } = initPong();
      scene = s;
      engine = eng;
    } catch (e) {
      console.error("Error initializing Pong:", e);
    }
  })
}

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
    if (Object.keys(route.query).length > 0) {
      sendRouter.push({ path: "/Tournament", query: { isTournament: "true" } })
    }
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
