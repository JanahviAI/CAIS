/**
 * services/api.js
 * ────────────────
 * All HTTP calls to the FastAPI backend.
 * Base URL is built dynamically from the stored IP address —
 * so changing the IP in Settings instantly affects all requests.
 */

import axios from "axios";
import { getIP } from "./storage";

// Build a fresh client on every call using the current stored IP
async function getClient() {
  const ip = await getIP();
  return axios.create({
    baseURL: `http://${ip}:8000/api`,
    timeout: 10000,
  });
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(email, password) {
  const client = await getClient();
  const res = await client.post("/auth/login", { email, password });
  return res.data;
}

export async function register(full_name, prn, email, password) {
  const client = await getClient();
  const res = await client.post("/auth/register", { full_name, prn, email, password });
  return res.data;
}

// ── Complaints ────────────────────────────────────────────────────────────────

export async function submitComplaint(user_id, text, location, is_emergency = false) {
  const client = await getClient();
  const res = await client.post("/complaints/", { user_id, text, location, is_emergency });
  return res.data;
}

export async function fetchComplaints(params = {}) {
  const client = await getClient();
  const res = await client.get("/complaints/", { params });
  return res.data;
}

// ── Connectivity test ─────────────────────────────────────────────────────────

export async function testConnection(ip) {
  try {
    const res = await axios.get(`http://${ip}:8000/`, { timeout: 5000 });
    return res.status === 200;
  } catch {
    return false;
  }
}
