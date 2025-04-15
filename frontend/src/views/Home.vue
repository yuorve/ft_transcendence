<template>
  <div>
    <div class="justify-items-center bg-amber-300 text-center">
      <h1 class="text-green-600">Bienvenido a FT-Transcendence</h1>
      <p><router-link :to="{ name: 'PongOnline', params: { game: 'new' } }">Nueva Partida de Pong en Línea</router-link>
      </p>
    </div>
    <div class="flex items-center justify-center gap-3 m-3">
      <div class="container mx-auto p-4 border-2 bg-amber-300 rounded-xl">
        <h1 class="text-2xl font-bold mb-4">Usuarios Conectados</h1>

        <div v-if="!playersArray" class="text-gray-600">
          Cargando usuarios...
        </div>

        <div v-else-if="playersArray.length === 0" class="text-gray-600">
          Aún no hay nadie conectado.
        </div>

        <table v-else class="table-auto w-full">
          <thead>
            <tr>
              <th class="px-4 py-2">Jugadores</th>
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
              <td class="border px-4 py-2" v-if="!game.player1 || !game.player2"><router-link
                  :to="{ name: 'PongOnline', params: { game: game.id } }">Unirse</router-link></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>


</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { getFriends, getBlocked } from '../api';

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

const updatePlayers = async () => {
  const playersString = localStorage.getItem('players');
  let players = {};
  let tempPlayersArray = [];

  if (playersString) {
    try {
      players = JSON.parse(playersString);
      tempPlayersArray = Object.entries(players).map(([id, playerDataRaw]) => {
        const playerData = playerDataRaw as { username: string };
        return {
          id,
          username: playerData.username,
          isFriend: false,
        };
      });
      try {
        const friendsResponse = await getFriends(username);
        const blockedResponse = await getBlocked(username);

        friends.value = friendsResponse?.friends?.map((friend: Friends) => friend.buddy) || [];
        blocked.value = blockedResponse?.blocked?.map((blockedUser: BlockedUser) => blockedUser.buddy) || [];

      } catch (error) {
        console.error("Error fetching friends or blocked:", error);
      }
      playersArray.value = tempPlayersArray.filter(player => !blocked.value.includes(player.username)).map(player => ({
        ...player,
        isFriend: friends.value.includes(player.username),
      }));
    } catch (error) {
      console.error("Error parsing players from localStorage:", error);
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

const storageChangeHandler = (event: StorageEvent) => {
  console.log("storageChangeHandler ejecutado:", event);
  console.log("Clave del evento:", event.key);
  console.log("Actualizando...");
  if (event.key === 'players') {
    updatePlayers();
  } else if (event.key === 'games') {
    updateGames();
  }
};

onMounted(() => {
  updatePlayers();
  updateGames();
  window.addEventListener('storage', storageChangeHandler);
});

onBeforeUnmount(() => {
  window.removeEventListener('storage', storageChangeHandler);
});

</script>