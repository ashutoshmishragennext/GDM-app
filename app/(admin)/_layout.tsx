
import React, { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export default function AdminLayout() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    } else if (user.role !== "ADMIN") {
      if (user.role === "USER") router.replace("/dashboard");
      if (user.role === "SUPER_ADMIN") router.replace("/dashboard");
    }
  }, [user]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
