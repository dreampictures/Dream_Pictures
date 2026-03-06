import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { PortfolioItemResponse } from "@shared/routes";

export function usePortfolio() {
  return useQuery({
    queryKey: [api.portfolio.list.path],
    queryFn: async (): Promise<PortfolioItemResponse> => {
      const res = await fetch(api.portfolio.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch portfolio");
      const data = await res.json();
      return api.portfolio.list.responses[200].parse(data);
    },
  });
}
