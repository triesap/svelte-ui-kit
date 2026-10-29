import { writeFileSync } from "node:fs";
import { buildResetSemanticsConsumer } from "../helpers/generated-consumer.js";
import { buildQualificationRuntime } from "../helpers/qualification-runtime.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

const cohorts = ["plain", "raw", "generated"] as const;
const kinds = [
  "text",
  "email",
  "password",
  "search",
  "tel",
  "url",
  "textarea",
  "select",
] as const;
for (const custom of [false, true]) {
  test.describe(`native reset semantics ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildResetSemanticsConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildResetSemanticsConsumer(
        custom,
        buildQualificationRuntime(
          process.env["SUIK_RESET_CAUSAL_CONTROL"] === "unpatched",
        ),
      );
      try {
        hosted = await startFixtureServer({ handler: consumer.handler });
      } catch (error) {
        consumer.cleanup();
        throw error;
      }
    });
    test.afterAll(async () => {
      try {
        if (hosted) {
          await hosted.server.stop();
          expect(hosted.server.failure()).toBeNull();
        }
      } finally {
        consumer?.cleanup();
      }
    });
    for (const method of ["native", "programmatic"] as const) {
      for (const kind of kinds) {
        for (const phase of ["none", "capture", "target", "bubble"] as const) {
          test(`${kind} ${method} reset preserves cancellation at ${phase} across plain DOM raw Svelte and generated Field`, async ({
            page,
          }, info) => {
            const url = new URL(consumer.route, hosted.baseURL);
            url.searchParams.set("kind", kind);
            await page.goto(url.href);
            await expect(page.locator('[data-ready="true"]')).toBeVisible();
            await page
              .getByRole("button", { name: `Cancel ${phase}`, exact: true })
              .click();
            for (const cohort of cohorts) {
              const control = page.locator(`#${cohort}-input`);
              if (kind === "select") await control.selectOption("Edited");
              else await control.fill("Edited");
            }
            await page.locator("#blur").click();
            const before = JSON.parse(
              await page.locator("#counts").innerText(),
            );
            for (const cohort of cohorts) {
              const name =
                method === "native"
                  ? `Native reset ${cohort}`
                  : `Programmatic reset ${cohort}`;
              await page.getByRole("button", { name, exact: true }).click();
              if (method === "programmatic") {
                await expect
                  .poll(
                    async () =>
                      JSON.parse(await page.locator("#after-tick").innerText())[
                        cohort
                      ],
                  )
                  .toBeDefined();
              }
            }
            // Join the event's later timer turn so a delayed erroneous reset
            // cannot pass an assertion made before it runs.
            await page.evaluate(
              () => new Promise<void>((resolve) => setTimeout(resolve, 0)),
            );
            const observed = await page.evaluate(
              (names) =>
                Object.fromEntries(
                  names.map((cohort) => {
                    const input = document.getElementById(`${cohort}-input`);
                    const form = document.getElementById(`${cohort}-form`);
                    if (
                      !(
                        input instanceof HTMLInputElement ||
                        input instanceof HTMLTextAreaElement ||
                        input instanceof HTMLSelectElement
                      ) ||
                      !(form instanceof HTMLFormElement)
                    )
                      throw new Error("missing native reset fixture");
                    return [
                      cohort,
                      {
                        value: input.value,
                        bound:
                          cohort === "plain"
                            ? input.value
                            : document.getElementById(`${cohort}-bound`)
                                ?.textContent,
                        data: [...new FormData(form)],
                      },
                    ];
                  }),
                ),
              cohorts,
            );
            const after = JSON.parse(await page.locator("#counts").innerText());
            const events = JSON.parse(
              await page.locator("#events").innerText(),
            );
            const ticks = JSON.parse(
              await page.locator("#after-tick").innerText(),
            );
            const artifact = info.outputPath("reset-observation.json");
            writeFileSync(
              artifact,
              JSON.stringify(
                {
                  method,
                  phase,
                  observed,
                  before,
                  after,
                  events,
                  ticks,
                  inputs: consumer.evidence,
                },
                null,
                2,
              ),
            );
            await info.attach("reset-observation", {
              path: artifact,
              contentType: "application/json",
            });
            const expected = phase === "none" ? "Default" : "Edited";
            expect(observed).toEqual(
              Object.fromEntries(
                cohorts.map((cohort) => [
                  cohort,
                  {
                    value: expected,
                    bound: expected,
                    data: [["value", expected]],
                  },
                ]),
              ),
            );
            expect(after).toEqual(before);
            expect(events).toHaveLength(9);
            if (method === "programmatic")
              expect(ticks).toEqual(
                Object.fromEntries(cohorts.map((cohort) => [cohort, expected])),
              );
          });
        }
      }
    }
    for (const kind of kinds) {
      for (const method of ["native", "programmatic"] as const) {
        test(`${kind} ${method} replacement during dispatch reads the control actually reset`, async ({
          page,
        }) => {
          const url = new URL(consumer.route, hosted.baseURL);
          url.searchParams.set("kind", kind);
          url.searchParams.set("scenario", "replace");
          await page.goto(url.href);
          await expect(page.locator('[data-ready="true"]')).toBeVisible();
          for (let repeat = 0; repeat < 3; repeat++) {
            for (const cohort of cohorts) {
              if (kind === "select")
                await page.locator(`#${cohort}-input`).selectOption("Edited");
              else await page.locator(`#${cohort}-input`).fill("Edited");
              await page.locator("#blur").click();
              await page
                .getByRole("button", {
                  name: `${method === "native" ? "Native" : "Programmatic"} reset ${cohort}`,
                  exact: true,
                })
                .click();
            }
            await page.evaluate(
              () => new Promise<void>((resolve) => setTimeout(resolve, 0)),
            );
            for (const cohort of cohorts)
              await expect(page.locator(`#${cohort}-input`)).toHaveValue(
                "Default",
              );
            await expect(page.locator("#raw-bound")).toHaveText("Default");
            await expect(page.locator("#generated-bound")).toHaveText(
              "Default",
            );
          }
          expect(
            JSON.parse(await page.locator("#events").innerText()),
          ).toHaveLength(27);
        });
      }
    }
    for (const scenario of [
      "move-before",
      "move-after",
      "late-edit",
      "later-mount",
      "unmount",
    ] as const) {
      test(`native reset observes ${scenario} and live binding teardown`, async ({
        page,
      }) => {
        const url = new URL(consumer.route, hosted.baseURL);
        url.searchParams.set("scenario", scenario);
        await page.goto(url.href);
        await expect(page.locator('[data-ready="true"]')).toBeVisible();
        for (const cohort of cohorts)
          await page.locator(`#${cohort}-input`).fill("Edited");
        await page.locator("#blur").click();
        const before = JSON.parse(await page.locator("#counts").innerText());
        for (const cohort of cohorts)
          await page
            .getByRole("button", {
              name: `Native reset ${cohort}`,
              exact: true,
            })
            .click();
        await page.evaluate(
          () => new Promise<void>((resolve) => setTimeout(resolve, 0)),
        );
        const expected =
          scenario === "move-before" || scenario === "unmount"
            ? "Edited"
            : scenario === "late-edit" || scenario === "later-mount"
              ? "Initial"
              : "Default";
        await expect(page.locator("#raw-bound")).toHaveText(expected);
        await expect(page.locator("#generated-bound")).toHaveText(expected);
        for (const cohort of cohorts) {
          if (scenario === "unmount")
            await expect(page.locator(`#${cohort}-input`)).toHaveCount(0);
          else
            await expect(page.locator(`#${cohort}-input`)).toHaveValue(
              expected,
            );
        }
        expect(JSON.parse(await page.locator("#counts").innerText())).toEqual(
          before,
        );
      });
    }
    test("programmatic reset still synchronizes bindings when a listener detaches mounted forms", async ({
      page,
    }) => {
      const url = new URL(consumer.route, hosted.baseURL);
      url.searchParams.set("scenario", "detach");
      await page.goto(url.href);
      await expect(page.locator('[data-ready="true"]')).toBeVisible();
      for (const cohort of cohorts)
        await page.locator(`#${cohort}-input`).fill("Edited");
      await page.locator("#blur").click();
      const values = await page.evaluate(async () => {
        const forms = ["plain", "raw", "generated"].map((cohort) => {
          const form = document.getElementById(`${cohort}-form`);
          if (!(form instanceof HTMLFormElement))
            throw new Error("native form");
          form.reset();
          return { cohort, form };
        });
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        return forms.map(({ cohort, form }) => ({
          cohort,
          data: [...new FormData(form)],
        }));
      });
      expect(values).toEqual(
        cohorts.map((cohort) => ({ cohort, data: [["value", "Default"]] })),
      );
      await expect(page.locator("#raw-bound")).toHaveText("Default");
      await expect(page.locator("#generated-bound")).toHaveText("Default");
    });
  });
}
