import { useContext } from "react";
import { GuestModeContext } from "../contexts/GuestModeContext";

export function useGuestMode() {
  const context = useContext(GuestModeContext);
  if (context === undefined) {
    throw new Error("useGuestMode must be used within a GuestModeProvider");
  }
  return context;
}
