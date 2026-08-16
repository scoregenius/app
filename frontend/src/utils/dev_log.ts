// frontend/src/utils/dev_log.ts

/**
 * Development-only logging.
 *
 * `import.meta.env.DEV` is replaced at build time, so in a production bundle
 * these collapse to a no-op and the calls are dropped entirely — including
 * the arguments, which is the part that matters when the argument is a whole
 * schedule array.
 *
 * Use this instead of `console.log` / `console.debug` guarded by hand. The
 * guard then lives in one place rather than at every call site, where it was
 * previously easy to forget: several diagnostics were shipping to production,
 * one of them logging every API URL the app constructed.
 *
 * `console.warn` and `console.error` are deliberately not wrapped. Real
 * problems should surface in production consoles.
 */
export const devLog: (...args: unknown[]) => void = import.meta.env.DEV
  ? // eslint-disable-next-line no-console
    (...args) => console.debug(...args)
  : () => {};
