import type { PageServerLoad } from "./$types";

/**
 * Request-local server load.
 *
 * The value is read from the request URL on every render and returned as
 * plain data. It is never cached or stored in module-level server state, so
 * concurrent and repeated requests stay independent.
 */
export const load: PageServerLoad = ({ url }) => {
  const requested = url.searchParams.get("name");
  const serverValue =
    requested === null || requested === "" ? "world" : requested;
  return { serverValue };
};
