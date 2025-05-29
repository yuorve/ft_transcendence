<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import initTicTacToe from "../games/tictactoe";
import { Engine, Scene } from "@babylonjs/core";
import { getProfile, API_URL, createGame, generateId, updateGame, getGame, deleteGame, noPlayer } from "../api";
import { useRoute, useRouter } from "vue-router";
import { puntuation } from "../games/tictactoe";
import defaultProfile from '../assets/default-profile.png' // se podria poner las imagenes en public/assets para no tener que importar
import type { Game } from "../api"
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()
const sendRouter = useRouter()

let scene: Scene | null = null
let engine: Engine | null = null

const gameid = ref<string>("")
const isTournament = ref(false)
const gameidWinner = ref<string>("")

const thisGame = ref<Game | null>(null)
const winnerGame = ref<Game | null>(null)

const player1 = ref<string>("")
const player2 = ref<string>("Invitado")

const profileImage = ref<string>("")
const username = ref<string>("")


// Obtener la imagen de perfil desde la API cuando el componente se monta
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
        "TicTacToe",
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

  // 6. Inicializar la escena de 3 en raya
  puntuation.playerTurn = 1;
  puntuation.online = 0;
  try {
    const { scene: s, engine: eng } = initTicTacToe();
    scene = s;
    engine = eng;
  } catch (e) {
    console.error("Error initializing tictactoe:", e);
  }
});

onUnmounted(() => {
  if (scene) scene.dispose()
  if (engine) engine.dispose()
  if (!isTournament.value && puntuation.pl < 1 && puntuation.pr < 1) {
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
    if (route.query.isTournament === "true") {
      sendRouter.push({ path: "/Tournament", query:{ isTournament: "true"} })
    }
  }, 2000)
}

watch(
  () => puntuation.pl,
  (newVal) => newVal >= 1 && sendPunt(player1.value)
)
watch(
  () => puntuation.pr,
  (newVal) => newVal >= 1 && sendPunt(player2.value)
)

const showSetup = ref(true);
function initGame() {

nextTick(() => {
  try {
    puntuation.gameState = 'playing';
    puntuation.online = 0;
    const { scene: s, engine: eng } = initTicTacToe();
    scene = s;
    engine = eng;
  } catch (e) {
    console.error("Error initializing Pong:", e);
  }
})
}
</script>

<template>
  <div class="relative flex flex-col h-screen w-full m-0 p-0 leading-none overflow-hidden">
    <!-- VENTANA DE SETUP -->
    <div class="w-full h-3/4 m-0 p-0 border-red-600">
      <div v-if="showSetup" class="w-full h-full flex items-center justify-center">
        <div class="flex flex-col items-center w-fit h-3/4
    transition-[width] duration-500 ease-in-out justify-center gap-6 landscape:flex-row landscape:lg:flex-col">
          <h2 class="lg:text-5xl bg-white p-4 rounded-2xl">{{t('prepare')}} {{ t('game') }}</h2>
          <div class="bg-white w-fit h-fit p-4 flex flex-col items-center justify-center rounded-2xl gap-4">
            <label class="lg:text-3xl">
              {{t('opponetName')}}:
            </label>
            <input v-if="!isTournament" class="text-center border rounded w-full p-2 bg-gray-200" v-model="player2"
              placeholder="Escribe su nombre" />
            <p v-else class="text-center p-2 lg:text-2xl">{{ player2 }}</p>
          </div>
          <button class="text-white rounded-2xl bg-gradient-to-b from-red-600 to-red-900 p-4 lg:text-2xl cursor-pointer"
            :disabled="!player2" @click="showSetup = false; initGame();">
            {{t('start')}} {{ t('game') }}
          </button>
        </div>

      </div>
      <!-- Lienzo de Pong, solo se inserta tras pulsar “Iniciar partida” -->
      <div v-else class="w-full h-full flex items-center justify-center">
        <canvas id="renderCanvas" class="block w-full h-full outline-none"></canvas>
      </div>
    </div>
    <div class="w-full h-1/4 m-0 p-0">
      <div class="flex items-center justify-center bg-gradient-to-r from-blue-700 to-amber-400 w-full h-full p-2">
        <div class="w-1/3 h-full flex justify-center gap-5 items-center">
          <img :src="profileImage" alt="Profile image"
            class="md:h-[80%] aspect-square rounded-full shadow-2xl border-2 hidden md:block" />
          <p
            class="md:text-3xl lg:text-5xl text-2xl bg-blue-200 border-1 p-2 border-blue-700 shadow-2xl rounded-md max-w-lg truncate">
            {{ player1 }}
          </p>
        </div>
        <div class="w-1/3 flex justify-around">
          <h1 class="text-5xl lg:text-8xl">{{ puntuation.pl }} - {{ puntuation.pr }}</h1>
        </div>
        <div class="w-1/3 h-full flex justify-center gap-5 items-center">
          <p
            class="md:text-3xl lg:text-5xl text-2xl bg-amber-200 border-1 p-2 border-amber-700 shadow-2xl rounded-md max-w-lg truncate">
            {{ player2 }}
          </p>
          <img :src="defaultProfile" alt="2nd player"
            class="md:h-[80%] aspect-square rounded-full shadow-2xl border-2 hidden md:block" />
        </div>
      </div>
    </div>
    <div
      class="absolute w-full h-full text-xl flex flex-col text-center items-center justify-center pointer-events-none xl:text-8xl"
      v-if="puntuation.pl >= 5 || puntuation.pr >= 5">
      <h1 class="bg-white rounded-2xl">FIN DE LA PARTIDA</h1>
      <h2 class="bg-white rounded-2xl" v-if="puntuation.pl >= 5">GANADOR {{ player1 }}</h2>
      <h2 class="bg-white rounded-2xl" v-else>GANADOR {{ player2 }}</h2>
    </div>
  </div>
</template>