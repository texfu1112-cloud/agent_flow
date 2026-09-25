import { access, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDirectory, "..")
const docsRoot = resolve(projectRoot, "docs")
const failures = []

const requiredFiles = ["index.html", "styles.css", "app.js", ".nojekyll"]
const requiredSections = ["start", "roles", "workflow", "commands", "state", "recipes", "maintain"]
const requiredCommands = ["/work", "/checkpoint", "/continue-task", "/connect", "/new"]

function check(condition, message) {
  if (!condition) failures.push(message)
}

async function exists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function hasExactCase(path) {
  const pathFromDocs = relative(docsRoot, path)
  if (!pathFromDocs || pathFromDocs.startsWith("..")) return true

  let current = docsRoot
  for (const segment of pathFromDocs.split(sep)) {
    const entries = await readdir(current)
    if (!entries.includes(segment)) return false
    current = resolve(current, segment)
  }
  return true
}

async function listPublishedFiles(directory = docsRoot, boundary = docsRoot) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const entryPath = resolve(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await listPublishedFiles(entryPath, boundary)))
    else files.push(relative(boundary, entryPath).split(sep).join("/"))
  }
  return files.sort()
}

function unexpectedPublishedFiles(files) {
  const allowlist = new Set(requiredFiles)
  return files.filter((file) => !allowlist.has(file))
}

function parseHexColor(value) {
  const match = value.match(/^#([0-9a-f]{6})$/i)
  if (!match) return null
  return [0, 2, 4].map((offset) => Number.parseInt(match[1].slice(offset, offset + 2), 16) / 255)
}

function relativeLuminance(value) {
  const channels = parseHexColor(value)
  if (!channels) return null
  const linear = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  )
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
}

function contrastRatio(first, second) {
  const firstLuminance = relativeLuminance(first)
  const secondLuminance = relativeLuminance(second)
  if (firstLuminance === null || secondLuminance === null) return 0
  const lighter = Math.max(firstLuminance, secondLuminance)
  const darker = Math.min(firstLuminance, secondLuminance)
  return (lighter + 0.05) / (darker + 0.05)
}

function cssVariable(name, source) {
  return source.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))?.[1] || ""
}

for (const file of requiredFiles) {
  check(await exists(resolve(docsRoot, file)), `missing published file: docs/${file}`)
}

const publishedFiles = await listPublishedFiles()
const missingPublishedFiles = requiredFiles.filter((file) => !publishedFiles.includes(file))
const unexpectedFiles = unexpectedPublishedFiles(publishedFiles)
check(missingPublishedFiles.length === 0, `published allowlist is missing: ${missingPublishedFiles.join(", ")}`)
check(unexpectedFiles.length === 0, `unexpected file inside docs/: ${unexpectedFiles.join(", ")}`)

if (process.argv.includes("--self-test")) {
  const fixture = await mkdtemp(resolve(tmpdir(), "agent-flow-site-"))
  try {
    await mkdir(resolve(fixture, "private"), { recursive: true })
    await writeFile(resolve(fixture, "private", "token.txt"), "credential probe", "utf8")
    const fixtureFiles = await listPublishedFiles(fixture, fixture)
    const fixtureUnexpected = unexpectedPublishedFiles(fixtureFiles)
    check(fixtureFiles.includes("private/token.txt"), "recursive self-test did not discover the nested credential probe")
    check(
      fixtureUnexpected.includes("private/token.txt"),
      "publication allowlist did not reject the discovered nested credential probe",
    )
  } finally {
    await rm(fixture, { recursive: true, force: true })
  }
}

const htmlPath = resolve(docsRoot, "index.html")
const cssPath = resolve(docsRoot, "styles.css")
const scriptPath = resolve(docsRoot, "app.js")

const [html, css, javascript] = await Promise.all([
  readFile(htmlPath, "utf8"),
  readFile(cssPath, "utf8"),
  readFile(scriptPath, "utf8"),
])

check(/<html\s[^>]*lang="zh-CN"/i.test(html), 'index.html must declare lang="zh-CN"')
check(/<meta\s[^>]*name="viewport"/i.test(html), "index.html must include a viewport meta tag")
check(/<a\s[^>]*class="skip-link"[^>]*href="#main"/i.test(html), "a skip link to #main is required")
check(/<main\s+id="main"/i.test(html), "the primary main landmark must use id=main")
check(/<nav\s[^>]*aria-label=/i.test(html), "the primary navigation needs an accessible label")
check(/aria-live="polite"/i.test(html), "copy feedback needs a polite live region")
check(!/<base\s/i.test(html), "a <base> element would break portable document-relative URLs")
check(/<script\s[^>]*src="\.\/app\.js"[^>]*defer/i.test(html), "app.js must load as a deferred relative script")

const baselineRoleLinks = [...html.matchAll(/<a\b[^>]*data-role-tab=/gi)]
const baselineRolePanels = [...html.matchAll(/<article\b[^>]*data-role-panel=[^>]*>/gi)]
check(baselineRoleLinks.length === 5, "all five role selectors must be baseline fragment links")
check(baselineRolePanels.length === 5, "all five role panels must exist in baseline HTML")
check(
  baselineRolePanels.every((match) => !/\shidden(?:\s|=|>)/i.test(match[0])),
  "role content must not be hidden before progressive enhancement",
)

const idMatches = [...html.matchAll(/\bid="([^"]+)"/g)]
const ids = idMatches.map((match) => match[1])
const idSet = new Set(ids)
check(idSet.size === ids.length, `duplicate HTML id found: ${ids.filter((id, index) => ids.indexOf(id) !== index).join(", ")}`)

for (const section of requiredSections) {
  check(idSet.has(section), `missing required tutorial section: #${section}`)
}

for (const command of requiredCommands) {
  check(html.includes(command), `tutorial is missing required command: ${command}`)
}

for (const phrase of ["Builder", "Explore", "Architect", "Planner", "Reviewer", "TASK.md", "CONTEXT.md"]) {
  check(html.includes(phrase), `tutorial is missing required concept: ${phrase}`)
}

const attributeReferences = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map((match) => match[1])
const fragmentReferences = []

for (const reference of attributeReferences) {
  if (/^(?:https?:|mailto:|tel:)/i.test(reference)) continue
  check(!reference.startsWith("/"), `root-relative URL is not Pages-subpath safe: ${reference}`)
  check(!reference.startsWith("../"), `published URL escapes docs/: ${reference}`)

  const [pathWithQuery, fragment = ""] = reference.split("#", 2)
  const localPath = pathWithQuery.split("?", 1)[0]
  if (fragment) fragmentReferences.push(fragment)
  if (!localPath) continue

  const target = resolve(docsRoot, localPath)
  const contained = target === docsRoot || target.startsWith(`${docsRoot}${sep}`)
  check(contained, `local reference resolves outside docs/: ${reference}`)
  if (!contained) continue
  check(await exists(target), `local reference does not exist: ${reference}`)
  if (await exists(target)) check(await hasExactCase(target), `local reference has incorrect filename case: ${reference}`)
}

for (const fragment of fragmentReferences) {
  check(idSet.has(decodeURIComponent(fragment)), `fragment has no matching id: #${fragment}`)
}

for (const match of html.matchAll(/<[^>]+\b(?:aria-controls|aria-labelledby)="([^"]+)"[^>]*>/g)) {
  for (const referencedId of match[1].trim().split(/\s+/)) {
    check(idSet.has(referencedId), `ARIA reference has no matching id: ${referencedId}`)
  }
}

for (const match of html.matchAll(/<a\b([^>]*)>/gi)) {
  const attributes = match[1]
  if (!/target="_blank"/i.test(attributes)) continue
  check(/rel="[^"]*noopener[^"]*"/i.test(attributes), "target=_blank link is missing rel=noopener")
  check(/rel="[^"]*noreferrer[^"]*"/i.test(attributes), "target=_blank link is missing rel=noreferrer")
}

const hasRemoteScript = /<script\b[^>]*src="https?:/i.test(html)
const hasRemoteStylesheet = [...html.matchAll(/<link\b([^>]*)>/gi)].some(
  (match) => /rel="stylesheet"/i.test(match[1]) && /href="https?:/i.test(match[1]),
)
check(!hasRemoteScript && !hasRemoteStylesheet, "remote runtime scripts/styles are prohibited")
check(!/@import\s/i.test(css), "CSS @import is prohibited")
check(!/url\(\s*["']?https?:/i.test(css), "remote CSS assets are prohibited")
check(!/url\(\s*["']?\//i.test(css), "root-relative CSS assets are prohibited")
check(css.includes(":focus-visible"), "visible keyboard focus styling is required")
check(css.includes("prefers-reduced-motion"), "reduced-motion support is required")
check(/@media\s*\([^)]*max-width/i.test(css), "responsive breakpoints are required")
check(css.includes("nav-enhanced"), "mobile navigation must be scoped to progressive enhancement")
check(css.includes("[data-enhanced]"), "role panel collapsing must be scoped to progressive enhancement")

const focusInner = cssVariable("focus-inner", css)
const focusOuter = cssVariable("focus-outer", css)
const darkTextMuted = cssVariable("dark-text-muted", css)
check(contrastRatio(focusOuter, "#fffdf7") >= 3, "outer focus indicator needs 3:1 contrast on light surfaces")
check(contrastRatio(focusInner, "#0b1117") >= 3, "inner focus indicator needs 3:1 contrast on dark surfaces")
check(contrastRatio(darkTextMuted, "#111a21") >= 4.5, "small terminal text needs 4.5:1 contrast")
for (const [selector, label] of [
  ["\\.terminal-bar\\s*>\\s*span", "terminal-bar marker"],
  ["\\.terminal-body\\s+small", "terminal command description"],
  ["\\.maintenance-label", "maintenance label"],
]) {
  check(
    new RegExp(`${selector}\\s*\\{[^}]*color:\\s*var\\(--dark-text-muted\\)`, "s").test(css),
    `${label} must use the validated dark small-text color`,
  )
}

check(!/^\s*import\s/m.test(javascript), "site JavaScript must not import runtime modules")
check(!/\bfetch\s*\(/.test(javascript), "site JavaScript must not require network fetches")
check(!/serviceWorker/.test(javascript), "site JavaScript must not register a service worker")
check(javascript.includes("window.isSecureContext"), "copy behavior must guard secure-context clipboard access")
check(javascript.includes("document.execCommand"), "copy behavior needs a file:// fallback")
check(javascript.includes("localStorage"), "theme/checklist persistence should use guarded local storage")

for (const path of [htmlPath, cssPath, scriptPath]) {
  const details = await stat(path)
  check(details.size > 0, `published file is empty: ${relative(projectRoot, path)}`)
}

check(!html.includes("/Users/"), "published HTML contains an absolute local user path")
check(!css.includes("/Users/"), "published CSS contains an absolute local user path")
check(!javascript.includes("/Users/"), "published JavaScript contains an absolute local user path")

if (failures.length) {
  console.error(`Site validation failed with ${failures.length} issue${failures.length === 1 ? "" : "s"}:`)
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exitCode = 1
} else {
  console.log(
    `Site validation passed: ${publishedFiles.length} published files, ${ids.length} unique ids, ${fragmentReferences.length} fragment links${process.argv.includes("--self-test") ? ", negative allowlist probe rejected" : ""}.`,
  )
}
