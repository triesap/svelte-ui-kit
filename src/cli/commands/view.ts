/** S080: exact bundled registry inspection, independent of project state. */
import type { CommandRequest } from "../args.js";
import { createEnvelope } from "../protocol.js";
import { issueDiagnostics } from "../output.js";
import { createAssetProvider } from "../../registry/assets.js";
import { loadRegistrySnapshot } from "../../registry/load.js";
import { issue } from "../../registry/errors.js";
import type { InfoResult } from "./info.js";

export function inspectView(
  request: CommandRequest,
  registryRoot: string,
): InfoResult {
  const loaded = loadRegistrySnapshot(createAssetProvider(registryRoot));
  if (!loaded.ok)
    return {
      envelope: createEnvelope({
        command: "view",
        status: "error",
        diagnostics: issueDiagnostics(loaded.issues),
      }),
      failureClass: "registry_failure",
    };
  const item = loaded.value.items.find((entry) => entry.id === request.item);
  if (item === undefined)
    return {
      envelope: createEnvelope({
        command: "view",
        status: "error",
        diagnostics: issueDiagnostics([
          issue(
            "REGISTRY_ITEM_UNKNOWN",
            "The requested item is not advertised by the bundled registry.",
            "item",
          ),
        ]),
      }),
      failureClass: "registry_failure",
    };
  return {
    envelope: createEnvelope({
      command: "view",
      status: "success",
      data: {
        registryVersion: loaded.value.root.registryVersion,
        registryHash: loaded.value.root.contentHash,
        item: item.manifest,
        ...(request.source
          ? {
              sources: item.files.map((file) => ({
                path: file.logicalSource,
                target: file.target,
                digest: file.digest,
                text: new TextDecoder("utf-8", { fatal: true }).decode(
                  file.bytes,
                ),
              })),
            }
          : {}),
      },
    }),
  };
}
