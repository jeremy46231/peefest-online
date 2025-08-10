import client from "$lib/server/slack";

export async function load() {
  const response = (await client.emoji.list());
  // Defensive: check for errors and structure
  const emojis = response && response.ok ? response.emoji : {};
  return { emojis };
}
