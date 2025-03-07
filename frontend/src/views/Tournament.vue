<script setup lang="ts">
import { ref, watch, onMounted } from "vue";

const number = ref<number>(localStorage.getItem("number") ? parseInt(localStorage.getItem("number")!) : 0);


onMounted(() => {
    const storedTour = localStorage.getItem("TourGroups");
  if (storedTour) {
    ranks.value = JSON.parse(storedTour);
  }
  window.addEventListener("beforeunload", handleBeforeUnload);
});

function handleBeforeUnload() {
  localStorage.removeItem("number");
  localStorage.removeItem("TourGroups");
}

watch(number, (newValue) => {
  if (newValue !== 0) {
    localStorage.setItem("number", newValue.toString());
  }
});

// const increment = () => {
//   number.value++;
// };
const reset = () => {
  number.value = 0;
};

const ranks = ref<number[]>([]);

const generateRanks = (count:number) => {
    ranks.value = [];
while(count > 0) {
    ranks.value.push(count);
    count = Math.floor(count / 2);
    }
    localStorage.setItem("TourGroups", JSON.stringify(ranks.value));
}

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
                <div v-for="n in num" :key="n" class="bg-green-400 p-3 mx-3">player {{ n }}</div>
            </div>
        </div>
    </div>
</template>