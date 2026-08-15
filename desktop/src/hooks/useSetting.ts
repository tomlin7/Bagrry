import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";
import { toast } from "@/components/ui/toast";

/**
 * A single row of the SQLite `settings` table, exposed as state. Writes are
 * optimistic so toggles feel instant, and rolled back if the command fails.
 */
export function useSetting(key: string, fallback = "") {
  const queryClient = useQueryClient();
  const queryKey = api.qk.settings([key]);

  const { data } = useQuery({
    queryKey,
    queryFn: async () => (await api.getSetting(key)) || fallback,
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: (value: string) => api.setSetting(key, value),
    onMutate: async (value) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<string>(queryKey);
      queryClient.setQueryData(queryKey, value);
      return { previous };
    },
    onError: (error, _value, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
      toast.error(error, "That preference wasn't saved.");
    },
  });

  const set = useCallback((value: string) => mutation.mutate(value), [mutation]);

  return [data ?? fallback, set] as const;
}

export function useBoolSetting(key: string, fallback = false) {
  const [raw, set] = useSetting(key, fallback ? "1" : "0");
  return [raw === "1" || raw === "true", (value: boolean) => set(value ? "1" : "0")] as const;
}
