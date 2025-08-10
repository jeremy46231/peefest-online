<script lang="ts">
  import Grid from '$lib/components/Grid.svelte'
  import EmojiPicker from '$lib/components/EmojiPicker.svelte'

  let { data } = $props()
  const emojis = data.emojis
  if (!emojis) throw new Error('emoji list is null')

  let selectedEmoji = $state<string | null>(null)
</script>

<div id="peefest-container">
  <Grid {emojis} {selectedEmoji} />
  <div id="emojipicker-container">
    <EmojiPicker {emojis} bind:selectedEmoji />
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap');

  :global(body) {
    font-family: 'Lato', sans-serif;
  }

  @media screen and (min-width: 840px) {
    #peefest-container {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    #emojipicker-container {
      flex-shrink: 0;
    }
  }
</style>
