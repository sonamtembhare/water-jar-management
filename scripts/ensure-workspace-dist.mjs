#!/usr/bin/env node
// Builds the workspace packages the deployed API imports at runtime.
//
// apps/api is deployed with a legacy `builds` entry in its vercel.json, which
// turns off the Turborepo build step, so nothing ever compiled
// packages/db/dist or packages/types/dist on the build machine. Those packages
// advertise `dist/index.js` as `main` and `dist/index.d.ts` as `types`, so the
// function could neither type-check nor resolve them at runtime.
//
// This runs as the root `postinstall`, which npm executes even when the install
// was started from inside apps/api. dist is also committed as a fallback: if the
// build cannot run here (a filtered install without dev deps, for example), the
// checked-in output keeps the deployment working instead of failing the install.
//
// Vercel installs Turborepo repos with a workspace filter
// (`npm install --workspace=web --include-workspace-root`), so packages that are
// not dependencies of the package being deployed never get their dependencies
// installed. Compiling those packages here would only print a page of
// "Cannot find module" errors, so each one is checked up front and left on its
// committed dist instead.

import { spawnSync } from "node:child_process"
import { createRequire } from "node:module"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")

// Types first: @repo/db only needs @repo/typescript-config today, but the
// declaration order keeps this correct if it starts depending on @repo/types.
const packages = ["packages/types", "packages/db"]

// typescript is a dev dependency of the repo root and of apps/api, either of
// which is enough to compile these two packages.
const typescriptRoots = [repoRoot, join(repoRoot, "apps/api")]

const readManifest = (dir) => JSON.parse(readFileSync(join(dir, "package.json"), "utf8"))

const resolveTsc = () => {
  for (const root of typescriptRoots) {
    try {
      return createRequire(join(root, "package.json")).resolve("typescript/bin/tsc")
    } catch {
      continue
    }
  }
  return null
}

// Workspace siblings are symlinked rather than installed, so they always
// resolve. They must not be reported as missing dependencies.
const workspaceNames = (() => {
  const names = new Set()
  for (const pattern of readManifest(repoRoot).workspaces ?? []) {
    const parent = pattern.replace(/\/\*$/, "")
    if (parent === pattern || !existsSync(join(repoRoot, parent))) continue
    for (const entry of readdirSync(join(repoRoot, parent), { withFileTypes: true })) {
      if (entry.isDirectory() && existsSync(join(repoRoot, parent, entry.name, "package.json"))) {
        names.add(readManifest(join(repoRoot, parent, entry.name)).name)
      }
    }
  }
  return names
})()

const isResolvable = (require, name) => {
  for (const specifier of [`${name}/package.json`, name]) {
    try {
      require.resolve(specifier)
      return true
    } catch {
      continue
    }
  }
  return false
}

const missingDependencies = (pkg) => {
  const manifest = join(repoRoot, pkg)
  const require = createRequire(join(manifest, "package.json"))
  const { dependencies, devDependencies } = readManifest(manifest)
  return Object.keys({ ...dependencies, ...devDependencies }).filter(
    (name) => !workspaceNames.has(name) && !isResolvable(require, name),
  )
}

const hasDist = (pkg) => existsSync(join(repoRoot, pkg, "dist", "index.d.ts"))

const buildPackage = (tsc, pkg) =>
  spawnSync(process.execPath, [tsc, "-p", join(repoRoot, pkg)], { stdio: "inherit" })

const tsc = resolveTsc()

if (!tsc) {
  const committed = packages.every(hasDist)
  if (committed) {
    console.warn("[postinstall] typescript not installed - keeping the committed package dist")
    process.exit(0)
  }
  console.error("[postinstall] typescript not installed and packages/*/dist is missing")
  process.exit(1)
}

const buildable = []
const uninstallable = []

for (const pkg of packages) {
  const missing = missingDependencies(pkg)
  if (missing.length === 0) {
    buildable.push(pkg)
  } else if (hasDist(pkg)) {
    uninstallable.push(`${pkg} (${missing.join(", ")} not installed)`)
  } else {
    console.error(
      `[postinstall] ${pkg} needs ${missing.join(", ")}, which this install did not provide, and dist is missing`,
    )
    process.exit(1)
  }
}

const failed = buildable.filter((pkg) => buildPackage(tsc, pkg).status !== 0)

for (const pkg of uninstallable) {
  console.warn(`[postinstall] skipping ${pkg} - keeping the committed package dist`)
}

const built = buildable.filter((pkg) => !failed.includes(pkg))

if (built.length > 0) {
  console.log("[postinstall] built " + built.join(", "))
}

if (failed.length === 0) {
  process.exit(0)
}

// A failed build still leaves a usable deployment as long as dist is committed,
// so only hard-fail when there is nothing to fall back to.
if (packages.every(hasDist)) {
  console.warn(
    `[postinstall] build failed for ${failed.join(", ")} - keeping the committed package dist`,
  )
  process.exit(0)
}

console.error(`[postinstall] build failed for ${failed.join(", ")} and no dist fallback exists`)
process.exit(1)
