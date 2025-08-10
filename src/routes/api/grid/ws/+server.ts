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
WebSocket protocol (GridStorage)

Server -> Client messages:
1. Initial snapshot (sent once right after connection):
  { "type": "snapshot", "grid": string[][] }
  - grid: 2D array [height][width] with string values ("" for empty cells)

2. Cell update (broadcast when any cell changes):
  { "type": "cell", "x": number, "y": number, "value": string }
  - x,y: zero-based coordinates within the fixed 20x20 grid
  - value: new string stored at that cell

3. Clear (broadcast when the grid is cleared):
  { "type": "clear" }

4. Error (individual to a client when their request fails validation):
  { "type": "error", "error": string }

Client -> Server messages:
1. Set cell:
  { "type": "set", "x": number, "y": number, "value": string }
  - Performs the same validation as the REST POST /api/grid/cell route, then upserts and broadcasts.

2. Clear grid (optional / future-facing):
  { "type": "clear" }

Notes:
 - Order is best-effort; apply idempotently. Snapshot arrives before any later mutations.
 - No heartbeat messages are sent; clients may implement their own ping if desired.
 - REST routes remain for initial population / fallback; websocket is the primary mutation path once connected.
*/
