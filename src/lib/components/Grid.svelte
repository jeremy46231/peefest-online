<script lang="ts">
  import { PUBLIC_WIDTH, PUBLIC_HEIGHT } from '$env/static/public'
  const WIDTH = PUBLIC_WIDTH ? parseInt(PUBLIC_WIDTH) : 20
  const HEIGHT = PUBLIC_HEIGHT ? parseInt(PUBLIC_HEIGHT) : 20

  const {
    emojis,
    selectedEmoji,
  }: { emojis: Record<string, string>; selectedEmoji: string | null } = $props()

  // Svelte 5 runes API ($state, $effect)
  let grid = $state<string[][]>(
    Array.from({ length: HEIGHT }, () =>
      Array.from({ length: WIDTH }, () => '')
    )
  )
  let status = $state<'connecting' | 'connected' | 'closed' | 'error'>(
    'connecting'
  )
  let lastEvent = $state<string>('')
  let errorMessage = $state<string | null>(null)
  let ws: WebSocket | null = null

  async function fetchInitial() {
    try {
      const res = await fetch('/api/grid')
      if (!res.ok) return
      const data = (await res.json().catch(() => null)) as { grid?: unknown }
      if (Array.isArray(data?.grid)) {
        applySnapshot(data.grid as unknown)
      }
    } catch {
      /* ignore */
    }
  }

  function applySnapshot(snap: unknown) {
    if (!Array.isArray(snap)) return
    if (snap.length !== HEIGHT) return
    const next: string[][] = Array.from({ length: HEIGHT }, (_, y) => {
      const row = snap[y]
      if (!Array.isArray(row) || row.length !== WIDTH) {
        return Array.from({ length: WIDTH }, () => '')
      }
      return row.map((v) => (typeof v === 'string' ? v : ''))
    })
    grid = next
  }

  function connect() {
    status = 'connecting'
    errorMessage = null
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const url = `${proto}//${location.host}/api/grid/ws`
    ws = new WebSocket(url)
    ws.addEventListener('open', () => (status = 'connected'))
    ws.addEventListener('close', () => (status = 'closed'))
    ws.addEventListener('error', () => {
      status = 'error'
      errorMessage = 'WebSocket error'
    })
    ws.addEventListener('message', (ev) => {
      lastEvent = ev.data
      try {
        const msg = JSON.parse(ev.data)
        switch (msg?.type) {
          case 'snapshot':
            applySnapshot(msg.grid)
            break
          case 'cell':
            if (
              typeof msg.x === 'number' &&
              typeof msg.y === 'number' &&
              typeof msg.value === 'string' &&
              msg.x >= 0 &&
              msg.x < WIDTH &&
              msg.y >= 0 &&
              msg.y < HEIGHT
            ) {
              const next = grid.map((r) => r.slice())
              next[msg.y][msg.x] = msg.value
              grid = next
            }
            break
          case 'clear':
            grid = Array.from({ length: HEIGHT }, () =>
              Array.from({ length: WIDTH }, () => '')
            )
            break
        }
      } catch {
        /* ignore */
      }
    })
  }

  $effect(() => {
    fetchInitial()
    connect()
    return () => {
      try {
        ws?.close()
      } catch {
        /* ignore */
      }
    }
  })

  async function setCell(x: number, y: number, value: string | null) {
    try {
      const res = await fetch('/api/grid/cell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ x, y, value: value ?? '' }),
      })
      if (!res.ok) throw new Error('Failed to set cell')
    } catch (error) {
      console.error(error)
    }
  }
</script>

<div>
  <small
    >Status: <span class={status}>{status}</span>{#if errorMessage}
      • {errorMessage}{/if}</small
  >
  <table
    aria-label="Live grid"
    aria-rowcount={HEIGHT}
    aria-colcount={WIDTH}
    aria-live="polite"
  >
    <tbody>
      {#each grid as row, y}
        <tr>
          {#each row as cell, x}
            <td title={`(${x},${y}) ${cell}`}>
              <button
                onclick={() => {
                  if (selectedEmoji === undefined) return // not wired up to selector
                  setCell(x, y, selectedEmoji)
                }}
              >
                {#if cell && emojis[cell]}
                  <img src={emojis[cell]} alt={cell} width="24" height="24" />
                {/if}
              </button>
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  table {
    border-collapse: collapse;
  }
  td {
    width: 24px;
    height: 24px;
    border: 1px solid #ccc;
    padding: 0;
    overflow: hidden;
  }
  button {
    display: block;
    width: 24px;
    height: 24px;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
  }
  img {
    display: block;
    width: 24px;
    height: 24px;
  }
  .connected {
    color: #080;
  }
  .connecting {
    color: #c60;
  }
  .closed {
    color: #666;
  }
  .error {
    color: #c00;
  }
</style>
