export function getStartContext(opts) {
  if (opts?.throwIfNotFound !== false) {
    return undefined;
  }
  return undefined;
}

export async function runWithStartContext(context, fn) {
  return fn();
}
