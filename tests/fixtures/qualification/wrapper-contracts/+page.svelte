<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { page } from "$app/state";
  import { DropdownMenu as NativeMenu } from "bits-ui";
  import * as UI from "__UI_MODULE__";
  import type * as Types from "__UI_MODULE__";
  type Refs = {
    Alert: Types.AlertProps["ref"];
    AlertDialogTrigger: Types.AlertDialogTriggerProps["ref"];
    AlertDialogOverlay: Types.AlertDialogOverlayProps["ref"];
    AlertDialogContent: Types.AlertDialogContentProps["ref"];
    AlertDialogTitle: Types.AlertDialogTitleProps["ref"];
    AlertDialogDescription: Types.AlertDialogDescriptionProps["ref"];
    AlertDialogAction: Types.AlertDialogActionProps["ref"];
    AlertDialogCancel: Types.AlertDialogCancelProps["ref"];
    Anchor: Types.AnchorProps["ref"];
    Avatar: Types.AvatarProps["ref"];
    Badge: Types.BadgeProps["ref"];
    Button: Types.ButtonProps["ref"];
    Card: Types.CardProps["ref"];
    Checkbox: Types.CheckboxProps["ref"];
    CollapsibleRoot: Types.CollapsibleRootProps["ref"];
    CollapsibleTrigger: Types.CollapsibleTriggerProps["ref"];
    CollapsibleContent: Types.CollapsibleContentProps["ref"];
    DialogTrigger: Types.DialogTriggerProps["ref"];
    DialogOverlay: Types.DialogOverlayProps["ref"];
    DialogContent: Types.DialogContentProps["ref"];
    DialogTitle: Types.DialogTitleProps["ref"];
    DialogDescription: Types.DialogDescriptionProps["ref"];
    DialogClose: Types.DialogCloseProps["ref"];
    FieldRoot: Types.FieldRootProps["ref"];
    FieldSurface: Types.FieldSurfaceProps["ref"];
    FieldLabel: Types.FieldLabelProps["ref"];
    FieldMessage: Types.FieldMessageProps["ref"];
    FieldRequired: Types.FieldRequiredProps["ref"];
    TextInput: Types.TextInputProps["ref"];
    TextArea: Types.TextAreaProps["ref"];
    NativeSelect: Types.NativeSelectProps["ref"];
    SelectIcon: Types.SelectIconProps["ref"];
    TextField: Types.TextFieldProps["ref"];
    TextAreaField: Types.TextAreaFieldProps["ref"];
    SelectField: Types.SelectFieldProps["ref"];
    MenuTrigger: Types.MenuTriggerProps["ref"];
    MenuContent: Types.MenuContentProps["ref"];
    MenuItem: Types.MenuItemProps["ref"];
    MenuRadioGroup: Types.MenuRadioGroupProps["ref"];
    MenuRadioItem: Types.MenuRadioItemProps["ref"];
    MenuItemIndicator: Types.MenuItemIndicatorProps["ref"];
    Progress: Types.ProgressProps["ref"];
    RadioGroup: Types.RadioGroupProps["ref"];
    RadioItem: Types.RadioItemProps["ref"];
    RouterLink: Types.RouterLinkProps["ref"];
    Separator: Types.SeparatorProps["ref"];
    Skeleton: Types.SkeletonProps["ref"];
    Status: Types.StatusProps["ref"];
    Switch: Types.SwitchProps["ref"];
    TabsRoot: Types.TabsRootProps["ref"];
    TabsList: Types.TabsListProps["ref"];
    TabsTrigger: Types.TabsTriggerProps["ref"];
    TabsContent: Types.TabsContentProps["ref"];
  };
  type Values = {
    AlertDialogRoot: Types.AlertDialogRootProps["open"];
    Checkbox: Types.CheckboxProps["checked"];
    CheckboxIndeterminate: Types.CheckboxProps["indeterminate"];
    CollapsibleRoot: Types.CollapsibleRootProps["open"];
    DialogRoot: Types.DialogRootProps["open"];
    TextInput: Types.TextInputProps["value"];
    TextArea: Types.TextAreaProps["value"];
    NativeSelect: Types.NativeSelectProps["value"];
    TextField: Types.TextFieldProps["value"];
    TextAreaField: Types.TextAreaFieldProps["value"];
    SelectField: Types.SelectFieldProps["value"];
    MenuRoot: Types.MenuRootProps["open"];
    MenuRadioGroup: Types.MenuRadioGroupProps["value"];
    RadioGroup: Types.RadioGroupProps["value"];
    Switch: Types.SwitchProps["checked"];
    TabsRoot: Types.TabsRootProps["value"];
  };
  let refs = $state<Refs>({
    Alert: null,
    AlertDialogTrigger: null,
    AlertDialogOverlay: null,
    AlertDialogContent: null,
    AlertDialogTitle: null,
    AlertDialogDescription: null,
    AlertDialogAction: null,
    AlertDialogCancel: null,
    Anchor: null,
    Avatar: null,
    Badge: null,
    Button: null,
    Card: null,
    Checkbox: null,
    CollapsibleRoot: null,
    CollapsibleTrigger: null,
    CollapsibleContent: null,
    DialogTrigger: null,
    DialogOverlay: null,
    DialogContent: null,
    DialogTitle: null,
    DialogDescription: null,
    DialogClose: null,
    FieldRoot: null,
    FieldSurface: null,
    FieldLabel: null,
    FieldMessage: null,
    FieldRequired: null,
    TextInput: null,
    TextArea: null,
    NativeSelect: null,
    SelectIcon: null,
    TextField: null,
    TextAreaField: null,
    SelectField: null,
    MenuTrigger: null,
    MenuContent: null,
    MenuItem: null,
    MenuRadioGroup: null,
    MenuRadioItem: null,
    MenuItemIndicator: null,
    Progress: null,
    RadioGroup: null,
    RadioItem: null,
    RouterLink: null,
    Separator: null,
    Skeleton: null,
    Status: null,
    Switch: null,
    TabsRoot: null,
    TabsList: null,
    TabsTrigger: null,
    TabsContent: null,
  });
  let values = $state<Values>({
    AlertDialogRoot: false,
    Checkbox: false,
    CheckboxIndeterminate: false,
    CollapsibleRoot: false,
    DialogRoot: false,
    TextInput: "input",
    TextArea: "area",
    NativeSelect: "a",
    TextField: "input",
    TextAreaField: "area",
    SelectField: "a",
    MenuRoot: false,
    MenuRadioGroup: "a",
    RadioGroup: "a",
    Switch: false,
    TabsRoot: "a",
  });
  let observed = $state<Record<string, string>>({});
  let setters = $state<Record<string, number>>({});
  let ready = $state(false);
  let mounted = $state(true);
  let cancel = $state(false);
  let clicks = $state(0);
  let selections = $state(0);
  let nativeOpen = $state(false);
  const functions = page.url.searchParams.get("bindings") === "functions";
  function count(key: string) {
    untrack(() => {
      setters[key] = (setters[key] ?? 0) + 1;
    });
  }
  $effect(() => {
    const current = Object.entries(refs).map(
      ([key, node]) => [key, node?.tagName] as const,
    );
    untrack(() => {
      for (const [key, tag] of current) if (tag) observed[key] = tag;
    });
  });
  onMount(() => {
    ready = true;
  });
</script>

<main data-ready={ready} data-bindings={functions ? "functions" : "ordinary"}>
  <h1>Full catalog shared wrapper qualification</h1>
  <button
    id="toggle-mounted"
    onclick={() => {
      mounted = !mounted;
    }}>Toggle mounted</button
  >
  <button
    id="toggle-cancel"
    onclick={() => {
      cancel = !cancel;
    }}>Toggle cancellation</button
  >
  <button
    id="parent-values"
    onclick={() => {
      values.Switch = true;
      values.Checkbox = true;
      values.CheckboxIndeterminate = true;
      values.RadioGroup = "b";
      values.TabsRoot = "b";
      values.CollapsibleRoot = true;
      values.TextInput = "parent-input";
      values.TextArea = "parent-area";
      values.NativeSelect = "b";
      values.TextField = "parent-input";
      values.TextAreaField = "parent-area";
      values.SelectField = "b";
      values.MenuRadioGroup = "b";
    }}>Parent values</button
  >
  <output id="values">{JSON.stringify(values)}</output><output id="refs"
    >{JSON.stringify(
      Object.fromEntries(
        Object.entries(refs).map(([key, node]) => [key, node?.tagName ?? null]),
      ),
    )}</output
  ><output id="observed">{JSON.stringify(observed)}</output><output id="setters"
    >{JSON.stringify(setters)}</output
  ><output id="events">{JSON.stringify({ cancel, clicks, selections })}</output>
  <NativeMenu.Root bind:open={nativeOpen}
    ><NativeMenu.Trigger>Native shared Menu</NativeMenu.Trigger
    ><NativeMenu.Portal disabled
      ><NativeMenu.Content
        aria-label="Native shared menu"
        side="bottom"
        align="start"
        sideOffset={4}
        collisionPadding={8}
        preventScroll={false}
        >{#snippet child({ props, wrapperProps })}<div
            {...wrapperProps}
            data-native-floating-wrapper
          >
            <div {...props} data-native-delegated-content>
              <NativeMenu.Item>Native choice</NativeMenu.Item>
            </div>
          </div>{/snippet}</NativeMenu.Content
      ></NativeMenu.Portal
    ></NativeMenu.Root
  >
  {#if mounted}
    {#if functions}
      <UI.Alert
        bind:ref={
          () => refs.Alert,
          (next) => {
            refs.Alert = next;
            count("Alert.ref");
          }
        }
        data-ref="Alert">Alert body</UI.Alert
      >
      <UI.Anchor
        bind:ref={
          () => refs.Anchor,
          (next) => {
            refs.Anchor = next;
            count("Anchor.ref");
          }
        }
        data-ref="Anchor"
        href="#ordinary-target">Anchor child</UI.Anchor
      >
      <UI.Avatar
        bind:ref={
          () => refs.Avatar,
          (next) => {
            refs.Avatar = next;
            count("Avatar.ref");
          }
        }
        data-ref="Avatar"
        src="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27/%3E"
        alt="Avatar">{#snippet fallback()}A{/snippet}</UI.Avatar
      >
      <UI.Badge
        bind:ref={
          () => refs.Badge,
          (next) => {
            refs.Badge = next;
            count("Badge.ref");
          }
        }
        data-ref="Badge">Badge child</UI.Badge
      >
      <UI.Button
        bind:ref={
          () => refs.Button,
          (next) => {
            refs.Button = next;
            count("Button.ref");
          }
        }
        data-ref="Button">Button child</UI.Button
      >
      <UI.Card
        bind:ref={
          () => refs.Card,
          (next) => {
            refs.Card = next;
            count("Card.ref");
          }
        }
        data-ref="Card">Card child</UI.Card
      >
      <UI.Switch
        bind:ref={
          () => refs.Switch,
          (next) => {
            refs.Switch = next;
            count("Switch.ref");
          }
        }
        bind:checked={
          () => values.Switch,
          (next) => {
            values.Switch = next;
            count("Switch.checked");
          }
        }
        data-ref="Switch"
        aria-label="Shared Switch"
        onclick={(event) => {
          clicks++;
          if (cancel) event.preventDefault();
        }}
      ></UI.Switch>
      <UI.Checkbox
        bind:ref={
          () => refs.Checkbox,
          (next) => {
            refs.Checkbox = next;
            count("Checkbox.ref");
          }
        }
        bind:checked={
          () => values.Checkbox,
          (next) => {
            values.Checkbox = next;
            count("Checkbox.checked");
          }
        }
        bind:indeterminate={
          () => values.CheckboxIndeterminate,
          (next) => {
            values.CheckboxIndeterminate = next;
            count("Checkbox.indeterminate");
          }
        }
        data-ref="Checkbox"
        aria-label="Shared Checkbox"
      ></UI.Checkbox>
      <UI.Progress
        bind:ref={
          () => refs.Progress,
          (next) => {
            refs.Progress = next;
            count("Progress.ref");
          }
        }
        data-ref="Progress"
        value={25}
        aria-label="Shared Progress"
      ></UI.Progress>
      <UI.RouterLink
        bind:ref={
          () => refs.RouterLink,
          (next) => {
            refs.RouterLink = next;
            count("RouterLink.ref");
          }
        }
        data-ref="RouterLink"
        href="#ordinary-target">Recipe child</UI.RouterLink
      >
      <UI.Separator
        bind:ref={
          () => refs.Separator,
          (next) => {
            refs.Separator = next;
            count("Separator.ref");
          }
        }
        data-ref="Separator"
      ></UI.Separator>
      <UI.Skeleton
        bind:ref={
          () => refs.Skeleton,
          (next) => {
            refs.Skeleton = next;
            count("Skeleton.ref");
          }
        }
        data-ref="Skeleton"
      ></UI.Skeleton>
      <UI.Spinner data-ref="Spinner" mode="decorative"></UI.Spinner>
      <UI.Status
        bind:ref={
          () => refs.Status,
          (next) => {
            refs.Status = next;
            count("Status.ref");
          }
        }
        data-ref="Status">Status child</UI.Status
      >
      <UI.FieldRoot
        bind:ref={
          () => refs.FieldRoot,
          (next) => {
            refs.FieldRoot = next;
            count("FieldRoot.ref");
          }
        }
        data-ref="FieldRoot"
        required
        ><UI.FieldSurface
          bind:ref={
            () => refs.FieldSurface,
            (next) => {
              refs.FieldSurface = next;
              count("FieldSurface.ref");
            }
          }
          data-ref="FieldSurface"
          ><UI.FieldLabel
            bind:ref={
              () => refs.FieldLabel,
              (next) => {
                refs.FieldLabel = next;
                count("FieldLabel.ref");
              }
            }
            data-ref="FieldLabel">Manual field</UI.FieldLabel
          ><UI.FieldRequired
            bind:ref={
              () => refs.FieldRequired,
              (next) => {
                refs.FieldRequired = next;
                count("FieldRequired.ref");
              }
            }
            data-ref="FieldRequired"
          ></UI.FieldRequired><UI.TextInput
            bind:ref={
              () => refs.TextInput,
              (next) => {
                refs.TextInput = next;
                count("TextInput.ref");
              }
            }
            bind:value={
              () => values.TextInput,
              (next) => {
                values.TextInput = next;
                count("TextInput.value");
              }
            }
            data-ref="TextInput"
            aria-label="Shared TextInput"
          ></UI.TextInput></UI.FieldSurface
        ><UI.FieldMessage
          bind:ref={
            () => refs.FieldMessage,
            (next) => {
              refs.FieldMessage = next;
              count("FieldMessage.ref");
            }
          }
          data-ref="FieldMessage"
          id="manual-hint">Message child</UI.FieldMessage
        ></UI.FieldRoot
      ><UI.TextArea
        bind:ref={
          () => refs.TextArea,
          (next) => {
            refs.TextArea = next;
            count("TextArea.ref");
          }
        }
        bind:value={
          () => values.TextArea,
          (next) => {
            values.TextArea = next;
            count("TextArea.value");
          }
        }
        data-ref="TextArea"
        aria-label="Shared TextArea"
      ></UI.TextArea><UI.NativeSelect
        bind:ref={
          () => refs.NativeSelect,
          (next) => {
            refs.NativeSelect = next;
            count("NativeSelect.ref");
          }
        }
        bind:value={
          () => values.NativeSelect,
          (next) => {
            values.NativeSelect = next;
            count("NativeSelect.value");
          }
        }
        data-ref="NativeSelect"
        aria-label="Shared NativeSelect"
        ><option value="a">A</option><option value="b">B</option
        ></UI.NativeSelect
      ><UI.SelectIcon
        bind:ref={
          () => refs.SelectIcon,
          (next) => {
            refs.SelectIcon = next;
            count("SelectIcon.ref");
          }
        }
        data-ref="SelectIcon">Icon child</UI.SelectIcon
      ><UI.TextField
        bind:ref={
          () => refs.TextField,
          (next) => {
            refs.TextField = next;
            count("TextField.ref");
          }
        }
        bind:value={
          () => values.TextField,
          (next) => {
            values.TextField = next;
            count("TextField.value");
          }
        }
        data-ref="TextField"
        label="Shared TextField"
        name="text-field"
      ></UI.TextField><UI.TextAreaField
        bind:ref={
          () => refs.TextAreaField,
          (next) => {
            refs.TextAreaField = next;
            count("TextAreaField.ref");
          }
        }
        bind:value={
          () => values.TextAreaField,
          (next) => {
            values.TextAreaField = next;
            count("TextAreaField.value");
          }
        }
        data-ref="TextAreaField"
        label="Shared TextAreaField"
        name="text-area-field"
      ></UI.TextAreaField><UI.SelectField
        bind:ref={
          () => refs.SelectField,
          (next) => {
            refs.SelectField = next;
            count("SelectField.ref");
          }
        }
        bind:value={
          () => values.SelectField,
          (next) => {
            values.SelectField = next;
            count("SelectField.value");
          }
        }
        data-ref="SelectField"
        label="Shared SelectField"
        name="select-field"
        selectedLabel={values.SelectField ?? ""}
        ><option value="a">A</option><option value="b">B</option
        ></UI.SelectField
      >
      <UI.RadioGroup
        bind:ref={
          () => refs.RadioGroup,
          (next) => {
            refs.RadioGroup = next;
            count("RadioGroup.ref");
          }
        }
        bind:value={
          () => values.RadioGroup,
          (next) => {
            values.RadioGroup = next;
            count("RadioGroup.value");
          }
        }
        data-ref="RadioGroup"
        aria-label="Shared Radio"
        ><UI.RadioItem
          bind:ref={
            () => refs.RadioItem,
            (next) => {
              refs.RadioItem = next;
              count("RadioItem.ref");
            }
          }
          data-ref="RadioItem"
          value="a"
          aria-label="Radio A"
        ></UI.RadioItem><UI.RadioItem
          data-ref="RadioItem"
          value="b"
          aria-label="Radio B"
        ></UI.RadioItem></UI.RadioGroup
      >
      <UI.TabsRoot
        bind:ref={
          () => refs.TabsRoot,
          (next) => {
            refs.TabsRoot = next;
            count("TabsRoot.ref");
          }
        }
        bind:value={
          () => values.TabsRoot,
          (next) => {
            values.TabsRoot = next;
            count("TabsRoot.value");
          }
        }
        data-ref="TabsRoot"
        ><UI.TabsList
          bind:ref={
            () => refs.TabsList,
            (next) => {
              refs.TabsList = next;
              count("TabsList.ref");
            }
          }
          data-ref="TabsList"
          aria-label="Shared Tabs"
          ><UI.TabsTrigger
            bind:ref={
              () => refs.TabsTrigger,
              (next) => {
                refs.TabsTrigger = next;
                count("TabsTrigger.ref");
              }
            }
            data-ref="TabsTrigger"
            value="a">Tab A</UI.TabsTrigger
          ><UI.TabsTrigger data-ref="TabsTrigger" value="b"
            >Tab B</UI.TabsTrigger
          ></UI.TabsList
        ><UI.TabsContent
          bind:ref={
            () => refs.TabsContent,
            (next) => {
              refs.TabsContent = next;
              count("TabsContent.ref");
            }
          }
          data-ref="TabsContent"
          value="a">Panel A child</UI.TabsContent
        ><UI.TabsContent data-ref="TabsContent" value="b"
          >Panel B child</UI.TabsContent
        ></UI.TabsRoot
      >
      <UI.CollapsibleRoot
        bind:ref={
          () => refs.CollapsibleRoot,
          (next) => {
            refs.CollapsibleRoot = next;
            count("CollapsibleRoot.ref");
          }
        }
        bind:open={
          () => values.CollapsibleRoot,
          (next) => {
            values.CollapsibleRoot = next;
            count("CollapsibleRoot.open");
          }
        }
        data-ref="CollapsibleRoot"
        ><UI.CollapsibleTrigger
          bind:ref={
            () => refs.CollapsibleTrigger,
            (next) => {
              refs.CollapsibleTrigger = next;
              count("CollapsibleTrigger.ref");
            }
          }
          data-ref="CollapsibleTrigger"
          >Shared Collapsible</UI.CollapsibleTrigger
        ><UI.CollapsibleContent
          bind:ref={
            () => refs.CollapsibleContent,
            (next) => {
              refs.CollapsibleContent = next;
              count("CollapsibleContent.ref");
            }
          }
          data-ref="CollapsibleContent">Collapsible child</UI.CollapsibleContent
        ></UI.CollapsibleRoot
      >
      <UI.DialogRoot
        bind:open={
          () => values.DialogRoot,
          (next) => {
            values.DialogRoot = next;
            count("DialogRoot.open");
          }
        }
        ><UI.DialogTrigger
          bind:ref={
            () => refs.DialogTrigger,
            (next) => {
              refs.DialogTrigger = next;
              count("DialogTrigger.ref");
            }
          }
          data-ref="DialogTrigger">Shared Dialog</UI.DialogTrigger
        ><UI.DialogPortal disabled
          ><UI.DialogOverlay
            bind:ref={
              () => refs.DialogOverlay,
              (next) => {
                refs.DialogOverlay = next;
                count("DialogOverlay.ref");
              }
            }
            data-ref="DialogOverlay"
          ></UI.DialogOverlay><UI.DialogContent
            bind:ref={
              () => refs.DialogContent,
              (next) => {
                refs.DialogContent = next;
                count("DialogContent.ref");
              }
            }
            data-ref="DialogContent"
            restoreScrollDelay={0}
            ><UI.DialogTitle
              bind:ref={
                () => refs.DialogTitle,
                (next) => {
                  refs.DialogTitle = next;
                  count("DialogTitle.ref");
                }
              }
              data-ref="DialogTitle">Dialog child title</UI.DialogTitle
            ><UI.DialogDescription
              bind:ref={
                () => refs.DialogDescription,
                (next) => {
                  refs.DialogDescription = next;
                  count("DialogDescription.ref");
                }
              }
              data-ref="DialogDescription"
              >Dialog child description</UI.DialogDescription
            ><UI.DialogClose
              bind:ref={
                () => refs.DialogClose,
                (next) => {
                  refs.DialogClose = next;
                  count("DialogClose.ref");
                }
              }
              data-ref="DialogClose">Close shared Dialog</UI.DialogClose
            ></UI.DialogContent
          ></UI.DialogPortal
        ></UI.DialogRoot
      >
      <UI.AlertDialogRoot
        bind:open={
          () => values.AlertDialogRoot,
          (next) => {
            values.AlertDialogRoot = next;
            count("AlertDialogRoot.open");
          }
        }
        ><UI.AlertDialogTrigger
          bind:ref={
            () => refs.AlertDialogTrigger,
            (next) => {
              refs.AlertDialogTrigger = next;
              count("AlertDialogTrigger.ref");
            }
          }
          data-ref="AlertDialogTrigger"
          >Shared Alert Dialog</UI.AlertDialogTrigger
        ><UI.AlertDialogPortal disabled
          ><UI.AlertDialogOverlay
            bind:ref={
              () => refs.AlertDialogOverlay,
              (next) => {
                refs.AlertDialogOverlay = next;
                count("AlertDialogOverlay.ref");
              }
            }
            data-ref="AlertDialogOverlay"
          ></UI.AlertDialogOverlay><UI.AlertDialogContent
            bind:ref={
              () => refs.AlertDialogContent,
              (next) => {
                refs.AlertDialogContent = next;
                count("AlertDialogContent.ref");
              }
            }
            data-ref="AlertDialogContent"
            restoreScrollDelay={0}
            ><UI.AlertDialogTitle
              bind:ref={
                () => refs.AlertDialogTitle,
                (next) => {
                  refs.AlertDialogTitle = next;
                  count("AlertDialogTitle.ref");
                }
              }
              data-ref="AlertDialogTitle">Alert child title</UI.AlertDialogTitle
            ><UI.AlertDialogDescription
              bind:ref={
                () => refs.AlertDialogDescription,
                (next) => {
                  refs.AlertDialogDescription = next;
                  count("AlertDialogDescription.ref");
                }
              }
              data-ref="AlertDialogDescription"
              >Alert child description</UI.AlertDialogDescription
            ><UI.AlertDialogAction
              bind:ref={
                () => refs.AlertDialogAction,
                (next) => {
                  refs.AlertDialogAction = next;
                  count("AlertDialogAction.ref");
                }
              }
              data-ref="AlertDialogAction"
              onclick={(event) => {
                clicks++;
                if (cancel) event.preventDefault();
              }}>Shared action</UI.AlertDialogAction
            ><UI.AlertDialogCancel
              bind:ref={
                () => refs.AlertDialogCancel,
                (next) => {
                  refs.AlertDialogCancel = next;
                  count("AlertDialogCancel.ref");
                }
              }
              data-ref="AlertDialogCancel"
              >Cancel shared Alert</UI.AlertDialogCancel
            ></UI.AlertDialogContent
          ></UI.AlertDialogPortal
        ></UI.AlertDialogRoot
      >
      <UI.MenuRoot
        bind:open={
          () => values.MenuRoot,
          (next) => {
            values.MenuRoot = next;
            count("MenuRoot.open");
          }
        }
        ><UI.MenuTrigger
          bind:ref={
            () => refs.MenuTrigger,
            (next) => {
              refs.MenuTrigger = next;
              count("MenuTrigger.ref");
            }
          }
          data-ref="MenuTrigger">Shared Menu</UI.MenuTrigger
        ><UI.MenuPortal disabled
          ><UI.MenuContent
            bind:ref={
              () => refs.MenuContent,
              (next) => {
                refs.MenuContent = next;
                count("MenuContent.ref");
              }
            }
            data-ref="MenuContent"
            aria-label="Shared menu"
            preventScroll={false}
          >
            {#snippet child({ props, wrapperProps, open })}<div
                {...wrapperProps}
                data-floating-wrapper
              >
                <div {...props} data-delegated-content data-open={open}>
                  <UI.MenuItem
                    bind:ref={
                      () => refs.MenuItem,
                      (next) => {
                        refs.MenuItem = next;
                        count("MenuItem.ref");
                      }
                    }
                    data-ref="MenuItem"
                    closeOnSelect={false}
                    onSelect={(event) => {
                      selections++;
                      if (cancel) event.preventDefault();
                    }}>Shared choice</UI.MenuItem
                  >
                  <UI.MenuRadioGroup
                    bind:ref={
                      () => refs.MenuRadioGroup,
                      (next) => {
                        refs.MenuRadioGroup = next;
                        count("MenuRadioGroup.ref");
                      }
                    }
                    bind:value={
                      () => values.MenuRadioGroup,
                      (next) => {
                        values.MenuRadioGroup = next;
                        count("MenuRadioGroup.value");
                      }
                    }
                    data-ref="MenuRadioGroup"
                    ><UI.MenuRadioItem
                      bind:ref={
                        () => refs.MenuRadioItem,
                        (next) => {
                          refs.MenuRadioItem = next;
                          count("MenuRadioItem.ref");
                        }
                      }
                      data-ref="MenuRadioItem"
                      value="a"
                    >
                      {#snippet children({ checked })}<UI.MenuItemIndicator
                          bind:ref={
                            () => refs.MenuItemIndicator,
                            (next) => {
                              refs.MenuItemIndicator = next;
                              count("MenuItemIndicator.ref");
                            }
                          }
                          data-ref="MenuItemIndicator"
                          {checked}>Indicator child</UI.MenuItemIndicator
                        >Radio choice A{/snippet}
                    </UI.MenuRadioItem><UI.MenuRadioItem
                      data-ref="MenuRadioItem"
                      value="b">Radio choice B</UI.MenuRadioItem
                    ></UI.MenuRadioGroup
                  >
                </div>
              </div>{/snippet}</UI.MenuContent
          ></UI.MenuPortal
        ></UI.MenuRoot
      >
    {:else}
      <UI.Alert bind:ref={refs.Alert} data-ref="Alert">Alert body</UI.Alert>
      <UI.Anchor
        bind:ref={refs.Anchor}
        data-ref="Anchor"
        href="#ordinary-target">Anchor child</UI.Anchor
      >
      <UI.Avatar
        bind:ref={refs.Avatar}
        data-ref="Avatar"
        src="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27/%3E"
        alt="Avatar">{#snippet fallback()}A{/snippet}</UI.Avatar
      >
      <UI.Badge bind:ref={refs.Badge} data-ref="Badge">Badge child</UI.Badge>
      <UI.Button bind:ref={refs.Button} data-ref="Button"
        >Button child</UI.Button
      >
      <UI.Card bind:ref={refs.Card} data-ref="Card">Card child</UI.Card>
      <UI.Switch
        bind:ref={refs.Switch}
        bind:checked={values.Switch}
        data-ref="Switch"
        aria-label="Shared Switch"
        onclick={(event) => {
          clicks++;
          if (cancel) event.preventDefault();
        }}
      ></UI.Switch>
      <UI.Checkbox
        bind:ref={refs.Checkbox}
        bind:checked={values.Checkbox}
        bind:indeterminate={values.CheckboxIndeterminate}
        data-ref="Checkbox"
        aria-label="Shared Checkbox"
      ></UI.Checkbox>
      <UI.Progress
        bind:ref={refs.Progress}
        data-ref="Progress"
        value={25}
        aria-label="Shared Progress"
      ></UI.Progress>
      <UI.RouterLink
        bind:ref={refs.RouterLink}
        data-ref="RouterLink"
        href="#ordinary-target">Recipe child</UI.RouterLink
      >
      <UI.Separator bind:ref={refs.Separator} data-ref="Separator"
      ></UI.Separator>
      <UI.Skeleton bind:ref={refs.Skeleton} data-ref="Skeleton"></UI.Skeleton>
      <UI.Spinner data-ref="Spinner" mode="decorative"></UI.Spinner>
      <UI.Status bind:ref={refs.Status} data-ref="Status"
        >Status child</UI.Status
      >
      <UI.FieldRoot bind:ref={refs.FieldRoot} data-ref="FieldRoot" required
        ><UI.FieldSurface bind:ref={refs.FieldSurface} data-ref="FieldSurface"
          ><UI.FieldLabel bind:ref={refs.FieldLabel} data-ref="FieldLabel"
            >Manual field</UI.FieldLabel
          ><UI.FieldRequired
            bind:ref={refs.FieldRequired}
            data-ref="FieldRequired"
          ></UI.FieldRequired><UI.TextInput
            bind:ref={refs.TextInput}
            bind:value={values.TextInput}
            data-ref="TextInput"
            aria-label="Shared TextInput"
          ></UI.TextInput></UI.FieldSurface
        ><UI.FieldMessage
          bind:ref={refs.FieldMessage}
          data-ref="FieldMessage"
          id="manual-hint">Message child</UI.FieldMessage
        ></UI.FieldRoot
      ><UI.TextArea
        bind:ref={refs.TextArea}
        bind:value={values.TextArea}
        data-ref="TextArea"
        aria-label="Shared TextArea"
      ></UI.TextArea><UI.NativeSelect
        bind:ref={refs.NativeSelect}
        bind:value={values.NativeSelect}
        data-ref="NativeSelect"
        aria-label="Shared NativeSelect"
        ><option value="a">A</option><option value="b">B</option
        ></UI.NativeSelect
      ><UI.SelectIcon bind:ref={refs.SelectIcon} data-ref="SelectIcon"
        >Icon child</UI.SelectIcon
      ><UI.TextField
        bind:ref={refs.TextField}
        bind:value={values.TextField}
        data-ref="TextField"
        label="Shared TextField"
        name="text-field"
      ></UI.TextField><UI.TextAreaField
        bind:ref={refs.TextAreaField}
        bind:value={values.TextAreaField}
        data-ref="TextAreaField"
        label="Shared TextAreaField"
        name="text-area-field"
      ></UI.TextAreaField><UI.SelectField
        bind:ref={refs.SelectField}
        bind:value={values.SelectField}
        data-ref="SelectField"
        label="Shared SelectField"
        name="select-field"
        selectedLabel={values.SelectField ?? ""}
        ><option value="a">A</option><option value="b">B</option
        ></UI.SelectField
      >
      <UI.RadioGroup
        bind:ref={refs.RadioGroup}
        bind:value={values.RadioGroup}
        data-ref="RadioGroup"
        aria-label="Shared Radio"
        ><UI.RadioItem
          bind:ref={refs.RadioItem}
          data-ref="RadioItem"
          value="a"
          aria-label="Radio A"
        ></UI.RadioItem><UI.RadioItem
          data-ref="RadioItem"
          value="b"
          aria-label="Radio B"
        ></UI.RadioItem></UI.RadioGroup
      >
      <UI.TabsRoot
        bind:ref={refs.TabsRoot}
        bind:value={values.TabsRoot}
        data-ref="TabsRoot"
        ><UI.TabsList
          bind:ref={refs.TabsList}
          data-ref="TabsList"
          aria-label="Shared Tabs"
          ><UI.TabsTrigger
            bind:ref={refs.TabsTrigger}
            data-ref="TabsTrigger"
            value="a">Tab A</UI.TabsTrigger
          ><UI.TabsTrigger data-ref="TabsTrigger" value="b"
            >Tab B</UI.TabsTrigger
          ></UI.TabsList
        ><UI.TabsContent
          bind:ref={refs.TabsContent}
          data-ref="TabsContent"
          value="a">Panel A child</UI.TabsContent
        ><UI.TabsContent data-ref="TabsContent" value="b"
          >Panel B child</UI.TabsContent
        ></UI.TabsRoot
      >
      <UI.CollapsibleRoot
        bind:ref={refs.CollapsibleRoot}
        bind:open={values.CollapsibleRoot}
        data-ref="CollapsibleRoot"
        ><UI.CollapsibleTrigger
          bind:ref={refs.CollapsibleTrigger}
          data-ref="CollapsibleTrigger"
          >Shared Collapsible</UI.CollapsibleTrigger
        ><UI.CollapsibleContent
          bind:ref={refs.CollapsibleContent}
          data-ref="CollapsibleContent">Collapsible child</UI.CollapsibleContent
        ></UI.CollapsibleRoot
      >
      <UI.DialogRoot bind:open={values.DialogRoot}
        ><UI.DialogTrigger
          bind:ref={refs.DialogTrigger}
          data-ref="DialogTrigger">Shared Dialog</UI.DialogTrigger
        ><UI.DialogPortal disabled
          ><UI.DialogOverlay
            bind:ref={refs.DialogOverlay}
            data-ref="DialogOverlay"
          ></UI.DialogOverlay><UI.DialogContent
            bind:ref={refs.DialogContent}
            data-ref="DialogContent"
            restoreScrollDelay={0}
            ><UI.DialogTitle bind:ref={refs.DialogTitle} data-ref="DialogTitle"
              >Dialog child title</UI.DialogTitle
            ><UI.DialogDescription
              bind:ref={refs.DialogDescription}
              data-ref="DialogDescription"
              >Dialog child description</UI.DialogDescription
            ><UI.DialogClose bind:ref={refs.DialogClose} data-ref="DialogClose"
              >Close shared Dialog</UI.DialogClose
            ></UI.DialogContent
          ></UI.DialogPortal
        ></UI.DialogRoot
      >
      <UI.AlertDialogRoot bind:open={values.AlertDialogRoot}
        ><UI.AlertDialogTrigger
          bind:ref={refs.AlertDialogTrigger}
          data-ref="AlertDialogTrigger"
          >Shared Alert Dialog</UI.AlertDialogTrigger
        ><UI.AlertDialogPortal disabled
          ><UI.AlertDialogOverlay
            bind:ref={refs.AlertDialogOverlay}
            data-ref="AlertDialogOverlay"
          ></UI.AlertDialogOverlay><UI.AlertDialogContent
            bind:ref={refs.AlertDialogContent}
            data-ref="AlertDialogContent"
            restoreScrollDelay={0}
            ><UI.AlertDialogTitle
              bind:ref={refs.AlertDialogTitle}
              data-ref="AlertDialogTitle">Alert child title</UI.AlertDialogTitle
            ><UI.AlertDialogDescription
              bind:ref={refs.AlertDialogDescription}
              data-ref="AlertDialogDescription"
              >Alert child description</UI.AlertDialogDescription
            ><UI.AlertDialogAction
              bind:ref={refs.AlertDialogAction}
              data-ref="AlertDialogAction"
              onclick={(event) => {
                clicks++;
                if (cancel) event.preventDefault();
              }}>Shared action</UI.AlertDialogAction
            ><UI.AlertDialogCancel
              bind:ref={refs.AlertDialogCancel}
              data-ref="AlertDialogCancel"
              >Cancel shared Alert</UI.AlertDialogCancel
            ></UI.AlertDialogContent
          ></UI.AlertDialogPortal
        ></UI.AlertDialogRoot
      >
      <UI.MenuRoot bind:open={values.MenuRoot}
        ><UI.MenuTrigger bind:ref={refs.MenuTrigger} data-ref="MenuTrigger"
          >Shared Menu</UI.MenuTrigger
        ><UI.MenuPortal disabled
          ><UI.MenuContent
            bind:ref={refs.MenuContent}
            data-ref="MenuContent"
            aria-label="Shared menu"
            preventScroll={false}
          >
            {#snippet child({ props, wrapperProps, open })}<div
                {...wrapperProps}
                data-floating-wrapper
              >
                <div {...props} data-delegated-content data-open={open}>
                  <UI.MenuItem
                    bind:ref={refs.MenuItem}
                    data-ref="MenuItem"
                    closeOnSelect={false}
                    onSelect={(event) => {
                      selections++;
                      if (cancel) event.preventDefault();
                    }}>Shared choice</UI.MenuItem
                  >
                  <UI.MenuRadioGroup
                    bind:ref={refs.MenuRadioGroup}
                    bind:value={values.MenuRadioGroup}
                    data-ref="MenuRadioGroup"
                    ><UI.MenuRadioItem
                      bind:ref={refs.MenuRadioItem}
                      data-ref="MenuRadioItem"
                      value="a"
                    >
                      {#snippet children({ checked })}<UI.MenuItemIndicator
                          bind:ref={refs.MenuItemIndicator}
                          data-ref="MenuItemIndicator"
                          {checked}>Indicator child</UI.MenuItemIndicator
                        >Radio choice A{/snippet}
                    </UI.MenuRadioItem><UI.MenuRadioItem
                      data-ref="MenuRadioItem"
                      value="b">Radio choice B</UI.MenuRadioItem
                    ></UI.MenuRadioGroup
                  >
                </div>
              </div>{/snippet}</UI.MenuContent
          ></UI.MenuPortal
        ></UI.MenuRoot
      >
    {/if}
  {/if}
</main>
