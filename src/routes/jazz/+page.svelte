<script lang="ts">
  import { AccountCoState } from 'jazz-tools/svelte'
  import { AppAccount } from '$lib/schema'

  // Anonymous / guest account (guestMode can be enabled in +layout if you truly want no auth)
  const account = new AccountCoState(AppAccount)

  const currentAccount = account.current
  if (currentAccount) {
    const grid = currentAccount.root?.grid
    if (grid) {
      console.log(grid, grid.toJSON())
    }
  }

</script>

{#if !account.current}
  <div>Preparing guest session…</div>
{:else if grid}
  <div
    class="grid"
    style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0.5rem;max-width:20rem;"
  >
    {#each grid as cell, i}
      <input
        value={cell.value}
        on:input={(e) => setCell(i, (e.target as HTMLInputElement).value)}
        class="border p-2 rounded text-sm"
        placeholder={`Cell ${i + 1}`}
      />
    {/each}
  </div>
{:else}
  <div>Setting up grid…</div>
{/if}
