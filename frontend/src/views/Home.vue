<template>
  <div>
    <div class="justify-items-center bg-amber-300 text-center">
      <h1 class="text-green-600">Bienvenido a FT-Transcendence</h1>
    </div>
    <div class="flex items-top justify-center gap-3 m-3">
      <RouterLink class="bg-red-600 p-3 rounded-xl text-white text-center" to="/pong-online?mode=newGame">Nueva Partida
        de Pong en Línea</RouterLink>
      <RouterLink class="bg-red-600 p-3 rounded-xl text-white text-center" to="/tictactoe-online?mode=newGame">Nueva
        Partida de 3 en Raya en Línea</RouterLink>
    </div>
    <div class="flex items-top justify-center gap-3 m-3">
      <div class="container mx-auto p-4 border-2 bg-amber-300 rounded-xl">
        <h1 class="text-2xl font-bold mb-4">Usuarios Conectados</h1>

        <div v-if="!playersArray" class="text-gray-600">
          Cargando usuarios...
        </div>

        <div v-else-if="playersArray.length === 1" class="text-gray-600">
          Aún no hay nadie conectado.
        </div>

        <table v-else class="table-auto w-full">
          <thead>
            <tr>
              <th class="px-4 py-2">{{ $t("players") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="player in playersArray" :key="player.id">
              <td v-if="player.username !== username" class="border px-4 py-2">{{ player.username }} -
                <span v-if="player.isFriend">(Amigo)</span>
                <span v-else><router-link
                    :to="{ name: 'Chats', params: { buddy: player.username } }">Invitar</router-link></span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="container mx-auto p-4 border-2 bg-amber-300 rounded-xl">
        <h1 class="text-2xl font-bold mb-4">Juegos en Curso</h1>
        <td class="border px-4 py-2">
          <router-link :to="{ name: 'PongOnline', query: { mode: 'joinGame', gameid: randomAvailableGameId } }"
            :class="randomAvailableGameId ? 'bg-green-600' : 'bg-gray-400 pointer-events-none'">
            🎮 Pong aleatorio
          </router-link>
        </td>

        <td class="border px-4 py-2">
          <router-link :to="{ name: 'TTTOnline', query: { mode: 'joinGame', gameid: randomAvailableGameId } }"
            :class="randomAvailableGameId ? 'bg-green-600' : 'bg-gray-400 pointer-events-none'">
            🎮 TTT aleatorio
          </router-link>
        </td>
        <div v-if="!gamesArray" class="text-gray-600">
          Cargando partidas...
        </div>

        <div v-else-if="gamesArray.length === 0" class="text-gray-600">
          Aún no hay nadie jugando.
        </div>

        <table v-else class="table-auto w-full">
          <thead>
            <tr>
              <th class="px-4 py-2">Partidas</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="game in gamesArray" :key="game.id">
              <td class="border px-4 py-2">{{ game.game }}</td>
              <td class="border px-4 py-2" v-if="game.player1">{{ game.player1 }}</td>
              <td class="border px-4 py-2" v-if="game.player2">{{ game.player2 }}</td>
              <td class="border px-4 py-2" v-if="(!game.player1 || !game.player2) && game.game === 'Pong'"><router-link
                  :to="{ name: 'PongOnline', query: { mode: 'joinGame', gameid: game.id } }">Unirse</router-link></td>
              <td class="border px-4 py-2" v-if="(!game.player1 || !game.player2) && game.game === 'TicTacToe'">
                <router-link
                  :to="{ name: 'TTTOnline', query: { mode: 'joinGame', gameid: game.id } }">Unirse</router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>


</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { getFriends, getBlocked, noPlayer } from '../api';
import { useWebSocket } from '../services/websocket';

interface Player {
  id: string;
  username: string;
  isFriend: boolean;
}

interface Game {
  id: string;
  game: string;
  player1: string;
  player2: string | null;
}

interface Friends {
  id: number;
  username: string;
  buddy: string;
}

interface BlockedUser {
  id: number;
  username: string;
  buddy: string;
}

const username = localStorage.getItem("username") || "";
const playersArray = ref<Player[]>([]);
const gamesArray = ref<Game[]>([])
const friends = ref<string[]>([]);
const blocked = ref<string[]>([]);
  const games = ref<{ [id: string]: any }>({});
  
const updatePlayers = async () => {
  const playersString = localStorage.getItem('players');
  let players = {};

  if (playersString) {
    try {
      players = JSON.parse(playersString);
      playersArray.value = Object.entries(players).map(([username, playerDataRaw]) => {
        return {
          id: username, // <- esto es lo que TypeScript necesita
          username,
          gameId: (playerDataRaw as { gameId: string }).gameId,
          isFriend: false
        };
      });
    } catch (error) {
      console.error("Error parsing games from localStorage:", error);
    }
  } else {
    playersArray.value = [];
  }
};

const updateGames = () => {
  const gamesString = localStorage.getItem('games');
  let games = {};

  if (gamesString) {
    try {
      games = JSON.parse(gamesString);
      gamesArray.value = Object.entries(games).map(([id, gameDataRaw]) => {
        const gameData = gameDataRaw as { game: string; player1: string; player2: string | null }; // Definición de tipo explícita
        return {
          id,
          game: gameData.game,
          player1: gameData.player1,
          player2: gameData.player2,
        };
      });
    } catch (error) {
      console.error("Error parsing games from localStorage:", error);
    }
  } else {
    gamesArray.value = [];
  }
};

const randomAvailableGameId = computed(() => {
  const gamesString = localStorage.getItem("games");
  if (!gamesString) {
    console.error("No hay partidas disponibles en localStorage");
    return null;
  }

  try {
    console.warn("SI hay partidas disponibles en localStorage");
    const games = JSON.parse(gamesString);
    console.log("Partidas actuales:", games);
    const availableGames = Object.entries(games)
      .map(([id, game]: any) => ({ id, ...game }))
      .filter((game) => game.player2 === null);
    console.log("Partidas mapeadas:", availableGames);
    if (availableGames.length === 0) {
      console.warn("No hay partidas disponibles para unirse");
      return null;
    }

    const randomGame = availableGames[Math.floor(Math.random() * availableGames.length)];
    console.warn("Partida aleatoria seleccionada:", randomGame);
    return randomGame.id;
  } catch (e) {
    console.error("Error leyendo partidas:", e);
    return null;
  }
});

// Uso del websocket
const { websocketState: { socket } } = useWebSocket();

if (socket) {
  socket.addEventListener('message', event => {
    const data = JSON.parse(event.data);
    console.log(data);
    if (data.type === 'currentPlayers') {
      localStorage.setItem('players', JSON.stringify(data.players));
      updatePlayers();
      console.log('Players stored:', data.players);
    }
    if (data.type === 'currentGames') {
      localStorage.setItem('games', JSON.stringify(data.games));
      updateGames();
      console.log('Games stored:', data.games);
    }
  });
};

onMounted(() => {
  updatePlayers();
  updateGames();
});

</script>