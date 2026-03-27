/**
 * services/api.js
 * ────────────────
 * All HTTP calls to the FastAPI backend.
 * Login uses email + password.
 */

import axios from "axios";

const client = axios.create({ baseURL: "http://127.0.0.1:8000/api" });

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (email, password) =>
  client.post("/auth/login", { email, password }).then((r) => r.data);

export const register = (full_name, prn, email, password) =>
  client.post("/auth/register", { full_name, prn, email, password }).then((r) => r.data);

// ── Complaints ────────────────────────────────────────────────────────────────
export const submitComplaint = (user_id, text, location, is_emergency = false) =>
  client.post("/complaints/", { user_id, text, location, is_emergency }).then((r) => r.data);

export const fetchComplaints = (params = {}) =>
  client.get("/complaints/", { params }).then((r) => r.data);

export const updateComplaint = (id, data) =>
  client.patch(`/complaints/${id}`, data).then((r) => r.data);

export const demoteComplaint = (id) =>
  client.patch(`/complaints/${id}/demote`).then((r) => r.data);

// ── Analytics ─────────────────────────────────────────────────────────────────
export const fetchStats = () =>
  client.get("/analytics/stats").then((r) => r.data);

export const fetchClusters = () =>
  client.get("/analytics/clusters").then((r) => r.data);
