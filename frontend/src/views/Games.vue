<template>
	<div class="w-full h-fit pt-4 m-0 px-0 sm:pt-6">
		<!-- Tabs + acciones -->
		<div
			class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 bg-amber-300 p-2 w-full m-0">
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
			<div v-if="username !== auth?.username" class="flex gap-2">
				<p v-if="hasBlockedTarget()" class="text-red-700 font-semibold">
					Lo tienes bloqueado</p>
				<p v-else-if="isBlockedByTarget()" class="text-red-700 font-semibold">
					Te tiene bloqueado
				</p>
				<p v-else-if="!isFriend(String(username)) && isRequestPending()"
					class="text-gray-500 font-semibold">
					Pendiente
				</p>

				<!-- Mostrar botón de añadir amigo solo si no está pendiente ni es amigo -->
				<button v-else-if="!isFriend(String(username)) && !isRequestPending()"
					@click="addFriend(String(username))"
					class="bg-blue-500 hover:bg-blue-600 transition text-white px-2 py-1 rounded">
					➕ Añadir amigo
				</button>
				<!-- Solo mostrar si SÍ es amigo -->
				<button v-else @click="removeFriend(String(username))"
					class="bg-violet-500 hover:bg-violet-700 transition text-white px-2 py-1 rounded">
					❌ Borrar amigo
				</button>
				<div v-if="!isFriend(String(username)) && !isRequestPending()">
					<button v-if="hasBlockedTarget()" @click="handleUnblockUser(String(username))"
						class="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition">
						🔓 Desbloquear
					</button>
					<button v-else @click="handleBlockUser(String(username))"
						class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition">
						{{ t('blockUser') }}
					</button>
				</div>
			</div>

		</div>

		<!-- Pong Tab -->
		<div v-if="activeTab === 'Pong'" class="w-full h-full">
			<div class="flex flex-col items-center justify-center">
				<h2 class="text-2xl font-bold mb-2 px-4 py-1 rounded w-fit bg-white">{{ t('pongGames') }}</h2>
				<div v-if="normalPongGames.length" class="w-[98%]">
					<div v-for="game in normalPongGames" :key="game.game" class="p-4 rounded shadow mb-3" :class="{
						'bg-green-100': isWin(game), 'bg-red-100': isLoss(game)
					}">
						<p><strong>{{ t('game') }} {{ t('id') }}:</strong> {{ game.game }}</p>
						<p><strong>{{ t('player1') }}:</strong> {{ game.player1 }}</p>
						<p><strong>{{ t('player2') }}:</strong> {{ game.player2 }}</p>
						<p><strong>{{ t('score') }}:</strong> {{ game.score1 }} - {{ game.score2 }}</p>
						<p><strong>{{ t('date') }}:</strong> {{ formatDate(game.created_at) }}</p>
					</div>
				</div>
				<p v-else>{{ t('noPongGames') }}</p>
			</div>
		</div>

		<!-- 3 en raya Tab -->
		<div v-else-if="activeTab === '3 en raya'" class="w-full h-full">
			<div class="flex flex-col items-center justify-center">
				<h2 class="text-2xl font-bold mb-2 px-4 py-1 rounded w-fit bg-white">{{ t('tictacGames') }}</h2>
				<div v-if="normalTicTacToeGames.length" class="w-[98%]">
					<div v-for="game in normalTicTacToeGames" :key="game.game" class="p-4 rounded shadow mb-3" :class="{
						'bg-green-100': isWin(game), 'bg-red-100': isLoss(game)
					}">
						<p><strong>{{ t('game') }} {{ t('id') }}:</strong> {{ game.game }}</p>
						<p><strong>{{ t('player1') }}:</strong> {{ game.player1 }}</p>
						<p><strong>{{ t('player2') }}:</strong> {{ game.player2 }}</p>
						<p><strong>{{ t('score') }}:</strong> {{ game.score1 }} - {{ game.score2 }}</p>
						<p><strong>{{ t('date') }}:</strong> {{ formatDate(game.created_at) }}</p>
					</div>
				</div>
				<p v-else>{{ t('noTicTacGames') }}</p>
			</div>
		</div>

		<!-- Torneos Tab -->
		<div v-else-if="activeTab === 'Torneos'" class="w-full h-full">
			<div class="flex flex-col items-center justify-center">
				<h2 class="text-2xl font-bold mb-2 px-4 py-1 rounded w-fit bg-white">{{ t('tournamentsHistory') }}</h2>
				<div v-if="myTournaments.tournaments.length" class="space-y-4 w-[98%]">
					<div v-for="torneo in myTournaments.tournaments" :key="torneo.tournament"
						class="bg-white rounded shadow overflow-hidden">
						<details>
							<summary
								class="cursor-pointer px-4 py-2 bg-blue-100 font-semibold flex justify-between items-center">
								<span>{{ t('tournament') }} {{ torneo.tournament }} - {{ t('game') }} {{
									torneo.games[0].type }}</span>
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
		</div>

		<!-- Estadísticas Tab -->
		<div v-else-if="activeTab === 'Estadísticas'" class="w-full h-full">
			<div class="flex flex-col items-center justify-center h-full">
				<h2 class="text-2xl font-bold mb-2 px-4 py-1 rounded w-fit bg-white">Estadísticas</h2>
				<div class="w-[98%] flex flex-wrap gap-8 bg-amber-300 rounded justify-around items-center h-full">
					<!-- Partidas por tipo -->
					<div class="flex flex-col items-center sm:w-1/3 border">

						<VueApexCharts class="w-fit h-fit m-2" type="pie" :options="gamesByTypeChartOptions"
							:series="gamesByTypeSeries" />
					</div>
					<!-- Victorias/Derrotas global -->
					<div class="flex flex-col items-center sm:w-1/3 border">

						<VueApexCharts class="w-fit h-fit m-2" type="pie" :options="winLossChartOptions"
							:series="winLossSeries" />
					</div>
					<!-- Victorias/Derrotas Pong -->
					<div class="flex flex-col items-center sm:w-1/3 border">
						<VueApexCharts class="w-fit h-fit" type="pie" :options="pongWinLossChartOptions"
							:series="pongWinLossSeries" />
					</div>
					<!-- Victorias/Derrotas 3 en raya -->
					<div class="flex flex-col items-center sm:w-1/3 border">
						<VueApexCharts class="w-fit h-fit" type="pie" :options="ticTacToeWinLossChartOptions"
							:series="ticTacToeWinLossSeries" />
					</div>
				</div>

			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, inject } from 'vue'
import { deleteFriend, getGames, getMyTournament, sendRequest, getFriends, blockUser, getBlocked, getRequests } from '../api'
import type { Game, MyTournamentsResponse } from '../api'
import VueApexCharts from 'vue3-apexcharts'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n();
const route = useRoute();
const auth = inject<{ username: string }>("auth");

const tabs = ['Pong', '3 en raya', 'Torneos', 'Estadísticas']
const activeTab = ref<string>(tabs[0])
const username = route.query.username as string || localStorage.getItem('username')

// Estado de partidas y torneos
const allGames = ref<Game[]>([])
const myTournaments = ref<MyTournamentsResponse>({ tournaments: [] })

onMounted(async () => {
	if (!username) return
	try {
		await loadBlockedByOthers();
		await loadMyBlocked();
		await loadPendingRequests();
		loadFriends();
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
	title: { text: 'Partidas jugadas por tipo', align: 'center' },
	legend: { position: 'bottom', horizontalAlign: 'center' }
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
	title: { text: 'Victorias vs Derrotas', align: 'center' },
	legend: { position: 'bottom', horizontalAlign: 'center' }
}

// Victorias vs Derrotas Pong
const pongWinLossSeries = computed(() => {
	const wins = allGames.value.filter(g => g.type === 'pong' && ((g.player1 === username && Number(g.score1) > Number(g.score2)) || (g.player2 === username && Number(g.score2) > Number(g.score1)))).length
	const losses = allGames.value.filter(g => g.type === 'pong' && ((g.player1 === username && Number(g.score1) < Number(g.score2)) || (g.player2 === username && Number(g.score2) < Number(g.score1)))).length
	return [wins, losses]
})
const pongWinLossChartOptions = { labels: ['Victorias Pong', 'Derrotas Pong'], title: { text: 'Victorias/Derrotas Pong', align: 'center' }, legend: { position: 'bottom', horizontalAlign: 'center' } }

// Victorias vs Derrotas 3 en raya
const ticTacToeWinLossSeries = computed(() => {
	const wins = allGames.value.filter(g => g.type === 'TicTacToe' && ((g.player1 === username && Number(g.score1) > Number(g.score2)) || (g.player2 === username && Number(g.score2) > Number(g.score1)))).length
	const losses = allGames.value.filter(g => g.type === 'TicTacToe' && ((g.player1 === username && Number(g.score1) < Number(g.score2)) || (g.player2 === username && Number(g.score2) < Number(g.score1)))).length
	return [wins, losses]
})
const ticTacToeWinLossChartOptions = { labels: ['Victorias 3 en raya', 'Derrotas 3 en raya'], title: { text: 'Victorias/Derrotas 3 en raya', align: 'center' }, legend: { position: 'bottom', horizontalAlign: 'center' } }

// Helper para formatear fechas
function formatDate(dateStr: string) {
	return new Date(dateStr).toLocaleDateString('es-ES', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	})
}

const currentUser = localStorage.getItem("username") || "";

async function handleBlockUser(buddyName: string) {
	try {
		await blockUser(currentUser, buddyName);
		alert(`${buddyName} has been blocked`);
		await loadMyBlocked();
	} catch (err) {
		console.error(err);
		alert(`Error blocking ${buddyName}: ${err}`);
	}
}

const addFriend = async (buddy: string) => {
	if (buddy === currentUser) {
		alert("No puedes añadirte a ti mismo.");
		return;
	}

	try {
		const res = await sendRequest(String(username), currentUser);
		alert(`${username} has been requested as a friend`);
		console.log(res.message || "Solicitud enviada a " + username);
		await loadPendingRequests();
		loadFriends();
	} catch (err) {
		console.error("Error al añadir amigo:", err);
		alert("No se pudo añadir el amigo");
	}
}

const removeFriend = async (buddy: string) => {
	const confirmDelete = confirm(`¿Estás seguro de que quieres eliminar a ${buddy} de tu lista de amigos?`);
	if (!confirmDelete) return;

	try {
		await deleteFriend(currentUser, buddy);
		loadFriends();
		alert('Amigo eliminado');
	} catch (err) {
		console.error('Error eliminando amigo:', err);
		alert('No se pudo eliminar al amigo');
	}
};

const friends = ref<any[]>([]);
const loadFriends = async () => {
	try {
		const res = await getFriends(String(currentUser));
		friends.value = res.friends || [];
	} catch (err) {
		console.error('Error al cargar amigos:', err);
	}
};

function isFriend(name: string): boolean {
	return friends.value.some(f => f.buddy === name || f.username === name);
}

const blockedMe = ref<any[]>([]);

const loadBlockedByOthers = async () => {
	try {
		// Obtenemos a quién ha bloqueado el usuario que estoy mirando (no el actual)
		const res = await getBlocked(String(username)); // username = persona objetivo
		console.log("usuario bloqueado por otros:", res);
		console.log(res);
		blockedMe.value = res.friends || [];
	} catch (err) {
		console.error('Error comprobando bloqueos:', err);
	}
};

function isBlockedByTarget(): boolean {
	return blockedMe.value.some(entry => entry.buddy === currentUser);
}
const myBlocked = ref<any[]>([]);

const loadMyBlocked = async () => {
	try {
		const res = await getBlocked(String(currentUser)); // quién he bloqueado yo
		myBlocked.value = res.friends || [];
	} catch (err) {
		console.error("Error al cargar mi lista de bloqueados", err);
	}
};
function hasBlockedTarget(): boolean {
	return myBlocked.value.some(entry => entry.buddy === username);
}

async function handleUnblockUser(buddyName: string) {
	try {
		// Aquí modificas blocked = "0" en backend
		await blockUser(currentUser, buddyName, false); // debes adaptar blockUser() a esto
		alert(`${buddyName} ha sido desbloqueado`);

		await loadMyBlocked(); // Recarga para actualizar el botón
	} catch (err) {
		console.error(err);
		alert(`Error al desbloquear a ${buddyName}`);
	}
}

const pendingRequests = ref<any[]>([]);

const loadPendingRequests = async () => {
	try {
		const res = await getRequests(String(username));
		pendingRequests.value = res.friends || [];
	} catch (err) {
		console.error("Error cargando solicitudes pendientes:", err);
	}
};

function isRequestPending(): boolean {
	return pendingRequests.value.some(
		req => req.buddy === currentUser
	);
}
</script>
