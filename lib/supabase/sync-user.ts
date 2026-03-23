type UserPreferences = {
  art_styles: string[];
  usage: string[];
};

type SyncUserPayload = {
  phone?: string | null;
  preferences?: UserPreferences;
  password?: string;
};

type SyncedUserProfile = {
  id: string;
  email: string;
  phone: string | null;
  preferences: UserPreferences | null;
  created_at: string;
  last_login: string;
};

function buildAuthHeaders(accessToken: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function syncAuthenticatedUser(
  accessToken?: string | null,
  payload?: SyncUserPayload,
) {
  if (!accessToken) return;

  const response = await fetch("/api/users", {
    method: "POST",
    headers: buildAuthHeaders(accessToken),
    body: JSON.stringify(payload ?? {}),
  });

  if (!response.ok) {
    let errorMessage = "Failed to sync user profile.";
    try {
      const data = (await response.json()) as { error?: string };
      if (data?.error) errorMessage = data.error;
    } catch {
      // Ignore JSON parsing errors and use a fallback error message.
    }
    throw new Error(errorMessage);
  }
}

export async function fetchAuthenticatedUserProfile(
  accessToken?: string | null,
): Promise<SyncedUserProfile | null> {
  if (!accessToken) return null;

  const response = await fetch("/api/users", {
    method: "GET",
    headers: buildAuthHeaders(accessToken),
  });

  if (!response.ok) {
    throw new Error("Failed to load user profile.");
  }

  const data = (await response.json()) as { user?: SyncedUserProfile | null };
  return data.user ?? null;
}
