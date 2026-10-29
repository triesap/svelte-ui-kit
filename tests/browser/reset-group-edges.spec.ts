import { writeFileSync } from "node:fs";
import { buildResetFamiliesConsumer } from "../helpers/generated-consumer.js";
import {
  buildQualificationRuntime,
  qualificationRuntimeMode,
} from "../helpers/qualification-runtime.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

const scenarios = [
  "checkbox-empty",
  "checkbox-multiple",
  "checkbox-duplicates",
  "checkbox-object",
  "radio-empty",
  "radio-undefined",
  "radio-undefined-empty",
  "radio-null",
  "radio-null-empty",
] as const;
const phases = ["capture", "target", "bubble"];
for (const custom of [false, true]) {
  test.describe(`native group edges ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildResetFamiliesConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildResetFamiliesConsumer(
        custom,
        buildQualificationRuntime(qualificationRuntimeMode()),
        "reset-group-edges",
      );
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
    for (const scenario of scenarios) {
      for (const method of ["native", "programmatic"] as const) {
        for (const phase of ["none", "capture", "target", "bubble"] as const) {
          test(`${scenario} ${method} reset at ${phase} qualifies values and native model constraints`, async ({
            page,
          }, info) => {
            const url = new URL(consumer.route, hosted.baseURL);
            url.searchParams.set("scenario", scenario);
            await page.goto(url.href);
            await expect(page.locator('[data-ready="true"]')).toBeVisible();
            await page
              .getByRole("button", {
                name: "Configure native defaults",
                exact: true,
              })
              .click();
            await expect(page.locator("#default-facts")).not.toHaveText("{}");
            const configuredDefaults = JSON.parse(
              await page.locator("#default-facts").innerText(),
            );
            expect(configuredDefaults.raw).toEqual(configuredDefaults.plain);
            const cohorts =
              scenario === "checkbox-duplicates"
                ? ["plain", "raw", "kit"]
                : ["plain", "raw"];
            if (scenario === "checkbox-duplicates")
              expect(configuredDefaults.kit).toEqual(configuredDefaults.plain);
            await page
              .getByRole("button", { name: `Cancel ${phase}`, exact: true })
              .click();
            for (const cohort of ["plain", "raw"]) {
              if (scenario.startsWith("checkbox-"))
                for (const input of await page
                  .locator(`#${cohort}-form input`)
                  .all())
                  await input.uncheck();
              await page.locator(`#${cohort}-beta`).check();
            }
            if (scenario === "checkbox-duplicates") {
              for (const name of [
                "Kit alpha",
                "Kit beta",
                "Kit duplicate alpha",
              ])
                await page
                  .getByRole("checkbox", { name, exact: true })
                  .uncheck();
              await page
                .getByRole("checkbox", { name: "Kit beta", exact: true })
                .check();
            }
            const before = JSON.parse(
              await page.locator("#counts").innerText(),
            );
            for (const cohort of cohorts)
              await page
                .getByRole("button", {
                  name: `${method === "native" ? "Native" : "Programmatic"} reset ${cohort}`,
                  exact: true,
                })
                .click();
            await page.evaluate(
              () => new Promise<void>((resolve) => setTimeout(resolve, 0)),
            );
            const observed = await page.evaluate((isRadio) => {
              function native(cohort: string) {
                const form = document.getElementById(`${cohort}-form`);
                if (!(form instanceof HTMLFormElement))
                  throw new Error("Actual form required");
                const selected = Array.from(
                  form.querySelectorAll<HTMLInputElement>("input:checked"),
                  (input) => input.value,
                );
                return {
                  value: isRadio ? (selected[0] ?? null) : selected,
                  data: [...new FormData(form)],
                };
              }
              return {
                plain: native("plain"),
                raw: native("raw"),
                kit: document.getElementById("kit-form") ? native("kit") : null,
                kitBound: JSON.parse(
                  document.getElementById("kit-bound")!.textContent!,
                ),
                bound: JSON.parse(
                  document.getElementById("raw-bound")!.textContent!,
                ),
                counts: JSON.parse(
                  document.getElementById("counts")!.textContent!,
                ),
                events: JSON.parse(
                  document.getElementById("events")!.textContent!,
                ),
                ticks: JSON.parse(
                  document.getElementById("ticks")!.textContent!,
                ),
              };
            }, scenario.startsWith("radio-"));
            const artifact = info.outputPath("native-group-edge.json");
            writeFileSync(
              artifact,
              JSON.stringify(
                {
                  scenario,
                  method,
                  phase,
                  configuredDefaults,
                  before,
                  observed,
                  inputs: consumer.evidence,
                },
                null,
                2,
              ),
            );
            await info.attach("native-group-edge", {
              path: artifact,
              contentType: "application/json",
            });
            const reset = phase === "none";
            const expected = scenario.startsWith("radio-")
              ? reset
                ? scenario.endsWith("empty")
                  ? null
                  : "alpha"
                : "beta"
              : reset
                ? scenario.endsWith("empty")
                  ? []
                  : scenario === "checkbox-multiple"
                    ? ["alpha", "beta"]
                    : ["alpha"]
                : ["beta"];
            expect(observed.plain.value).toEqual(expected);
            if (reset && scenario === "checkbox-duplicates") {
              // Native membership arrays link equal values; they cannot model
              // independently checked defaults for those separate controls.
              expect(observed.raw).toEqual({
                value: ["alpha", "alpha"],
                data: [
                  ["value", "alpha"],
                  ["value", "alpha"],
                ],
              });
            } else if (reset && scenario === "radio-null-empty") {
              // Native bind:group uses null for no selection, so an option
              // whose value is null is selected by that same model value.
              expect(observed.raw).toEqual({
                value: "alpha",
                data: [["value", "alpha"]],
              });
            } else expect(observed.raw).toEqual(observed.plain);
            if (scenario === "checkbox-duplicates") {
              expect(observed.kit).toEqual(observed.plain);
              expect(observed.kitBound).toEqual(
                reset ? [true, false, false] : [false, true, false],
              );
            }
            if (scenario === "checkbox-object")
              expect(observed.bound).toEqual({
                values: expected,
                identityValid: true,
              });
            else if (scenario.startsWith("radio-")) {
              const expectedModel = !reset
                ? { kind: "value", value: "beta" }
                : scenario.endsWith("empty") || scenario === "radio-null"
                  ? { kind: "null" }
                  : scenario === "radio-undefined"
                    ? { kind: "undefined" }
                    : { kind: "value", value: "alpha" };
              expect(observed.bound).toEqual(expectedModel);
            } else expect(observed.bound).toEqual(expected);
            expect(observed.counts).toEqual(before);
            expect(
              observed.events.map(
                ({
                  trusted,
                  ...event
                }: {
                  trusted: boolean;
                  cohort: string;
                  phase: string;
                  prevented: boolean;
                }) => {
                  expect(typeof trusted).toBe("boolean");
                  return event;
                },
              ),
            ).toEqual(
              cohorts.flatMap((cohort) =>
                phases.map((at, index) => ({
                  cohort,
                  phase: at,
                  prevented: phase !== "none" && index >= phases.indexOf(phase),
                })),
              ),
            );
            for (let index = 1; index < cohorts.length; index++)
              expect(
                observed.events
                  .slice(index * 3, index * 3 + 3)
                  .map((event: { trusted: boolean }) => event.trusted),
              ).toEqual(
                observed.events
                  .slice(0, 3)
                  .map((event: { trusted: boolean }) => event.trusted),
              );
            if (method === "programmatic")
              expect(observed.ticks.raw).toEqual(observed.bound);
          });
        }
      }
    }
    test("no-reset model assignment independently witnesses linked duplicates and the null sentinel", async ({
      page,
    }, info) => {
      const observations = [];
      for (const scenario of ["checkbox-duplicates", "radio-null-empty"]) {
        const url = new URL(consumer.route, hosted.baseURL);
        url.searchParams.set("scenario", scenario);
        await page.goto(url.href);
        await expect(page.locator('[data-ready="true"]')).toBeVisible();
        await page
          .getByRole("button", {
            name: "Configure native defaults",
            exact: true,
          })
          .click();
        await page
          .getByRole("button", { name: "Project raw model", exact: true })
          .click();
        const observed = await page.evaluate(() => {
          const form = document.getElementById("raw-form");
          if (!(form instanceof HTMLFormElement))
            throw new Error("Actual form required");
          return {
            checked: Array.from(
              form.querySelectorAll<HTMLInputElement>("input:checked"),
              (node) => node.id,
            ),
            data: [...new FormData(form)],
            bound: JSON.parse(
              document.getElementById("raw-bound")!.textContent!,
            ),
            events: JSON.parse(document.getElementById("events")!.textContent!),
          };
        });
        expect(observed.events).toEqual([]);
        expect(observed.checked).toEqual(
          scenario === "checkbox-duplicates"
            ? ["raw-alpha", "raw-duplicate"]
            : ["raw-alpha"],
        );
        expect(observed.data).toEqual(
          scenario === "checkbox-duplicates"
            ? [
                ["value", "alpha"],
                ["value", "alpha"],
              ]
            : [["value", "alpha"]],
        );
        expect(observed.bound).toEqual(
          scenario === "checkbox-duplicates" ? ["alpha"] : { kind: "null" },
        );
        observations.push({ scenario, observed });
      }
      const artifact = info.outputPath("native-group-projection-control.json");
      writeFileSync(
        artifact,
        JSON.stringify({ observations, inputs: consumer.evidence }, null, 2),
      );
      await info.attach("native-group-projection-control", {
        path: artifact,
        contentType: "application/json",
      });
    });
  });
}
