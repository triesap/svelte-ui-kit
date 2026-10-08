import type { PageServerLoad } from "./$types";

export const load = (({ url }) => ({
  loadedArrival: url.searchParams.get("arrival") ?? "none",
})) satisfies PageServerLoad;
