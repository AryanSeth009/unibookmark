// Popup script for SmartBookmark.AI Chrome Extension
class SmartBookmarkPopup {
  constructor() {
    this.apiBaseUrl = this.getApiBaseUrl()
    this.init()
  }

  getApiBaseUrl() {
    // Ensure this matches your Next.js app's URL
    return "http://localhost:3000"
  }

  async init() {
    try {
      const result = await window.chrome.storage.local.get(["authToken", "user"])
      const isAuthenticated = !!(result.authToken && result.user)

      if (isAuthenticated) {
        this.openPage("/") // Open dashboard
      } else {
        this.openPage("/auth/login") // Open login page
      }
    } catch (error) {
      console.error("Error determining auth status:", error)
      this.openPage("/auth/login") // Default to login on error
    } finally {
      window.close() // Close the extension popup immediately after redirecting
    }
  }

  openPage(path) {
    window.chrome.tabs.create({ url: `${this.apiBaseUrl}${path}` })
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new SmartBookmarkPopup()
})
