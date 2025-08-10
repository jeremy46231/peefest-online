<script lang="ts">
	let { children } = $props();
</script>

<svelte:head>
	<title>My SvelteKit App</title>
</svelte:head>

{@render children?.()}
