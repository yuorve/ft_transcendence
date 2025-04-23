<template>
	<div class="w-full p-4 sm:p-6">
		<!-- Tabs + acciones -->
		<div
			class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-gray-300 mb-4 bg-amber-300 p-2">
			<!-- Grupo de pestañas -->
			<div class="flex flex-wrap sm:flex-nowrap gap-4 overflow-x-auto">
				<button v-for="tab in tabs" :key="tab" @click="activeTab = tab" :class="[
					'px-4 py-2 font-semibold whitespace-nowrap',
					activeTab === tab
						? 'border-b-4 border-blue-600 text-blue-600'
						: 'text-gray-500 hover:text-blue-400'
				]">
					{{ tab }}
				</button>
			</div>
			<!-- Botones de acción -->
			<div class="flex gap-2">
				<button class="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition">
					Añadir amigo
				</button>
				<button class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition">
					Bloquear
				</button>
			</div>
		</div>

		<!-- Pong Tab -->
		<div v-if="activeTab === 'Pong'" class="p-4">
			<h2 class="text-2xl font-bold mb-4">Juegos de Pong</h2>
			<div v-if="normalPongGames.length">
				<div v-for="game in normalPongGames" :key="game.game" class="bg-white p-4 rounded shadow mb-3">
					<p><strong>Juego ID:</strong> {{ game.game }}</p>
					<p><strong>Jugador 1:</strong> {{ game.player1 }}</p>
					<p><strong>Jugador 2:</strong> {{ game.player2 }}</p>
					<p><strong>Resultado:</strong> {{ game.score1 }} - {{ game.score2 }}</p>
					<p><strong>Fecha:</strong> {{ formatDate(game.created_at) }}</p>
				</div>
			</div>
			<p v-else>No se encontraron partidas de Pong.</p>
		</div>

		<!-- 3 en raya Tab -->
		<div v-else-if="activeTab === '3 en raya'" class="p-4">
			<h2 class="text-2xl font-bold mb-4">Juegos de 3 en raya</h2>
			<div v-if="normalTicTacToeGames.length">
				<div v-for="game in normalTicTacToeGames" :key="game.game" class="bg-white p-4 rounded shadow mb-3">
					<p><strong>Juego ID:</strong> {{ game.game }}</p>
					<p><strong>Jugador 1:</strong> {{ game.player1 }}</p>
					<p><strong>Jugador 2:</strong> {{ game.player2 }}</p>
					<p><strong>Resultado:</strong> {{ game.score1 }} - {{ game.score2 }}</p>
					<p><strong>Fecha:</strong> {{ formatDate(game.created_at) }}</p>
				</div>
			</div>
			<p v-else>No se encontraron partidas de 3 en raya.</p>
		</div>

		<!-- Torneos Tab -->
		<div v-else-if="activeTab === 'Torneos'" class="p-4">
			<h2 class="text-2xl font-bold mb-4">Historial de Mis Torneos</h2>

			<div v-if="myTournaments.tournaments.length" class="space-y-4">
				<div v-for="torneo in myTournaments.tournaments" :key="torneo.tournament"
					class="bg-white rounded shadow overflow-hidden">
					<details>
						<summary
							class="cursor-pointer px-4 py-2 bg-blue-100 font-semibold flex justify-between items-center">
							<span>Torneo {{ torneo.tournament }}</span>
							<span class="text-green-700">
								Ganador: {{ torneo.champion || 'Pendiente' }}
							</span>
						</summary>
						<div class="p-4 bg-white">
							<div v-for="game in torneo.games" :key="game.game"
								class="mb-3 border-b last:border-b-0 pb-2" :class="{
									'bg-green-100': isWin(game),
									'bg-red-100': isLoss(game)
								}">
								<p>
									<strong>Ronda {{ game.round }} — Juego {{ game.game_order }}:</strong>
								</p>
								<p>
									{{ game.player1 }} vs {{ game.player2 }}
									<span v-if="game.score1 !== '' && game.score2 !== ''">
										{{ game.score1 }} - {{ game.score2 }}
									</span>
									<span v-else class="italic text-gray-500">Sin puntuar</span>
								</p>
								<p><strong>Fecha:</strong> {{ formatDate(game.created_at) }}</p>
							</div>
						</div>
					</details>
				</div>
			</div>
			<p v-else class="text-gray-500">No has participado en ningún torneo.</p>
		</div>

		<!-- Estadísticas Tab -->
		<div v-else-if="activeTab === 'Estadísticas'">
			<h2 class="text-2xl font-bold mb-2">Estadísticas</h2>
			<div class="flex flex-wrap gap-8">
				<!-- Partidas por tipo -->
				<VueApexCharts type="pie" :options="gamesByTypeChartOptions" :series="gamesByTypeSeries" width="380"
					height="380" />
				<!-- Victorias/Derrotas global -->
				<VueApexCharts type="pie" :options="winLossChartOptions" :series="winLossSeries" width="380"
					height="380" />
				<!-- Victorias/Derrotas Pong -->
				<VueApexCharts type="pie" :options="pongWinLossChartOptions" :series="pongWinLossSeries" width="380"
					height="380" />
				<!-- Victorias/Derrotas 3 en raya -->
				<VueApexCharts type="pie" :options="ticTacToeWinLossChartOptions" :series="ticTacToeWinLossSeries"
					width="380" height="380" />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getGames, getMyTournament } from '../api'
import type { Game, MyTournamentsResponse } from '../api'
import VueApexCharts from 'vue3-apexcharts'

const tabs = ['Pong', '3 en raya', 'Torneos', 'Estadísticas']
const activeTab = ref<string>(tabs[0])
const username = localStorage.getItem('username') || ''

// Estado de partidas y torneos
const allGames = ref<Game[]>([])
const myTournaments = ref<MyTournamentsResponse>({ tournaments: [] })

onMounted(async () => {
	if (!username) return
	try {
		const { games } = await getGames(username)
		allGames.value = games

		const data = await getMyTournament(username)
		myTournaments.value = data
	} catch (err: any) {
		console.error('Error cargando datos:', err)
	}
})

// Filtros para cada tipo de juego
const normalPongGames = computed(() =>
	allGames.value.filter(
		g => g.type === 'pong' && g.score1 !== '' && g.score2 !== '' && Number(g.game_order) === -1
	)
)
const normalTicTacToeGames = computed(() =>
	allGames.value.filter(
		g => g.type === 'TicTacToe' && g.score1 !== '' && g.score2 !== '' && Number(g.game_order) === -1
	)
)

// Helpers para determinar victoria/derrota del usuario
function isWin(game: Game): boolean {
	const s1 = Number(game.score1)
	const s2 = Number(game.score2)
	if (game.player1 === username) return !isNaN(s1) && !isNaN(s2) && s1 > s2
	if (game.player2 === username) return !isNaN(s1) && !isNaN(s2) && s2 > s1
	return false
}
function isLoss(game: Game): boolean {
	const s1 = Number(game.score1)
	const s2 = Number(game.score2)
	if (game.player1 === username) return !isNaN(s1) && !isNaN(s2) && s1 < s2
	if (game.player2 === username) return !isNaN(s1) && !isNaN(s2) && s2 < s1
	return false
}
// Estadística: partidas por tipo (incluye torneos)
const gamesByTypeSeries = computed(() => {
	const pongCount = allGames.value.filter(g => g.type === 'pong' && g.score1 !== "" && g.score2 !== "").length
	const tttCount = allGames.value.filter(g => g.type === 'TicTacToe' && g.score1 !== "" && g.score2 !== "").length
	return [pongCount, tttCount]
})
const gamesByTypeChartOptions = {
	labels: ['Pong', '3 en raya'],
	title: { text: 'Partidas jugadas por tipo' }
}

// Estadística: victorias vs derrotas
const winLossSeries = computed(() => {
	let wins = 0
	let losses = 0
	allGames.value.forEach(g => {
		// Solo juegos con marcador completo
		if (g.score1 !== '' && g.score2 !== '') {
			const userIsP1 = g.player1 === username
			const userScore = userIsP1 ? Number(g.score1) : Number(g.score2)
			const oppScore = userIsP1 ? Number(g.score2) : Number(g.score1)
			if (userScore > oppScore) wins++
			else losses++
		}
	})
	return [wins, losses]
})
const winLossChartOptions = {
	labels: ['Victorias', 'Derrotas'],
	title: { text: 'Victorias vs Derrotas' }
}

// Victorias vs Derrotas Pong
const pongWinLossSeries = computed(() => {
	const wins = allGames.value.filter(g => g.type === 'pong' && ((g.player1 === username && Number(g.score1) > Number(g.score2)) || (g.player2 === username && Number(g.score2) > Number(g.score1)))).length
	const losses = allGames.value.filter(g => g.type === 'pong' && ((g.player1 === username && Number(g.score1) < Number(g.score2)) || (g.player2 === username && Number(g.score2) < Number(g.score1)))).length
	return [wins, losses]
})
const pongWinLossChartOptions = { labels: ['Victorias Pong', 'Derrotas Pong'], title: { text: 'Victorias/Derrotas Pong' } }

// Victorias vs Derrotas 3 en raya
const ticTacToeWinLossSeries = computed(() => {
	const wins = allGames.value.filter(g => g.type === 'TicTacToe' && ((g.player1 === username && Number(g.score1) > Number(g.score2)) || (g.player2 === username && Number(g.score2) > Number(g.score1)))).length
	const losses = allGames.value.filter(g => g.type === 'TicTacToe' && ((g.player1 === username && Number(g.score1) < Number(g.score2)) || (g.player2 === username && Number(g.score2) < Number(g.score1)))).length
	return [wins, losses]
})
const ticTacToeWinLossChartOptions = { labels: ['Victorias 3 en raya', 'Derrotas 3 en raya'], title: { text: 'Victorias/Derrotas 3 en raya' } }

// Helper para formatear fechas
function formatDate(dateStr: string) {
	return new Date(dateStr).toLocaleDateString('es-ES', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	})
}
</script>
