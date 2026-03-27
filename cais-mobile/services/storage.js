/**
 * services/storage.js
 * ────────────────────
 * Thin wrapper around AsyncStorage.
 * Stores: user session, backend IP address.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  SESSION: "cais_session",
  IP:      "cais_backend_ip",
};

const DEFAULT_IP = "127.0.0.1";

// ── Session ───────────────────────────────────────────────────────────────────

export async function saveSession(user) {
  await AsyncStorage.setItem(KEYS.SESSION, JSON.stringify(user));
}

export async function getSession() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function clearSession() {
  await AsyncStorage.removeItem(KEYS.SESSION);
}

// ── Backend IP ────────────────────────────────────────────────────────────────

export async function saveIP(ip) {
  await AsyncStorage.setItem(KEYS.IP, ip.trim());
}

export async function getIP() {
  try {
    const ip = await AsyncStorage.getItem(KEYS.IP);
    return ip || DEFAULT_IP;
  } catch {
    return DEFAULT_IP;
  }
}
