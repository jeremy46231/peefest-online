import client from '$lib/server/slack'

/**
 * Resolves emoji aliases to their actual image URLs.
 * Slack returns aliases in the format "alias:<emoji-name>".
 * This function recursively resolves these aliases to actual URLs.
 */
function resolveEmojiAliases(
  emojis: Record<string, string>
): Record<string, string> {
  const resolved: Record<string, string> = {}
  const visited = new Set<string>()

  function resolve(name: string): string | null {
    // Prevent infinite loops
    if (visited.has(name)) {
      return null
    }
    visited.add(name)

    const value = emojis[name]
    if (!value) {
      return null
    }

    // If it's an alias, resolve it
    if (value.startsWith('alias:')) {
      const aliasTarget = value.substring(6) // Remove "alias:" prefix
      return resolve(aliasTarget)
    }

    // It's a URL, return it
    return value
  }

  // Resolve all emojis
  for (const [name, value] of Object.entries(emojis)) {
    visited.clear() // Reset visited set for each emoji
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
