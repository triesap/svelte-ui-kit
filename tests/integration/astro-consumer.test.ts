import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import path from "node:path";
import { test } from "node:test";
import { chromium, expect } from "@playwright/test";
import { parse, stringify } from "yaml";
import { snapshotTree } from "../helpers/tree-snapshot.js";

const owner = process.cwd();
function command(root: string, executable: string, args: string[]) {
  const result = spawnSync(executable, args, {
    cwd: root,
    encoding: "utf8",
    timeout: 240_000,
    env: {
      ...process.env,
      ASTRO_TELEMETRY_DISABLED: "1",
      pnpm_config_verify_deps_before_run: "false",
    },
  });
  assert.equal(
    result.status,
    0,
    `${executable} ${args.join(" ")}\n${result.stdout}\n${result.stderr}\n${result.error ?? ""}`,
  );
  return result.stdout + result.stderr;
}
function cli(root: string, ...args: string[]) {
  return command(root, process.execPath, [
    path.join(owner, "dist/cli/main.js"),
    "--cwd",
    root,
    ...args,
  ]);
}
async function freePort() {
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  await new Promise<void>((resolve, reject) =>
    server.close((e) => (e ? reject(e) : resolve())),
  );
  return address.port;
}

test(
  "real generated Astro consumer checks, builds, serves SSR and hydrates independent islands",
  { timeout: 360_000 },
  async (t) => {
    const root = path.join(
      owner,
      ".artifacts/verification",
      `astro-${randomUUID()}`,
    );
    mkdirSync(root, { recursive: true });
    const blueprint = path.join(owner, "tests/fixtures/astro-consumer");
    cpSync(blueprint, root, {
      recursive: true,
      filter: (source) =>
        !source
          .split(path.sep)
          .some((part) => ["node_modules", ".astro", "dist"].includes(part)),
    });
    const workspace = parse(
      readFileSync(path.join(owner, "pnpm-workspace.yaml"), "utf8"),
    );
    writeFileSync(
      path.join(root, "pnpm-workspace.yaml"),
      stringify({
        packages: ["."],
        catalog: workspace.catalog,
        minimumReleaseAgeExclude: workspace.minimumReleaseAgeExclude,
      }),
    );
    const manifest = JSON.parse(
      readFileSync(path.join(root, "package.json"), "utf8"),
    );
    const archive = manifest.dependencies["bits-ui"]
      .slice(5)
      .replace(/^\.\//, "");
    mkdirSync(path.dirname(path.join(root, archive)), { recursive: true });
    cpSync(path.join(owner, archive), path.join(root, archive));
    const state = path.join(root, "src/generated/ui/_kit");
    mkdirSync(state, { recursive: true });
    cpSync(path.join(root, "kit-intent.json"), path.join(state, "kit.json"));
    const logs: Record<string, string> = {};
    logs.install = command(root, "pnpm", [
      "install",
      "--ignore-scripts",
      "--strict-peer-dependencies",
      "--engine-strict",
    ]);
    logs.frozenInstall = command(root, "pnpm", [
      "install",
      "--frozen-lockfile",
      "--ignore-scripts",
      "--strict-peer-dependencies",
      "--engine-strict",
    ]);
    const manifestBefore = readFileSync(
      path.join(root, "package.json"),
      "utf8",
    );
    const layoutBefore = readFileSync(
      path.join(root, "src/layouts/Layout.astro"),
      "utf8",
    );
    logs.init = cli(root, "init");
    for (const item of ["button", "field", "dialog"])
      logs[item] = cli(root, "add", item);
    logs.sync = cli(root, "sync");
    assert.equal(
      readFileSync(path.join(root, "package.json"), "utf8"),
      manifestBefore,
    );
    const generated = readFileSync(
      path.join(root, "src/layouts/Layout.astro"),
      "utf8",
    );
    assert.ok(
      generated.endsWith(
        layoutBefore.slice(layoutBefore.indexOf("interface Props")),
      ),
    );
    const before = snapshotTree(root);
    for (const args of [
      ["info"],
      ["doctor"],
      ["sync", "--dry-run"],
      ["sync"],
      ["init"],
    ]) {
      logs[args.join(" ")] = cli(root, ...args);
      assert.deepEqual(snapshotTree(root), before, args.join(" "));
    }
    logs.check = command(root, "pnpm", ["run", "check"]);
    assert.match(
      logs.check,
      /Result \(([1-9]\d*) files\):\s*\n- 0 errors\s*\n- 0 warnings/,
    );
    assert.match(logs.check, /svelte-check found 0 errors and 0 warnings/);
    logs.build = command(root, "pnpm", ["run", "build"]);
    writeFileSync(
      path.join(root, "verification-commands.json"),
      JSON.stringify(logs, null, 2),
    );
    const port = await freePort();
    const witness = randomUUID();
    const url = `http://127.0.0.1:${port}/?name=Actual%20SSR`;
    const server = spawn(process.execPath, ["dist/server/entry.mjs"], {
      cwd: root,
      env: {
        ...process.env,
        HOST: "127.0.0.1",
        PORT: String(port),
        OWNED_FIXTURE_WITNESS: witness,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let serverLog = "";
    let serverErrors = "";
    server.stdout.on("data", (d) => {
      serverLog += d;
    });
    server.stderr.on("data", (d) => {
      serverLog += d;
      serverErrors += d;
    });
    const exited = new Promise<{
      code: number | null;
      signal: NodeJS.Signals | null;
    }>((resolve, reject) => {
      server.once("error", reject);
      server.once("exit", (code, signal) => resolve({ code, signal }));
    });
    t.after(async () => {
      const alive = server.exitCode === null && server.signalCode === null;
      if (alive) server.kill("SIGTERM");
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const result = await Promise.race([
          exited,
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => {
              server.kill("SIGKILL");
              reject(
                new Error("Owned Astro server did not stop within 5 seconds"),
              );
            }, 5000);
          }),
        ]);
        assert.equal(
          serverErrors,
          "",
          `Unexpected Astro server stderr: ${serverErrors}`,
        );
        assert.ok(
          alive,
          `Owned Astro server exited unexpectedly: ${JSON.stringify(result)}\n${serverLog}`,
        );
        assert.ok(
          (result.code === 0 && result.signal === null) ||
            (result.code === null && result.signal === "SIGTERM"),
          JSON.stringify(result),
        );
      } finally {
        if (timer) clearTimeout(timer);
        writeFileSync(path.join(root, "server.log"), serverLog);
      }
    });
    let html = "";
    for (let attempt = 0; attempt < 200; attempt++) {
      assert.equal(server.exitCode, null, serverLog);
      try {
        const response = await fetch(url);
        if (response.ok) {
          html = await response.text();
          break;
        }
      } catch {
        /* bounded owned startup */
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    assert.ok(html.includes(witness), serverLog);
    assert.ok(html.includes("Actual SSR"));
    assert.ok(html.includes('data-hydrated="false"'));
    writeFileSync(path.join(root, "response.html"), html);
    const browser = await chromium.launch({ headless: true });
    t.after(() => browser.close());
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (["error", "warning"].includes(m.type())) errors.push(m.text());
    });
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("**/*", async (route) => {
      if (route.request().resourceType() === "script") await gate;
      await route.continue();
    });
    await page.goto(url, { waitUntil: "commit" });
    await page
      .locator('[data-island="Second"] input')
      .waitFor({ state: "attached" });
    const beforeIds = await page.locator("input").evaluateAll((nodes) =>
      nodes.map((node) => ({
        id: node.id,
        labels: [...((node as HTMLInputElement).labels ?? [])].map(
          (label) => label.htmlFor,
        ),
      })),
    );
    assert.equal(beforeIds.length, 2);
    assert.equal(new Set(beforeIds.map((n) => n.id)).size, 2);
    for (const entry of beforeIds) {
      assert.ok(entry.id);
      assert.deepEqual(entry.labels, [entry.id]);
    }
    release();
    await page
      .locator('[data-island="Second"][data-hydrated="true"]')
      .waitFor();
    assert.deepEqual(
      await page.locator("input").evaluateAll((nodes) =>
        nodes.map((node) => ({
          id: node.id,
          labels: [...((node as HTMLInputElement).labels ?? [])].map(
            (label) => label.htmlFor,
          ),
        })),
      ),
      beforeIds,
    );
    await page
      .getByRole("button", { name: "First increment", exact: true })
      .click();
    assert.equal(await page.getByTestId("First-count").textContent(), "1");
    assert.equal(await page.getByTestId("Second-count").textContent(), "0");
    await page.getByLabel("First name", { exact: true }).fill("Island state");
    assert.equal(
      await page.getByTestId("First-value").textContent(),
      "Island state",
    );
    assert.equal(
      await page.getByLabel("Second name", { exact: true }).inputValue(),
      "",
    );
    await page
      .getByRole("button", { name: "First dialog", exact: true })
      .click();
    await page.getByRole("dialog", { name: "First details" }).waitFor();
    await expect
      .poll(() =>
        page
          .getByRole("dialog")
          .evaluate((node) => node.contains(document.activeElement)),
      )
      .toBe(true);
    await page.keyboard.press("Escape");
    await page.getByRole("dialog").waitFor({ state: "detached" });
    await expect(
      page.getByRole("button", { name: "First dialog", exact: true }),
    ).toBeFocused();
    await page
      .getByRole("button", { name: "First dialog", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Unmount First dialog", exact: true })
      .click();
    await page.getByRole("dialog").waitFor({ state: "detached" });
    await expect
      .poll(() =>
        page
          .locator("body")
          .evaluate((node) => getComputedStyle(node).pointerEvents),
      )
      .toBe("auto");
    await page
      .getByRole("button", { name: "Mount First dialog", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Second increment", exact: true })
      .click();
    assert.equal(await page.getByTestId("Second-count").textContent(), "1");
    assert.equal(
      await page.getByTestId("named-slot").textContent(),
      "Application-owned banner",
    );
    assert.equal(
      await page.getByTestId("layout-footer").textContent(),
      "Application-owned footer",
    );
    assert.equal(
      (
        await page
          .getByTestId("style-order")
          .evaluate((node) =>
            getComputedStyle(node).getPropertyValue("--fixture-order"),
          )
      ).trim(),
      "app",
    );
    await page.screenshot({
      path: path.join(root, "consumer.png"),
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    writeFileSync(
      path.join(root, "verification.json"),
      JSON.stringify(
        {
          root,
          url,
          witness,
          beforeIds,
          commands: Object.keys(logs),
          errors,
          serverPid: server.pid,
          screenshot: "consumer.png",
          status: "pass",
        },
        null,
        2,
      ),
    );
    console.log(`Retained generated consumer: ${root}`);
  },
);
