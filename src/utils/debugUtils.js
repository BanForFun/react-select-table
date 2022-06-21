export function debugSymbols(symbols) {
  for (const name in symbols)
    symbols[name] = '_' + name
}
