import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSession } from "../hooks/useSession";
import { View, ActivityIndicator } from "react-native";
import { COLORS } from "../constants/colors";

export default function RootLayout() {
  const { session, loading } = useSession();
  const router   = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuth = segments[0] === "auth";

    if (!session && !inAuth) {
      // Not logged in — send to login
      router.replace("/auth/login");
    } else if (session && inAuth) {
      // Logged in but on auth screen — send to app
      router.replace("/tabs/submit");
    }
  }, [session, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.navy }}>
        <ActivityIndicator size="large" color={COLORS.white} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth" />
        <Stack.Screen name="tabs" />
      </Stack>
    </>
  );
}
