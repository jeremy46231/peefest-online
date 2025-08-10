import type { GridStorage } from '$lib/durable/grid-storage'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url, platform }) => {
  if (!platform) {
    throw new Error('Platform not available')
  }
  const GRID_STORAGE = platform.env
    .GRID_STORAGE as unknown as DurableObjectNamespace<GridStorage>
  const id = GRID_STORAGE.idFromName('global')
  const stub = GRID_STORAGE.get(id)

  const grid = await stub.getGrid()

  return new Response(JSON.stringify({ grid }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
