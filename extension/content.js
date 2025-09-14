// Content script for SmartBookmark.AI Chrome Extension
const chrome = window.chrome // Declare the chrome variable

class SmartBookmarkContent {
  constructor() {
    this.isInjected = false
    this.init()
  }

  init() {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse)
      return true
    })

    // Add keyboard shortcuts
    document.addEventListener("keydown", (e) => this.handleKeydown(e))

    // Inject floating action button if enabled
    this.injectFloatingButton()
  }

  handleMessage(message, sender, sendResponse) {
    switch (message.action) {
      case "getPageMetadata":
        sendResponse(this.getPageMetadata())
        break
      case "highlightText":
        this.highlightSelectedText()
        break
      case "showSaveDialog":
        this.showQuickSaveDialog()
        break
    }
  }

  handleKeydown(e) {
    // Ctrl/Cmd + Shift + S - Quick save
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "S") {
      e.preventDefault()
      this.quickSave()
    }

    // Ctrl/Cmd + Shift + F - Quick search
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "F") {
      e.preventDefault()
      this.showQuickSearch()
    }
  }

  getPageMetadata() {
    const getMetaContent = (name) => {
      const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`)
      return meta ? meta.content : null
    }

    const getFavicon = () => {
      const favicon = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]')
      if (favicon) {
        return new URL(favicon.href, window.location.origin).href
      }
      return `https://www.google.com/s2/favicons?domain=${window.location.hostname}&sz=32`
    }

    const extractKeywords = () => {
      const keywords = getMetaContent("keywords")
      if (keywords) return keywords.split(",").map((k) => k.trim())

      // Extract from headings
      const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
      return headings
        .slice(0, 5)
        .map((h) => h.textContent.trim())
        .filter((t) => t)
    }

    const getSelectedText = () => {
      const selection = window.getSelection()
      return selection.toString().trim()
    }

    const getReadingTime = () => {
      const text = document.body.innerText || document.body.textContent || ""
      const words = text.trim().split(/\s+/).length
      return Math.ceil(words / 200) // Average reading speed: 200 words per minute
    }

    return {
      title: document.title,
      url: window.location.href,
      description: getMetaContent("description") || getMetaContent("og:description"),
      favicon: getFavicon(),
      tags: extractKeywords(),
      language: document.documentElement.lang || "en",
      selectedText: getSelectedText(),
      readingTime: getReadingTime(),
      wordCount: (document.body.innerText || "").trim().split(/\s+/).length,
    }
  }

  async quickSave() {
    const metadata = this.getPageMetadata()

    // Send to background script
    chrome.runtime.sendMessage(
      {
        action: "saveBookmark",
        data: metadata,
      },
      (response) => {
        if (response?.success) {
          this.showToast("Bookmark saved!", "success")
        } else {
          this.showToast("Failed to save bookmark", "error")
        }
      },
    )
  }

  showQuickSearch() {
    // Open extension popup
    chrome.runtime.sendMessage({ action: "openQuickSearch" })
  }

  injectFloatingButton() {
    if (this.isInjected || window.location.hostname === "localhost") return

    const button = document.createElement("div")
    button.id = "smartbookmark-floating-btn"
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
        <polyline points="17,21 17,13 7,13 7,21"></polyline>
        <polyline points="7,3 7,8 15,8"></polyline>
      </svg>
    `

    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #6c47ff 0%, #00d8a4 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(108, 71, 255, 0.3);
      z-index: 10000;
      transition: all 0.3s ease;
      color: white;
    `

    button.addEventListener("mouseenter", () => {
      button.style.transform = "scale(1.1)"
      button.style.boxShadow = "0 6px 20px rgba(108, 71, 255, 0.4)"
    })

    button.addEventListener("mouseleave", () => {
      button.style.transform = "scale(1)"
      button.style.boxShadow = "0 4px 12px rgba(108, 71, 255, 0.3)"
    })

    button.addEventListener("click", () => {
      this.quickSave()
    })

    document.body.appendChild(button)
    this.isInjected = true
  }

  showToast(message, type = "info") {
    const toast = document.createElement("div")
    toast.textContent = message
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      z-index: 10001;
      animation: slideIn 0.3s ease;
      ${type === "success" ? "background: #00d8a4;" : "background: #ef4444;"}
    `

    const style = document.createElement("style")
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `
    document.head.appendChild(style)

    document.body.appendChild(toast)

    setTimeout(() => {
      toast.remove()
      style.remove()
    }, 3000)
  }

  highlightSelectedText() {
    const selection = window.getSelection()
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const span = document.createElement("span")
      span.style.backgroundColor = "#6c47ff"
      span.style.color = "white"
      span.style.padding = "2px 4px"
      span.style.borderRadius = "3px"

      try {
        range.surroundContents(span)
      } catch (e) {
        // Handle cases where selection spans multiple elements
        const contents = range.extractContents()
        span.appendChild(contents)
        range.insertNode(span)
      }

      selection.removeAllRanges()
    }
  }
}

// Initialize content script
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => new SmartBookmarkContent())
} else {
  new SmartBookmarkContent()
}
