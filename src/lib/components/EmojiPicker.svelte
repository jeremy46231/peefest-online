<script lang="ts">
  let {
    emojis,
    selectedEmoji = $bindable(null),
  }: { emojis: Record<string, string>; selectedEmoji?: string | null } =
    $props()

  let filteredEmojis: Array<[string, string]> = $state([])

  // Debounce utility
  function debounce(fn: Function, delay: number) {
    let timer: NodeJS.Timeout
    return function (...args: any) {
      clearTimeout(timer)
      timer = setTimeout(() => fn.apply(fn, args), delay)
    }
  }

  const selectEmoji = debounce((event: InputEvent) => {
    if (selectedEmoji) selectedEmoji = null

    // @ts-ignore
    if (!event.target.value) {
      filteredEmojis = []
      return
    }

    // @ts-ignore
    const inputValue = event.target.value.toLowerCase().replaceAll(' ', '-')
    // Prioritize exact matches over emojis that contain the substring
    filteredEmojis = Object.entries(emojis)
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
</script>

<p>choose an emoji!</p>

<label for="emoji-picker">:</label>
<input
  type="text"
  name="emoji-picker"
  id="emoji-picker"
  placeholder="peefest"
  oninput={selectEmoji}
/>
<label for="emoji-picker">:</label>
<button
  onclick={() => {
    selectedEmoji = null
    ;(document.getElementById('emoji-picker') as HTMLInputElement).value = ''
    filteredEmojis = []
  }}
  title="Clear selected emoji">❌</button
>

{#if !selectedEmoji}
  <ul>
    {#each filteredEmojis as [name, url]}
      <li>
        <button
          onclick={() => {
            selectedEmoji = name
          }}
          class="emoji-button"
        >
          {name}
          <img src={url} alt={name} width="24" height="24" />
        </button>
      </li>
    {/each}
  </ul>
{:else}
  <p>
    Selected emoji <span style="font-family: monospace">:{selectedEmoji}:</span>
    <img
      src={emojis[selectedEmoji]}
      alt={selectedEmoji}
      width="24"
      height="24"
    />
  </p>
{/if}

<style>
  li {
    padding: 4px;
  }

  .emoji-button {
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    font-family: monospace;
  }

  .emoji-button:hover {
    transition-duration: 75ms;
    background-color: lightgrey;
    padding: 5px;
    font-size: medium;
    border-radius: 5%;
  }

  .emoji-button,
  .emoji-button img {
    vertical-align: middle;
  }

  button:not(.emoji-button) {
    background-color: white;
    border: 2px solid lightgray;
    border-radius: 5%;
  }

  button:not(.emoji-button):hover {
    background-color: lightgray;
    transition-duration: 50ms;
  }

  p:has(img),
  p:has(img) img {
    vertical-align: middle;
  }
</style>
