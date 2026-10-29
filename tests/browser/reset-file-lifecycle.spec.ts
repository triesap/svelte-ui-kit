import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import type { Page, FrameLocator, TestInfo } from "@playwright/test";
import { buildResetFamiliesConsumer } from "../helpers/generated-consumer.js";
import {
  buildQualificationRuntime,
  qualificationRuntimeMode,
} from "../helpers/qualification-runtime.js";
import { test, expect, createIssueCollector } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

type Surface = Page | FrameLocator;
for (const custom of [false, true]) {
  test.describe(`native files lifecycle ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildResetFamiliesConsumer>;
    let hosted: FixtureServer;
    let directory: string;
    let flat: string[];
    test.beforeAll(async () => {
      test.setTimeout(240000);
      directory = mkdtempSync(path.join(os.tmpdir(), "suik-native-files-"));
      mkdirSync(path.join(directory, "nested"));
      flat = [
        path.join(directory, "one.txt"),
        path.join(directory, "nested", "café.txt"),
      ];
      writeFileSync(flat[0]!, "first native file");
      writeFileSync(flat[1]!, "second native file");
      consumer = buildResetFamiliesConsumer(
        custom,
        buildQualificationRuntime(qualificationRuntimeMode()),
        "reset-file-lifecycle",
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
        if (closed) {
          consumer?.cleanup();
          if (directory) rmSync(directory, { recursive: true });
        }
      }
    });
    async function prepare(
      page: Page,
      scenario: string,
      folder: boolean,
      cancel: string,
      frame: boolean,
    ): Promise<Surface> {
      const url = new URL(consumer.route, hosted.baseURL);
      url.searchParams.set("scenario", scenario);
      url.searchParams.set("cancel", cancel);
      if (folder) url.searchParams.set("directory", "1");
      let surface: Surface = page;
      if (frame) {
        // Establish the real loopback origin before creating the independent
        // document. An opaque about:blank parent cannot authorize local-network
        // navigation in current browsers.
        await page.goto(url.href);
        await expect(page.locator('[data-ready="true"]')).toBeVisible();
        await page.evaluate((src) => {
          const node = document.createElement("iframe");
          node.id = "native-frame";
          node.src = src;
          document.body.append(node);
        }, url.href);
        surface = page.frameLocator("#native-frame");
      } else await page.goto(url.href);
      await expect(surface.locator('[data-ready="true"]')).toBeVisible();
      for (const cohort of ["plain", "raw"])
        await surface
          .locator(`#${cohort}-input`)
          .setInputFiles(folder ? directory : flat);
      await expect(surface.locator("#bound")).not.toHaveText("[]");
      expect(
        JSON.parse(await surface.locator("#bound").innerText()),
      ).toHaveLength(2);
      await surface
        .getByRole("button", { name: "Prepare native reset", exact: true })
        .click();
      await expect(surface.locator('[data-prepared="true"]')).toBeVisible();
      return surface;
    }
    async function reset(surface: Surface, method: "native" | "programmatic") {
      for (const cohort of ["plain", "raw"])
        await surface
          .getByRole("button", {
            name: `${method === "native" ? "Native" : "Programmatic"} reset ${cohort}`,
            exact: true,
          })
          .click();
      await surface
        .locator("#bound")
        .evaluate(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
    }
    async function observe(surface: Surface, info: TestInfo, context: object) {
      const reactiveBeforeProbe = JSON.parse(
        await surface.locator("#bound").innerText(),
      );
      await surface
        .getByRole("button", {
          name: "Observe current file facts",
          exact: true,
        })
        .click();
      await expect(surface.locator("#probe")).not.toHaveText("");
      const facts = JSON.parse(await surface.locator("#probe").innerText());
      const artifact = info.outputPath("file-lifecycle.json");
      writeFileSync(
        artifact,
        JSON.stringify(
          { context, reactiveBeforeProbe, facts, inputs: consumer.evidence },
          null,
          2,
        ),
      );
      await info.attach("file-lifecycle", {
        path: artifact,
        contentType: "application/json",
      });
      return { reactiveBeforeProbe, ...facts };
    }
    async function dispatchResetControl(surface: Surface) {
      for (const cohort of ["plain", "raw"])
        await surface
          .getByRole("button", {
            name: `Dispatch reset control ${cohort}`,
            exact: true,
          })
          .click();
      await surface
        .locator("#bound")
        .evaluate(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
    }
    for (const folder of [false, true])
      test(`successful nonempty copy control preserves ${folder ? "directory" : "multiple"} native File identities`, async ({
        page,
      }, info) => {
        const surface = await prepare(
          page,
          "copy-success",
          folder,
          "none",
          false,
        );
        const before = Number(await surface.locator("#writes").innerText());
        const original = await observe(surface, info, {
          phase: "before synthetic reset control",
        });
        expect(original.getterMatchesDOM).toBe(true);
        expect(original.boundSameOriginalList).toBe(true);
        await dispatchResetControl(surface);
        const observed = await observe(surface, info, {
          control:
            "synthetic reset dispatch has no UA reset default action; isolates nonempty native-list copy",
          folder,
          original,
        });
        expect(observed.writes).toBe(before + 1);
        expect(observed.boundNativeList).toBe(true);
        expect(observed.boundSameOriginalList).toBe(false);
        expect(observed.boundFileIdentity).toEqual([true, true]);
        expect(observed.bound).toEqual(original.bound);
        expect(observed.reactiveBeforeProbe).toEqual(observed.bound);
        expect(observed.values.raw.files).toEqual(observed.values.plain.files);
        expect(observed.values.raw.data).toEqual(observed.values.plain.data);
        expect(observed.counts).toEqual(original.counts);
      });
    for (const folder of [false, true]) {
      for (const method of ["native", "programmatic"] as const) {
        for (const scenario of [
          "none",
          "late-change",
          "late-direct-missing",
          "destroy-before",
          "destroy-after",
        ]) {
          test(`${scenario} ${method} ${folder ? "directory" : "multiple"} keeps current files and disposed bindings`, async ({
            page,
          }, info) => {
            const surface = await prepare(
              page,
              scenario,
              folder,
              "none",
              false,
            );
            const before = {
              writes: Number(await surface.locator("#writes").innerText()),
              counts: JSON.parse(await surface.locator("#counts").innerText()),
              files: JSON.parse(await surface.locator("#bound").innerText()),
            };
            await reset(surface, method);
            const observed = await observe(surface, info, {
              scenario,
              method,
              folder,
              before,
            });
            expect(observed.values.raw.files).toEqual(
              observed.values.plain.files,
            );
            expect(observed.values.raw.data).toEqual(
              observed.values.plain.data,
            );
            expect(observed.bound).toEqual(observed.values.raw.files);
            for (const cohort of ["plain", "raw"]) {
              expect(observed.values[cohort].nativeList).toBe(true);
              expect(observed.values[cohort].nativeFiles).toBe(true);
              expect(observed.values[cohort].ownerRealm).toBe(true);
            }
            if (scenario.startsWith("destroy-")) {
              expect(observed.writes).toBe(before.writes);
              expect(observed.values.raw.connected).toBe(false);
              expect(observed.values.raw.files).toHaveLength(
                scenario === "destroy-before" ? 2 : 0,
              );
              await surface
                .getByRole("button", { name: "Remount raw input", exact: true })
                .click();
              await expect(surface.locator("#raw-input")).toHaveCount(1);
              const afterRemount = Number(
                await surface.locator("#writes").innerText(),
              );
              await surface
                .getByRole("button", {
                  name: "Dispatch old change",
                  exact: true,
                })
                .click();
              await expect(surface.locator("#writes")).toHaveText(
                String(afterRemount),
              );
            } else {
              expect(observed.reactiveBeforeProbe).toEqual(observed.bound);
              expect(observed.writes).toBe(
                before.writes + (scenario === "late-change" ? 2 : 1),
              );
              const nonempty = scenario.startsWith("late-");
              expect(observed.bound).toHaveLength(nonempty ? 2 : 0);
              if (nonempty) {
                expect(observed.bound).toEqual(before.files);
                expect(observed.values.raw.fileIdentity).toEqual([true, true]);
                expect(observed.values.plain.fileIdentity).toEqual([
                  true,
                  true,
                ]);
                if (folder)
                  expect(
                    observed.bound.every(
                      (file: { relativePath: string }) =>
                        file.relativePath.length > 0,
                    ),
                  ).toBe(true);
              }
            }
            expect(observed.counts).toEqual(
              scenario === "late-change"
                ? {
                    plain: {
                      ...before.counts.plain,
                      change: before.counts.plain.change + 1,
                    },
                    raw: {
                      ...before.counts.raw,
                      change: before.counts.raw.change + 1,
                    },
                  }
                : before.counts,
            );
            await surface
              .getByRole("button", {
                name: "Restore native file capability",
                exact: true,
              })
              .click();
          });
        }
        for (const cancel of ["capture", "target", "bubble"]) {
          test(`cancel ${cancel} ${method} ${folder ? "directory" : "multiple"} preserves File and FileList identity`, async ({
            page,
          }, info) => {
            const surface = await prepare(page, "none", folder, cancel, false);
            const before = {
              writes: Number(await surface.locator("#writes").innerText()),
              counts: JSON.parse(await surface.locator("#counts").innerText()),
            };
            await reset(surface, method);
            const observed = await observe(surface, info, {
              method,
              folder,
              cancel,
              before,
            });
            expect(observed.bound).toHaveLength(2);
            expect(observed.reactiveBeforeProbe).toEqual(observed.bound);
            expect(observed.writes).toBe(before.writes);
            expect(observed.counts).toEqual(before.counts);
            for (const cohort of ["plain", "raw"]) {
              expect(observed.values[cohort].sameList).toBe(true);
              expect(observed.values[cohort].fileIdentity).toEqual([
                true,
                true,
              ]);
              expect(observed.values[cohort].files).toEqual(
                observed.values[cohort].original,
              );
            }
          });
        }
      }
    }
    test("a separately booted owner document refreshes genuine realm FileLists", async ({
      page,
    }, info) => {
      const surface = await prepare(page, "late-change", true, "none", true);
      await reset(surface, "native");
      const observed = await observe(surface, info, {
        realm: "same-origin independent iframe application",
      });
      expect(observed.bound).toHaveLength(2);
      expect(observed.reactiveBeforeProbe).toEqual(observed.bound);
      expect(observed.values.raw.fileIdentity).toEqual([true, true]);
      expect(observed.values.raw.nativeList).toBe(true);
      expect(observed.values.raw.nativeFiles).toBe(true);
      expect(observed.values.raw.ownerRealm).toBe(true);
    });
    for (const [scenario, diagnostic] of [
      [
        "missing",
        "File binding reset requires DataTransfer in the input document.",
      ],
      ["copy-failure", "File binding reset could not preserve native files."],
    ] as const)
      test(`${scenario} owner capability fails explicitly without publishing incomplete files`, async ({
        browser,
      }, info) => {
        const context = await browser.newContext();
        const page = await context.newPage();
        const issues = createIssueCollector(page);
        try {
          const surface = await prepare(page, scenario, false, "none", false);
          const before = Number(await surface.locator("#writes").innerText());
          const original = await observe(surface, info, {
            phase: "before capability control",
          });
          expect(original.getterMatchesDOM).toBe(true);
          if (scenario === "copy-failure") await dispatchResetControl(surface);
          else await reset(surface, "native");
          const observed = await observe(surface, info, {
            capability: scenario,
            original,
            dispatch:
              scenario === "copy-failure"
                ? "synthetic reset control; no UA default action"
                : "actual native form reset",
            issues,
          });
          await expect
            .poll(() => issues)
            .toEqual([`page error: ${diagnostic}`]);
          if (scenario === "missing")
            expect(observed.values.raw.files).toEqual([]);
          else {
            expect(observed.copyConstructors).toBe(1);
            expect(observed.copyAttempts).toBe(2);
            expect(observed.values.raw.files).toHaveLength(2);
            expect(observed.values.raw.fileIdentity).toEqual([true, true]);
            expect(observed.bound).toEqual(observed.values.raw.files);
            expect(observed.reactiveBeforeProbe).toEqual(observed.bound);
          }
          expect(observed.writes).toBe(before);
          await surface
            .getByRole("button", {
              name: "Restore native file capability",
              exact: true,
            })
            .click();
        } finally {
          await context.close();
        }
        expect(issues).toEqual([`page error: ${diagnostic}`]);
      });
  });
}
