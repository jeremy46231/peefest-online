<script lang="ts">
  const WIDTH = 20
  const HEIGHT = 20

  const {
    emojis,
    selectedEmoji,
  }: { emojis: Record<string, string>; selectedEmoji: string | null } = $props()

  let grid = $state<string[][]>(
    Array.from({ length: HEIGHT }, () =>
      Array.from({ length: WIDTH }, () => '')
    )
  )
  let status = $state<
    'connecting' | 'connected' | 'closed' | 'error' | 'reconnecting'
  >('connecting')
  let lastEvent = $state<string>('')
  let errorMessage = $state<string | null>(null)
  let ws: WebSocket | null = null
  let isDrawing = $state(false)
  let activePointer: number | null = null
  let reconnectAttempts = 0
  let reconnectTimer: number | null = null
  let destroyed = false
  const MAX_BACKOFF = 5000 // ms
  const BASE_BACKOFF = 500 // ms

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

  function connect(isRetry = false) {
    if (destroyed) return
    if (
      ws &&
      (ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING)
    ) {
      return
    }
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    status = isRetry ? 'reconnecting' : 'connecting'
    errorMessage = null
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const url = `${proto}//${location.host}/api/grid/ws`
    try {
      ws = new WebSocket(url)
    } catch (e) {
      scheduleReconnect()
      return
    }
    ws.addEventListener('open', () => {
      status = 'connected'
      reconnectAttempts = 0
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
    })
    ws.addEventListener('close', () => {
      if (destroyed) return
      status = 'closed'
      scheduleReconnect()
    })
    ws.addEventListener('error', () => {
      if (destroyed) return
      status = 'error'
      errorMessage = 'WebSocket error'
      scheduleReconnect()
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

  function scheduleReconnect() {
    if (destroyed) return
    reconnectAttempts += 1
    const delay = Math.min(
      MAX_BACKOFF,
      Math.round(BASE_BACKOFF * Math.pow(2, reconnectAttempts - 1))
    )
    if (reconnectTimer) clearTimeout(reconnectTimer)
    reconnectTimer = window.setTimeout(() => connect(true), delay)
  }

  function startDraw(x: number, y: number) {
    if (selectedEmoji === undefined) return
    isDrawing = true
    // Only update if changed to reduce requests
    if (grid[y][x] !== (selectedEmoji ?? '')) {
      setCell(x, y, selectedEmoji)
    }
  }

  function continueDraw(x: number, y: number) {
    if (!isDrawing) return
    if (selectedEmoji === undefined) return
    if (grid[y][x] !== (selectedEmoji ?? '')) {
      setCell(x, y, selectedEmoji)
    }
  }

  $effect(() => {
    function endPointer() {
      isDrawing = false
      activePointer = null
    }
    window.addEventListener('pointerup', endPointer, { passive: true })
    window.addEventListener('pointercancel', endPointer, { passive: true })
    window.addEventListener('blur', endPointer)
    return () => {
      window.removeEventListener('pointerup', endPointer)
      window.removeEventListener('pointercancel', endPointer)
      window.removeEventListener('blur', endPointer)
    }
  })

  $effect(() => {
    fetchInitial()
    connect()
    return () => {
      try {
        ws?.close()
      } catch {
        /* ignore */
      }
      destroyed = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
    }
  })

  async function setCell(x: number, y: number, value: string | null) {
    const val = value ?? ''
    // Optimistic update locally (will be overwritten by broadcast if races)
    if (grid[y][x] !== val) {
      const next = grid.map((r) => r.slice())
      next[y][x] = val
      grid = next
    }
    // Prefer websocket if open
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ type: 'set', x, y, value: val }))
        return
      } catch {
        // fall through to REST
      }
    }
    // Fallback REST call (keep route for backwards compatibility / first paint)
    try {
      const res = await fetch('/api/grid/cell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x, y, value: val }),
      })
      if (!res.ok) throw new Error('Failed to set cell (fallback)')
    } catch (error) {
      console.error(error)
      // Optionally mark error status
      status = 'error'
      errorMessage = 'Failed to send update'
    }
  }
</script>

<div>
  <small>
    Status: <span class={status}>{status}</span>
    {#if errorMessage}
      {' • '} {errorMessage}
    {/if}
  </small>
  <table
    aria-label="Live grid"
    aria-rowcount={HEIGHT}
    aria-colcount={WIDTH}
    aria-live="polite"
    oncontextmenu={(e) => e.preventDefault()}
  >
    <tbody>
      {#each grid as row, y}
        <tr>
          {#each row as cell, x}
            <td title={`(${x},${y}) ${cell}`}>
              <button
                onpointerdown={(e) => {
                  e.preventDefault()
                  if (activePointer !== null && activePointer !== e.pointerId)
                    return
                  activePointer = e.pointerId
                  startDraw(x, y)
                }}
                onpointerenter={(e) => {
                  // Only draw while primary pointer active
                  if (activePointer !== null && e.pointerId === activePointer) {
                    continueDraw(x, y)
                  }
                }}
                onclick={(e) => {
                  // Prevent accidental double triggering, treat tap as single cell
                  e.preventDefault()
                  if (!isDrawing) startDraw(x, y)
                  isDrawing = false
                  activePointer = null
                }}
                ondragstart={(e) => e.preventDefault()}
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
    touch-action: none; /* prevent panning / zoom while drawing */
    -webkit-user-select: none;
    user-select: none;
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
  .reconnecting {
    color: #c60;
    font-style: italic;
  }
  .closed {
    color: #666;
  }
  .error {
    color: #c00;
  }
</style>
