import type { GridStorage } from '$lib/durable/grid-storage'
import type { RequestHandler } from '@sveltejs/kit'

export const GET: RequestHandler = (async (event) => {
  const { request, platform } = event as typeof event & { platform: any }
  if (!platform) throw new Error('Platform not available')
  const upgrade = request.headers.get('Upgrade')
  if (upgrade !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { status: 426 })
  }
  const GRID_STORAGE = platform.env
    .GRID_STORAGE as unknown as DurableObjectNamespace<GridStorage>
  const id = GRID_STORAGE.idFromName('global')
  const stub = GRID_STORAGE.get(id)
  // Force path ending in /ws for DO to detect
  const url = new URL(request.url)
  if (!url.pathname.endsWith('/ws'))
    url.pathname = url.pathname.replace(/\/?$/, '/ws')
  return stub.fetch(new Request(url.toString(), request))
}) satisfies RequestHandler

/*
WebSocket server (GridStorage) push message formats:

1. Initial snapshot (sent once right after connection):
  { "type": "snapshot", "grid": string[][] }
  - grid: 2D array [height][width] with string values ("" for empty cells)

2. Cell update (sent whenever any cell is changed via API):
  { "type": "cell", "x": number, "y": number, "value": string }
  - x,y: zero-based coordinates within the fixed 20x20 grid
  - value: new string stored at that cell

3. Clear (sent when the grid is cleared):
  { "type": "clear" }

Notes:
 - The WebSocket is read-only for clients; any client messages are ignored and responded to with an error.
 - Order is best-effort; if you need strict ordering persist last-seen sequence client-side.
 - No heartbeat messages are currently sent; clients may implement their own ping logic if desired.
*/
