// Background script for SmartBookmark.AI Chrome Extension
class SmartBookmarkBackground {
  constructor() {
    this.apiBaseUrl = "http://localhost:3000" // Will be configurable
    this.syncInterval = null
    this.init()
  }

  init() {
    // Set up event listeners
    window.chrome.runtime.onInstalled.addListener(() => this.onInstalled())
    window.chrome.runtime.onStartup.addListener(() => this.onStartup())
    window.chrome.commands.onCommand.addListener((command) => this.onCommand(command))
    window.chrome.contextMenus.onClicked.addListener((info, tab) => this.onContextMenu(info, tab))
    window.chrome.runtime.onMessage.addListener((message, sender, sendResponse) =>
      this.onMessage(message, sender, sendResponse),
    )

    // Set up periodic sync
    this.setupPeriodicSync()
  }

  onInstalled() {
    console.log("SmartBookmark.AI extension installed")

    // Create context menus
    window.chrome.contextMenus.create({
      id: "save-bookmark",
      title: "Save to SmartBookmark.AI",
      contexts: ["page", "link"],
    })

    window.chrome.contextMenus.create({
      id: "save-link",
      title: "Save link to SmartBookmark.AI",
      contexts: ["link"],
    })

    // Set default settings
    window.chrome.storage.local.set({
      settings: {
        autoSync: true,
        syncInterval: 30, // minutes
        autoCategories: true,
        notifications: true,
      },
    })
  }

  onStartup() {
    console.log("SmartBookmark.AI extension started")
    this.setupPeriodicSync()
  }

  async onCommand(command) {
    const [tab] = await window.chrome.tabs.query({ active: true, currentWindow: true })

    switch (command) {
      case "save-bookmark":
        await this.saveCurrentPage(tab)
        break
      case "quick-search":
        await this.openQuickSearch()
        break
      case "open-dashboard":
        await this.openDashboard()
        break
    }
  }

  async onContextMenu(info, tab) {
    switch (info.menuItemId) {
      case "save-bookmark":
        await this.saveCurrentPage(tab)
        break
      case "save-link":
        await this.saveLink(info.linkUrl, tab)
        break
    }
  }

  async onMessage(message, sender, sendResponse) {
    switch (message.action) {
      case "saveBookmark":
        const result = await this.saveBookmark(message.data)
        sendResponse(result)
        break
      case "syncBookmarks":
        await this.syncBookmarks()
        sendResponse({ success: true })
        break
      case "getAuthStatus":
        const authStatus = await this.getAuthStatus()
        sendResponse(authStatus)
        break
      case "setAuthToken":
        await this.setAuthToken(message.token, message.user)
        sendResponse({ success: true })
        break
    }
    return true // Keep message channel open for async response
  }

  async saveCurrentPage(tab) {
    if (!tab || !tab.url || tab.url.startsWith("chrome://")) {
      this.showNotification("Cannot save this page", "This page cannot be bookmarked")
      return
    }

    try {
      // Get page metadata
      const metadata = await this.getPageMetadata(tab)

      // Save bookmark
      const result = await this.saveBookmark({
        title: metadata.title || tab.title,
        url: tab.url,
        description: metadata.description,
        favicon_url: metadata.favicon,
        tags: metadata.tags || [],
      })

      if (result.success) {
        this.showNotification("Bookmark saved!", `"${tab.title}" has been saved to your collection`)
      } else {
        this.showNotification("Save failed", result.error || "Failed to save bookmark")
      }
    } catch (error) {
      console.error("Save current page error:", error)
      this.showNotification("Save failed", "An error occurred while saving")
    }
  }

  async saveLink(url, tab) {
    try {
      // Create a temporary tab to get metadata
      const tempTab = await window.chrome.tabs.create({ url, active: false })

      // Wait a bit for page to load
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const metadata = await this.getPageMetadata(tempTab)

      // Close temporary tab
      window.chrome.tabs.remove(tempTab.id)

      const result = await this.saveBookmark({
        title: metadata.title || url,
        url: url,
        description: metadata.description,
        favicon_url: metadata.favicon,
        tags: metadata.tags || [],
      })

      if (result.success) {
        this.showNotification("Link saved!", `Link has been saved to your collection`)
      } else {
        this.showNotification("Save failed", result.error || "Failed to save link")
      }
    } catch (error) {
      console.error("Save link error:", error)
      this.showNotification("Save failed", "An error occurred while saving link")
    }
  }

  async getPageMetadata(tab) {
    try {
      const results = await window.chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          // Extract metadata from page
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

          return {
            title: document.title,
            description: getMetaContent("description") || getMetaContent("og:description"),
            favicon: getFavicon(),
            tags: extractKeywords(),
            language: document.documentElement.lang || "en",
          }
        },
      })

      return results[0]?.result || {}
    } catch (error) {
      console.error("Get metadata error:", error)
      return {}
    }
  }

  async saveBookmark(bookmarkData) {
    try {
      const { authToken } = await window.chrome.storage.local.get(["authToken"])

      if (!authToken) {
        return { success: false, error: "Not authenticated" }
      }

      const response = await fetch(`${this.apiBaseUrl}/api/bookmarks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(bookmarkData),
      })

      if (response.ok) {
        return { success: true, data: await response.json() }
      } else {
        const error = await response.text()
        return { success: false, error }
      }
    } catch (error) {
      console.error("Save bookmark error:", error)
      return { success: false, error: error.message }
    }
  }

  async syncBookmarks() {
    try {
      const { authToken } = await window.chrome.storage.local.get(["authToken"])

      if (!authToken) {
        console.log("Not authenticated, skipping sync")
        return
      }

      // Get Chrome bookmarks
      const chromeBookmarks = await this.getChromeBookmarks()

      // Send to API for processing
      const response = await fetch(`${this.apiBaseUrl}/api/bookmarks/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ bookmarks: chromeBookmarks }),
      })

      if (response.ok) {
        console.log("Bookmarks synced successfully")
        this.showNotification("Sync complete", "Your bookmarks have been synchronized")
      } else {
        console.error("Sync failed:", await response.text())
      }
    } catch (error) {
      console.error("Sync error:", error)
    }
  }

  async getChromeBookmarks() {
    const bookmarkTree = await window.chrome.bookmarks.getTree()
    const bookmarks = []

    const traverse = (nodes) => {
      for (const node of nodes) {
        if (node.url) {
          bookmarks.push({
            title: node.title,
            url: node.url,
            dateAdded: new Date(node.dateAdded),
            parentTitle: node.parentId ? "Chrome Import" : null,
          })
        }
        if (node.children) {
          traverse(node.children)
        }
      }
    }

    traverse(bookmarkTree)
    return bookmarks
  }

  async openQuickSearch() {
    // Open popup or create a new tab with search
    window.chrome.action.openPopup()
  }

  async openDashboard() {
    window.chrome.tabs.create({ url: this.apiBaseUrl })
  }

  async getAuthStatus() {
    const result = await window.chrome.storage.local.get(["authToken", "user"])
    return {
      isAuthenticated: !!(result.authToken && result.user),
      user: result.user,
    }
  }

  async setAuthToken(token, user) {
    await window.chrome.storage.local.set({ authToken: token, user: user })
  }

  setupPeriodicSync() {
    // Clear existing interval
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }

    // Set up new interval (every 30 minutes by default)
    this.syncInterval = setInterval(
      async () => {
        const { settings } = await window.chrome.storage.local.get(["settings"])
        if (settings?.autoSync) {
          await this.syncBookmarks()
        }
      },
      30 * 60 * 1000,
    ) // 30 minutes
  }

  showNotification(title, message) {
    window.chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: title,
      message: message,
    })
  }
}

// Initialize background script
new SmartBookmarkBackground()
