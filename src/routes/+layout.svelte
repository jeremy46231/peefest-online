<script lang="ts">
  import { JazzSvelteProvider } from 'jazz-tools/svelte'
  import { AppAccount } from '$lib/schema'

  let { children } = $props()

  const sync = {
    peer: 'wss://cloud.jazz.tools/?key=peefest-online-jazz-api-key-2025-08-10@jer.app',
    when: 'always',
  }
  const guestMode = false
</script>

<JazzSvelteProvider {sync} AccountSchema={AppAccount} {guestMode}>
  {@render children()}
</JazzSvelteProvider>
