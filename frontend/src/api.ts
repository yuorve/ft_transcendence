// @ts-ignore
import type { int } from "@babylonjs/core";
import axios from "axios";

// Dirección del backend
export const API_URL = "/api";

export const registerUser = async (formData: FormData) => {
  return axios.post(`${API_URL}/register`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const UpdateImage = async (formData: FormData) => {
  try {
    return axios.post(`${API_URL}/update-profile`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  } catch (error) {
    console.error("Error al actualizar la imagen:", error);
    throw new Error("Error Actualizando.");
  }
};

export const UpdatePassword = async (formData: FormData) => {
  return axios.post(`${API_URL}/update-password`, formData);
};

export const deleteAccount = async (formData: FormData) => {
  return axios.post(`${API_URL}/delete-account`, formData);
};

export const checkUsernameAvailability = async (username: String) => {
  return axios.get(`${API_URL}/check-username/${username}`);
};

export const loginWithGoogle = async (googleToken: string) => {
  try {
    const response = await fetch(`${API_URL}/google-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: googleToken }),
    });

    return await response.json();
  } catch (error) {
    console.error("Error en la autenticación con Google:", error);
    throw new Error("Error en la conexión con el servidor.");
  }
};

// Iniciar sesión con usuario y contraseña
export async function login(username: string, password: string) {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const contentType = response.headers.get("content-type");

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Error del servidor:", errorText);
    throw new Error(`Error del servidor: ${response.status}`);
  }

  if (contentType && contentType.includes("application/json")) {
    return response.json();
  } else {
    const text = await response.text();
    console.error("Respuesta no JSON:", text);
    throw new Error("La respuesta no es JSON");
  }
}

// Obtener perfil del usuario autenticado
export async function getProfile() {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/profile`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${token}` },
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Error al obtener perfil");
  }

  // data.user es un array; devolvemos solo el primer objeto
  return payload.user[0];
}

// Actualizar idioma favorito
export async function updateFavLang(
  username: string,
  favlang: string
): Promise<{ success: boolean }> {
  const res = await fetch(`${API_URL}/user/${username}/favlang`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ favlang })
  });
  if (!res.ok) throw new Error('Error actualizando idioma favorito');
  return res.json();
}

// Obtener lista de partidas
export async function getGames(username: string) {
  const response = await fetch(`${API_URL}/games/${username}`);
  return response.json();
}

// Registrar una partida
export async function createGame(game: string, type: string, game_order: number, player1: string, player2: string, score1: string, score2: string) {
  const response = await fetch(`${API_URL}/games`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ game, type, game_order, player1, player2, score1, score2 }),
  });
  return response.json();
}

// Borrar una partida
export async function deleteGame(gameId: string) {
  const response = await fetch(`${API_URL}/delete-game/${gameId}`, {
    method: 'GET',
  });
  return response.json();
}

// Obtener una partida concreta por su ID de juego
export async function getGame(gameId: string) {
  const response = await fetch(`${API_URL}/game/${gameId}`)
  // asume que responde { game: Game }
  return response.json()
}

// Actualizar una partida
export async function updateGame(gameId: string, newPlayer1: string, newPlayer2: string, newScore1: string, newScore2: string) {
  const response = await fetch(`${API_URL}/games/${gameId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player1: newPlayer1, player2: newPlayer2, score1: newScore1, score2: newScore2 }),
  });
  return response.json();
}

// Obtener lista de TODOS los torneos
export async function getAllTournament() {
  const response = await fetch(`${API_URL}/tournaments`);
  return response.json();
}

export async function getTournament(tournamentId: string): Promise<TournamentResponse> {
  const response = await fetch(`${API_URL}/tournament/${tournamentId}`);
  if (!response.ok) {
    throw new Error(`Error al cargar el torneo ${tournamentId}: ${response.statusText}`);
  }
  return response.json();
}

export interface MyTournamentsResponse {
  tournaments: TournamentResponse[];
}

export async function getMyTournament(
  username: string
): Promise<MyTournamentsResponse> {
  const res = await fetch(`${API_URL}/mytournaments/${username}`);
  if (!res.ok) {
    throw new Error(`Error al cargar mis torneos: ${res.statusText}`);
  }
  return res.json();
}

// Registrar un torneo
export async function createTournament(id: string, game: string, round: number) {
  const response = await fetch(`${API_URL}/tournament`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, game, round }),
  });
  return response.json();
}


// Actualiza al ganador del troneo
export async function updateChampion(tournamentId: string, champion: string): Promise<{ message: string }> {
  const url = `${API_URL}/tournaments/${encodeURIComponent(tournamentId)}/champion`;
  console.log("Torneo: " + tournamentId + " Campeon: " + champion);
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ champion })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Error ${response.status} actualizando campeón: ${err.error || response.statusText}`);
  }
  return response.json();
}

// Obtener lista de amigos
export async function getFriends(username: string) {
  const response = await fetch(`${API_URL}/friends/${username}`);
  return response.json();
}

// Obtener lista de solicitudes de amistad
export async function getRequests(username: string) {
  const response = await fetch(`${API_URL}/friend-request/${username}`);
  return response.json();
}

// Obtener lista de amistades bloqueadas
export async function getBlocked(username: string) {
  const response = await fetch(`${API_URL}/friend-blocked/${username}`);
  return response.json();
}

// Enviar una solicitud de amistad
export async function sendRequest(username: string, buddy: string) {
  const response = await fetch(`${API_URL}/friend-request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, buddy }),
  });
  return response.json();
}

export async function blockUser(username: string, buddy: string, blocked = true) {
	const response = await fetch(`${API_URL}/friend-block`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			username,
			buddy,
			blocked: blocked ? "1" : "0"
		})
	});
	return await response.json();
}

export async function getBlockedUsers(username: string) {
  const response = await fetch(`/friend-blocked/${username}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch blocked users');
  }

  return data.friends;
}

export async function deleteFriend(username: string, buddy: string) {
  const res = await fetch(`${API_URL}/friends`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, buddy }),
  });
  return res.json();
}

// Aceptar/Rechazar/Bloquear una amistad
export async function actionRequest(id: string, req: string, blocked: string) {
  const response = await fetch(`${API_URL}/friends`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, req, blocked }),
  });
  return response.json();
}

// Obtener lista de chats
export async function getChats(id: string) {
  const response = await fetch(`${API_URL}/chats/${id}`);
  return response.json();
}

// Guardar un mensaje del chat
export async function saveMessage(chat: string, sender: string, message: string) {
  const response = await fetch(`${API_URL}/chats`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat, sender, message }),
  });
  return response.json();
}

// Obtener lista de usuarios
export async function getUsers() {
  const response = await fetch(`${API_URL}/users`);
  return response.json();
}

// Obtener usuario
export async function getUser(username: string) {
  const response = await fetch(`${API_URL}/user/${username}`);
  return response.json();
}

// Obtener imagen de usuario
export async function getUserImage(user: string) {
  const response = await fetch(`${API_URL}/user-image/${user}`);
  return response.json();
}

export function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

export interface Game {
  game: string;
  type: string;
  game_order: string;
  player1: string;
  player2: string;
  score1: string;
  score2: string;
  round: string;
  created_at: string;
}
export interface TournamentResponse {
  games: Game[];
  tournament: string;
  champion: string | null;
  created_at: string | null;
}

export const noPlayer = "???";