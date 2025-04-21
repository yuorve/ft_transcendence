<template>
	<div class="w-full p-6">
		<!-- Tabs -->
		<details class="flex items-center w-400 sm:hidden relative z-50">
			<summary class="list-none cursor-pointer bg-red-600 p-3 w-fit rounded-xl text-white ml-3">
				<p>{{ activeTab }}</p>
			</summary>
			<div
				class="top-full left-4 z-50 flex flex-col border-1 p-2 mt-1 w-auto -translate-x-1 gap-2 bg-gray-300 rounded-lg">
				hola
			</div>
		</details>
		<div class="gap-4 border-b border-gray-300 mb-4 bg-amber-300 sm:block hidden">
			<button v-for="tab in tabs" :key="tab" @click="activeTab = tab" :class="[
				'px-4 py-2 font-semibold',
				activeTab === tab
					? 'border-b-4 border-blue-600 text-blue-600'
					: 'text-gray-500 hover:text-blue-400'
			]">
				{{ tab }}
			</button>
			<button class="">añadir amigo</button>
			<button class="">bloquear</button>
		</div>

		<!-- Tab content -->
		<div v-if="activeTab === 'Pong'">
			<h2 class="text-2xl font-bold mb-2">Juegos de Pong</h2>
			<div v-if="pongGames.length">
				<div v-for="game in pongGames" :key="game.game" class="bg-white p-3 rounded shadow mb-2">
					<p><strong>Juego ID:</strong> {{ game.game }}</p>
					<!-- <p><strong>Juego :</strong> {{ game.type }}</p> -->
					<p><strong>Jugador 1:</strong> {{ game.player1 }}</p>
					<p><strong>Jugador 2:</strong> {{ game.player2 }}</p>
					<p>
						<strong>Resultado:</strong> {{ game.score1 }} – {{ game.score2 }}
					</p>
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
					<p>
						<strong>Resultado:</strong> {{ game.score1 }} – {{ game.score2 }}
					</p>
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
			<!-- Pie chart -->
			<ApexCharts type="pie" :options="chartOptions" :series="series" width="380" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import ApexCharts from 'vue3-apexcharts'
import { getGames } from '../api'       // tu función para obtener partidas
import type { Game } from '../api'

// registramos el componente localmente
const tabs = ['Pong', '3 en raya', 'Torneos', 'Estadísticas']
const activeTab = ref('Pong')
const username = localStorage.getItem('username') || ''
const allGames = ref<Game[]>([])

onMounted(async () => {
	if (!username) return
	try {
		const { games } = await getGames(username)
		allGames.value = games
	} catch (err) {
		console.error('Error al obtener partidas:', err)
	}
})

// filtrados
const pongGames = computed(() =>
	allGames.value.filter(
		g => g.type === 'pong' && g.score1 !== '' && g.score2 !== ''
	)
)
const tictactoeGames = computed(() =>
	allGames.value.filter(
		g => g.type === 'TicTacToe' && g.score1 !== '' && g.score2 !== ''
	)
)

// datos para el pie chart
const series = ref<number[]>([0, 0])
const chartOptions = ref({
	labels: ['Pong', '3 en raya'],
	legend: { position: 'bottom' as const },
	responsive: [
		{
			breakpoint: 480,
			options: {
				chart: { width: 300 },
				legend: { position: 'bottom' }
			}
		}
	]
})

// actualizamos los datos cada vez que cambian los arrays
watch([pongGames, tictactoeGames], () => {
	series.value = [pongGames.value.length, tictactoeGames.value.length]
}, { immediate: true })

function formatDate(dateStr: string) {
	return new Date(dateStr).toLocaleDateString('es-ES', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	})
}
</script>
