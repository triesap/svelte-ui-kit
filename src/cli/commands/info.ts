/** S079: actual read-only inspection of the selected consumer package. */
import type { CommandRequest } from "../args.js";
import {
  createEnvelope,
  type CommandEnvelope,
  type FailureClass,
} from "../protocol.js";
import { issueDiagnostics } from "../output.js";
import { resolveProjectRoot } from "../../project/root.js";
import { captureEnvironment } from "../../project/environment.js";
import { deriveKitPaths } from "../../project/config.js";
import {
  inspectDependencyStateFromEvidence,
  validatePeerDependenciesFromEvidence,
  type DependencyRequirement,
} from "../../project/dependencies.js";
import { createAssetProvider } from "../../registry/assets.js";
import { loadRegistrySnapshot } from "../../registry/load.js";
import { projectRequests } from "../../registry/projection.js";
import {
  planDependencies,
  type NpmPlanEntry,
} from "../../registry/dependency-plan.js";
import type { ModelIssue } from "../../registry/errors.js";

export interface InfoResult {
  readonly envelope: CommandEnvelope;
  readonly failureClass?: FailureClass;
}
export function inspectInfo(
  request: CommandRequest,
  registryRoot: string,
  invocationDir = process.cwd(),
): InfoResult {
  const failure = (
    issues: readonly ModelIssue[],
    failureClass?: FailureClass,
  ): InfoResult => ({
    envelope: createEnvelope({
      command: "info",
      status: issues.some(
        (issue) =>
          issue.code.includes("UNSUPPORTED") ||
          issue.code === "PROJECT_NOT_SVELTEKIT",
      )
        ? "unsupported"
        : "error",
      diagnostics: issueDiagnostics(
        issues.map((issue) =>
          issue.code === "PROJECT_CWD_NOT_FOUND"
            ? {
                ...issue,
                message:
                  "The explicitly selected application directory is unavailable.",
              }
            : issue,
        ),
      ),
      data: { ready: false },
    }),
    ...(failureClass === undefined ? {} : { failureClass }),
  });
  const selected = resolveProjectRoot({ cwd: request.cwd, invocationDir });
  if (!selected.ok)
    return failure(
      selected.issues.map((issue) => ({
        ...issue,
        message: issue.code.includes("AMBIGUOUS")
          ? "The selected workspace is ambiguous; pass --cwd for one application package."
          : "No supported application package could be selected; pass --cwd for a directory containing its package.json.",
      })),
    );
  const registry = loadRegistrySnapshot(createAssetProvider(registryRoot));
  if (!registry.ok) return failure(registry.issues, "registry_failure");
  const environment = captureEnvironment(selected.value.root);
  if (!environment.project.ok) return failure(environment.project.issues);
  if (!environment.kitConfig.ok) return failure(environment.kitConfig.issues);
  const project = environment.project.value;
  const discovered = environment.kitConfig.value;
  const config =
    discovered.kind === "custom"
      ? discovered.config
      : {
          ...discovered.config,
          uiDir: project.uiDir,
          stylesDir: project.stylesDir,
          layoutFile: project.layoutFile,
        };
  const closure = projectRequests(registry.value, config.requested);
  if (!closure.ok) return failure(closure.issues, "registry_failure");
  const dependencies = planDependencies(registry.value, closure.value.order);
  if (!dependencies.ok) return failure(dependencies.issues, "registry_failure");
  // The framework is always relevant; Bits/date are assessed when declared or
  // selected by a configured component, never imposed on empty foundation use.
  const entries: NpmPlanEntry[] = [...dependencies.value.entries];
  const targets: DependencyRequirement[] = [
    { name: "svelte", range: registry.value.root.compatibility.svelte },
  ];
  if (environment.manifest.kind === "value") {
    for (const [name, range] of [
      ["bits-ui", registry.value.root.compatibility.bits],
      ["@internationalized/date", registry.value.root.compatibility.date],
    ] as const) {
      const declared = [
        "dependencies",
        "devDependencies",
        "peerDependencies",
      ].some((field) =>
        Object.hasOwn(
          (environment.manifest.kind === "value"
            ? environment.manifest.value[field]
            : undefined) ?? {},
          name,
        ),
      );
      if (declared) targets.push({ name, range });
    }
  }
  for (const requirement of targets)
    if (!entries.some((entry) => entry.name === requirement.name))
      entries.push({
        ...requirement,
        roles: ["peer"],
        requiredBy: ["compatibility"],
      });
  const evidence = {
    manifest: environment.manifest,
    observe: (name: string) =>
      environment.installed.get(name) ??
      (environment.enumerationComplete ? { kind: "absent" as const } : null),
  };
  const state = inspectDependencyStateFromEvidence(
    evidence,
    entries.map((entry) => ({ name: entry.name, range: entry.range })),
  );
  const peers = validatePeerDependenciesFromEvidence(evidence, { entries });
  const issues = [
    ...environment.managerIssues,
    ...(!state.ok ? state.issues : []),
    ...(!peers.ok ? peers.issues : []),
  ];
  const states = state.ok ? state.value : [];
  const ready =
    issues.length === 0 && states.every((entry) => entry.status === "ready");
  return {
    envelope: createEnvelope({
      command: "info",
      status: ready ? "success" : "warning",
      diagnostics: issueDiagnostics(issues, "warn"),
      data: {
        ready,
        project: {
          packageName: selected.value.packageName,
          selectedBy: selected.value.selectedBy,
          svelteConfigFile: project.svelteConfigFile,
        },
        config: {
          kind: discovered.kind,
          path: discovered.configPath,
          requested: config.requested,
        },
        paths: {
          uiDir: config.uiDir,
          stylesDir: config.stylesDir,
          layoutFile: config.layoutFile,
          ...deriveKitPaths(config),
        },
        registry: {
          version: registry.value.root.registryVersion,
          contentHash: registry.value.root.contentHash,
          compatibility: registry.value.root.compatibility,
        },
        manager: environment.manager,
        dependencies: states,
        peers: peers.ok ? peers.value : [],
      },
    }),
  };
}
