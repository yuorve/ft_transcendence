import type { int } from "@babylonjs/core";
import axios from "axios";

export const API_URL = "http://localhost:4000"; // Dirección del backend

export const registerUser = async (formData: FormData) => {
  return axios.post(`${API_URL}/register`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

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
  return response.json();
}

// Obtener perfil del usuario autenticado
export async function getProfile() {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/profile`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${token}` },
  });
  const data = await response.json();
  return data.user;
}

// Obtener lista de partidas
export async function getGames() {
  const response = await fetch(`${API_URL}/games`);
  return response.json();
}

// Registrar una partida
export async function createGame(player1: string, player2: string, score: int) {
  const response = await fetch(`${API_URL}/games`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player1, player2, score }),
  });
  return response.json();
}
