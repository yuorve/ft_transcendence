<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import initTicTacToe from "../games/tictactoe";
import { Engine, Scene } from "@babylonjs/core";
import { getProfile, API_URL, createGame, generateId, updateGame, getGame, deleteGame, noPlayer } from "../api";
import { useRoute, useRouter } from "vue-router";
import { puntuation } from "../games/tictactoe";
import defaultProfile from '../assets/default-profile.png' // se podria poner las imagenes en public/assets para no tener que importar
import type { Game } from "../api"

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
    if (Object.keys(route.query).length > 0) {
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
</script>

<template>
  <div class="flex h-full">
    <div class="w-1/6 flex flex-col bg-gradient-to-b from-blue-400 to-transparent">
      <div class="w-full h-80 flex flex-col gap-10 justify-center items-center">
        <img :src="profileImage" alt="Profile Image" class=" w-30 h-30 rounded-full shadow-2xl border-2">
        <p class="bg-blue-200 border-1 border-blue-700 shadow-2xl rounded-md p-1">{{ player1 }}</p>
      </div>
      <div class="border-3 w-full flex-1 flex justify-center">stadistics</div>
    </div>
    <div class="flex flex-col flex-1 m-0 p-0 h-full border-l-3 border-l-blue-700 border-r-3 border-r-amber-700">
      <div class="border-b-3 border-b-gray-700 h-full">
        <canvas id="renderCanvas" class="w-full h-full outline-none"></canvas>
      </div>
      <!-- <div class="bg-gradient-to-b from-gray-400 to-transparent w-full h-1/4">
			contador 3 en raya boton de reiniciar?
			</div> -->
    </div>
    <div class="w-1/6 flex flex-col bg-gradient-to-b from-amber-400 to-transparent ">
      <div class="w-full h-80 flex flex-col gap-10 justify-center items-center">
        <img src="../assets/default-profile.png" alt="Guest Image" class=" w-30 h-30 rounded-full shadow-2xl border-2">
        <p class="bg-amber-200 border-1 border-amber-700 shadow-2xl rounded-md p-1">{{ player2 }}</p>
      </div>
      <div class="border-3 w-full flex-1 flex justify-center">stadistics</div>
    </div>
  </div>
</template>