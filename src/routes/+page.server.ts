import client from '$lib/server/slack'

/**
 * Resolves emoji aliases to their actual image URLs.
 * Slack returns aliases in the format "alias:<emoji-name>".
 * This function iteratively resolves these aliases to actual URLs.
 */
function resolveEmojiAliases(
  emojis: Record<string, string>
): Record<string, string> {
  const resolved: Record<string, string> = {}

  function resolve(name: string): string | null {
    const visited = new Set<string>()
    let current = name

    while (true) {
      // Prevent infinite loops
      if (visited.has(current)) {
        return null
      }
      visited.add(current)

      const value = emojis[current]
      if (!value) {
        return null
      }

      // If it's an alias, continue following the chain
      if (value.startsWith('alias:')) {
        current = value.substring(6) // Remove "alias:" prefix
        continue
      }

      // It's a URL, return it
      return value
    }
  }

  // Resolve all emojis
  for (const [name] of Object.entries(emojis)) {
    const resolvedUrl = resolve(name)
    if (resolvedUrl) {
      resolved[name] = resolvedUrl
    }
  }

  return resolved
}

export async function load() {
  const response = await client.emoji.list()
  // Defensive: check for errors and structure
  const rawEmojis = response && response.ok ? response.emoji : {}

  // Resolve emoji aliases to actual URLs
  const emojis = resolveEmojiAliases(rawEmojis || {})

  return { emojis }
}
