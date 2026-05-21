import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMe } from "@/routes/api/me";

export function useAuth() {
  const fetchMe = useServerFn(getMe);
  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => fetchMe(),
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
  };
}
