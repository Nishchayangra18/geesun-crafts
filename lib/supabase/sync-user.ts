type UserPreferences = {
  art_styles: string[];
  usage: string[];
};

type SyncUserPayload = {
  phone?: string | null;
  preferences?: UserPreferences;
};

export async function syncAuthenticatedUser(
  accessToken?: string | null,
  payload?: SyncUserPayload,
) {
  if (!accessToken) return;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  await fetch("/api/users", {
    method: "POST",
    headers,
    body: JSON.stringify(payload ?? {}),
  });
}
