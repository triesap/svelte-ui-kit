<script lang="ts">
  import {
    Anchor,
    RouterLink,
    Avatar,
    Badge,
    Button,
    Card,
    Alert,
    Status,
    Progress,
    Separator,
    Skeleton,
    Spinner,
  } from "__UI_MODULE__";
  import type { ProgressProps } from "__UI_MODULE__";
  const progress: Pick<ProgressProps, "value"> = { value: 25 };
</script>

<main>
  <h1>Complete installed catalog</h1>
  <Anchor href="https://example.com">Anchor</Anchor><RouterLink
    href="https://example.com/recipe">Recipe</RouterLink
  ><Avatar
    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'/%3E"
    alt="Catalog avatar"
  /><Badge>Badge</Badge><Button>Button</Button><Card><h2>Card</h2></Card><Alert
    >Alert</Alert
  ><Status>Status</Status><Progress
    {...progress}
    aria-label="Catalog progress"
  /><Separator /><Skeleton /><Spinner />
</main>
