import { useQuery } from "@tanstack/react-query";
import { api, buildUrl, type AlbumResponse } from "@shared/routes";

export function useAlbum(code: string | null) {
  return useQuery({
    queryKey: [api.albums.get.path, code],
    queryFn: async () => {
      if (!code) throw new Error("No album code provided");
      
      const url = buildUrl(api.albums.get.path, { code });
      const res = await fetch(url, { credentials: "include" });
      
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("ALBUM_NOT_FOUND");
        }
        throw new Error("Failed to fetch album");
      }
      
      const data = await res.json();
      // Since it's z.custom<AlbumResponse>(), we can just cast it for TypeScript
      return data as AlbumResponse;
    },
    enabled: !!code,
    retry: false, // Don't retry 404s
  });
}
