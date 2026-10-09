/** Shared Markdown helpers; extracted from the original contract checker. */
export function computeFenceMask(lines) {
  const mask = new Array(lines.length).fill(false);
  let open = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (open === null) {
      const m = line.match(/^ {0,3}(`{3,}|~{3,})/);
      if (m) {
        open = { marker: m[1][0], length: m[1].length };
        mask[i] = true;
      }
      continue;
    }
    mask[i] = true;
    const close = line.match(/^ {0,3}(`{3,}|~{3,})\s*$/);
    if (
      close &&
      close[1][0] === open.marker &&
      close[1].length >= open.length
    ) {
      open = null;
    }
  }
  return mask;
}

/**
 * Return only the lines outside fenced code blocks. Structural definitions (IDs,
 * ranges, gate lines, summaries, evidence records) must never be satisfied or
 * duplicated by content inside a literal example fence.
 */
export function stripFencedLines(text) {
  const lines = text.split("\n");
  const fence = computeFenceMask(lines);
  return lines.filter((_, i) => !fence[i]);
}

/** Replace inline code spans with equal-length spaces so links/anchors inside them are ignored. */
export function maskInlineCode(line) {
  let out = "";
  let i = 0;
  while (i < line.length) {
    if (line[i] === "`") {
      let n = 1;
      while (line[i + n] === "`") n++;
      const open = "`".repeat(n);
      const closeIdx = line.indexOf(open, i + n);
      if (closeIdx !== -1) {
        out += " ".repeat(closeIdx + n - i);
        i = closeIdx + n;
        continue;
      }
    }
    out += line[i];
    i++;
  }
  return out;
}

export function slugifyHeading(text) {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/[`*_~[\]]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}_-]/gu, "");
}

/**
 * Collect explicit HTML anchors and heading-derived slugs. Explicit IDs keep
 * their literal value and duplicates are reported instead of being suffixed;
 * duplicate headings receive GitHub-style numeric suffixes.
 */
export function extractAnchorData(text) {
  const lines = text.split("\n");
  const fence = computeFenceMask(lines);
  const explicit = [];
  const explicitSet = new Set();
  const duplicateExplicit = [];
  const slugs = [];
  const slugSet = new Set();
  for (let i = 0; i < lines.length; i++) {
    if (fence[i]) continue;
    const scan = maskInlineCode(lines[i]);
    for (const m of scan.matchAll(
      /<a\s+[^>]*?(?:id|name)\s*=\s*(?:"([^"]+)"|'([^']+)')/g,
    )) {
      const id = m[1] ?? m[2];
      if (explicitSet.has(id)) duplicateExplicit.push(id);
      explicitSet.add(id);
      explicit.push(id);
    }
    const heading = lines[i].match(/^#{1,6}\s+(.*?)\s*#*\s*$/);
    if (!heading) continue;
    const base = slugifyHeading(heading[1]);
    if (!base) continue;
    let candidate = base;
    let n = 1;
    while (slugSet.has(candidate)) candidate = `${base}-${n++}`;
    slugSet.add(candidate);
    slugs.push(candidate);
  }
  return { explicit, explicitSet, duplicateExplicit, slugs, slugSet };
}

/** Backwards-compatible union of explicit anchors and heading slugs. */
export function extractAnchors(text) {
  const { explicit, slugs } = extractAnchorData(text);
  return [...explicit, ...slugs];
}

/**
 * Extract Markdown links outside fenced code blocks. Supports inline links,
 * reference-style links (`[label][ref]`, `[label][]`) and shortcut references
 * that resolve to a definition; image links are included. Inline code is
 * masked so code examples neither create nor hide links.
 */
export function extractLinks(text) {
  const lines = text.split("\n");
  const fence = computeFenceMask(lines);
  const definitions = new Map();
  const definitionLines = new Set();
  const normalizeRef = (value) =>
    value.trim().toLowerCase().replace(/\s+/g, " ");
  for (let i = 0; i < lines.length; i++) {
    if (fence[i]) continue;
    const m = lines[i].match(
      /^ {0,3}\[([^\]]+)\]:\s*(<[^>]*>|\S+)(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*$/,
    );
    if (m) {
      definitionLines.add(i);
      const key = normalizeRef(m[1]);
      if (!definitions.has(key)) {
        definitions.set(key, {
          target: m[2].replace(/^<|>$/g, ""),
          line: i + 1,
        });
      }
    }
  }
  const links = [];
  for (let i = 0; i < lines.length; i++) {
    if (fence[i] || definitionLines.has(i)) continue;
    const masked = maskInlineCode(lines[i]);
    for (const m of masked.matchAll(
      /!?\[([^\]]*)\]\(\s*(<[^>]*>|[^()\s]+)(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/g,
    )) {
      links.push({
        text: m[1],
        target: m[2].replace(/^<|>$/g, ""),
        line: i + 1,
      });
    }
    for (const m of masked.matchAll(/!?\[([^\]]*)\]\[([^\]]*)\]/g)) {
      const label = m[2] === "" ? m[1] : m[2];
      const key = normalizeRef(label);
      const def = definitions.get(key);
      links.push({
        text: m[1],
        ref: key,
        target: def ? def.target : null,
        missingRef: !def,
        line: i + 1,
      });
    }
    for (const m of masked.matchAll(/!?\[([^\]]+)\](?!\(|\[)/g)) {
      const key = normalizeRef(m[1]);
      const def = definitions.get(key);
      if (def) {
        links.push({ text: m[1], ref: key, target: def.target, line: i + 1 });
      }
    }
  }
  return links;
}

/** Read exactly one owned, nonempty fenced example without executing its text. */
export function readMarkedExample(text, marker, language) {
  const start = "<!-- " + marker + ":start -->";
  const end = "<!-- " + marker + ":end -->";
  if (text.split(start).length !== 2 || text.split(end).length !== 2)
    throw new Error("example " + marker + " needs exactly one start/end pair");
  const first = text.indexOf(start),
    last = text.indexOf(end);
  if (last <= first) throw new Error("example " + marker + " is unbalanced");
  const block = text.slice(first + start.length, last).trim();
  const lines = block.split("\n");
  if (lines[0] !== "```" + language || lines.at(-1) !== "```")
    throw new Error(
      "example " + marker + " must be one fenced " + language + " block",
    );
  const content = lines.slice(1, -1).join("\n").trim();
  if (!content || lines.slice(1, -1).some((line) => /^```/.test(line)))
    throw new Error("example " + marker + " is empty or contains extra fences");
  return content;
}
