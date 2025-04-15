<template>
	<div class="container mx-auto p-4 bg-blue-300 mt-3 rounded-xl">
	  <h1 class="text-2xl font-bold mb-4">Amigos de {{ username }}</h1>

	  <div v-if="!friends" class="text-gray-600">
		Cargando amigos...
	  </div>
  
	  <div v-else-if="friends.length === 0" class="text-gray-600">
		Aún no tienes ningún amigo.
	  </div>
  
	  <table v-else class="table-auto w-full">
		<thead>
		  <tr>
			<th class="px-4 py-2">Amigos</th>
		  </tr>
		</thead>
		<tbody>
		  <tr v-for="friend in friends" :key="friend.id">
			<td class="border px-4 py-2">{{ friend.buddy }} - 
				<router-link :to="{ name: 'Chats', params: { buddy: friend.buddy } }">Ir al Chat</router-link>
			</td>
		  </tr>
		</tbody>
	  </table>
	  <table v-if="requests.length !== 0" class="table-auto w-full">
		<thead>
		  <tr>
			<th class="px-4 py-2">Solicitudes</th>
		  </tr>
		</thead>
		<tbody>
		  <tr v-for="request in requests" :key="request.id">
			<td class="border px-4 py-2">{{ request.buddy }}</td>
		  </tr>
		</tbody>
	  </table>	  
	  <table v-if="blocked.length !== 0" class="table-auto w-full">
		<thead>
		  <tr>
			<th class="px-4 py-2">Bloqueados</th>
		  </tr>
		</thead>
		<tbody>
		  <tr v-for="enemy in blocked" :key="enemy.id">
			<td class="border px-4 py-2">{{ enemy.buddy }}</td>
		  </tr>
		</tbody>
	  </table>
	</div>
  </template>
  
  <script>
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { getFriends, getRequests, getBlocked } from '../api'; 
  
  export default {
	data() {
	  return {
		friends: null,
		requests: null,
		blocked: null,
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
			const friendsResponse = await getFriends(username);
			this.friends = friendsResponse.friends;

			const requestsResponse = await getRequests(username);
			this.requests = requestsResponse.friends;

			const blockedResponse = await getBlocked(username);
			this.blocked = blockedResponse.friends;
		  } catch (error) {
			console.error('Error al obtener a los amigos:', error);
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