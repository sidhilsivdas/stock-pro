"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getConnection, getServerConnection, getSocket, subscribeConnection } from "@/lib/socket";

// Live connection info: status, latency, and how many people are online
export function useConnection() {
  useEffect(() => {
    getSocket(); // make sure the socket exists
  }, []);
  return useSyncExternalStore(subscribeConnection, getConnection, getServerConnection);
}
