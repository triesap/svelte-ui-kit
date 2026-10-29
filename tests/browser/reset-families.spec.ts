import { writeFileSync } from "node:fs";
import { buildResetFamiliesConsumer } from "../helpers/generated-consumer.js";
import {
  buildQualificationRuntime,
  qualificationRuntimeMode,
} from "../helpers/qualification-runtime.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

const kinds = [
  "number",
  "range",
  "checked",
  "multiple",
  "files",
  "checkbox-group",
  "radio-group",
  "chained",
  "chained-reverse",
] as const;
for (const custom of [false, true]) {
  test.describe(`native binding families ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildResetFamiliesConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildResetFamiliesConsumer(
        custom,
        buildQualificationRuntime(qualificationRuntimeMode()),
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
    for (const kind of kinds) {
      for (const method of ["native", "programmatic"] as const) {
        for (const phase of ["none", "capture", "target", "bubble"] as const) {
          test(`${kind} ${method} reset at ${phase} preserves actual native values and callbacks`, async ({
            page,
          }, info) => {
            const url = new URL(consumer.route, hosted.baseURL);
            url.searchParams.set("kind", kind);
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
            await page
              .getByRole("button", { name: `Cancel ${phase}`, exact: true })
              .click();
            for (const cohort of ["plain", "raw"]) {
              const input = page.locator(`#${cohort}-input`);
              if (kind === "number") await input.fill("30");
              else if (kind === "range") {
                await input.focus();
                await input.press("Home");
                for (let step = 0; step < 30; step++)
                  await input.press("ArrowRight");
              } else if (
                kind === "checked" ||
                kind === "chained" ||
                kind === "chained-reverse"
              ) {
                await input.check();
                await input.uncheck();
              } else if (kind === "multiple")
                await input.selectOption(["beta"]);
              else if (kind === "files")
                await input.setInputFiles({
                  name: "owned-fixture.txt",
                  mimeType: "text/plain",
                  buffer: Buffer.from("owned native file"),
                });
              else {
                if (kind === "checkbox-group")
                  await page.locator(`#${cohort}-alpha`).uncheck();
                await page.locator(`#${cohort}-beta`).check();
              }
            }
            await page.locator("#commit-native-edits").click();
            const before = JSON.parse(
              await page.locator("#counts").innerText(),
            );
            for (const cohort of ["plain", "raw"])
              await page
                .getByRole("button", {
                  name: `${method === "native" ? "Native" : "Programmatic"} reset ${cohort}`,
                  exact: true,
                })
                .click();
            await page.evaluate(
              () => new Promise<void>((resolve) => setTimeout(resolve, 0)),
            );
            const reactiveBoundBeforeProbe = JSON.parse(
              await page.locator("#raw-bound").innerText(),
            );
            await page
              .getByRole("button", {
                name: "Read current native bindings",
                exact: true,
              })
              .click();
            await expect(page.locator("#binding-probe")).not.toHaveText("");
            const bindingProbe = JSON.parse(
              await page.locator("#binding-probe").innerText(),
            );
            const snapshot = await page.evaluate((kind) => {
              const native = (cohort: string) => {
                const form = document.getElementById(`${cohort}-form`);
                if (!(form instanceof HTMLFormElement))
                  throw new Error("Actual form required");
                const input = form.querySelector("input");
                const select = form.querySelector("select");
                let value: unknown;
                if (kind === "multiple")
                  value = Array.from(
                    select!.selectedOptions,
                    (option) => option.value,
                  );
                else if (kind === "files")
                  value = Array.from(input!.files!, (file) => ({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                  }));
                else if (kind === "number" || kind === "range")
                  value = input!.valueAsNumber;
                else if (kind === "checked") value = input!.checked;
                else if (kind === "chained" || kind === "chained-reverse")
                  value = {
                    group: input!.checked ? [input!.value] : [],
                    checked: input!.checked,
                  };
                else {
                  const checked = Array.from(
                    form.querySelectorAll<HTMLInputElement>("input:checked"),
                    (node) => node.value,
                  );
                  value =
                    kind === "radio-group" ? (checked[0] ?? null) : checked;
                }
                return {
                  value,
                  data: Array.from(new FormData(form), ([name, item]) => [
                    name,
                    item instanceof File
                      ? { name: item.name, size: item.size, type: item.type }
                      : item,
                  ]),
                };
              };
              return {
                plain: native("plain"),
                raw: native("raw"),
                bound: JSON.parse(
                  document.getElementById("raw-bound")!.textContent!,
                ),
                counts: JSON.parse(
                  document.getElementById("counts")!.textContent!,
                ),
                events: JSON.parse(
                  document.getElementById("events")!.textContent!,
                ),
                tickFacts: JSON.parse(
                  document.getElementById("tick-facts")!.textContent!,
                ),
              };
            }, kind);
            const observed = {
              ...snapshot,
              reactiveBoundBeforeProbe,
              bindingProbe,
            };
            const artifact = info.outputPath("native-family-observation.json");
            writeFileSync(
              artifact,
              JSON.stringify(
                {
                  kind,
                  method,
                  phase,
                  before,
                  configuredDefaults,
                  observed,
                  inputs: consumer.evidence,
                },
                null,
                2,
              ),
            );
            await info.attach("native-family-observation", {
              path: artifact,
              contentType: "application/json",
            });
            const reset = phase === "none";
            const expected =
              kind === "number" || kind === "range"
                ? reset
                  ? 10
                  : 30
                : kind === "checked"
                  ? reset
                  : kind === "multiple"
                    ? reset
                      ? ["alpha", "gamma"]
                      : ["beta"]
                    : kind === "files"
                      ? reset
                        ? []
                        : [
                            {
                              name: "owned-fixture.txt",
                              size: Buffer.byteLength("owned native file"),
                              type: "text/plain",
                            },
                          ]
                      : kind === "chained" || kind === "chained-reverse"
                        ? { group: reset ? ["alpha"] : [], checked: reset }
                        : kind === "radio-group"
                          ? reset
                            ? "alpha"
                            : "beta"
                          : reset
                            ? ["alpha"]
                            : ["beta"];
            expect(observed.plain.value).toEqual(expected);
            expect(observed.raw).toEqual(observed.plain);
            expect(observed.bindingProbe.value).toEqual(observed.plain.value);
            expect(observed.reactiveBoundBeforeProbe).toEqual(
              observed.plain.value,
            );
            expect(observed.bound).toEqual(observed.plain.value);
            expect(observed.counts).toEqual(before);
            expect(observed.events).toHaveLength(6);
            const phases = ["capture", "target", "bubble"];
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
              ["plain", "raw"].flatMap((cohort) =>
                phases.map((at, index) => ({
                  cohort,
                  phase: at,
                  prevented: phase !== "none" && index >= phases.indexOf(phase),
                })),
              ),
            );
            expect(
              observed.events
                .slice(0, 3)
                .map((event: { trusted: boolean }) => event.trusted),
            ).toEqual(
              observed.events
                .slice(3)
                .map((event: { trusted: boolean }) => event.trusted),
            );
            if (method === "programmatic")
              expect(observed.tickFacts.raw).toEqual(observed.plain.value);
          });
        }
      }
    }
  });
}
