import client from '$lib/server/slack'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
  const emojis = await client.emoji.list()
  return new Response(JSON.stringify(emojis), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
