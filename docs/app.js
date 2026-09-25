(() => {
  "use strict"

  const root = document.documentElement
  root.classList.add("js")

  const select = (selector, scope = document) => scope.querySelector(selector)
  const selectAll = (selector, scope = document) => [...scope.querySelectorAll(selector)]

  const storage = {
    get(key) {
      try {
        return window.localStorage.getItem(key)
      } catch {
        return null
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(key, value)
        return true
      } catch {
        return false
      }
    },
    remove(key) {
      try {
        window.localStorage.removeItem(key)
      } catch {
        // Local storage is optional, especially under file://.
      }
    },
  }

  function initTheme() {
    const button = select("[data-theme-toggle]")
    const icon = select("[data-theme-icon]")
    if (!button || !icon) return

    const stored = storage.get("agent-flow-theme")
    const preferred = window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    const initial = stored === "dark" || stored === "light" ? stored : preferred

    const apply = (theme) => {
      root.dataset.theme = theme
      const next = theme === "dark" ? "浅色" : "深色"
      button.setAttribute("aria-label", `切换为${next}主题`)
      button.setAttribute("aria-pressed", String(theme === "dark"))
      icon.textContent = theme === "dark" ? "☀" : "◐"
      const themeColor = select('meta[name="theme-color"]')
      themeColor?.setAttribute("content", theme === "dark" ? "#0b1117" : "#f2efe6")
    }

    button.addEventListener("click", () => {
      const next = root.dataset.theme === "dark" ? "light" : "dark"
      apply(next)
      storage.set("agent-flow-theme", next)
    })

    apply(initial)
  }

  function initNavigation() {
    const toggle = select("[data-nav-toggle]")
    const menu = select("[data-nav-menu]")
    const header = select("[data-header]")
    if (!toggle || !menu || !header) return

    let returnFocus = false
    const themeToggle = select("[data-theme-toggle]")

    const menuFocusables = () =>
      [...selectAll("a[href]", menu), themeToggle, toggle].filter(
        (element) => element && !element.hasAttribute("disabled"),
      )

    const close = ({ restoreFocus = false } = {}) => {
      menu.classList.remove("is-open")
      toggle.setAttribute("aria-expanded", "false")
      toggle.setAttribute("aria-label", "打开导航菜单")
      document.body.classList.remove("nav-open")
      if (restoreFocus && returnFocus) window.requestAnimationFrame(() => toggle.focus())
      returnFocus = false
    }

    const open = () => {
      menu.classList.add("is-open")
      toggle.setAttribute("aria-expanded", "true")
      toggle.setAttribute("aria-label", "关闭导航菜单")
      document.body.classList.add("nav-open")
      returnFocus = true
      window.requestAnimationFrame(() => select("a[href]", menu)?.focus())
    }

    toggle.addEventListener("click", () => {
      if (menu.classList.contains("is-open")) close()
      else open()
    })

    menu.addEventListener("click", (event) => {
      if (!event.target.closest("a")) return
      const wasOpen = menu.classList.contains("is-open")
      close({ restoreFocus: wasOpen })
    })

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menu.classList.contains("is-open")) {
        close({ restoreFocus: true })
        return
      }

      if (event.key === "Tab" && menu.classList.contains("is-open")) {
        const focusables = menuFocusables()
        const first = focusables[0]
        const last = focusables.at(-1)
        if (!first || !last) return
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    })

    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) close()
    })

    root.classList.add("nav-enhanced")

    let frame = 0
    const updateHeader = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 16)
      frame = 0
    }
    window.addEventListener(
      "scroll",
      () => {
        if (!frame) frame = window.requestAnimationFrame(updateHeader)
      },
      { passive: true },
    )
    updateHeader()
  }

  function initRoleTabs() {
    const tabList = select("[data-role-tabs]")
    const panelsContainer = select(".role-panels")
    if (!tabList || !panelsContainer) return

    const tabs = selectAll("[data-role-tab]", tabList)
    const panels = selectAll("[data-role-panel]", panelsContainer)
    if (!tabs.length || tabs.length !== panels.length) return

    const activate = (role, { focus = false, updateHash = false } = {}) => {
      const activeTab = tabs.find((tab) => tab.dataset.roleTab === role)
      const activePanel = panels.find((panel) => panel.dataset.rolePanel === role)
      if (!activeTab || !activePanel) return

      for (const tab of tabs) {
        const active = tab === activeTab
        tab.classList.toggle("is-active", active)
        tab.setAttribute("aria-selected", String(active))
        tab.tabIndex = active ? 0 : -1
      }

      for (const panel of panels) {
        const active = panel === activePanel
        panel.classList.toggle("is-active", active)
        panel.hidden = !active
      }

      if (focus) activeTab.focus()
      if (updateHash && window.history?.replaceState) {
        window.history.replaceState(null, "", `#${activePanel.id}`)
      }
    }

    tabs.forEach((tab, index) => {
      const role = tab.dataset.roleTab
      const panel = panels.find((candidate) => candidate.dataset.rolePanel === role)
      if (!role || !panel) return

      tab.setAttribute("role", "tab")
      tab.setAttribute("aria-controls", panel.id)
      panel.setAttribute("role", "tabpanel")
      panel.setAttribute("aria-labelledby", tab.id)

      tab.addEventListener("click", (event) => {
        event.preventDefault()
        activate(role, { updateHash: true })
      })

      tab.addEventListener("keydown", (event) => {
        let nextIndex = null
        if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % tabs.length
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + tabs.length) % tabs.length
        if (event.key === "Home") nextIndex = 0
        if (event.key === "End") nextIndex = tabs.length - 1
        if (nextIndex === null) return
        event.preventDefault()
        activate(tabs[nextIndex].dataset.roleTab, { focus: true, updateHash: true })
      })
    })

    tabList.setAttribute("role", "tablist")
    tabList.setAttribute("aria-label", "选择 Agent 角色")
    panelsContainer.dataset.enhanced = "true"

    const hashRole = panels.find((panel) => `#${panel.id}` === window.location.hash)?.dataset.rolePanel
    activate(hashRole || tabs[0].dataset.roleTab)
  }

  function initChecklist() {
    const board = select("[data-checklist]")
    if (!board) return

    const checks = selectAll("[data-step-check]", board)
    const count = select("[data-checklist-count]", board)
    const bar = select("[data-checklist-bar]", board)
    const reset = select("[data-checklist-reset]", board)
    if (!checks.length || !count || !bar || !reset) return

    const key = "agent-flow-start-checklist"
    const saved = storage.get(key)
    if (saved) {
      try {
        const values = JSON.parse(saved)
        checks.forEach((check, index) => {
          check.checked = Boolean(values[index])
        })
      } catch {
        storage.remove(key)
      }
    }

    const update = () => {
      const values = checks.map((check) => check.checked)
      const completed = values.filter(Boolean).length
      const percentage = (completed / checks.length) * 100
      count.textContent = `${completed} / ${checks.length}`
      bar.style.width = `${percentage}%`
      board.dataset.complete = String(completed === checks.length)
      storage.set(key, JSON.stringify(values))
    }

    checks.forEach((check) => check.addEventListener("change", update))
    reset.addEventListener("click", () => {
      checks.forEach((check) => {
        check.checked = false
      })
      storage.remove(key)
      update()
      checks[0].focus()
    })
    update()
  }

  function fallbackCopy(text) {
    const area = document.createElement("textarea")
    area.value = text
    area.setAttribute("readonly", "")
    area.style.position = "fixed"
    area.style.left = "-9999px"
    document.body.append(area)
    area.select()
    area.setSelectionRange(0, text.length)
    let copied = false
    try {
      copied = document.execCommand("copy")
    } catch {
      copied = false
    }
    area.remove()
    return copied
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text)
        return true
      } catch {
        return fallbackCopy(text)
      }
    }
    return fallbackCopy(text)
  }

  function initCopyButtons() {
    const buttons = selectAll("[data-copy]")
    const toast = select("[data-toast]")
    if (!buttons.length || !toast) return

    let toastTimer = 0
    const announce = (message) => {
      window.clearTimeout(toastTimer)
      toast.textContent = message
      toast.classList.add("is-visible")
      toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1800)
    }

    buttons.forEach((button) => {
      button.addEventListener("click", async () => {
        const original = button.textContent
        const copied = await copyText(button.dataset.copy || "")
        if (!copied) {
          announce("自动复制不可用，请手动选择命令")
          return
        }
        button.textContent = "已复制"
        button.classList.add("is-copied")
        announce("命令已复制到剪贴板")
        window.setTimeout(() => {
          button.textContent = original
          button.classList.remove("is-copied")
        }, 1500)
      })
    })
  }

  function initScrollProgress() {
    const bar = select(".scroll-progress span")
    if (!bar) return

    let frame = 0
    const update = () => {
      const available = document.documentElement.scrollHeight - window.innerHeight
      const progress = available > 0 ? Math.min(1, Math.max(0, window.scrollY / available)) : 0
      bar.style.width = `${progress * 100}%`
      frame = 0
    }

    window.addEventListener(
      "scroll",
      () => {
        if (!frame) frame = window.requestAnimationFrame(update)
      },
      { passive: true },
    )
    window.addEventListener("resize", update)
    update()
  }

  function initActiveNavigation() {
    if (!("IntersectionObserver" in window)) return

    const links = selectAll('.nav-links a[href^="#"]')
    const targets = links
      .map((link) => ({ link, section: select(link.getAttribute("href")) }))
      .filter((item) => item.section)
    if (!targets.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (!visible) return
        for (const { link, section } of targets) {
          link.classList.toggle("is-active", section === visible.target)
        }
      },
      { rootMargin: "-25% 0px -62%", threshold: [0, 0.15, 0.5] },
    )

    targets.forEach(({ section }) => observer.observe(section))
  }

  function initReveal() {
    if (!("IntersectionObserver" in window)) return
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return

    const elements = selectAll("[data-reveal]")
    if (!elements.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add("is-visible")
          observer.unobserve(entry.target)
        })
      },
      { rootMargin: "0px 0px -8%", threshold: 0.08 },
    )

    elements.forEach((element) => {
      element.classList.add("reveal-pending")
      observer.observe(element)
    })
  }

  function initYear() {
    selectAll("[data-year]").forEach((element) => {
      element.textContent = String(new Date().getFullYear())
    })
  }

  const initializers = [
    initTheme,
    initNavigation,
    initRoleTabs,
    initChecklist,
    initCopyButtons,
    initScrollProgress,
    initActiveNavigation,
    initReveal,
    initYear,
  ]

  for (const initialize of initializers) {
    try {
      initialize()
    } catch (error) {
      console.warn(`[Agent Flow] ${initialize.name} unavailable`, error)
    }
  }
})()
