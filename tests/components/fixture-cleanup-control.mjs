import assert from "node:assert/strict";
import { appendFileSync } from "node:fs";
import { test } from "node:test";

/**
 * Bounded cleanup control for the strict-audit fixture allocation.
 *
 * The maintained component lane spawns this module as an owned `node --test`
 * child. The first test allocates a fixture, registers its cleanup immediately
 * and passes. The second allocates another fixture, registers its cleanup the
 * same way and then fails an assertion deliberately, so the child exits
 * nonzero. Both tests append their owned root to the report file named by
 * `SUIK_CLEANUP_REPORT`; the parent proves each root is gone after the child
 * exits. The compiled helper module is supplied by `SUIK_STRICT_AUDIT_MODULE`
 * so the control always exercises the same code the lane compiled. The control
 * only ever inspects the roots it reports and never removes unrelated trees.
 */
const strictAuditModule = process.env["SUIK_STRICT_AUDIT_MODULE"];
const reportPath = process.env["SUIK_CLEANUP_REPORT"];

if (typeof strictAuditModule !== "string" || strictAuditModule === "") {
  throw new Error("SUIK_STRICT_AUDIT_MODULE must name the compiled helper");
}
if (typeof reportPath !== "string" || reportPath === "") {
  throw new Error("SUIK_CLEANUP_REPORT must name a report file");
}

const { prepareStrictFixture } = await import(strictAuditModule);

/**
 * Allocate an owned fixture and register its cleanup on the test context before
 * recording the root, mirroring the maintained test convention.
 */
function allocateOwned(t, label) {
  const copy = prepareStrictFixture();
  t.after(() => copy.cleanup());
  appendFileSync(reportPath, `${label} ${copy.root}\n`);
  return copy;
}

test("a successful fixture control registers and runs cleanup", (t) => {
  const copy = allocateOwned(t, "success");
  assert.ok(copy.root.length > 0);
});

test("a failing fixture control still registers and runs cleanup", (t) => {
  allocateOwned(t, "failure");
  assert.fail("intentional cleanup-control assertion failure");
});
