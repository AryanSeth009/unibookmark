import useSWR from "swr"

export interface Profile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
  last_bookmark_date?: string
  bookmark_streak?: number
  bookmark_count?: number
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useProfile() {
  const { data, error, mutate } = useSWR("/api/profile", fetcher)

  return {
    profile: data?.profile,
    isLoading: !error && !data,
    isError: error,
    mutate,
  }
}

export async function updateProfile(profileData: { full_name?: string; avatar_url?: string }) {
  const response = await fetch("/api/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profileData),
  })

  if (!response.ok) {
    throw new Error("Failed to update profile")
  }

  return response.json()
}
