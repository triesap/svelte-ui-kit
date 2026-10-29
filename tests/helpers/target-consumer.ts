/** Native generated/packed consumer execution shared by supported application targets. */
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { createServer } from "node:net";
import path from "node:path";
import type { TestContext } from "node:test";
import { chromium, expect } from "@playwright/test";
export function nativeCommand(
  root: string,
  executable: string,
  args: string[],
  extraEnv: NodeJS.ProcessEnv = {},
) {
  const result = spawnSync(executable, args, {
    cwd: root,
    encoding: "utf8",
    timeout: 240_000,
    env: {
      ...process.env,
      ASTRO_TELEMETRY_DISABLED: "1",
      pnpm_config_verify_deps_before_run: "false",
      ...extraEnv,
    },
  });
  assert.equal(
    result.status,
    0,
    `${executable} ${args.join(" ")}\n${result.stdout}\n${result.stderr}\n${result.error ?? ""}`,
  );
  return result.stdout + result.stderr;
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

export async function verifyTargetConsumer(
  {
    root,
    framework,
    commands,
    env = {},
  }: {
    root: string;
    framework: "astro" | "sveltekit";
    commands: readonly string[];
    env?: NodeJS.ProcessEnv;
  },
  t: TestContext,
) {
  const port = await freePort();
  const witness = randomUUID();
  const url = `http://127.0.0.1:${port}/?name=Actual%20SSR`;
  const server = spawn(
    process.execPath,
    [framework === "astro" ? "dist/server/entry.mjs" : "build/index.js"],
    {
      cwd: root,
      env: {
        ...process.env,
        ...env,
        HOST: "127.0.0.1",
        PORT: String(port),
        OWNED_FIXTURE_WITNESS: witness,
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
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
    server.once("close", (code, signal) => resolve({ code, signal }));
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
              new Error("Owned consumer server did not stop within 5 seconds"),
            );
          }, 5000);
        }),
      ]);
      assert.equal(
        serverErrors,
        "",
        `Unexpected consumer server stderr: ${serverErrors}`,
      );
      assert.ok(
        alive,
        `Owned consumer server exited unexpectedly: ${JSON.stringify(result)}\n${serverLog}`,
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
  await page.locator('[data-island="Second"][data-hydrated="true"]').waitFor();
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
  await page.getByRole("button", { name: "First dialog", exact: true }).click();
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
  await page.getByRole("button", { name: "First dialog", exact: true }).click();
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
        commands,
        framework,
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
}
