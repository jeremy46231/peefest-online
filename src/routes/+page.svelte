<script lang="ts">
  import Grid from '$lib/components/Grid.svelte'
  import EmojiPicker from '$lib/components/EmojiPicker.svelte';

  let { data } = $props()
  if (!data.emojis) throw new Error('emoji list is null');
</script>

<Grid />
<EmojiPicker emojis={data.emojis} />


