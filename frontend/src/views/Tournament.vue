<script setup lang="ts">
import { ref, onMounted, inject, computed } from "vue";
import { useRouter } from "vue-router";
// import { watch } from "vue";

import { getMyTournament, createTournament, createGame, generateId } from "../api";
// import type { int } from "@babylonjs/core";
// const number = ref<number>(localStorage.getItem("number") ? parseInt(localStorage.getItem("number")!) : 0);

// 🚀 Obtener el usuario actual del sistema (debe estar en `provide` en `App.vue`)
const auth = inject<{ username: string }>("auth");
const currentUser = auth?.username || "Tú"; // Si no hay usuario, poner "Tú"
const router = useRouter();

const idtournament = generateId();

const player1 = ref(auth?.username || "Jugador 1");
const player2 = ref("Invitado");
const gameid = ref("");
const gameround = ref("0");

interface Game {
  game: string;
  type: string;
  order: string;
  player1: string;
  player2: string;
  score1: string;
  score2: string;
  round: string;
  created_at: string;
}

interface TournamentResponse {
  games: Game[];
  created_at: string;
}

const nextGame = () => {
  if (!tournamentData.value || !tournamentData.value.games || tournamentData.value.games.length === 0) {
    console.log("No hay datos del torneo");
    return;
  }
  let i = 0;
  if (tournamentData.value != null) {
    while (tournamentData.value.games[i].score1 != "" && tournamentData.value.games[i].score2 != "")
      i++;
    player1.value = tournamentData.value.games[i].player1;
    player2.value = tournamentData.value.games[i].player2;
    gameid.value = tournamentData.value.games[i].game;
    gameround.value = tournamentData.value.games[i].round;
  }
}

// Variable reactiva para almacenar la respuesta del torneo
const tournamentData = ref<TournamentResponse | null>(null);
async function fetchTournament() {
  try {
    // Llamamos a getTournament y guardamos el resultado
    tournamentData.value = await getMyTournament(currentUser);
    nextGame();
    console.log("Datos del torneo:", tournamentData.value);
  } catch (error) {
    console.error("Error al obtener los datos del torneo:", error);
  }
}

const tournamentActive = ref(false);
async function checkTournament() {
  const tournament = await getMyTournament(currentUser);
  // Verificamos si tournament tiene propiedades (por ejemplo, en el caso de que sea un objeto)
  if (tournament && Array.isArray(tournament.games) && tournament.games.length > 0) {
    console.log("Torneo en marcha detectado");
    tournamentActive.value = true;
  } else {
    console.log("No hay torneo en marcha");
    tournamentActive.value = false;
  }
}


// nextRoundMatch = Math.floor(i / 2)

// Donde i es el índice de la partida en la ronda actual. Por ejemplo:

// • Si i = 0 (primera partida) o i = 1 (segunda partida), Math.floor(0/2) = 0 y Math.floor(1/2) = 0, por lo que ambos ganadores irán a la partida 0 de la siguiente ronda (o la primera partida si numeras desde 1, usando la fórmula ajustada).

// • Si i = 2 o i = 3, Math.floor(2/2) = 1 y Math.floor(3/2) = 1, por lo que los ganadores de esas partidas se asignan a la partida 1 de la siguiente ronda.

// Si prefieres numerar partidas desde 1, la fórmula se puede ajustar a:

// nextRoundMatch = Math.floor((currentMatch - 1) / 2) + 1

// Así, por ejemplo, si currentMatch = 1 o 2, entonces: Math.floor((1-1)/2) + 1 = 1 y Math.floor((2-1)/2) + 1 = 1, asignándoles a la primera partida de la siguiente ronda.

// Esta fórmula es muy común para la construcción de llaves de torneos. Con ella, puedes agrupar las partidas de cada ronda y asignar los ganadores a la partida correspondiente en la siguiente ronda.
// const winnerNextGame = () => {
//   if (!tournamentData.value || !tournamentData.value.games || tournamentData.value.games.length === 0) {
//     console.log("No hay datos del torneo");
//     return;
//   }
//   let nextRoundMatch = Math.floor(i / 2);
// };

const redirect = () => {
  if (player1.value && player2.value)
    router.push({
      path: "/Pong",
      query: {
        gameid: gameid.value,
        player1: player1.value,
        player2: player2.value
      }
    });
  else {
    alert("No hay suficientes jugadores para jugar Pong");
  }
};

onMounted( async () => {
  await checkTournament();
  if (tournamentActive.value == true)
    fetchTournament();
});

const players = ref<string[]>([currentUser]);
// Función para generar los participantes del torneo
const generateRanks = async (count: number) => {
  console.log("ID torneo:", idtournament);
  let k = 0;
  if (players.value.length == playerNum.value) {
    // Recorremos el array players desde el segundo elemento (índice 1) hasta count - 1
    for (let i = 1; i < count; i++) {
      if (i % 2 !== 0) {
        const idgame = generateId();
        await createGame(idgame, "pong", k, players.value[i - 1], players.value[i], "", "");
        await createTournament(idtournament, idgame, 1);
        k++;
      }
    }

    let currentGameCount = Math.floor(count / 2); // Número de partidos en la ronda 1
    let round = 2;
    // Mientras queden más de un partido (es decir, hasta el partido final)
    while (currentGameCount > 1) {
      // Calculamos cuántos partidos tendrá la siguiente ronda (la mitad)
      currentGameCount = Math.floor(currentGameCount / 2);
      for (let i = 0; i < currentGameCount; i++) {
        const idgame = generateId();
        // Se crea un partido "vacío" (sin jugadores asignados) para esta ronda
        await createGame(idgame, "pong", k, "???", "???", "", "");
        await createTournament(idtournament, idgame, round);
        k++;
      }
      round++;
    }
  }
  else
    console.log("Error en generateRanks: No hay suficientes jugadores");
}

const playerNum = ref(0);
const sortedRounds = computed(() => {
  if (!tournamentData.value || !tournamentData.value.games) return [];
  const rounds: Record<string, Game[]> = {};
  tournamentData.value.games.forEach((game) => {
    if (!rounds[game.round]) {
      rounds[game.round] = [];
    }
    rounds[game.round].push(game);
  });
  // Ordenamos las rondas de mayor a menor (se asume que las rondas se pueden comparar como números)
  return Object.keys(rounds)
    .sort((a, b) => Number(b) - Number(a))
    .map(round => ({
      round,
      games: rounds[round]
    }));
});
</script>


<template>
   <!-- v-if="tournamentActive === false" -->
  <div class="bg-violet-700 h-fit w-full flex flex-col items-center gap-10">
    <p>Selecciona el número de jugadores</p>
    <div class="flex items-center justify-center gap-10">
      <!-- <button @click="reset" class="cursor-pointer bg-amber-300 py-1 px-3 rounded-md">reset</button> -->
      <button @click="playerNum = 2" class="cursor-pointer bg-amber-300 py-1 px-3 rounded-md">2</button>
      <button @click="playerNum = 4" class="cursor-pointer bg-amber-300 py-1 px-3 rounded-md">4</button>
      <button @click="playerNum = 8" class="cursor-pointer bg-amber-300 py-1 px-3 rounded-md">8</button>
    </div>
    <div class="flex gap-4">
      <div v-for="(index) in Array.from({ length: playerNum }, (_, index) => index)" :key="index" class="flex bg-gray-300">
        <input v-model="players[index]" type="text" :placeholder="`Jugador ${index + 1}`" class="border p-2 my-1" />
      </div>
    </div>
    <button @click="generateRanks(playerNum)" class="cursor-pointer bg-blue-300 rounded-md">crear torneo</button>
  </div>
  <!-- Sección para mostrar los datos del torneo en forma de pirámide -->
  <!-- v-else class="bg-violet-700 h-fit w-full" -->
   <!-- ahora mismo mezcla todos los torneos en los que participa el jugador -->
   <div>
     <div v-if="tournamentData" class="w-auto">
       <h2 class="text-center font-bold text-xl mb-4">Datos del Torneo</h2>
       <div v-if="sortedRounds.length" class="flex flex-col gap-4">
         <div v-for="roundGroup in sortedRounds" :key="roundGroup.round" class="flex flex-col items-center">
           <h3 class="mb-2">Ronda {{ roundGroup.round }}</h3>
           <div class="flex justify-center bg-gray-300">
             <div v-for="game in roundGroup.games" :key="game.game" class="bg-green-400 p-3 m-1">
               <p><strong>Juego:</strong> {{ game.game }}</p>
               <p><strong>Jugador 1:</strong> {{ game.player1 }}</p>
               <p><strong>Jugador 2:</strong> {{ game.player2 }}</p>
               <p><strong>Ronda:</strong> {{ game.round }}</p>
             </div>
           </div>
         </div>
       </div>
     </div>
     <div class="flex items-center justify-center m-3" v-if="tournamentActive === true">
       <button
         class="p-2 bg-gradient-to-b from-red-400 to-red-800 w-fit cursor-pointer rounded-md border-2 border-red-400 text-2xl text-white"
         @click="redirect"> jugar pong con {{ player1 }} y {{ player2 }} la partida {{ gameid }}</button>
     </div>

   </div>
</template>