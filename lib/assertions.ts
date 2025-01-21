export function assert(condition: any, message: string): asserts condition {
  if (!condition) {
    console.error('Assertion failed:', message);
    throw new Error(message);
  }
}
