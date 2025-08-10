<script lang="ts">
  import Grid from '$lib/components/Grid.svelte'
  import EmojiPicker from '$lib/components/EmojiPicker.svelte'

  let { data } = $props()
  const emojis = data.emojis
  if (!emojis) throw new Error('emoji list is null')

  const selectedEmoji = $state<string | null>(null);
</script>

<Grid {emojis} {selectedEmoji} />
<EmojiPicker {emojis} {selectedEmoji} />
