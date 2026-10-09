import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  checkDocs,
  checkLinks,
  EXAMPLES,
  REQUIRED_DOCS,
} from "./check-docs.mjs";
import { extractAnchorData, readMarkedExample } from "./markdown-docs.mjs";

const tool = fileURLToPath(new URL("./check-docs.mjs", import.meta.url));
function write(root, file, text) {
  mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  writeFileSync(path.join(root, file), text);
}
function append(root, file, text) {
  write(root, file, readFileSync(path.join(root, file), "utf8") + text);
}
function snapshot(root) {
  const entries = [];
  const visit = (file) => {
    const info = lstatSync(path.join(root, file));
    entries.push([
      file,
      info.mode,
      info.isSymbolicLink()
        ? readlinkSync(path.join(root, file))
        : info.isFile()
          ? readFileSync(path.join(root, file)).toString("hex")
          : "directory",
    ]);
    if (info.isDirectory())
      for (const name of readdirSync(path.join(root, file)).sort())
        visit(file ? file + "/" + name : name);
  };
  visit("");
  return JSON.stringify(entries);
}
function fixture() {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-current-docs-"));
  for (const file of REQUIRED_DOCS) write(root, file, "# Current guidance\n");
  for (const [file, marker, language, count] of EXAMPLES) {
    const content =
      count === null
        ? '{"uiDir":"src/lib/widgets"}'
        : Array.from(
            { length: count },
            () => 'node "$CLI" --cwd "$APP" info',
          ).join("\n");
    append(
      root,
      file,
      `\n<!-- ${marker}:start -->\n\n\u0060\u0060\u0060${language}\n${content}\n\u0060\u0060\u0060\n\n<!-- ${marker}:end -->\n`,
    );
  }
  write(
    root,
    "registry/registry.json",
    JSON.stringify({ items: [{ id: "sample", manifest: "ui/sample.json" }] }),
  );
  write(
    root,
    "registry/ui/sample.json",
    JSON.stringify({
      id: "sample",
      exports: [{ name: "Sample" }],
      files: [{ source: "ui/sample.svelte" }],
      styles: [],
    }),
  );
  write(root, "registry/ui/sample.svelte", "<button>sample</button>\n");
  write(
    root,
    "docs/reference/components/README.md",
    "# Components\n\n[Sample](sample.md)\n",
  );
  write(
    root,
    "docs/reference/components/sample.md",
    "# Sample\n\n`Sample`\n\n[Manifest](../../../registry/ui/sample.json)\n",
  );
  for (const [file, pointer] of [
    ["docs/reference/configuration.md", "schema/v1/kit.schema.json"],
    ["docs/reference/cli.md", "schema/v1/command-envelope.schema.json"],
    ["docs/agents/native-dependency.md", "tools/native-dependency/recipe.json"],
  ]) {
    write(root, pointer, "{}\n");
    append(root, file, `\n[Authority](../../${pointer})\n`);
  }
  mkdirSync(path.join(root, ".hidden/empty"), { recursive: true });
  write(root, ".hidden/state", "preserve\n");
  return root;
}
function withFixture(fn) {
  const root = fixture();
  try {
    fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
function cli(root) {
  return spawnSync(process.execPath, [tool, "--root", root], {
    encoding: "utf8",
  });
}

test("valid current fixture passes CLI without Git history or writes", () =>
  withFixture((root) => {
    const before = snapshot(root);
    assert.deepEqual(checkDocs(root), []);
    assert.equal(cli(root).status, 0);
    assert.equal(snapshot(root), before);
  }));

const failures = [
  [
    "missing document",
    (root) => rmSync(path.join(root, "docs/guides/styling.md")),
    "DOCUMENT",
  ],
  [
    "missing local target",
    (root) => append(root, "README.md", "[Missing](absent.md)\n"),
    "LINK",
  ],
  [
    "missing fragment",
    (root) => append(root, "README.md", "[Missing](docs/README.md#absent)\n"),
    "LINK",
  ],
  [
    "wrong path case",
    (root) => append(root, "README.md", "[Wrong](docs/readme.md)\n"),
    "LINK",
  ],
  [
    "root escape",
    (root) => append(root, "README.md", "[Outside](../outside.md)\n"),
    "LINK",
  ],
  [
    "absolute target",
    (root) => append(root, "README.md", "[Absolute](/README.md)\n"),
    "LINK",
  ],
  [
    "malformed percent encoding",
    (root) => append(root, "README.md", "[Wrong](docs/%GG.md)\n"),
    "LINK",
  ],
  [
    "nonregular target",
    (root) => append(root, "README.md", "[Directory](docs/guides)\n"),
    "LINK",
  ],
  [
    "symlink target",
    (root) => {
      symlinkSync("README.md", path.join(root, "linked.md"));
      append(root, "README.md", "[Link](linked.md)\n");
    },
    "LINK",
  ],
  [
    "unsupported inline syntax",
    (root) => append(root, "README.md", "[Complex](foo(bar).md)\n"),
    "SYNTAX",
  ],
  [
    "HTML destination",
    (root) => append(root, "README.md", '<a href="absent.md">missing</a>\n'),
    "SYNTAX",
  ],
  [
    "undefined reference",
    (root) => append(root, "README.md", "[Missing][not-defined]\n"),
    "LINK",
  ],
  [
    "duplicate explicit anchor",
    (root) =>
      append(root, "README.md", '<a id="same"></a>\n<a id="same"></a>\n'),
    "ANCHOR",
  ],
  [
    "missing example marker",
    (root) => write(root, "docs/guides/recovery.md", "# Recovery\n"),
    "EXAMPLE",
  ],
  [
    "duplicate example marker",
    (root) =>
      append(
        root,
        "docs/guides/recovery.md",
        "<!-- documented-recovery-diagnosis:start -->\n",
      ),
    "EXAMPLE",
  ],
  [
    "unbalanced example",
    (root) => {
      const file = "docs/guides/recovery.md";
      write(
        root,
        file,
        readFileSync(path.join(root, file), "utf8")
          .replace(":start -->", ":end -->")
          .replace(":end -->", ":start -->"),
      );
      write(
        root,
        file,
        "<!-- documented-recovery-diagnosis:end -->\n<!-- documented-recovery-diagnosis:start -->\n",
      );
    },
    "EXAMPLE",
  ],
  [
    "empty example",
    (root) =>
      write(
        root,
        "docs/guides/recovery.md",
        "<!-- documented-recovery-diagnosis:start -->\n\u0060\u0060\u0060sh\n\u0060\u0060\u0060\n<!-- documented-recovery-diagnosis:end -->\n",
      ),
    "EXAMPLE",
  ],
  [
    "zero executed commands",
    (root) => {
      const file = "docs/guides/recovery.md";
      write(
        root,
        file,
        readFileSync(path.join(root, file), "utf8").replaceAll(
          'node "$CLI"',
          'echo "$CLI"',
        ),
      );
    },
    "EXAMPLE",
  ],
  [
    "missing schema",
    (root) => rmSync(path.join(root, "schema/v1/kit.schema.json")),
    "POINTER",
  ],
  [
    "missing source pointer",
    (root) =>
      write(root, "docs/agents/native-dependency.md", "# Native producer\n"),
    "POINTER",
  ],
  [
    "missing manifest source",
    (root) => rmSync(path.join(root, "registry/ui/sample.svelte")),
    "CATALOG",
  ],
  [
    "missing advertised component",
    (root) =>
      write(root, "docs/reference/components/README.md", "# Components\n"),
    "CATALOG",
  ],
  [
    "extra advertised component",
    (root) =>
      append(
        root,
        "docs/reference/components/README.md",
        "[Identity](identity.md)\n",
      ),
    "CATALOG",
  ],
  [
    "duplicate advertised component",
    (root) =>
      append(
        root,
        "docs/reference/components/README.md",
        "[Sample](sample.md)\n",
      ),
    "CATALOG",
  ],
  [
    "missing export",
    (root) =>
      write(
        root,
        "docs/reference/components/sample.md",
        "# Sample\n[Manifest](../../../registry/ui/sample.json)\n",
      ),
    "CATALOG",
  ],
];
for (const [name, mutate, code] of failures)
  test(name + " fails causally and remains read-only", () =>
    withFixture((root) => {
      mutate(root);
      const before = snapshot(root);
      assert.ok(
        checkDocs(root).some((issue) => issue.code === code),
        name,
      );
      assert.equal(cli(root).status, 1, name);
      assert.equal(snapshot(root), before, name);
    }),
  );

test("fences/code/comments mask examples while reference links, images and explicit anchors resolve", () =>
  withFixture((root) => {
    write(
      root,
      "image.svg",
      '<svg xmlns="http://www.w3.org/2000/svg"></svg>\n',
    );
    write(
      root,
      "docs/with space.md",
      '# Heading\n\n## Same\n\n## Same\n\n<a id="explicit"></a>\n',
    );
    append(
      root,
      "README.md",
      "\n[Inline](<docs/with space.md#same-1>)\n[Reference][guide]\n[guide]: <docs/with space.md#explicit>\n![Image](image.svg)\n\u0060[Not a link](missing.md)\u0060\n<!-- [Not a link](missing.md) -->\n\u0060\u0060\u0060md\n[Not a link](missing.md)\n\u0060\u0060\u0060\n",
    );
    assert.deepEqual(checkDocs(root), []);
  }));

test("packed Markdown link closure needs only actual extracted files", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-packed-docs-"));
  try {
    write(root, "README.md", "# Package\n[Guide](docs/start.md#begin)\n");
    write(
      root,
      "docs/start.md",
      "# Begin\n[Maintenance repository](https://github.com/triesap/svelte-ui-kit)\n",
    );
    assert.deepEqual(checkLinks(root, ["README.md", "docs/start.md"]), []);
    write(root, "docs/start.md", "# Different\n");
    assert.ok(checkLinks(root, ["README.md", "docs/start.md"]).length);
    rmSync(path.join(root, "docs/start.md"));
    assert.ok(checkLinks(root, ["README.md"]).length);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("marked examples reject multiple fences and invalid language", () => {
  const text =
    "<!-- example:start -->\n\u0060\u0060\u0060sh\nnode example\n\u0060\u0060\u0060\n<!-- example:end -->";
  assert.equal(readMarkedExample(text, "example", "sh"), "node example");
  assert.throws(() => readMarkedExample(text, "example", "json"));
  assert.throws(() =>
    readMarkedExample(
      text.replace(
        "node example",
        "node example\n\u0060\u0060\u0060\n\u0060\u0060\u0060sh\nnode again",
      ),
      "example",
      "sh",
    ),
  );
});

test("heading suffixes and explicit anchor collisions retain the original parser behavior", () => {
  const anchors = extractAnchorData(
    '# Same\n# Same\n<a id="literal"></a>\n<a id="literal"></a>\n',
  );
  assert.deepEqual(anchors.slugs, ["same", "same-1"]);
  assert.deepEqual(anchors.duplicateExplicit, ["literal"]);
});

test("reference images are validated rather than silently skipped", () =>
  withFixture((root) => {
    append(root, "README.md", "\n![Image][picture]\n[picture]: absent.svg\n");
    assert.ok(checkDocs(root).some((issue) => issue.code === "LINK"));
    write(root, "absent.svg", "<svg></svg>\n");
    assert.deepEqual(checkDocs(root), []);
  }));

test("unclosed fences and duplicate definitions cannot conceal invalid navigation", () =>
  withFixture((root) => {
    append(root, "README.md", "\n\u0060\u0060\u0060md\n[Missing](absent.md)\n");
    assert.ok(checkDocs(root).some((issue) => issue.code === "SYNTAX"));
    write(
      root,
      "README.md",
      "# Root\n[Guide][ref]\n[ref]: docs/README.md\n[REF]: docs/CHANGELOG.md\n",
    );
    assert.ok(checkDocs(root).some((issue) => issue.code === "SYNTAX"));
  }));

test("unknown CLI arguments fail visibly", () =>
  assert.equal(
    spawnSync(process.execPath, [tool, "--allow-legacy"], { encoding: "utf8" })
      .status,
    2,
  ));
