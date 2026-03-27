import { Redirect } from "expo-router";

// Root index — immediately redirect based on session (handled in _layout.jsx)
export default function Index() {
  return <Redirect href="/auth/login" />;
}
