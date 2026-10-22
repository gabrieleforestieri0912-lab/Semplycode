import { execFile } from "node:child_process"
import { existsSync } from "node:fs"
import { join } from "node:path"
import { promisify } from "node:util"

const exec = promisify(execFile)

/**
 * Auto commit + push plugin (OpenCode V2 plugin API) - Semplycode only.
 *
 * After every mutating tool call (edit / write / patch / bash / execute ...)
 * the working tree is committed and pushed automatically.
 *
 * Escape hatches:
 *   - create a file named `.opencode-autocommit-off` in the repo root to disable it
 *   - set env var OPENCODE_AUTOCOMMIT=0
 */

const MUTATING_TOOL = /edit|write|patch|apply|create|delete|remove|rename|move|bash|shell|execute|task/i
const DEBOUNCE_MS = 1500

type ExecResult = { ok: boolean; out: string }

async function git(args: string[], cwd: string): Promise<ExecResult> {
  try {
    const { stdout, stderr } = await exec("git", args, {
      cwd,
      encoding: "utf8",
      windowsHide: true, // never flash a console window
      timeout: 120000,
      maxBuffer: 32 * 1024 * 1024,
    })
    return { ok: true, out: `${stdout ?? ""}${stderr ?? ""}` }
  } catch (err: any) {
    return { ok: false, out: `${err?.stdout ?? ""}${err?.stderr ?? ""}` }
  }
}

async function commitAndPush(dir: string) {
  if (process.env.OPENCODE_AUTOCOMMIT === "0") return
  if (!dir) return
  if (existsSync(join(dir, ".opencode-autocommit-off"))) return

  const inside = await git(["rev-parse", "--is-inside-work-tree"], dir)
  if (!inside.ok || inside.out.trim() !== "true") return

  const status = await git(["status", "--porcelain"], dir)
  if (!status.ok || !status.out.trim()) return

  const add = await git(["add", "-A"], dir)
  if (!add.ok) {
    console.error("[autocommit] git add failed:", add.out.trim())
    return
  }

  const staged = await git(["diff", "--cached", "--name-only"], dir)
  if (!staged.ok || !staged.out.trim()) return

  const files = staged.out
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
  if (files.length === 0) return

  const subject = `chore(auto): update ${files.length} file${files.length > 1 ? "s" : ""}`
  const body = files.slice(0, 20).join(", ")

  const commit = await git(["commit", "-m", subject, "-m", body], dir)
  if (!commit.ok) {
    console.error("[autocommit] git commit failed:", commit.out.trim())
    return
  }

  const upstream = await git(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"], dir)
  let push: ExecResult
  if (upstream.ok && upstream.out.trim()) {
    push = await git(["push"], dir)
  } else {
    const branch = await git(["rev-parse", "--abbrev-ref", "HEAD"], dir)
    if (!branch.ok || !branch.out.trim()) {
      console.error("[autocommit] no branch to push")
      return
    }
    push = await git(["push", "-u", "origin", branch.out.trim()], dir)
  }

  if (push.ok) {
    console.log(`[autocommit] committed and pushed ${files.length} file(s): ${body}`)
  } else {
    console.error("[autocommit] git push failed:", push.out.trim())
  }
}

export default {
  id: "autocommit",
  async setup(ctx: any) {
    let timer: ReturnType<typeof setTimeout> | undefined
    let running = false
    let queued = false
    let lastDir = ctx?.location?.directory ?? process.cwd()

    const flush = async () => {
      if (running) {
        queued = true
        return
      }
      running = true
      try {
        await commitAndPush(lastDir)
      } catch (err) {
        console.error("[autocommit] unexpected error:", err)
      } finally {
        running = false
        if (queued) {
          queued = false
          void flush()
        }
      }
    }

    await ctx.tool.hook("execute.after", (event: any) => {
      const tool = String(event?.tool ?? "")
      if (!MUTATING_TOOL.test(tool)) return
      if (event?.status === "error") return

      const dir = event?.directory ?? event?.worktree ?? ctx?.location?.directory ?? lastDir
      if (dir) lastDir = dir

      if (timer) clearTimeout(timer)
      timer = setTimeout(() => void flush(), DEBOUNCE_MS)
    })

    console.log("[autocommit] plugin loaded")
  },
}
