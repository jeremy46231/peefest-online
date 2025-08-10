<script lang="ts">
  import Grid from '$lib/components/Grid.svelte'

  let { data } = $props()
  let filteredEmojis: [string, string][] = $state([])
  let selectedEmoji: [string, string] | null = $state(null)

  // Debounce utility
  function debounce(fn: Function, delay: number) {
    let timer: NodeJS.Timeout
    return function (...args: any) {
      clearTimeout(timer)
      timer = setTimeout(() => fn.apply(fn, args), delay)
    }
  }

  const selectEmoji = debounce((event: InputEvent) => {
    if (!data.emojis) return
    if (selectedEmoji) selectedEmoji = null
    // @ts-ignore
    if (!event.target.value) {
      filteredEmojis = []
      return
    }

    // @ts-ignore
    const inputValue = event.target.value.toLowerCase().replaceAll(' ', '-')
    // Prioritize exact matches over emojis that contain the substring
    filteredEmojis = Object.entries(data.emojis)
      .filter(
        ([name]) =>
          name.toLowerCase() === inputValue ||
          name.toLowerCase().includes(inputValue)
      )
      .sort(([nameA], [nameB]) =>
        nameA.toLowerCase() === inputValue
          ? -1
          : nameB.toLowerCase() === inputValue
            ? 1
            : 0
      )
      .slice(0, 20) // Limit to top 20 results
  }, 200)

  /**
   * @param {Event} event
   */
  function emojiSelected(event: Event) {
    selectedEmoji = [
      // @ts-ignore
      event.target.alt ?? event.target.textContent.trim(),
      // @ts-ignore
      event.target.src ?? event.target.lastChild.src,
    ]
    console.log('Selected emoji :' + selectedEmoji + ':')
  }
</script>

<Grid emojis={data.emojis!} />

<p>choose an emoji!</p>

<label for="emoji-picker">:</label>
<input
  type="text"
  name="emoji-picker"
  id="emoji-picker"
  placeholder="pf"
  oninput={selectEmoji}
/>
<label for="emoji-picker">:</label>

{#if !selectedEmoji}
  <ul>
    {#each filteredEmojis as [name, url]}
      <li>
        <button onclick={emojiSelected}>
          {name}
          <img src={url} alt={name} width="24" height="24" />
        </button>
      </li>
    {/each}
  </ul>
{:else}
  <p>
    Selected emoji <span style="font-family: monospace"
      >:{selectedEmoji[0]}:</span
    >
    <img src={selectedEmoji[1]} alt={selectedEmoji[0]} width="24" height="24" />
  </p>
{/if}

<style>
  @import url('https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap');

  :global(body) {
    font-family: 'Lato', sans-serif;
  }

  li {
    padding: 4px;
  }

  button {
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    font-family: monospace;
  }

  button:hover {
    transition-duration: 75ms;
    background-color: lightgrey;
    padding: 5px;
    font-size: medium;
    border-radius: 5%;
  }

  button,
  button img {
    vertical-align: middle;
  }

  p:has(img),
  p:has(img) img {
    vertical-align: middle;
  }
</style>
