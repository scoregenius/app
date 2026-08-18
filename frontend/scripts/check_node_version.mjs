/**
 * Preflight for `npm run test:utils`.
 *
 * The utility tests import their subjects straight from `.ts` sources rather
 * than from a build, so they rely on Node running type stripping without a
 * flag. That became the default in Node 22.18. On anything older the runner
 * fails with `ERR_UNKNOWN_FILE_EXTENSION`, or — older still — reports the glob
 * itself as a missing file, and both read as a broken suite rather than as a
 * wrong interpreter.
 */

const MINIMUM = [22, 18]
const [major = 0, minor = 0] = process.versions.node.split('.').map(Number)

if (major < MINIMUM[0] || (major === MINIMUM[0] && minor < MINIMUM[1])) {
  process.stderr.write(
    `\n  The frontend utility tests need Node >= ${MINIMUM.join('.')}; this is Node ${process.versions.node}.\n` +
      `  They import .ts modules directly and depend on unflagged type stripping.\n\n` +
      `  Run \`nvm use\` from the repository root — .nvmrc pins the supported version.\n\n`
  )
  process.exit(1)
}
