#!/usr/bin/env node
// Fails fast with an actionable message when a dev port is already taken.
//
// Next's bare "listen EADDRINUSE :::3000" never says who holds the port, which
// makes a leftover dev/production server hard to track down. This preflight
// identifies the holder so the fix is a single copy-pasteable command.
//
// Usage: node scripts/ensure-port.mjs <port> "<what is starting>"

import { execSync } from "node:child_process"
import net from "node:net"

const port = Number(process.argv[2])
const label = process.argv[3] ?? "dev server"

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error(`ensure-port: invalid port "${process.argv[2]}"`)
  process.exit(2)
}

const isFree = (p) =>
  new Promise((resolve) => {
    const probe = net.createServer()
    probe.once("error", () => resolve(false))
    probe.once("listening", () => probe.close(() => resolve(true)))
    probe.listen(p)
  })

const listeningPid = (p) => {
  try {
    if (process.platform === "win32") {
      const rows = execSync("netstat -ano -p TCP", { encoding: "utf8" }).split(/\r?\n/)
      const row = rows.find((l) => new RegExp(`^\\s*TCP\\s+\\S*:${p}\\s+\\S+\\s+LISTENING\\s+(\\d+)\\s*$`, "i").test(l))
      return row ? row.trim().split(/\s+/).pop() : null
    }
    return execSync(`lsof -ti tcp:${p} -sTCP:LISTEN`, { encoding: "utf8" }).trim().split(/\r?\n/)[0] || null
  } catch {
    return null
  }
}

const commandOf = (pid) => {
  try {
    if (process.platform === "win32") {
      return execSync(
        `powershell -NoProfile -Command "(Get-CimInstance Win32_Process -Filter 'ProcessId=${pid}').CommandLine"`,
        { encoding: "utf8" },
      ).trim()
    }
    return execSync(`ps -p ${pid} -o command=`, { encoding: "utf8" }).trim()
  } catch {
    return null
  }
}

if (await isFree(port)) {
  console.log(`port ${port} is free`)
  process.exit(0)
}

const pid = listeningPid(port)
const command = pid ? commandOf(pid) : null
const stopHint = pid
  ? process.platform === "win32"
    ? `Stop-Process -Id ${pid} -Force`
    : `kill ${pid}`
  : process.platform === "win32"
    ? `Get-NetTCPConnection -LocalPort ${port} -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`
    : `lsof -ti tcp:${port} | xargs kill`

console.error(`\nCannot start ${label}: port ${port} is already in use.`)
if (pid) {
  console.error(`  held by PID ${pid}`)
  if (command) console.error(`  running: ${command}`)
}
console.error(`\n  A previous dev or production server is still up. Stop it, then retry:\n`)
console.error(`    ${stopHint}\n`)
process.exit(1)
