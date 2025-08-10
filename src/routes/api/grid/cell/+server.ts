import type { GridStorage } from '$lib/durable/grid-storage'
import type { RequestHandler } from '@sveltejs/kit'

export const POST: RequestHandler = async ({ request, platform }) => {
  if (!platform) throw new Error('Platform not available')
  const bodyRaw = await request.json()
  const body = bodyRaw as { x?: unknown; y?: unknown; value?: unknown }
  if (
    typeof body.x !== 'number' ||
    typeof body.y !== 'number' ||
    typeof body.value !== 'string'
  ) {
    return new Response(
      JSON.stringify({ error: 'Expected {x:number, y:number, value:string}' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
  const ns = platform.env
    .GRID_STORAGE as unknown as DurableObjectNamespace<GridStorage>
  const id = ns.idFromName('global')
  const stub = ns.get(id)
  await stub.setCell(body.x, body.y, body.value)
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
