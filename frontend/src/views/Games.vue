<template>
	<div class="container mx-auto p-4 bg-amber-300 mt-3 rounded-xl">
	  <h1 class="text-2xl font-bold mb-4">Partidas de {{ username }}</h1>
  
	  <div v-if="!games" class="text-gray-600">
		Cargando partidas...
	  </div>
  
	  <div v-else-if="games.length === 0" class="text-gray-600">
		Aún no has jugado ninguna partida.
	  </div>
  
	  <table v-else class="table-auto w-full">
		<thead>
		  <tr>
			<th class="px-4 py-2">Jugador 1</th>
			<th class="px-4 py-2">Jugador 2</th>
			<th class="px-4 py-2">Puntuación 1</th>
			<th class="px-4 py-2">Puntuación 2</th>
			<th class="px-4 py-2">Fecha</th>
		  </tr>
		</thead>
		<tbody>
		  <tr v-for="(game, index) in games" :key="game.id" :class="index % 2 === 0 ? 'bg-white' : 'bg-gray-200'">
			<td class="border px-4 py-2">{{ game.player1 }}</td>
			<td class="border px-4 py-2">{{ game.player2 }}</td>
			<td class="border px-4 py-2">{{ game.score1 }}</td>
			<td class="border px-4 py-2">{{ game.score2 }}</td>
			<td class="border px-4 py-2">{{ formatDate(game.created_at) }}</td>
		  </tr>
		</tbody>
	  </table>
	</div>
  </template>
  
  <script>
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { getGames } from '../api'; 
  
  export default {
	data() {
	  return {
		games: null,
		username: localStorage.getItem("username") || "",
	  };
	},
	created() {
	  this.fetchData();
	},
	methods: {
	  async fetchData() {
		const username = localStorage.getItem("username") || "";
		
		if (username) {
		  try {
			const response = await getGames(username);
			this.games = response.games;
		  } catch (error) {
			console.error('Error al obtener las partidas:', error);
		  }
		} else {
		  console.error('Nombre de usuario no encontrado en localStorage');
		  this.$router.push('/login');
		}
	  },
	  formatDate(dateString) {
		const options = { year: 'numeric', month: 'long', day: 'numeric' };
		return new Date(dateString).toLocaleDateString('es-ES', options);
	  },
	},
  };
  </script>