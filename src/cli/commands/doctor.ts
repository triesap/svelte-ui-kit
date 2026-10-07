import { parse, parseCss } from "svelte/compiler";
import { sha256Hex } from "../../codegen/digest.js";
import { projectRequests } from "../../registry/projection.js";
import { renderDependencyInstructionsFromEvidence } from "../../project/dependency-instructions.js";
/** Structural/dependency diagnosis is strictly read-only, including recovery. */
import path from "node:path";
import type { CommandRequest } from "../args.js";
import {
  createEnvelope,
  isSafeLocator,
  type EnvelopeDiagnostic,
} from "../protocol.js";
import { issueDiagnostics } from "../output.js";
import { captureCommandContext } from "./context.js";
import type { InfoResult } from "./info.js";
import { deriveKitPaths } from "../../project/config.js";
import { observeEntry } from "../../project/io.js";
import { planDependencies } from "../../registry/dependency-plan.js";
import {
  inspectDependencyStateFromEvidence,
  validatePeerDependenciesFromEvidence,
  type DependencyStateEntry,
} from "../../project/dependencies.js";
import { createExportAuthority } from "../../codegen/exports.js";
import { parseExportRegion } from "../../codegen/export-parse.js";
import { parseManagedCss } from "../../codegen/css-parse.js";
import { parseSvelteLayout } from "../../codegen/svelte-parse.js";
import {
  resolveProjectedConfig,
  validateProjectedLock,
  type ProjectedBatch,
} from "../../codegen/projected-batch.js";
import { decodeObservedText } from "../../codegen/snapshot.js";
import { inspectTransactions } from "../../codegen/recovery.js";
import { writerLockDir } from "../../codegen/transaction-types.js";
import { issue, type ModelIssue } from "../../registry/errors.js";

export interface DoctorCheck {
  readonly code: string;
  readonly status:
    "healthy" | "broken" | "unsafe" | "unverified" | "customized";
  readonly locator?: string;
}
export function diagnose(
  request: CommandRequest,
  registryRoot: string,
): InfoResult {
  const checks: DoctorCheck[] = [];
  const issues: ModelIssue[] = [];
  const warnings: EnvelopeDiagnostic[] = [];
  let dependencyStates: readonly DependencyStateEntry[] = [];
  let dependencyInstructions: unknown = null;
  const record = (
    entries: readonly ModelIssue[],
    code: string,
    locator?: string,
  ) => {
    if (entries.length === 0)
      checks.push({
        code,
        status: "healthy",
        ...(locator === undefined ? {} : { locator }),
      });
    else
      for (const entry of entries) {
        issues.push(entry);
        checks.push({
          code: entry.code,
          status: entry.code.includes("UNSAFE") ? "unsafe" : "broken",
          ...(entry.locator !== undefined && isSafeLocator(entry.locator)
            ? { locator: entry.locator }
            : {}),
        });
      }
  };
  const result = (): InfoResult => {
    const broken = issues.length > 0;
    return {
      envelope: createEnvelope({
        command: "doctor",
        status:
          broken && request.strict
            ? "error"
            : broken || warnings.length > 0
              ? "warning"
              : "success",
        diagnostics: [
          ...issueDiagnostics(issues, request.strict ? "error" : "warn"),
          ...warnings,
        ],
        data: {
          ready:
            !broken && !checks.some((check) => check.status === "unverified"),
          checks,
          dependencies: dependencyStates,
          dependencyInstructions,
        },
      }),
      ...(broken && request.strict
        ? { failureClass: "strict_doctor" as const }
        : {}),
    };
  };
  const context = captureCommandContext(request, registryRoot);
  if (!context.ok) {
    record(context.issues, "DOCTOR_CONTEXT");
    if (
      context.issues.some(
        (entry) =>
          entry.locator?.startsWith("registry/") ||
          entry.locator?.startsWith("schema/"),
      )
    )
      return {
        envelope: createEnvelope({
          command: "doctor",
          status: "error",
          diagnostics: issueDiagnostics(context.issues),
          data: { ready: false, checks },
        }),
        failureClass: "registry_failure",
      };
    return result();
  }
  const { snapshot, config, lock, registry } = context.value;
  const derived = deriveKitPaths(config);
  if (lock === null) {
    record(
      [
        issue(
          "DOCTOR_NOT_INITIALIZED",
          "No installed ownership lock is present; inspect init --dry-run before initialization.",
          derived.stateDir + "/kit.lock.json",
        ),
      ],
      "DOCTOR_LOCK",
    );
    return result();
  }
  const required = new Set([
    ...lock.files.map((entry) => entry.path),
    ...lock.cssBlocks.map((entry) => entry.path),
    ...lock.integrations.map((entry) => entry.path),
    derived.stateDir + "/kit.json",
  ]);
  for (const logical of required) {
    const observed = snapshot.entries.get(logical);
    if (observed?.kind === "file") record([], "DOCTOR_TARGET_PRESENT", logical);
    else
      record(
        [
          issue(
            observed?.kind === "absent"
              ? "DOCTOR_TARGET_MISSING"
              : "DOCTOR_TARGET_UNSAFE",
            "Required installed content is missing or not a regular contained file.",
            logical,
          ),
        ],
        "DOCTOR_TARGET_PRESENT",
      );
  }
  if (checks.some((check) => check.status === "unsafe")) return result();
  for (const file of lock.files) {
    const observed = snapshot.entries.get(file.path);
    if (observed?.kind !== "file") continue;
    const decoded = decodeObservedText(observed);
    if (decoded.kind !== "text") {
      record(
        [
          issue(
            "DOCTOR_SOURCE_INVALID",
            "Owned source is not valid UTF-8.",
            file.path,
          ),
        ],
        "DOCTOR_SOURCE",
      );
      continue;
    }
    try {
      if (file.path.endsWith(".svelte")) parse(decoded.text, { modern: true });
      else if (file.path.endsWith(".ts")) {
        const parsed = parseExportRegion(file.path, decoded.text);
        if (!parsed.ok) {
          record(parsed.issues, "DOCTOR_SOURCE");
          continue;
        }
        const item = registry.items.find((entry) => entry.id === file.owner);
        if (
          registry.root.contentHash === lock.registryHash &&
          item !== undefined
        ) {
          const declarations = item.manifest.exports.filter(
            (entry) => config.uiDir + "/" + entry.target === file.path,
          );
          const missing = declarations.filter(
            (entry) =>
              !parsed.value.appExports.some(
                (actual) => actual.name === entry.name,
              ),
          );
          if (missing.length > 0) {
            record(
              [
                issue(
                  "DOCTOR_SOURCE_EXPORT_MISSING",
                  "Owned TypeScript source no longer supplies its declared public export.",
                  file.path,
                ),
              ],
              "DOCTOR_SOURCE",
            );
            continue;
          }
        }
      }
    } catch {
      record(
        [
          issue(
            "DOCTOR_SOURCE_INVALID",
            "Owned source cannot be parsed by the pinned language compiler.",
            file.path,
          ),
        ],
        "DOCTOR_SOURCE",
      );
      continue;
    }
    if (observed.hash !== file.baseHash) {
      checks.push({
        code: "DOCTOR_SOURCE_CUSTOMIZED",
        status: "customized",
        locator: file.path,
      });
      warnings.push({
        code: "DOCTOR_SOURCE_CUSTOMIZED",
        level: "info",
        message:
          "Valid local source differs from recorded upstream; original base lineage is retained.",
        locator: file.path,
        guidance:
          "Review incoming changes with view and sync --dry-run before upgrading.",
      });
    }
  }

  const cssPaths = new Set(lock.cssBlocks.map((entry) => entry.path));
  cssPaths.add(derived.kitCss);
  for (const logical of cssPaths) {
    const observed = snapshot.entries.get(logical);
    if (observed === undefined) continue;
    const decoded = decodeObservedText(observed);
    if (decoded.kind !== "text") continue;
    try {
      parseCss(decoded.text);
    } catch {
      record(
        [
          issue(
            "DOCTOR_CSS_SYNTAX_INVALID",
            "The installed stylesheet cannot be parsed by the pinned CSS parser.",
            logical,
          ),
        ],
        "DOCTOR_CSS",
      );
      continue;
    }
    const parsed = parseManagedCss(decoded.text);
    record(parsed.ok ? [] : parsed.issues, "DOCTOR_CSS", logical);
    if (parsed.ok)
      for (const owned of lock.cssBlocks.filter(
        (entry) => entry.path === logical,
      )) {
        const block = parsed.value.blocks.find(
          (entry) => entry.id === owned.blockId,
        );
        if (
          block !== undefined &&
          sha256Hex(
            new TextEncoder().encode(
              decoded.text.slice(block.contentStart, block.contentEnd),
            ),
          ) !== owned.baseHash
        ) {
          checks.push({
            code: "DOCTOR_CSS_CUSTOMIZED",
            status: "customized",
            locator: logical,
          });
          warnings.push({
            code: "DOCTOR_CSS_CUSTOMIZED",
            level: "info",
            message: `Valid local CSS block ${owned.blockId} differs from recorded upstream; original base lineage is retained.`,
            locator: logical,
            guidance:
              "Use application overrides or inspect incoming source before reconciling this customization.",
          });
        }
      }
    if (parsed.ok)
      for (const owned of lock.cssBlocks.filter(
        (entry) => entry.path === logical,
      ))
        if (!parsed.value.blocks.some((block) => block.id === owned.blockId))
          record(
            [
              issue(
                "DOCTOR_CSS_BLOCK_MISSING",
                "An owned managed CSS block is absent.",
                logical,
              ),
            ],
            "DOCTOR_CSS",
          );
  }
  for (const integration of lock.integrations) {
    const observed = snapshot.entries.get(integration.path);
    if (observed === undefined) continue;
    const decoded = decodeObservedText(observed);
    if (decoded.kind !== "text") {
      if (observed.kind === "file")
        record(
          [
            issue(
              "DOCTOR_TEXT_INVALID",
              "Integration content is not valid UTF-8.",
              integration.path,
            ),
          ],
          "DOCTOR_TEXT",
        );
      continue;
    }
    if (integration.kind === "exports") {
      const parsed = parseExportRegion(integration.path, decoded.text);
      record(
        parsed.ok && parsed.value.region !== null
          ? []
          : parsed.ok
            ? [
                issue(
                  "DOCTOR_EXPORTS_REGION_MISSING",
                  "The owned export region is absent.",
                  integration.path,
                ),
              ]
            : parsed.issues,
        "DOCTOR_EXPORTS",
        integration.path,
      );
    }
    if (integration.kind === "layout") {
      const parsed = parseSvelteLayout(decoded.text);
      record(
        parsed.ok && parsed.value.rendersChildren
          ? []
          : parsed.ok
            ? [
                issue(
                  "DOCTOR_CHILD_RENDER_MISSING",
                  "The layout no longer proves application child rendering.",
                  integration.path,
                ),
              ]
            : parsed.issues,
        "DOCTOR_LAYOUT",
        integration.path,
      );
    }
  }
  if (registry.root.contentHash === lock.registryHash) {
    const closure = projectRequests(registry, config.requested);
    record(
      closure.ok
        ? JSON.stringify([...closure.value.order].sort()) ===
          JSON.stringify(lock.items.map((item) => item.id).sort())
          ? []
          : [
              issue(
                "DOCTOR_CLOSURE_MISMATCH",
                "The installed item set differs from the configured dependency closure.",
                derived.stateDir + "/kit.lock.json",
              ),
            ]
        : closure.issues,
      "DOCTOR_CLOSURE",
    );
    const authority = createExportAuthority(
      registry,
      config,
      lock.items.map((entry) => entry.id),
    );
    if (!authority.ok) record(authority.issues, "DOCTOR_EXPORT_AUTHORITY");
    else {
      const batch: ProjectedBatch = {
        stateDir: derived.stateDir,
        uiDir: config.uiDir,
        stylesDir: config.stylesDir,
        layoutFile: config.layoutFile,
        targets: [],
        evidence: [...snapshot.entries.values()]
          .filter((entry) => entry.kind === "file" || entry.kind === "absent")
          .map((entry) => ({
            path: entry.path,
            kind: entry.kind as "file" | "absent",
          })),
        content: [...snapshot.entries.values()]
          .filter((entry) => entry.kind === "file" && entry.bytes !== null)
          .map((entry) => ({ path: entry.path, bytes: entry.bytes! })),
        exportAuthority: authority.value,
      };
      const projected = resolveProjectedConfig(batch);
      record(
        [...projected.issues, ...validateProjectedLock(batch, lock, projected)],
        "DOCTOR_INSTALLED_COHERENCE",
      );
    }
  } else {
    checks.push({ code: "DOCTOR_REGISTRY_UPDATE", status: "unverified" });
    warnings.push({
      code: "DOCTOR_REGISTRY_UPDATE",
      level: "warn",
      message:
        "The bundled registry differs from installed lineage; current registry declarations do not certify historical exports.",
      guidance:
        "Inspect view and sync --dry-run; reconcile upgrades without replacing customized lineage.",
    });
  }
  const dependencies = planDependencies(
    registry,
    lock.items
      .map((entry) => entry.id)
      .filter((id) => registry.items.some((entry) => entry.id === id)),
  );
  if (!dependencies.ok) record(dependencies.issues, "DOCTOR_DEPENDENCIES");
  else {
    const environment = snapshot.environment;
    const evidence = {
      manifest: environment.manifest,
      observe: (name: string) =>
        environment.installed.get(name) ??
        (environment.enumerationComplete ? { kind: "absent" as const } : null),
    };
    const requirements = [
      ...dependencies.value.entries.map((entry) => ({
        name: entry.name,
        range: entry.range,
      })),
      { name: "svelte", range: registry.root.compatibility.svelte },
    ];
    if (environment.manifest.kind === "value")
      for (const [name, range] of [
        ["bits-ui", registry.root.compatibility.bits],
        ["@internationalized/date", registry.root.compatibility.date],
      ] as const)
        if (
          ["dependencies", "devDependencies", "peerDependencies"].some(
            (field) =>
              Object.hasOwn(
                environment.manifest.kind === "value"
                  ? (environment.manifest.value[field] ?? {})
                  : {},
                name,
              ),
          )
        )
          requirements.push({ name, range });
    const instructions = renderDependencyInstructionsFromEvidence(
      environment.manager,
      environment.managerIssues,
      {
        runtime: dependencies.value.entries
          .filter((entry) => entry.roles.includes("runtime"))
          .map((entry) => `${entry.name}@${entry.range}`),
        peers: requirements
          .filter(
            (entry) =>
              !dependencies.value.entries.some(
                (dep) =>
                  dep.name === entry.name && dep.roles.includes("runtime"),
              ),
          )
          .map((entry) => `${entry.name}@${entry.range}`),
      },
    );
    if (instructions.ok) dependencyInstructions = instructions.value;
    else record(instructions.issues, "DOCTOR_MANAGER");
    const state = inspectDependencyStateFromEvidence(evidence, requirements);
    if (state.ok) dependencyStates = state.value;
    record(
      state.ok
        ? state.value
            .filter((entry) => entry.status !== "ready")
            .map((entry) =>
              issue(
                "DOCTOR_DEPENDENCY_NOT_READY",
                `${entry.name}: ${entry.status}.`,
                "package.json",
              ),
            )
        : state.issues,
      "DOCTOR_DEPENDENCIES",
    );
    const peers = validatePeerDependenciesFromEvidence(evidence, {
      entries: [
        ...dependencies.value.entries,
        ...requirements
          .filter(
            (requirement) =>
              !dependencies.value.entries.some(
                (entry) => entry.name === requirement.name,
              ),
          )
          .map((requirement) => ({
            ...requirement,
            roles: ["peer" as const],
            requiredBy: ["compatibility"],
          })),
      ],
    });
    record(peers.ok ? [] : peers.issues, "DOCTOR_PEERS");
  }
  const transactions = inspectTransactions(snapshot.root, derived.stateDir, {
    uiDir: config.uiDir,
    stylesDir: config.stylesDir,
    layoutFile: config.layoutFile,
  });
  for (const transaction of transactions)
    record(
      transaction.ok
        ? [
            issue(
              "DOCTOR_RECOVERY_PENDING",
              "Retained transaction state requires guarded recovery; doctor never repairs it.",
              derived.stateDir + "/.svelte-ui-kit",
            ),
          ]
        : transaction.issues.map((entry) => ({
            ...entry,
            locator: derived.stateDir + "/.svelte-ui-kit",
          })),
      "DOCTOR_RECOVERY",
    );
  const writer = observeEntry(
    path.join(snapshot.root, writerLockDir(derived.stateDir)),
  );
  if (writer.kind !== "absent")
    record(
      [
        issue(
          "DOCTOR_WRITER_PRESENT",
          "Writer ownership evidence is present; do not remove it or infer takeover from PID/age.",
          derived.stateDir + "/.svelte-ui-kit",
        ),
      ],
      "DOCTOR_COORDINATION",
    );
  return result();
}
