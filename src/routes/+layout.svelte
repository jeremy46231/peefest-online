<script lang="ts">
  let { children } = $props()
</script>

<svelte:head>
  <title>PeeFest Online</title>
</svelte:head>

{@render children?.()}
