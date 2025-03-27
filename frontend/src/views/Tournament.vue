<script setup lang="ts">
import { ref, onMounted, inject, computed, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
// import { watch } from "vue";

import { createTournament, createGame, generateId } from "../api";
// const number = ref<number>(localStorage.getItem("number") ? parseInt(localStorage.getItem("number")!) : 0);
const ranks = ref<string[][]>([]); // Matriz para guardar los jugadores en cada ronda

// 🚀 Obtener el usuario actual del sistema (debe estar en `provide` en `App.vue`)
const auth = inject<{ username: string }>("auth");
const currentUser = auth?.username || "Tú"; // Si no hay usuario, poner "Tú"
const router = useRouter();
const receiveRoute = useRoute();
const winner =  receiveRoute.query.winner || "no winner";
const idtournament = generateId();

const player1 = computed(() =>{
  return ranks.value.length > 0 && ranks.value[0].length > 0 ? ranks.value[0][0] : auth?.username;
});

const player2 = computed (() => {
  return ranks.value.length > 0 && ranks.value[0].length > 0 ? ranks.value[0][1] : "Invitado";
});


const redirect = () => {
  if (player1.value && player2.value)
    router.push({
    path: "/Pong",
    query: { 
      player1: player1.value, 
      player2: player2.value 
    }
  });  
  else {
    alert("No hay suficientes jugadores para jugar Pong");
  }
};

onMounted(() => {
  const storedTour = localStorage.getItem("TourGroups");
  if (storedTour) {
    ranks.value = JSON.parse(storedTour);
  }
  else
  {
    // const idtournament = generateId();
    console.log("id torneo " + idtournament);
  }
  // window.addEventListener("beforeunload", handleBeforeUnload);
});

// function handleBeforeUnload() {
//   localStorage.removeItem("number");
//   localStorage.removeItem("TourGroups");
// }

// Guardar `number` en localStorage cada vez que cambia
// watch(number, (newValue) => {
//   if (newValue !== 0) {
//     localStorage.setItem("number", newValue.toString());
//   }
// });

// onUnmounted(() => {
//   winner = "no winner";
// });

// Reiniciar el número de jugadores
const reset = () => {
  // number.value = 0;
  ranks.value = [];
  localStorage.removeItem("TourGroups");
};

// ✅ Función para generar los participantes del torneo
const generateRanks = (count: number) => {
  ranks.value = [];
  
    console.log(idtournament);
    // Primera ronda: Jugadores
  let players: string[] = [currentUser]; // Primero el usuario logeado
  for (let i = 1; i < count; i++) {
    players.push(`Jugador ${i + 1}`);
    if (i % 2 != 0) 
    {
      const idgame = generateId();
      createGame(idgame, "pong", players[i - 1], players[i], "", "");
      createTournament(idtournament, idgame, 1);
    }
  }
  ranks.value.push(players);


  // Generar rondas eliminatorias (división por 2 en cada ronda)
  while (players.length > 1) {
    players = players.reduce((acc: string[], _, index) => {
      if (index % 2 === 0) acc.push(`Ganador de Ronda ${ranks.value.length}`);
      return acc;
    }, []);
    ranks.value.push(players);
  }
  
  // Guardar en localStorage
  localStorage.setItem("TourGroups", JSON.stringify(ranks.value));
};
const updateRanks = () => {
  ranks.value[1][0] = winner as string
  
};
</script>


<template>
    <div class="bg-violet-700 h-1/2 flex flex-col items-center gap-10">
        <p>Selecciona el número de jugadores</p>
        <!-- <label for="numPl" class="bg-green-500">num jugadres</label>
        <input for="numPl" type="number" class="bg-white border-3" v-model="number">
        <button @click="increment" class="bg-red-400 cursor-pointer w-20">sumar {{ number }}</button> -->
        <div class="flex items-center justify-center gap-10">
            <button @click="reset" class="cursor-pointer bg-amber-300 py-1 px-3 rounded-md">reset</button>
            <!-- <button @click="generateRanks(number)" class="cursor-pointer bg-amber-300 py-1 px-3 rounded-md">{{number}}</button> -->
            <button @click="generateRanks(2)" class="cursor-pointer bg-amber-300 py-1 px-3 rounded-md">2</button>
            <button @click="generateRanks(4)" class="cursor-pointer bg-amber-300 py-1 px-3 rounded-md">4</button>
            <button @click="generateRanks(8)" class="cursor-pointer bg-amber-300 py-1 px-3 rounded-md">8</button>
        </div>
        <div class="flex flex-col-reverse w-auto">
            <div v-for="(num, index) in ranks" :key="index" class="bg-gray-200 p-3 m-2 rounded flex justify-around">
                <div v-for="n in num" :key="n" class="bg-green-400 p-3 mx-3">{{ n }}</div>
            </div>
        </div>
    </div>
    <div class="flex items-center justify-center m m-3">
      <button class="p-2 bg-gradient-to-b from-red-400 to-red-800 w-fit cursor-pointer rounded-md border-2 border-red-400 text-2xl text-white" @click="redirect"> jugar pong con {{ player1 }} y {{ player2 }}</button>
    </div>
    <div class="flex items-center justify-center m m-3">
      <button @click="updateRanks" class="cursor-pointer bg-amber-300 py-1 px-3 rounded-md">Test update</button>
    </div>
</template>