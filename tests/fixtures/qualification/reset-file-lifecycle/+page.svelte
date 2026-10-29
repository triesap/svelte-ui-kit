<script lang="ts">
  import { flushSync, onMount, tick } from "svelte";
  import { page } from "$app/state";
  import { TextField } from "__UI_MODULE__";
  import type { TextInputProps } from "__UI_MODULE__";
  const witness: Pick<TextInputProps, "readonly" | "value"> = {
    readonly: true,
    value: "FileList lifecycle qualification",
  };
  type Cohort = "plain" | "raw";
  const cohorts = ["plain", "raw"] as const;
  const scenario = page.url.searchParams.get("scenario") ?? "none";
  const cancellation = page.url.searchParams.get("cancel") ?? "none";
  const directory = page.url.searchParams.has("directory");
  let ready = $state(false);
  let prepared = $state(false);
  let mounted = $state(true);
  let files = $state<FileList>();
  let writes = $state(0);
  let copyAttempts = $state(0);
  let copyConstructors = $state(0);
  let probe = $state("");
  let counts = $state({
    plain: { input: 0, change: 0 },
    raw: { input: 0, change: 0 },
  });
  let ticks = $state<Record<string, unknown>>({});
  let events = $state<
    { cohort: Cohort; at: string; prevented: boolean; trusted: boolean }[]
  >([]);
  const records: Partial<
    Record<
      Cohort,
      {
        input: HTMLInputElement;
        files: File[];
        list: FileList;
        late?: FileList;
      }
    >
  > = {};
  let capability: PropertyDescriptor | undefined;
  let formerRaw: HTMLInputElement | undefined;
  function metadata(list: readonly File[] | FileList | undefined) {
    return Array.from(list ?? [], (file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      relativePath: file.webkitRelativePath,
    }));
  }
  function form(cohort: Cohort) {
    const node = document.getElementById(`${cohort}-form`);
    if (!(node instanceof HTMLFormElement))
      throw new Error("Actual form required");
    return node;
  }
  function prepare() {
    for (const cohort of cohorts) {
      const input = document.getElementById(`${cohort}-input`);
      if (!(input instanceof HTMLInputElement) || !input.files)
        throw new Error("Actual files input required");
      const original = Array.from(input.files);
      let late: FileList | undefined;
      if (scenario.startsWith("late-")) {
        const transfer = new DataTransfer();
        for (const file of original) transfer.items.add(file);
        late = transfer.files;
      }
      records[cohort] = {
        input,
        files: original,
        list: input.files,
        ...(late ? { late } : {}),
      };
    }
    if (scenario.includes("missing") || scenario === "copy-failure") {
      capability = Object.getOwnPropertyDescriptor(window, "DataTransfer");
      const Transfer = window.DataTransfer;
      Object.defineProperty(window, "DataTransfer", {
        configurable: true,
        writable: true,
        value:
          scenario === "copy-failure"
            ? class extends Transfer {
                constructor() {
                  super();
                  copyConstructors += 1;
                  const items = this.items;
                  const add = items.add.bind(items);
                  let additions = 0;
                  // Real native list, with the second actual file refused. This
                  // must never publish the partially copied first file as success.
                  Object.defineProperty(this, "items", { value: items });
                  Object.defineProperty(items, "add", {
                    value: (file: File) => {
                      copyAttempts += 1;
                      return ++additions === 2 ? null : add(file);
                    },
                  });
                }
              }
            : undefined,
      });
    }
    prepared = true;
  }
  function remove(cohort: Cohort) {
    if (cohort === "raw") {
      formerRaw = records.raw?.input;
      flushSync(() => {
        mounted = false;
      });
    } else records.plain?.input.remove();
  }
  function beforeReset(cohort: Cohort, method: "native" | "programmatic") {
    if (!prepared) throw new Error("Prepare the actual file inputs first");
    const later = () => {
      if (scenario === "destroy-after") remove(cohort);
      const record = records[cohort];
      if (scenario.startsWith("late-") && record?.late) {
        record.input.files = record.late;
        if (scenario === "late-change")
          record.input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    };
    if (scenario.startsWith("late-") || scenario === "destroy-after") {
      if (method === "native") setTimeout(later, 0);
      else queueMicrotask(later);
    }
  }
  function resetEvent(cohort: Cohort, at: string, event: Event) {
    if (cancellation === at) event.preventDefault();
    events.push({
      cohort,
      at,
      prevented: event.defaultPrevented,
      trusted: event.isTrusted,
    });
    if (at === "target" && scenario === "destroy-before") remove(cohort);
  }
  async function programmatic(cohort: Cohort) {
    beforeReset(cohort, "programmatic");
    form(cohort).reset();
    await tick();
    ticks[cohort] =
      cohort === "raw" ? metadata(files) : "native reset returned";
  }
  function observe() {
    const values = Object.fromEntries(
      cohorts.map((cohort) => {
        const record = records[cohort];
        if (!record) throw new Error("Missing original native file facts");
        const current = record.input.files;
        if (!current) throw new Error("Missing actual FileList");
        return [
          cohort,
          {
            files: metadata(current),
            original: metadata(record.files),
            sameList: current === record.list,
            fileIdentity: Array.from(
              current,
              (file, index) => file === record.files[index],
            ),
            connected: record.input.isConnected,
            data: Array.from(new FormData(form(cohort)), ([name, item]) => {
              if (!(item instanceof File)) return [name, item];
              const { lastModified, ...wire } = metadata([item])[0];
              void lastModified;
              return [name, wire];
            }),
            nativeList: current instanceof FileList,
            nativeFiles: Array.from(current).every(
              (file) => file instanceof File,
            ),
            ownerRealm: record.input.ownerDocument.defaultView === window,
          },
        ];
      }),
    );
    probe = JSON.stringify({
      values,
      bound: metadata(files),
      getterMatchesDOM: files === records.raw?.input.files,
      boundSameOriginalList: files === records.raw?.list,
      boundNativeList: files instanceof FileList,
      boundFileIdentity: Array.from(
        files ?? [],
        (file, index) => file === records.raw?.files[index],
      ),
      writes,
      copyAttempts,
      copyConstructors,
      counts,
      events,
      ticks,
    });
  }
  function restoreCapability() {
    if (capability) Object.defineProperty(window, "DataTransfer", capability);
  }
  onMount(() => {
    ready = true;
  });
</script>

<h1>Native FileList lifecycle</h1>
<p data-ready={ready}>Hydrated</p>
<TextField label="Generated Field witness" name="witness" {...witness} />
<button onclick={prepare}>Prepare native reset</button>
<p data-prepared={prepared}>Prepared</p>
<button onclick={observe}>Observe current file facts</button>
{#each cohorts as cohort (cohort)}
  <button
    onclick={() =>
      form(cohort).dispatchEvent(
        new Event("reset", { bubbles: true, cancelable: true }),
      )}>Dispatch reset control {cohort}</button
  >
{/each}
<button onclick={restoreCapability}>Restore native file capability</button>
<button
  onclick={() => {
    mounted = true;
  }}>Remount raw input</button
>
<button
  onclick={() => {
    formerRaw?.dispatchEvent(new Event("change", { bubbles: true }));
  }}>Dispatch old change</button
>
<output id="bound">{JSON.stringify(metadata(files))}</output>
<output id="writes">{writes}</output>
<output id="counts">{JSON.stringify(counts)}</output>
<output id="probe">{probe}</output>
<div onreset={(event) => resetEvent("plain", "bubble", event)}>
  <form
    id="plain-form"
    onresetcapture={(event) => resetEvent("plain", "capture", event)}
    onreset={(event) => resetEvent("plain", "target", event)}
  >
    <label
      >Plain files<input
        id="plain-input"
        name="files"
        type="file"
        multiple
        webkitdirectory={directory ? true : undefined}
        oninput={() => counts.plain.input++}
        onchange={() => counts.plain.change++}
      /></label
    >
    <button type="reset" onclickcapture={() => beforeReset("plain", "native")}
      >Native reset plain</button
    >
    <button type="button" onclick={() => programmatic("plain")}
      >Programmatic reset plain</button
    >
  </form>
</div>
<div onreset={(event) => resetEvent("raw", "bubble", event)}>
  <form
    id="raw-form"
    onresetcapture={(event) => resetEvent("raw", "capture", event)}
    onreset={(event) => resetEvent("raw", "target", event)}
  >
    {#if mounted}
      <label
        >Raw files<input
          id="raw-input"
          name="files"
          type="file"
          multiple
          webkitdirectory={directory ? true : undefined}
          bind:files={
            () => files,
            (value) => {
              writes += 1;
              files = value;
            }
          }
          oninput={() => counts.raw.input++}
          onchange={() => counts.raw.change++}
        /></label
      >
    {/if}
    <button type="reset" onclickcapture={() => beforeReset("raw", "native")}
      >Native reset raw</button
    >
    <button type="button" onclick={() => programmatic("raw")}
      >Programmatic reset raw</button
    >
  </form>
</div>
