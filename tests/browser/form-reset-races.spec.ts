import { writeFileSync } from "node:fs";
import { buildFormResetRacesConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

for (const custom of [false, true]) {
  test.describe(`current native reset truth ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildFormResetRacesConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildFormResetRacesConsumer(custom);
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
    for (const scenario of [
      "defaults",
      "late-edit",
      "reassociate",
      "incoming",
      "incoming-capture",
      "incoming-target",
      "incoming-bubble",
      "replace-owner",
      "second-canceled",
      "destroy",
      "late-destroy",
    ]) {
      test(`${scenario} retains current native Checkbox Switch and Radio truth`, async ({
        page,
      }, info) => {
        const url = new URL(consumer.route, hosted.baseURL);
        url.searchParams.set(
          "scenario",
          scenario.startsWith("incoming-") ? "incoming" : scenario,
        );
        if (scenario.startsWith("incoming-"))
          url.searchParams.set("cancel", scenario.slice("incoming-".length));
        await page.goto(url.href);
        await expect(page.locator('[data-ready="true"]')).toBeVisible();
        await page
          .getByRole("checkbox", { name: "Plain checkbox", exact: true })
          .check();
        await page
          .getByRole("checkbox", { name: "Kit checkbox", exact: true })
          .check();
        await page
          .getByRole("checkbox", { name: "Plain switch checkbox", exact: true })
          .check();
        await page
          .getByRole("switch", { name: "Kit switch", exact: true })
          .check();
        await page
          .getByRole("radio", { name: "Plain Beta", exact: true })
          .check();
        await page
          .getByRole("radio", { name: "Kit Beta", exact: true })
          .check();
        const before = JSON.parse(await page.locator("#callbacks").innerText());
        if (scenario === "defaults")
          await page
            .getByRole("button", {
              name: "Change native defaults",
              exact: true,
            })
            .click();
        await page
          .getByRole("button", {
            name:
              scenario === "second-canceled"
                ? "Reset twice with a canceled second event"
                : "Native reset",
            exact: true,
          })
          .click();
        await page.evaluate(
          () => new Promise<void>((resolve) => setTimeout(resolve, 0)),
        );
        const observed = await page.evaluate(() => {
          const input = (selector: string) => {
            const field = document.querySelector(selector);
            if (!(field instanceof HTMLInputElement))
              throw new Error(`missing field ${selector}`);
            return field;
          };
          const state = JSON.parse(
            document.getElementById("kit-state")!.textContent!,
          );
          const callbacks = JSON.parse(
            document.getElementById("callbacks")!.textContent!,
          );
          if (!document.getElementById("plain-checkbox"))
            return { state, callbacks, removed: true };
          const owner = input("#plain-checkbox").form;
          if (!owner) throw new Error("actual form owner");
          const data = new FormData(owner);
          return {
            state,
            callbacks,
            removed: false,
            native: {
              checkbox: input("#plain-checkbox").checked,
              switch: input("#plain-switch").checked,
              radio: input("#plain-alpha").checked
                ? "alpha"
                : input("#plain-beta").checked
                  ? "beta"
                  : "",
            },
            nativeData: [
              data.get("plain-checkbox"),
              data.get("plain-switch"),
              data.get("plain-radio"),
            ],
            kitData: [
              data.get("kit-checkbox"),
              data.get("kit-switch"),
              data.get("kit-radio"),
            ],
            owner: owner.id,
          };
        });
        const artifact = info.outputPath("current-reset-truth.json");
        writeFileSync(
          artifact,
          JSON.stringify(
            { scenario, before, observed, inputs: consumer.evidence },
            null,
            2,
          ),
        );
        await info.attach("current-reset-truth", {
          path: artifact,
          contentType: "application/json",
        });
        expect(observed.callbacks).toEqual(before);
        if (scenario === "destroy" || scenario === "late-destroy") {
          expect(observed.removed).toBe(true);
          expect(observed.state).toEqual({
            checkbox: true,
            switch: true,
            radio: "beta",
          });
          await page
            .getByRole("button", { name: "Remount controls", exact: true })
            .click();
          for (const name of ["kit-checkbox", "kit-switch", "kit-radio"])
            await expect(page.locator(`input[name="${name}"]`)).toHaveCount(1);
        } else {
          expect(observed.state).toEqual(observed.native);
          expect(observed.native).toEqual(
            scenario === "incoming"
              ? { checkbox: false, switch: false, radio: "alpha" }
              : { checkbox: true, switch: true, radio: "beta" },
          );
          expect(observed.kitData).toEqual(observed.nativeData);
          if (scenario === "reassociate")
            expect(observed.owner).toBe("alternate");
        }
      });
    }
  });
}
