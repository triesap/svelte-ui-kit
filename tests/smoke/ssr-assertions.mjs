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

/** The HTML with HTML comment content removed. */
export function stripComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, "");
}

/**
 * The visible server markup with both scripts and comments removed. A marker
 * that appears only inside a serialized hydration script or an HTML comment is
 * therefore never counted as rendered content.
 */
export function visibleMarkup(html) {
  return stripComments(stripScripts(html));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
  const visible = visibleMarkup(response.body);
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
  const visible = visibleMarkup(response.body);
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

/**
 * Assert the actual generated component markup, not merely page wrapper text.
 *
 * Each expectation names one generated component by the element tag it
 * renders, the component's own `data-kit-marker` attribute value and the exact
 * stage-specific text it must contain. The assertion isolates the marked
 * element's own content (up to that element's closing tag) and requires the
 * expected text to appear *inside* it, so text in an unrelated later element
 * cannot satisfy the assertion even when an earlier marked element is empty:
 *
 * - a page that only renders its own `data-*-marker` wrappers (no generated
 *   component) cannot pass;
 * - a marker placed only in a serialized script or an HTML comment cannot pass,
 *   because scripts and comments are stripped first;
 * - a missing generated component cannot pass; and
 * - stale generated markup (the marker/text of another stage) cannot pass.
 *
 * Transport success is asserted independently so a 500 or wrong content type
 * cannot satisfy a component assertion. Returns the visible markup.
 */
export function assertGeneratedComponentMarkup(
  response,
  { components = [], absent = [] } = {},
  label = "SSR",
) {
  assertHtmlTransport(response, label);
  const visible = visibleMarkup(response.body);
  for (const component of components) {
    const { tag, marker, text } = component;
    // The content group is bounded by the first closing tag for this element,
    // so a match can never span out of an empty marked element into unrelated
    // later markup. The captured inner content must itself contain the exact
    // expected text.
    const pattern = new RegExp(
      `<${escapeRegExp(tag)}\\b[^>]*\\bdata-kit-marker="${escapeRegExp(marker)}"[^>]*>([\\s\\S]*?)<\\/${escapeRegExp(tag)}>`,
    );
    const match = pattern.exec(visible);
    assert.ok(
      match !== null && match[1].includes(text),
      `${label}: generated <${tag}> with data-kit-marker=${JSON.stringify(marker)} and content ${JSON.stringify(text)} is absent from visible server-rendered markup`,
    );
  }
  for (const marker of absent) {
    assert.ok(
      !visible.includes(`data-kit-marker="${marker}"`),
      `${label}: unexpected generated component marker ${JSON.stringify(marker)}`,
    );
  }
  return visible;
}
