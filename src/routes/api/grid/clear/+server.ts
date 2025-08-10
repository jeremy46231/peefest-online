import type { GridStorage } from '$lib/durable/grid-storage'
import type { RequestHandler } from '@sveltejs/kit'

export const POST: RequestHandler = async ({ platform }) => {
  if (!platform) throw new Error('Platform not available')
  const ns = platform.env
    .GRID_STORAGE as unknown as DurableObjectNamespace<GridStorage>
  const id = ns.idFromName('global')
  const stub = ns.get(id)
  await stub.clear()
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
