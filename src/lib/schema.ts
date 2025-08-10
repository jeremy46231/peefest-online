// src/lib/schema.ts
import { co } from 'jazz-tools'
import { z } from 'zod'

export const Cell = co.map({
  value: z.string(),
})

export const AppRoot = co.map({
  // a list of cells; index can be cell position or you can use object keys with map/list
  grid: co.list(Cell),
})

export const AppAccount = co.account({
  root: AppRoot,
  profile: co.profile(),
})
