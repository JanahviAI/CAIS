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

export const registerSuperAdmin = (full_name, email, password) =>
  client.post("/auth/register/super", { full_name, email, password }).then((r) => r.data);

// ── Complaints ────────────────────────────────────────────────────────────────
export const submitComplaint = (user_id, text, location, is_emergency = false, dept_id = null) =>
  client.post("/complaints/", { user_id, text, location, is_emergency, dept_id }).then((r) => r.data);

export const fetchComplaints = (params = {}) =>
  client.get("/complaints/", { params }).then((r) => r.data);

export const updateComplaint = (id, data, actor_id = null) =>
  client.patch(`/complaints/${id}`, data, { params: actor_id ? { actor_id } : {} }).then((r) => r.data);

export const demoteComplaint = (id, actor_id = null) =>
  client.patch(`/complaints/${id}/demote`, {}, { params: actor_id ? { actor_id } : {} }).then((r) => r.data);

// ── RCA ───────────────────────────────────────────────────────────────────────
export const fetchComplaintAnalysis = (complaint_id) =>
  client.get(`/complaints/${complaint_id}/analysis`).then((r) => r.data);

export const rerunComplaintAnalysis = (complaint_id) =>
  client.post(`/complaints/${complaint_id}/analysis`).then((r) => r.data);

// ── Analytics ─────────────────────────────────────────────────────────────────
export const fetchStats = () =>
  client.get("/analytics/stats").then((r) => r.data);

export const fetchClusters = () =>
  client.get("/analytics/clusters").then((r) => r.data);

export const fetchOrganizationStats = (user_id) =>
  client.get("/analytics/organization", { params: { user_id } }).then((r) => r.data);

export const fetchDepartmentStats = (dept_id, user_id) =>
  client.get(`/analytics/department/${dept_id}`, { params: { user_id } }).then((r) => r.data);

// ── Departments ───────────────────────────────────────────────────────────────
export const fetchDepartments = () =>
  client.get("/departments/").then((r) => r.data);

export const createDepartment = (name, location, user_id) =>
  client.post("/departments/", { name, location }, { params: { user_id } }).then((r) => r.data);

export const assignDeptAdmin = (dept_id, target_user_id, caller_id) =>
  client.post(`/departments/${dept_id}/admins`, { user_id: target_user_id }, { params: { caller_id } }).then((r) => r.data);

export const fetchDeptAdmins = (dept_id) =>
  client.get(`/departments/${dept_id}/admins`).then((r) => r.data);

export const removeDeptAdmin = (dept_id, target_user_id, caller_id) =>
  client.delete(`/departments/${dept_id}/admins/${target_user_id}`, { params: { caller_id } }).then((r) => r.data);

// ── Anomalies ─────────────────────────────────────────────────────────────────
export const fetchAnomalies = (dept_id = null) =>
  client.get("/anomalies/", { params: dept_id ? { dept_id } : {} }).then((r) => r.data);

export const fetchCategoryAnomalies = (dept_id = null) =>
  client.get("/anomalies/by-category", { params: dept_id ? { dept_id } : {} }).then((r) => r.data);

