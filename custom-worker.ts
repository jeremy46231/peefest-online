// import & re-export from source file:
export { GridStorage } from './src/lib/durable/grid-storage.ts'

// @ts-ignore - .svelte-kit/cloudflare/_worker.js is generated at build time
import handler from './.svelte-kit/cloudflare/_worker.js'
// re-use the generated fetch handler so SvelteKit still serves everything
export default {
  fetch: handler.fetch,
}
