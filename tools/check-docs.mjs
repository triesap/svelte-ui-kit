#!/usr/bin/env node
/** Current documentation validation. No history lookup, writes or network access. */
import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  realpathSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  computeFenceMask,
  extractAnchorData,
  extractLinks,
  maskInlineCode,
  readMarkedExample,
} from "./markdown-docs.mjs";

export const REQUIRED_DOCS = Object.freeze([
  "README.md",
  "AGENTS.md",
  "docs/README.md",
  "docs/CONTRIBUTING.md",
  "docs/CHANGELOG.md",
  "docs/getting-started.md",
  "docs/guides/styling.md",
  "docs/guides/upgrading.md",
  "docs/guides/recovery.md",
  "docs/reference/cli.md",
  "docs/reference/configuration.md",
  "docs/reference/compatibility.md",
  "docs/reference/components/README.md",
  "docs/agents/README.md",
  "docs/agents/product-contract.md",
  "docs/agents/architecture.md",
  "docs/agents/synchronization.md",
  "docs/agents/transactions.md",
  "docs/agents/testing.md",
  "docs/agents/native-dependency.md",
  "docs/provenance.md",
]);
export const EXAMPLES = Object.freeze([
  ["docs/getting-started.md", "documented-cli-workflow", "sh", 7],
  ["docs/getting-started.md", "documented-item-install", "sh", 6],
  [
    "docs/reference/configuration.md",
    "documented-custom-mapping",
    "json",
    null,
  ],
  ["docs/guides/upgrading.md", "documented-upgrade-workflow", "sh", 4],
  ["docs/guides/recovery.md", "documented-recovery-diagnosis", "sh", 2],
]);

function inside(root, file) {
  const relative = path.relative(root, file);
  return (
    relative === "" ||
    (!relative.startsWith(".." + path.sep) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  );
}

/** Resolve with exact casing and refuse symlinks/nonregular files. */
export function localFile(root, relative) {
  let cursor = root;
  for (const part of relative.split("/")) {
    if (
      !part ||
      part === "." ||
      part === ".." ||
      !readdirSync(cursor).includes(part)
    )
      throw Error("missing or incorrectly cased path: " + relative);
    cursor = path.join(cursor, part);
    const info = lstatSync(cursor);
    if (info.isSymbolicLink())
      throw Error("symlink documentation target: " + relative);
  }
  if (!lstatSync(cursor).isFile())
    throw Error("nonregular documentation target: " + relative);
  return cursor;
}

export function markdownFiles(root, directory = "docs") {
  const files = [];
  const visit = (relative) => {
    const absolute = path.join(root, relative);
    if (!existsSync(absolute)) return;
    const info = lstatSync(absolute);
    if (info.isSymbolicLink())
      throw Error("symlink documentation tree: " + relative);
    if (info.isDirectory())
      for (const name of readdirSync(absolute).sort())
        visit(relative + "/" + name);
    else if (info.isFile() && relative.endsWith(".md")) files.push(relative);
  };
  visit(directory);
  return files;
}

/** Validate an explicit document set, also usable against an extracted package. */
export function checkLinks(root, documents) {
  root = realpathSync(root);
  const issues = [];
  const fail = (file, code, message) => issues.push({ file, code, message });
  for (const file of documents) {
    let text;
    try {
      text = readFileSync(localFile(root, file), "utf8");
    } catch (error) {
      fail(file, "DOCUMENT", error.message);
      continue;
    }
    // HTML comments are not rendered Markdown; marker ownership is checked separately.
    const rendered = text.replace(/<!--[\s\S]*?-->/g, "");
    const anchors = extractAnchorData(rendered);
    for (const id of anchors.duplicateExplicit)
      fail(file, "ANCHOR", "duplicate explicit anchor: " + id);
    const lines = rendered.split("\n"),
      fences = computeFenceMask(lines);
    let openFence = null;
    const definitions = new Set();
    for (let n = 0; n < lines.length; n++) {
      const fence = lines[n].match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
      if (fence) {
        if (openFence === null) openFence = fence[1];
        else if (
          fence[1][0] === openFence[0] &&
          fence[1].length >= openFence.length &&
          !fence[2].trim()
        )
          openFence = null;
      }
      if (fences[n]) continue;
      const line = maskInlineCode(lines[n]);
      const definition = line.match(/^ {0,3}\[([^\]]+)\]:/);
      if (definition) {
        const id = definition[1].trim().toLowerCase().replace(/\s+/g, " ");
        if (definitions.has(id))
          fail(file, "SYNTAX", "duplicate link definition: " + id);
        definitions.add(id);
      }
      if (/<(?:a|img)\b[^>]*(?:href|src)\s*=/i.test(line))
        fail(
          file,
          "SYNTAX",
          "use Markdown links/images instead of HTML destinations",
        );
      for (const match of line.matchAll(/!?\[[^\]]*\]\(/g)) {
        if (
          !/^!?\[[^\]]*\]\(\s*(?:<[^>]+>|[^()\s]+)(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/.test(
            line.slice(match.index),
          )
        )
          fail(
            file,
            "SYNTAX",
            "unsupported or malformed inline link; use angle brackets for complex destinations",
          );
      }
    }
    if (openFence !== null) fail(file, "SYNTAX", "unclosed Markdown fence");
    for (const link of extractLinks(rendered)) {
      if (link.missingRef) {
        fail(file, "LINK", "undefined link reference: " + link.ref);
        continue;
      }
      if (/^(?:https?:|mailto:|tel:)/i.test(link.target)) continue;
      if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|\/)/i.test(link.target)) {
        fail(
          file,
          "LINK",
          "unsupported or absolute destination: " + link.target,
        );
        continue;
      }
      try {
        const hash = link.target.indexOf("#");
        const rawPath = decodeURIComponent(
          hash < 0 ? link.target : link.target.slice(0, hash),
        );
        const fragment =
          hash < 0 ? "" : decodeURIComponent(link.target.slice(hash + 1));
        const absolute = path.resolve(
          root,
          path.dirname(file),
          rawPath || path.basename(file),
        );
        if (!inside(root, absolute))
          throw Error("link escapes root: " + link.target);
        const relative = path
          .relative(root, absolute)
          .split(path.sep)
          .join("/");
        const target = localFile(root, relative);
        if (fragment) {
          if (!relative.endsWith(".md"))
            throw Error(
              "unsupported local fragment on non-Markdown file: " + link.target,
            );
          const data = extractAnchorData(
            readFileSync(target, "utf8").replace(/<!--[\s\S]*?-->/g, ""),
          );
          if (!data.explicitSet.has(fragment) && !data.slugSet.has(fragment))
            throw Error("missing anchor: " + link.target);
        }
      } catch (error) {
        fail(file, "LINK", error.message);
      }
    }
  }
  return issues;
}

export function checkDocs(root) {
  root = realpathSync(root);
  const issues = [];
  const fail = (file, code, message) => issues.push({ file, code, message });
  let documents;
  try {
    documents = [...new Set([...REQUIRED_DOCS, ...markdownFiles(root)])];
  } catch (error) {
    return [{ file: "docs", code: "DOCUMENT", message: error.message }];
  }
  issues.push(...checkLinks(root, documents));
  for (const [file, marker, language, count] of EXAMPLES) {
    try {
      const example = readMarkedExample(
        readFileSync(localFile(root, file), "utf8"),
        marker,
        language,
      );
      if (count !== null) {
        const commands = example
          .split("\n")
          .filter((line) => line.startsWith("node "));
        if (
          commands.length !== count ||
          commands.some(
            (line) =>
              !/^node "\$(?:CLI|INCOMING_CLI)" --cwd "\$APP" [-a-z ]+$/.test(
                line,
              ),
          )
        )
          throw Error(
            "example " +
              marker +
              " must contain exactly " +
              count +
              " supported commands",
          );
      } else JSON.parse(example);
    } catch (error) {
      fail(file, "EXAMPLE", error.message);
    }
  }
  try {
    const registry = JSON.parse(
      readFileSync(localFile(root, "registry/registry.json"), "utf8"),
    );
    const items = registry.items;
    if (
      !Array.isArray(items) ||
      !items.length ||
      new Set(items.map((item) => item.id)).size !== items.length
    )
      throw Error("registry item inventory is invalid");
    const indexFile = "docs/reference/components/README.md";
    const index = readFileSync(localFile(root, indexFile), "utf8");
    const advertised = extractLinks(index)
      .filter(
        (link) => link.target && /^[a-z][a-z0-9-]*\.md$/.test(link.target),
      )
      .map((link) => link.target.slice(0, -3));
    if (
      JSON.stringify(advertised.slice().sort()) !==
      JSON.stringify(items.map((item) => item.id).sort())
    )
      fail(
        indexFile,
        "CATALOG",
        "component navigation must match registry IDs exactly once",
      );
    const pages = markdownFiles(root, "docs/reference/components").filter(
      (file) => file !== indexFile,
    );
    const expected = items.map(
      (item) => "docs/reference/components/" + item.id + ".md",
    );
    if (
      JSON.stringify(pages.slice().sort()) !==
      JSON.stringify(expected.slice().sort())
    )
      fail(indexFile, "CATALOG", "missing or extra component reference page");
    for (const item of items) {
      const manifestPath = "registry/" + item.manifest;
      const manifest = JSON.parse(
        readFileSync(localFile(root, manifestPath), "utf8"),
      );
      if (manifest.id !== item.id)
        throw Error("registry/manifest ID disagreement: " + item.id);
      const page = "docs/reference/components/" + item.id + ".md";
      const text = readFileSync(localFile(root, page), "utf8");
      for (const entry of manifest.exports ?? [])
        if (!text.includes("`" + entry.name + "`"))
          fail(page, "CATALOG", "undocumented manifest export: " + entry.name);
      if (
        !extractLinks(text).some((link) => link.target?.includes(manifestPath))
      )
        fail(page, "POINTER", "missing authoritative manifest pointer");
      for (const asset of [
        ...(manifest.files ?? []),
        ...(manifest.styles ?? []),
      ])
        localFile(root, "registry/" + asset.source);
    }
  } catch (error) {
    fail("registry/registry.json", "CATALOG", error.message);
  }
  for (const [file, pointer] of [
    ["docs/reference/configuration.md", "schema/v1/kit.schema.json"],
    ["docs/reference/cli.md", "schema/v1/command-envelope.schema.json"],
    ["docs/agents/native-dependency.md", "tools/native-dependency/recipe.json"],
  ]) {
    try {
      localFile(root, pointer);
      if (
        !extractLinks(readFileSync(localFile(root, file), "utf8")).some(
          (link) => link.target?.includes(pointer),
        )
      )
        throw Error("missing authoritative pointer: " + pointer);
    } catch (error) {
      fail(file, "POINTER", error.message);
    }
  }
  return issues;
}

export function main(args = process.argv.slice(2)) {
  let root = fileURLToPath(new URL("../", import.meta.url));
  if (args.length) {
    if (args.length !== 2 || args[0] !== "--root") {
      console.error("usage: node tools/check-docs.mjs [--root directory]");
      return 2;
    }
    root = path.resolve(args[1]);
  }
  try {
    const issues = checkDocs(root);
    for (const issue of issues)
      console.error(issue.code + " " + issue.file + ": " + issue.message);
    if (!issues.length) console.log("Current documentation: PASS");
    return issues.length ? 1 : 0;
  } catch (error) {
    console.error(error.message);
    return 1;
  }
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  process.exitCode = main();
