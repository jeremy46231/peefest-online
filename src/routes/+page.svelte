<script lang="ts">
  import Grid from '$lib/components/Grid.svelte'
  import EmojiPicker from '$lib/components/EmojiPicker.svelte'

  let { data } = $props()
  const emojis = data.emojis
  if (!emojis) throw new Error('emoji list is null')

  let selectedEmoji = $state<string | null>(null)
</script>

<div style="display: flex; gap: 1rem; align-items: flex-start;">
  <Grid {emojis} {selectedEmoji} />
  <div style="flex-shrink: 0;">
    <EmojiPicker {emojis} bind:selectedEmoji />
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap');

  :global(body) {
    font-family: 'Lato', sans-serif;
  }
</style>
