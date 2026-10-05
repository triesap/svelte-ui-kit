/**
 * Shared SSR assertion helpers for the S007 consumer fixture suite.
 *
 * Transport success (HTTP 200 + HTML content type) is asserted independently
 * from the visible-markup assertion, so a negative control cannot be satisfied
 * by an unrelated HTTP 500 or a wrong content type. The missing-markup error is
 * specific and greppable.
 */
import { strict as assert } from "node:assert";

/** The HTML with executable/serialized script content removed. */
export function stripScripts(html) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
}

/**
 * Assert successful HTTP transport independent of page content. Throws for a
 * non-200 status or a non-HTML content type.
 */
export function assertHtmlTransport(response, label) {
  assert.equal(response.status, 200, `${label}: expected HTTP 200`);
  assert.match(
    response.contentType,
    /text\/html/,
    `${label}: expected an HTML content type`,
  );
}

/**
 * Return a specific Error when visible server-rendered markup is missing, or
 * null when the expected heading and request-local value are both present.
 */
export function missingSsrMarkupError(response, expectedValue) {
  const visible = stripScripts(response.body);
  if (!/Consumer fixture qualification/.test(visible)) {
    return new Error(
      "missing visible SSR markup: the server-rendered route heading is absent",
    );
  }
  if (!visible.includes(`Server value: ${expectedValue}`)) {
    return new Error(
      `missing visible SSR markup: the request-local value ${JSON.stringify(expectedValue)} is absent`,
    );
  }
  return null;
}

/**
 * Assert the response is real server-rendered HTML carrying the qualification
 * heading and request-local value in visible markup (not only in the
 * serialized hydration script).
 */
export function assertServerRendered(response, expectedValue) {
  assertHtmlTransport(response, "SSR");
  const error = missingSsrMarkupError(response, expectedValue);
  if (error) throw error;
  return stripScripts(response.body);
}

/**
 * Assert the visible (non-script) server-rendered markup contains every
 * expected component/marker string and none of the forbidden ones. Transport
 * success is asserted independently so a 500 or wrong content type cannot
 * satisfy a marker assertion. Returns the visible markup for diagnostics.
 */
export function assertVisibleMarkers(
  response,
  { present = [], absent = [] } = {},
  label = "SSR",
) {
  assertHtmlTransport(response, label);
  const visible = stripScripts(response.body);
  for (const marker of present) {
    assert.ok(
      visible.includes(marker),
      `${label}: missing visible marker ${JSON.stringify(marker)}`,
    );
  }
  for (const marker of absent) {
    assert.ok(
      !visible.includes(marker),
      `${label}: unexpected visible marker ${JSON.stringify(marker)}`,
    );
  }
  return visible;
}
