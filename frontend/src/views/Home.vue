<template>
  <div class="flex flex-col items-center justify-center gap-3">
    <div class="w-full justify-items-center bg-amber-300 text-center">
      <h1 class="text-green-600">Bienvenido a FT-Transcendence</h1>
    </div>
    <div class="flex items-top justify-center gap-3 my-3">
      <RouterLink class="bg-red-600 p-3 rounded-xl text-white text-center" to="/pong-online?mode=newGame">Nueva Partida
        de Pong en Línea</RouterLink>
      <RouterLink class="bg-red-600 p-3 rounded-xl text-white text-center" to="/tictactoe-online?mode=newGame">Nueva
        Partida de 3 en Raya en Línea</RouterLink>
    </div>
    <div class="flex w-[98%] flex-col-reverse md:flex-row h-full  justify-center gap-3">
      <div class="container mx-auto p-4 border-2 bg-white rounded-xl">
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
            <tr v-for="player in playersArray" :key="player.id" class="">
              <td v-if="player.username !== username" class="pt-2">
                <div class="bg-gray-200 w-full rounded-xl border-2 px-2 py-1">
                  {{ player.username }}
                  <span v-if="player.isFriend">(Amigo)</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="container mx-auto p-4 border-2 bg-white rounded-xl">
        <h1 class="text-2xl font-bold mb-4">Juegos en Curso</h1>
        <div class="flex gap-3">
          <td class="border-2 rounded-xl px-3 text-center"
            :class="randomPongGameId ? 'bg-green-500 transition duration-500 hover:bg-green-600' : 'bg-gray-400 pointer-events-none'">
            <router-link :to="{ name: 'PongOnline', query: { mode: 'joinGame', gameid: randomPongGameId } }">
              🎮 Pong aleatorio
            </router-link>
          </td>

          <td class="border-2 rounded-xl px-3 text-center"
            :class="randomTTTGameId ? 'bg-green-500 transition duration-500 hover:bg-green-600' : 'bg-gray-400 pointer-events-none'">
            <router-link :to="{ name: 'TTTOnline', query: { mode: 'joinGame', gameid: randomTTTGameId } }">
              🎮 TTT aleatorio
            </router-link>
          </td>

        </div>
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
            <tr v-for="game in gamesArray" :key="game.id" class="">
              <div class="border-2 rounded-xl bg-gray-200 flex justify-around py-1 px-2 mt-2">
                <td class="w-full">{{ game.game }}</td>
                <div class="w-full flex justify-around items-center">
                  <td class="" v-if="game.player1">{{ game.player1 }}</td>
                  <td class="" v-if="game.player2">{{ game.player2 }}</td>
                  <td class="bg-green-500 px-2 rounded-xl transition duration-500 hover:bg-green-600" v-if="(!game.player1 || !game.player2) && game.game === 'Pong'"><router-link
                      :to="{ name: 'PongOnline', query: { mode: 'joinGame', gameid: game.id } }">Unirse</router-link></td>
                  <td class="bg-green-500 px-2 rounded-xl transition duration-500 hover:bg-green-600" v-if="(!game.player1 || !game.player2) && game.game === 'TicTacToe'">
                    <router-link
                      :to="{ name: 'TTTOnline', query: { mode: 'joinGame', gameid: game.id } }">Unirse</router-link>
                  </td>

                </div>

              </div>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>


</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
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

function useRandomAvailableGameId(gameType: string) {
  return computed(() => {
    if (!games.value || Object.keys(games.value).length === 0) {
      return null;
    }

    const availableGames = Object.entries(games.value)
      .map(([id, game]: any) => ({ id, ...game }))
      .filter((game) => game.player2 === null && game.game === gameType);

    if (availableGames.length === 0) {
      return null;
    }

    const randomGame = availableGames[Math.floor(Math.random() * availableGames.length)];
    return randomGame.id;
  });
}
const gamesLoaded = ref(false);
const randomPongGameId = useRandomAvailableGameId('Pong');
const randomTTTGameId = useRandomAvailableGameId('TicTacToe');

// Uso del websocket
const { websocketState: { socket } } = useWebSocket();

watch(
  () => socket,
  (ws) => {
    if (!ws) return;

    ws.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      console.log(data);

      if (data.type === 'currentPlayers') {
        localStorage.setItem('players', JSON.stringify(data.players));
        updatePlayers();
        console.log('Players stored:', data.players);
      }

      if (data.type === 'currentGames') {
        games.value = data.games;
        gamesLoaded.value = true;
        localStorage.setItem('games', JSON.stringify(data.games));
        updateGames();
        console.log('Games stored:', data.games);
      }
    });
  },
  { immediate: true }
);

onMounted(() => {
  updatePlayers();
  updateGames();
  // Si ya hay datos, considerar que están cargados
  const local = localStorage.getItem("games");
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Object.keys(parsed).length > 0) {
        games.value = parsed;
        gamesLoaded.value = true; // ✅ activa visualmente los botones
      }
    } catch {
      console.warn("No se pudieron parsear las partidas locales");
    }
  }
});

</script>