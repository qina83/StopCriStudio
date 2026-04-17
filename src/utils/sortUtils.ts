export function sortStringsCaseInsensitiveStable(values: string[]): string[] {
  return values
    .map((value, index) => ({ value, index, folded: value.toLowerCase() }))
    .sort((a, b) => {
      if (a.folded < b.folded) return -1
      if (a.folded > b.folded) return 1
      return a.index - b.index
    })
    .map((entry) => entry.value)
}
