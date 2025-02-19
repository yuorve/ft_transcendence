const API_URL = "http://localhost:4000"; // Dirección del backend

// Iniciar sesión con usuario y contraseña
export async function login(username, password) {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return response.json();
}

// Registro de usuario
export async function register(username, password) {
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return response.json();
}

// Iniciar sesión con Google
export async function googleLogin(token) {
  const response = await fetch(`${API_URL}/google-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  return response.json();
}

// Obtener perfil del usuario autenticado
export async function getProfile() {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/profile`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${token}` },
  });
  return response.json();
}

// Obtener lista de partidas
export async function getGames() {
  const response = await fetch(`${API_URL}/games`);
  return response.json();
}

// Registrar una partida
export async function createGame(player1, player2, score) {
  const response = await fetch(`${API_URL}/games`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player1, player2, score }),
  });
  return response.json();
}
