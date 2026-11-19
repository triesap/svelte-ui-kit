import { verifyShowcase } from "../helpers/showcase-browser.js";
import { test } from "./browser-issues.js";
import { buildShowcaseConsumer } from "../helpers/generated-consumer.js";
import {
  finishFixtureServer,
  startFixtureServer,
  type FixtureServer,
} from "./fixture-server.js";
let consumer: ReturnType<typeof buildShowcaseConsumer>;
let hosted: FixtureServer;
test.beforeAll(async () => {
  test.setTimeout(300000);
  consumer = buildShowcaseConsumer(false);
  hosted = await startFixtureServer({ handler: consumer.handler });
});
test.afterAll(async () => {
  await finishFixtureServer(hosted, () => consumer?.cleanup());
});
test("public canonical showcase builds and hydrates the complete catalog on white canvas", async ({
  page,
}, info) => {
  await verifyShowcase(
    page,
    new URL(consumer.route, hosted.baseURL).href,
    consumer.evidence.coinstalled,
    (name) => info.outputPath(name),
  );
});
