import type { RegistrySnapshotItem } from "../registry/load.js";
import {
  KIT_LAYERS,
  THEME_INTEGRATION_ID,
  tokenMetadataPaths,
} from "../registry/theme.js";
import { deriveKitPaths, type KitConfig } from "../project/config.js";
import { canonicalJson } from "./serialize.js";

/** Project only contracts authenticated by the installed registry snapshot. */
export function projectThemeMetadata(
  item: RegistrySnapshotItem,
  config: KitConfig,
): readonly { readonly path: string; readonly bytes: Uint8Array }[] {
  if (item.contracts === undefined) return [];
  const { tokenContract, componentCustomization } = item.contracts;
  const integration = {
    id: THEME_INTEGRATION_ID,
    contractVersion: 1,
    description:
      "Stylesheet integration and document/custom-host CSS inheritance; this record does not supply portal runtime.",
    stylesheet: "kit.css",
    layers: [...KIT_LAYERS],
    producer: "svelte-ui-kit",
    compatibility: { ...item.manifest.compatibility },
    portal: { supported: true, strategies: ["document", "custom-host"] },
    tokenContract: {
      id: tokenContract.id,
      contractVersion: tokenContract.contractVersion,
    },
  };
  const documents = [tokenContract, componentCustomization, integration];
  return tokenMetadataPaths(deriveKitPaths(config).stateDir).map(
    (path, index) => ({
      path,
      bytes: new TextEncoder().encode(canonicalJson(documents[index]) + "\n"),
    }),
  );
}
