const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

export function nanoid(size = 10): string {
  const bytes = new Uint8Array(size)
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < size; i++) {
      bytes[i] = Math.floor(Math.random() * 256)
    }
  }
  let id = ""
  for (let i = 0; i < size; i++) {
    id += alphabet[bytes[i]! % alphabet.length]
  }
  return id
}