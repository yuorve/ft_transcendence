<template>
	<div class="w-full p-6">
		<!-- Tabs -->
		<div class="flex gap-4 border-b border-gray-300 mb-4 bg-amber-300">
			<button v-for="tab in tabs" :key="tab" @click="activeTab = tab" :class="[
				'px-4 py-2 font-semibold',
				activeTab === tab
					? 'border-b-4 border-blue-600 text-blue-600'
					: 'text-gray-500 hover:text-blue-400'
			]">
				{{ tab }}
			</button>
		</div>

		<!-- Tab content -->
		<div v-if="activeTab === 'Pong'">
			<h2 class="text-2xl font-bold mb-2">Juegos de Pong</h2>
			<div v-if="pongGames.length">
				<div v-for="game in pongGames" :key="game.game" class="bg-white p-3 rounded shadow mb-2">
					<p><strong>Juego ID:</strong> {{ game.game }}</p>
					<p><strong>Jugador 1:</strong> {{ game.player1 }}</p>
					<p><strong>Jugador 2:</strong> {{ game.player2 }}</p>
					<p><strong>Resultado:</strong> {{ game.score1 }} - {{ game.score2 }}</p>
					<p><strong>Fecha:</strong> {{ formatDate(game.created_at) }}</p>
				</div>
			</div>
			<p v-else>No se encontraron partidas de Pong.</p>
		</div>

		<div v-else-if="activeTab === '3 en raya'">
			<h2 class="text-2xl font-bold mb-2">Juegos de 3 en raya</h2>
			<div v-if="tictactoeGames.length">
				<div v-for="game in tictactoeGames" :key="game.game" class="bg-white p-3 rounded shadow mb-2">
					<p><strong>Juego ID:</strong> {{ game.game }}</p>
					<p><strong>Jugador 1:</strong> {{ game.player1 }}</p>
					<p><strong>Jugador 2:</strong> {{ game.player2 }}</p>
					<p><strong>Resultado:</strong> {{ game.score1 }} - {{ game.score2 }}</p>
					<p><strong>Fecha:</strong> {{ formatDate(game.created_at) }}</p>
				</div>
			</div>
			<p v-else>No se encontraron partidas de 3 en raya.</p>
		</div>

		<div v-else-if="activeTab === 'Torneos'">
			<h2 class="text-2xl font-bold mb-2">Historial de Torneos</h2>
			<p>Aquí irá el historial de torneos.</p>
		</div>

		<div v-else-if="activeTab === 'Estadísticas'">
			<h2 class="text-2xl font-bold mb-2">Estadísticas</h2>
			<p>Aquí se mostrarán gráficos y datos de rendimiento.</p>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getGames } from '../api' // Asegúrate de que existe esta función
import type { Game } from '../api'

const tabs = ['Pong', '3 en raya', 'Torneos', 'Estadísticas']
const activeTab = ref('Pong')
const username = localStorage.getItem('username') || ''
const allGames = ref<Game[]>([])

onMounted(async () => {
	if (username) {
		try {
			const response = await getGames(username)
			allGames.value = response.games
		} catch (err) {
			console.error('Error al obtener partidas:', err)
		}
	}
})
const pongGames = computed(() =>
  allGames.value.filter(
    (game) =>
      game.type === 'pong' &&
      game.score1 !== '' &&
      game.score2 !== ''
  )
)

const tictactoeGames = computed(() =>
  allGames.value.filter(
    (game) =>
      game.type === 'TicTacToe' &&
      game.score1 !== '' &&
      game.score2 !== ''
  )
)
function formatDate(dateStr: string) {
	return new Date(dateStr).toLocaleDateString('es-ES', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	})
}
</script>