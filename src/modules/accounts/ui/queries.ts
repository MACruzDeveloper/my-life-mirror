import { useQuery } from "@tanstack/react-query";
import type { Gender } from "@modules/accounts/domain/Profile";
import { getJson } from "@shared/ui/api/getJson";
import { useOptionalSession } from "@shared/ui/context/SessionContext";

export interface ProfileResponse {
  name: string;
  birthDate?: string;
  gender?: Gender;
  timeZone?: string;
  /** RF-40: ideas personalizadas con IA activadas por el usuario. */
  aiIdeasEnabled?: boolean;
}

export const PROFILE_KEY = ["profile"] as const;

/** Perfil del usuario (RF-03); `null` si todavía no tiene (react-query no admite `undefined` como dato). */
export function useProfile(enabled = true) {
  return useQuery({ queryKey: PROFILE_KEY, enabled, queryFn: ({ signal }) => getJson<ProfileResponse | null>("/api/accounts/profile", signal) });
}

/** RF-40: hay que pedir ideas personalizadas solo si la función existe en este despliegue y el usuario la activó. */
export function useAiIdeasActive(): boolean {
  const session = useOptionalSession();
  const available = session?.aiIdeasAvailable === true;
  // Sin la función disponible ni siquiera se pide el perfil.
  const profile = useProfile(available);
  return available && profile.data?.aiIdeasEnabled === true;
}
