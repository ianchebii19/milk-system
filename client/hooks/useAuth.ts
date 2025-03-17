"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

export default function useAuth() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return; // Prevents execution on the server

    console.log("Current Path:", pathname, "Authenticated:", isAuthenticated);

    // **Handle Unauthenticated Users**
    if (!isAuthenticated) {
      if (!pathname.startsWith("/login") && !pathname.startsWith("/register")) {
        router.push("/login");
      }
      return;
    }

    // **Redirect Authenticated Users to their Dashboards**
    if (pathname === "/") {
      if (user?.role === "ADMIN") router.push("/admin");
      else if (user?.role === "OPERATOR") router.push("/operator");
      else if (user?.role === "FARMER") router.push("/farmer");
      else router.push("/unauthorized");
      return;
    }

    // **Prevent Admin Access for Non-Admins**
    if (pathname.startsWith("/admin") && user?.role !== "ADMIN") {
      router.push("/unauthorized");
      return;
    }

    // **Prevent Operator Access for Non-Operators**
    if (pathname.startsWith("/operator") && user?.role !== "OPERATOR") {
      router.push("/unauthorized");
      return;
    }

    // **Prevent Farmer Access for Non-Farmers**
    if (pathname.startsWith("/farmer") && user?.role !== "FARMER") {
      router.push("/unauthorized");
      return;
    }
  }, [isAuthenticated, user, pathname, router]);

  return { isAuthenticated, user };
}
