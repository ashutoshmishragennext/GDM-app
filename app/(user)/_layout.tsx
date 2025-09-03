import React, { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export default function UserLayout() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      // No user logged in → back to login
      router.replace("/login");
    } else if (user.role !== "USER") {
      // Wrong role → redirect to correct dashboard
      if (user.role === "ADMIN") router.replace("/dashboard");
      if (user.role === "SUPER_ADMIN") router.replace("/dashboard");
    }
  }, [user]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
