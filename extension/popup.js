// Popup script for SmartBookmark.AI Chrome Extension
class SmartBookmarkPopup {
  constructor() {
    this.apiBaseUrl = this.getApiBaseUrl()
    this.currentTab = null
    this.collections = []
    this.recentBookmarks = []
    this.isAuthenticated = false
    this.searchTimeout = null

    this.init()
  }

  getApiBaseUrl() {
    // Try to detect the environment
    if (typeof window.chrome !== "undefined" && window.chrome.storage) {
      // Will be set from background script or options
      return "http://localhost:3000" // Default for development
    }
    return "http://localhost:3000"
  }

  async init() {
    try {
      // Get current tab
      const [tab] = await window.chrome.tabs.query({ active: true, currentWindow: true })
      this.currentTab = tab

      // Check authentication status
      await this.checkAuthStatus()

      // Initialize UI
      this.initializeUI()

      if (this.isAuthenticated) {
        // Load data
        await this.loadCollections()
        await this.loadRecentBookmarks()
      } else {
        this.showAuthRequired()
      }
    } catch (error) {
      console.error("Failed to initialize popup:", error)
      this.showError("Failed to initialize extension")
    }
  }

  async checkAuthStatus() {
    try {
      const result = await window.chrome.storage.local.get(["authToken", "user"])
      this.isAuthenticated = !!(result.authToken && result.user)
      return this.isAuthenticated
    } catch (error) {
      console.error("Auth check failed:", error)
      return false
    }
  }

  initializeUI() {
    // Bind event listeners
    document.getElementById("saveCurrentBtn").addEventListener("click", () => this.showSaveForm())
    document.getElementById("quickSearchBtn").addEventListener("click", () => this.showSearch())
    document.getElementById("settingsBtn").addEventListener("click", () => this.openSettings())
    document.getElementById("openDashboardBtn").addEventListener("click", () => this.openDashboard())
    document.getElementById("syncBtn").addEventListener("click", () => this.syncBookmarks())
    document.getElementById("viewAllBtn").addEventListener("click", () => this.openDashboard())

    // Save form events
    document.getElementById("cancelSaveBtn").addEventListener("click", () => this.hideSaveForm())
    document.getElementById("confirmSaveBtn").addEventListener("click", () => this.saveBookmark())

    // Search events
    document.getElementById("searchInput").addEventListener("input", (e) => this.handleSearch(e.target.value))
    document.getElementById("searchInput").addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.hideSearch()
      }
    })

    // Pre-fill current page info if showing save form
    if (this.currentTab) {
      document.getElementById("titleInput").value = this.currentTab.title || ""
      document.getElementById("urlInput").value = this.currentTab.url || ""
    }
  }

  showSaveForm() {
    if (!this.isAuthenticated) {
      this.showAuthRequired()
      return
    }

    document.getElementById("recentSection").style.display = "none"
    document.getElementById("searchContainer").style.display = "none"
    document.getElementById("saveForm").style.display = "block"

    // Pre-fill form with current tab data
    if (this.currentTab) {
      document.getElementById("titleInput").value = this.currentTab.title || ""
      document.getElementById("urlInput").value = this.currentTab.url || ""
    }

    // Focus on title input
    document.getElementById("titleInput").focus()
  }

  hideSaveForm() {
    document.getElementById("saveForm").style.display = "none"
    document.getElementById("recentSection").style.display = "block"
  }

  showSearch() {
    if (!this.isAuthenticated) {
      this.showAuthRequired()
      return
    }

    document.getElementById("recentSection").style.display = "none"
    document.getElementById("saveForm").style.display = "none"
    document.getElementById("searchContainer").style.display = "block"

    // Focus on search input
    document.getElementById("searchInput").focus()
  }

  hideSearch() {
    document.getElementById("searchContainer").style.display = "none"
    document.getElementById("recentSection").style.display = "block"
    document.getElementById("searchInput").value = ""
    document.getElementById("searchResults").innerHTML = ""
  }

  async loadCollections() {
    try {
      const response = await this.makeAuthenticatedRequest("/api/collections")
      if (response.ok) {
        this.collections = await response.json()
        this.populateCollectionSelect()
      }
    } catch (error) {
      console.error("Failed to load collections:", error)
    }
  }

  populateCollectionSelect() {
    const select = document.getElementById("collectionSelect")
    select.innerHTML = '<option value="">Select a collection...</option>'

    this.collections.forEach((collection) => {
      const option = document.createElement("option")
      option.value = collection.id
      option.textContent = collection.name
      select.appendChild(option)
    })
  }

  async loadRecentBookmarks() {
    try {
      const response = await this.makeAuthenticatedRequest("/api/bookmarks?limit=5&sort=recent")
      if (response.ok) {
        this.recentBookmarks = await response.json()
        this.displayRecentBookmarks()
      }
    } catch (error) {
      console.error("Failed to load recent bookmarks:", error)
      document.getElementById("recentBookmarks").innerHTML = '<div class="loading">Failed to load bookmarks</div>'
    }
  }

  displayRecentBookmarks() {
    const container = document.getElementById("recentBookmarks")

    if (this.recentBookmarks.length === 0) {
      container.innerHTML = '<div class="loading">No bookmarks yet. Save your first bookmark!</div>'
      return
    }

    container.innerHTML = this.recentBookmarks
      .map(
        (bookmark) => `
      <div class="bookmark-item" data-url="${bookmark.url}">
        <img src="${bookmark.favicon_url || "/placeholder.svg?height=16&width=16"}" 
             alt="" class="bookmark-favicon" 
             onerror="this.src='/placeholder.svg?height=16&width=16'">
        <div class="bookmark-content">
          <div class="bookmark-title">${this.escapeHtml(bookmark.title)}</div>
          <div class="bookmark-url">${this.escapeHtml(this.shortenUrl(bookmark.url))}</div>
          ${
            bookmark.tags && bookmark.tags.length > 0
              ? `
            <div class="bookmark-tags">
              ${bookmark.tags
                .slice(0, 3)
                .map((tag) => `<span class="bookmark-tag">${this.escapeHtml(tag)}</span>`)
                .join("")}
            </div>
          `
              : ""
          }
        </div>
      </div>
    `,
      )
      .join("")

    // Add click handlers
    container.querySelectorAll(".bookmark-item").forEach((item) => {
      item.addEventListener("click", () => {
        const url = item.dataset.url
        window.chrome.tabs.create({ url })
        window.close()
      })
    })
  }

  async saveBookmark() {
    const title = document.getElementById("titleInput").value.trim()
    const url = document.getElementById("urlInput").value.trim()
    const description = document.getElementById("descriptionInput").value.trim()
    const collectionId = document.getElementById("collectionSelect").value
    const tagsInput = document.getElementById("tagsInput").value.trim()

    if (!title || !url) {
      this.showError("Title and URL are required")
      return
    }

    const tags = tagsInput
      ? tagsInput
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag)
      : []

    try {
      const bookmarkData = {
        title,
        url,
        description: description || null,
        collection_id: collectionId || null,
        tags,
        favicon_url: await this.getFaviconUrl(url),
      }

      const response = await this.makeAuthenticatedRequest("/api/bookmarks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookmarkData),
      })

      if (response.ok) {
        this.showSuccess("Bookmark saved successfully!")
        this.hideSaveForm()
        await this.loadRecentBookmarks() // Refresh recent bookmarks

        // Clear form
        document.getElementById("titleInput").value = ""
        document.getElementById("urlInput").value = ""
        document.getElementById("descriptionInput").value = ""
        document.getElementById("collectionSelect").value = ""
        document.getElementById("tagsInput").value = ""
      } else {
        const error = await response.text()
        this.showError(`Failed to save bookmark: ${error}`)
      }
    } catch (error) {
      console.error("Save bookmark error:", error)
      this.showError("Failed to save bookmark")
    }
  }

  async handleSearch(query) {
    if (!query.trim()) {
      document.getElementById("searchResults").innerHTML = ""
      return
    }

    // Debounce search to avoid repeated loading on each letter input
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout)
    }

    this.searchTimeout = setTimeout(async () => {
      try {
        const response = await this.makeAuthenticatedRequest(`/api/bookmarks/search?q=${encodeURIComponent(query)}`)
        if (response.ok) {
          const results = await response.json()
          this.displaySearchResults(results)
        }
      } catch (error) {
        console.error("Search error:", error)
        document.getElementById("searchResults").innerHTML = '<div class="loading">Search failed</div>'
      }
    }, 300) // 300ms debounce delay
  }

  displaySearchResults(results) {
    const container = document.getElementById("searchResults")

    if (results.length === 0) {
      container.innerHTML = '<div class="loading">No bookmarks found</div>'
      return
    }

    container.innerHTML = results
      .map(
        (bookmark) => `
      <div class="bookmark-item" data-url="${bookmark.url}">
        <img src="${bookmark.favicon_url || "/placeholder.svg?height=16&width=16"}" 
             alt="" class="bookmark-favicon"
             onerror="this.src='/placeholder.svg?height=16&width=16'">
        <div class="bookmark-content">
          <div class="bookmark-title">${this.escapeHtml(bookmark.title)}</div>
          <div class="bookmark-url">${this.escapeHtml(this.shortenUrl(bookmark.url))}</div>
          ${
            bookmark.tags && bookmark.tags.length > 0
              ? `
            <div class="bookmark-tags">
              ${bookmark.tags
                .slice(0, 3)
                .map((tag) => `<span class="bookmark-tag">${this.escapeHtml(tag)}</span>`)
                .join("")}
            </div>
          `
              : ""
          }
        </div>
      </div>
    `,
      )
      .join("")

    // Add click handlers
    container.querySelectorAll(".bookmark-item").forEach((item) => {
      item.addEventListener("click", () => {
        const url = item.dataset.url
        window.chrome.tabs.create({ url })
        window.close()
      })
    })
  }

  async syncBookmarks() {
    if (!this.isAuthenticated) {
      this.showAuthRequired()
      return
    }

    try {
      this.showStatus("Syncing bookmarks...", "info")

      // Trigger sync in background script
      window.chrome.runtime.sendMessage({ action: "syncBookmarks" })

      // Refresh data
      await this.loadRecentBookmarks()

      this.showSuccess("Bookmarks synced successfully!")
    } catch (error) {
      console.error("Sync error:", error)
      this.showError("Failed to sync bookmarks")
    }
  }

  openDashboard() {
    window.chrome.tabs.create({ url: this.apiBaseUrl })
    window.close()
  }

  openSettings() {
    window.chrome.runtime.openOptionsPage()
  }

  showAuthRequired() {
    document.getElementById("recentBookmarks").innerHTML = `
      <div class="loading">
        <p>Please log in to use SmartBookmark.AI</p>
        <button class="btn primary" onclick="window.chrome.tabs.create({url: '${this.apiBaseUrl}/auth/login'})">
          Login
        </button>
      </div>
    `
  }

  async makeAuthenticatedRequest(endpoint, options = {}) {
    const { authToken } = await window.chrome.storage.local.get(["authToken"])

    if (!authToken) {
      throw new Error("Not authenticated")
    }

    return fetch(`${this.apiBaseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${authToken}`,
        ...options.headers,
      },
    })
  }

  async getFaviconUrl(url) {
    try {
      const domain = new URL(url).hostname
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    } catch {
      return null
    }
  }

  showSuccess(message) {
    this.showStatus(message, "success")
  }

  showError(message) {
    this.showStatus(message, "error")
  }

  showStatus(message, type = "info") {
    const statusEl = document.getElementById("statusMessage")
    statusEl.textContent = message
    statusEl.className = `status-message ${type}`
    statusEl.style.display = "block"

    setTimeout(() => {
      statusEl.style.display = "none"
    }, 3000)
  }

  escapeHtml(text) {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }

  shortenUrl(url) {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname + (urlObj.pathname !== "/" ? urlObj.pathname : "")
    } catch {
      return url
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new SmartBookmarkPopup()
})
