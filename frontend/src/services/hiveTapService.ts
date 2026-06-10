import { apiCall } from "./api";

export interface GeoLocation {
  lat: number;
  lng: number;
}

export function getCurrentLocation(): Promise<GeoLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Géolocalisation non supportée sur cet appareil."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () =>
        reject(
          new Error(
            "Active la localisation pour confirmer que tu es proche de ton chum.",
          ),
        ),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  });
}

export async function getHiveTapBalance() {
  return apiCall<{ balance: number }>("/hive-tap/balance");
}

export async function createHiveTapToken(
  amount: number,
  location: GeoLocation,
) {
  return apiCall<{ token: string; expiresInMs: number }>("/hive-tap/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, location }),
  });
}

export async function processHiveTapToken(
  token: string,
  location: GeoLocation,
) {
  return apiCall<{
    success: boolean;
    amount: number;
    transactionId: string;
    hapticPattern: string;
    balance: number;
  }>("/hive-tap/process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, location }),
  });
}
