export function hasBytePrefix(actual: Uint8Array, expected: readonly number[]) {
  return expected.every((byte, index) => actual[index] === byte)
}
