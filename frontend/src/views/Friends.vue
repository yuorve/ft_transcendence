<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { actionRequest, getBlocked, getFriends, getRequests, getUsers } from '../api'
import router from '../router'

interface User { username: string }

const allUsers = ref<User[]>([])
const searchTerm = ref('')
const results = ref<User[]>([])

const username = localStorage.getItem('username') || '';
const requests = ref<any[]>([]);

const loadRequests = async () => {
	try {
		const res = await getRequests(username);
		requests.value = res.friends || [];
	} catch (err) {
		console.error('Error al cargar solicitudes:', err);
	}
};

const acceptRequest = async (id: string) => {
	await actionRequest(id, '0', '0'); // acepta la solicitud
	await loadRequests(); // recarga
	loadFriends();
};

const rejectRequest = async (id: string) => {
	await actionRequest(id, '2', '0'); // marca como rechazada
	await loadRequests();
};

// Al montar, carga la lista completa
onMounted(async () => {
	try {
		loadRequests();
		loadFriends();
		await loadBlocked();
		const res = await getUsers()
		// getUsers devuelve { users: User[] }
		allUsers.value = res.users || []
	} catch (err) {
		console.error('No se pudo cargar usuarios:', err)
	}
})
// Computed que actualiza resultados en cuanto cambia searchTerm
const filteredUsers = computed(() => {
	const q = searchTerm.value.trim().toLowerCase()
	if (!q) return []
	return allUsers.value.filter(u =>
		u.username.toLowerCase().includes(q)
	)
})

function select(username: string) {
	searchTerm.value = username
	// aquí decides qué hacer: emitir un evento, navegar…
	router.push({ path: '/games', query: { username: searchTerm.value } })
	results.value = []  // opcional: oculta la lista tras seleccionar
}

const friends = ref<any[]>([]);
const loadFriends = async () => {
	try {
		const res = await getFriends(username);
		friends.value = res.friends || [];
	} catch (err) {
		console.error('Error al cargar amigos:', err);
	}
};

const blocked = ref<any[]>([]);

const loadBlocked = async () => {
	try {
		const res = await getBlocked(username);
		blocked.value = res.friends || [];
	} catch (err) {
		console.error('Error al cargar bloqueados:', err);
	}
};
</script>

<template>
	<div class="flex w-[98%] flex-col md:flex-row h-full gap-3">
		<div class="flex flex-col md:w-1/3 w-full items-center justify-center">
			<div class="flex flex-col w-[90%] h-[90%]  rounded-xl">
				<div class="flex relative w-full bg-white px-4 py-2 rounded-t-xl">
					<h1 class="text-xl font-bold mx-4 my-2">Buscar</h1>
					<input v-model="searchTerm" type="text" placeholder="Buscar usuario…"
						class="w-full max-w-64 border p-2 rounded" />
					<ul v-if="filteredUsers.length"
						class="absolute top-15 left-30 z-10 w-64 bg-white border rounded mt-1 max-h-40 overflow-auto">
						<li v-for="user in filteredUsers" :key="user.username" @click="select(user.username)"
							class="px-2 py-1 hover:bg-gray-100 cursor-pointer">
							{{ user.username }}
						</li>
					</ul>
				</div>
				<div class="bg-white w-full h-full rounded-b-xl">
					<h1 class="text-xl font-bold mt-4 mb-2 m-3">Solicitudes pendientes</h1>
					<table class="table-auto w-full bg-gray-300 rounded-xl">
						<thead>
							<tr class="bg-white">
								<th class="text-center px-4 py-2">Usuario</th>
								<th class="px-4 py-2 text-center">Acción</th>
							</tr>
						</thead>
						<tbody>
							<tr v-if="requests.length" v-for="sol in requests" :key="sol.id">
								<td class="text-center px-4 py-2">{{ sol.buddy }}</td>
								<td class="items-center justify-center flex px-4 py-2">
									<button @click="acceptRequest(sol.id)"
										class="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded mr-2">
										Aceptar
									</button>
									<button @click="rejectRequest(sol.id)"
										class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded">
										Rechazar
									</button>
								</td>
							</tr>
							<p v-else class="text-gray-500 px-4 py-2">Sin solicitudes todavia</p>
						</tbody>
					</table>
			</div>
			</div>
		</div>
		<div class="flex md:w-1/3 w-full items-center justify-center">

			<div class="w-[90%] h-[90%] bg-green-400 rounded-xl">
				<h1 class="text-2xl font-bold mx-4 my-2">Mis amigos</h1>

				<table class="table-auto w-full bg-green-200 rounded-xl">
					<thead>
						<tr class="bg-white">
							<th class="text-center px-4 py-2">Nombre de usuario</th>
							<th class="text-center px-4 py-2">Acciones</th>
						</tr>
					</thead>
					<tbody>
						<tr v-if="friends.length" v-for="friend in friends" :key="friend.id">
							<td class=" px-4 py-2">{{ friend.buddy }}</td>
							<td class=" px-4 py-2">
								<!-- Aquí puedes poner botones como "Chatear", "Eliminar", etc -->
								<button class="bg-blue-500 hover:bg-blue-700 transition rounded px-2">noFunc</button>
							</td>
						</tr>
						<p v-else class="text-gray-500 px-4 py-2">Sin amigos todavia</p>
					</tbody>
				</table>
			</div>
		</div>

		<div class="flex md:w-1/3 w-full items-center justify-center">
			<div class="w-[90%] h-[90%] bg-red-500 rounded-xl">

				<h1 class="text-2xl font-bold mx-4 my-2">Usuarios bloqueados</h1>

				<table class="table-auto w-full bg-red-200 rounded-b-xl">
					<thead>
						<tr class="bg-white">
							<th class="text-left px-4 py-2">Nombre de usuario</th>
							<th class="text-left px-4 py-2">Acciones</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="user in blocked" :key="user.id">
							<td class=" px-4 py-2">{{ user.buddy }}</td>
							<td class=" px-4 py-2">
								<button class="bg-blue-500 hover:bg-blue-700 transition rounded px-2">noFunc</button>
							</td>
						</tr>
						<tr v-if="blocked.length === 0">
							<td colspan="2" class="text-gray-500 px-4 py-2">No tienes usuarios bloqueados</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</div>
</template>