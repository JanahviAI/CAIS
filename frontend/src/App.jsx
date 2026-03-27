import { useState } from "react";
import LoginPage    from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import UserDashboard  from "./components/user/UserDashboard";
import AdminDashboard from "./components/admin/AdminDashboard";

export default function App() {
  const [session, setSession] = useState(null);
  const [page, setPage]       = useState("login"); // "login" | "register"

  if (!session) {
    if (page === "register") {
      return (
        <RegisterPage
          onRegistered={data => { setSession(data); setPage("login"); }}
          onBackToLogin={() => setPage("login")}
        />
      );
    }
    return (
      <LoginPage
        onLogin={data => setSession(data)}
        onRegister={() => setPage("register")}
      />
    );
  }

  if (session.role === "user") return <UserDashboard user={session} onLogout={() => setSession(null)} />;
  return <AdminDashboard user={session} onLogout={() => setSession(null)} />;
}
