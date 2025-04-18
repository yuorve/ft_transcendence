<script setup lang="ts">
import { ref, onMounted, inject, computed } from "vue";
import { useRouter } from "vue-router";

import { getMyTournament, createTournament, createGame, generateId, noPlayer } from "../api";
import type { Game } from "../api";
// import type { int } from "@babylonjs/core";

// 🚀 Obtener el usuario actual del sistema (debe estar en `provide` en `App.vue`)
const auth = inject<{ username: string }>("auth");
const currentUser = auth?.username || "Tú"; // Si no hay usuario, poner "Tú"
const router = useRouter();

const idtournament = generateId();

const player1 = ref(auth?.username || "Jugador 1");
const player2 = ref("Invitado");
const gameid = ref("");
const gameround = ref("0");
const gameorder = ref("0");

interface TournamentResponse {
  games: Game[];
  created_at: string;
}

const nextGame = () => {
  if (!tournamentData.value || !tournamentData.value.games || tournamentData.value.games.length === 0) {
    console.log("No hay datos del torneo");
    return;
  }
  const next = tournamentData.value.games.find(g => g.score1 === "" && g.score2 === "")
  if(next)
  {
    gameid.value = next.game;
    player1.value = next.player1;
    player2.value = next.player2;
    gameround.value = next.round;
    gameorder.value = next.game_order;
  }
  else
      console.log("ganador del torneo ");   //hacer variable, que la guarde en la BBDD, ocultar boton de jugar partida y anular nextwinnergame
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



const nextWinnerGame = (): string => {
  if (!tournamentData.value) return "";

  let winnerGame = Math.floor(Number(gameorder.value) / 2);
  let i = 0;

  // Avanza hasta encontrar una partida en una ronda mayor
  while (i < tournamentData.value.games.length && tournamentData.value.games[i].round <= gameround.value) {
    i++;
  }

  // Avanza hasta encontrar la partida con el orden deseado
  while (i < tournamentData.value.games.length && Number(tournamentData.value.games[i].game_order) < winnerGame) {
    i++;
  }

  if (i < tournamentData.value.games.length) {
    console.log("id del juego del ganador encontrado es " + tournamentData.value.games[i].game);
    return tournamentData.value.games[i].game;
  }

  // Si no se encontró una partida adecuada, devuelve un valor por defecto
  console.warn("No se encontró partida ganadora siguiente.");
  return "";
};

const redirect = () => {
  if (player1.value && player2.value)
    router.push({
      path: "/Pong",
      query: {
        gameid: gameid.value,
        gameidWinner: nextWinnerGame() // (tener cuidado de no pisar al ganador anterior)
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
      k = 0;
      // Calculamos cuántos partidos tendrá la siguiente ronda (la mitad)
      currentGameCount = Math.floor(currentGameCount / 2);
      for (let i = 0; i < currentGameCount; i++) {
        const idgame = generateId();
        // Se crea un partido "vacío" (sin jugadores asignados) para esta ronda
        await createGame(idgame, "pong", k, noPlayer, noPlayer, "", "");
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
  <div class="bg-violet-700 h-fit w-full flex flex-col items-center gap-10" v-if="tournamentActive === false">
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
               <p><strong>orden:</strong> {{ game.game_order }}</p>
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