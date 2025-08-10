import { DurableObject } from 'cloudflare:workers'

const WIDTH = 20
const HEIGHT = 20

export class GridStorage extends DurableObject<Env> {
  #initialized = false

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
  }

  /** Ensure the backing SQL table exists (idempotent). */
  #ensureSchema() {
    if (this.#initialized) return
    // Primary key over (x,y) allows efficient upsert.
    this.ctx.storage.sql.exec(
      'CREATE TABLE IF NOT EXISTS grid (x INTEGER NOT NULL, y INTEGER NOT NULL, value TEXT NOT NULL, PRIMARY KEY (x, y))'
    )
    this.#initialized = true
  }

  /** Bounds check helper */
  #assertInBounds(x: number, y: number) {
    if (!Number.isInteger(x) || !Number.isInteger(y)) {
      throw new Error('Coordinates must be integers')
    }
  if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) {
      throw new Error(
        `Coordinate out of bounds: (${x},${y}) not within 0..${WIDTH - 1},0..${
          HEIGHT - 1
        }`
      )
    }
  }

  /** Set the string at a coordinate. */
  async setCell(x: number, y: number, value: string): Promise<void> {
    this.#ensureSchema()
    this.#assertInBounds(x, y)
    if (typeof value !== 'string') throw new Error('Value must be a string')
    // Upsert row
    this.ctx.storage.sql.exec(
      'INSERT INTO grid (x, y, value) VALUES (?1, ?2, ?3) ON CONFLICT(x,y) DO UPDATE SET value=excluded.value',
      x,
      y,
      value
    )
    await this.#broadcast({ type: 'cell', x, y, value })
  }

  /** Fetch the string at a coordinate, or null if unset. */
  async getCell(x: number, y: number): Promise<string | null> {
    this.#ensureSchema()
    this.#assertInBounds(x, y)
    const row = this.ctx.storage.sql
      .exec('SELECT value FROM grid WHERE x=?1 AND y=?2', x, y)
      .one() as { value?: unknown } | undefined
    if (!row || typeof row.value !== 'string') return null
    return row.value
  }

  /** Return the whole grid as a 2D array (height rows, width columns). Unset cells are empty strings. */
  async getGrid(): Promise<string[][]> {
    this.#ensureSchema()
    // Initialize with empty strings to keep shape stable.
    const grid: string[][] = Array.from({ length: HEIGHT }, () =>
      Array.from({ length: WIDTH }, () => '')
    )
    const cursor = this.ctx.storage.sql.exec('SELECT x, y, value FROM grid')
    // .exec() returns a cursor we can iterate with .next() until done.
    while (true) {
      const r = cursor.next() as
        | { done: true; value: undefined }
        | { done: false; value: { x: unknown; y: unknown; value: unknown } }
      if (r.done) break
      const row = r.value
      if (
        typeof row.x === 'number' &&
        typeof row.y === 'number' &&
        typeof row.value === 'string'
      ) {
  if (row.x >= 0 && row.x < WIDTH && row.y >= 0 && row.y < HEIGHT) {
          grid[row.y][row.x] = row.value
        }
      }
    }
    return grid
  }

  /** Optional helper to clear all stored cells. */
  async clear(): Promise<void> {
    this.#ensureSchema()
    this.ctx.storage.sql.exec('DELETE FROM grid')
    await this.#broadcast({ type: 'clear' })
  }

  /** Fetch handler only for websocket upgrade (push-only updates). */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    if (!url.pathname.endsWith('/ws'))
      return new Response('Not found', { status: 404 })
    const upgrade = request.headers.get('Upgrade')
    if (upgrade !== 'websocket')
      return new Response('Expected websocket', { status: 426 })
    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)
    this.ctx.acceptWebSocket(server) // hibernation-enabled
    try {
      server.serializeAttachment({})
    } catch {
      /* ignore */
    }
    // Send initial snapshot then rely on broadcasts from setCell/clear
    const grid = await this.getGrid()
    server.send(JSON.stringify({ type: 'snapshot', grid }))
    return new Response(null, { status: 101, webSocket: client })
  }

  /** Broadcast a JSON serializable payload to all connected websockets */
  async #broadcast(payload: Record<string, unknown>) {
    let sockets: WebSocket[] = []
    try {
      sockets = this.ctx.getWebSockets()
    } catch {
      return
    }
    const msg = JSON.stringify(payload)
    for (const s of sockets) {
      try {
        s.send(msg)
      } catch {
        /* ignore individual failures */
      }
    }
  }
}
