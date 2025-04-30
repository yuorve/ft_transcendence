<template>
  <div class="connection-lost">
    <h1>Conexión Perdida</h1>
    <p>
      Tu conexión ha sido reemplazada por otra pestaña o ventana. Por favor, recarga la página para continuar.
    </p>
    <button @click="reloadPage">Recargar Página</button>
    
  </div>
</template>
  
<script setup lang="ts">
  const reloadPage = () => {
    const redirectUrl: string | null = localStorage.getItem('redirectUrl');
    localStorage.removeItem('redirectUrl');
    window.location.replace(redirectUrl ?? '/');
  };
</script>
  
<style scoped>
.connection-lost {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
}

.connection-lost h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.connection-lost p {
  font-size: 1.1rem;
  margin-bottom: 2rem;
  padding: 0 1rem;
  max-width: 600px;
}

.connection-lost button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.connection-lost button:hover {
  background-color: #0056b3;
}
</style>
  