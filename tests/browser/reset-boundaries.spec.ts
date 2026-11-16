import { writeFileSync } from "node:fs";
import { buildResetBoundariesConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

// Normal application acceptance covers connected-document roots. Extended native
// mount environments are a deliberate diagnostic selection, not skipped tests or
// an assertion that their previously observed reset defects have been repaired.
const extended = process.env["SUIK_EXTENDED_RESET_CHARACTERIZATION"];
if (extended !== undefined && extended !== "1")
  throw new Error("SUIK_EXTENDED_RESET_CHARACTERIZATION must be absent or 1");
const scopes = extended
  ? ["connected", "detached", "shadow", "foreign-document"]
  : ["connected"];

for (const custom of [false, true]) {
  test.describe(`native form root boundaries ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildResetBoundariesConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildResetBoundariesConsumer(custom);
      hosted = await startFixtureServer({ handler: consumer.handler });
    });
    test.afterAll(async () => {
      let closed = false;
      try {
        if (hosted) {
          await hosted.server.stop();
          closed = true;
          expect(hosted.server.failure()).toBeNull();
        }
      } finally {
        if (closed) consumer?.cleanup();
      }
    });
    for (const scope of scopes) {
      for (const canceled of [false, true]) {
        test(`${scope} programmatic reset ${canceled ? "canceled" : "completed"} matches actual native form state`, async ({
          page,
        }, info) => {
          const url = new URL(consumer.route, hosted.baseURL);
          url.searchParams.set("scope", scope);
          await page.goto(url.href);
          await expect(page.locator('[data-ready="true"]')).toBeVisible();
          await page
            .getByRole("button", { name: "Edit controls", exact: true })
            .click();
          await expect
            .poll(async () =>
              JSON.parse(
                await page.locator("#observation").innerText(),
              ).controls.map((c: { bound: string }) => c.bound),
            )
            .toEqual(["Edited", "Edited", "Edited"]);
          if (canceled)
            await page
              .getByRole("button", { name: "Cancel reset", exact: true })
              .click();
          await page
            .getByRole("button", { name: "Reset controls", exact: true })
            .click();
          await expect
            .poll(
              async () =>
                JSON.parse(await page.locator("#observation").innerText())
                  .resets.length,
            )
            .toBe(3);
          const observed = JSON.parse(
            await page.locator("#observation").innerText(),
          );
          const artifact = info.outputPath("native-root-observation.json");
          writeFileSync(
            artifact,
            JSON.stringify(
              { scope, canceled, observed, inputs: consumer.evidence },
              null,
              2,
            ),
          );
          await info.attach("native-root-observation", {
            path: artifact,
            contentType: "application/json",
          });
          const expected = canceled ? "Edited" : "Default";
          expect(observed.controls).toEqual(
            ["plain", "raw", "generated"].map((cohort) => ({
              cohort,
              value: expected,
              bound: expected,
              data: [["value", expected]],
              connected: scope !== "detached",
            })),
          );
          expect(observed.counts).toEqual({ plain: 1, raw: 1, generated: 1 });
          expect(
            observed.resets.map(
              (event: { prevented: boolean }) => event.prevented,
            ),
          ).toEqual([canceled, canceled, canceled]);
        });
      }
    }
  });
}
