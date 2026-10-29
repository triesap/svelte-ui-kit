import { env } from "$env/dynamic/private";
export function load({ url }: { url: URL }) {
  return {
    serverValue: url.searchParams.get("name") ?? "Server visitor",
    fixtureWitness: env.OWNED_FIXTURE_WITNESS ?? "unqualified",
  };
}
