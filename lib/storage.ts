// Browser storage utilities for user preferences

export interface UserPreferences {
  emailNotifications: boolean
  smsNotifications: boolean
  marketingEmails: boolean
  darkMode: boolean
  language: string
  timezone: string
}

const PREFERENCES_KEY = 'sm@rtz_user_preferences'

export const storage = {
  // Get preferences from localStorage
  getPreferences(): UserPreferences {
    if (typeof window === 'undefined') {
      return {
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: false,
        darkMode: false,
        language: 'en',
        timezone: 'Africa/Lagos',
      }
    }

    try {
      const stored = localStorage.getItem(PREFERENCES_KEY)
      if (stored) {
        const preferences = JSON.parse(stored)
        return {
          emailNotifications: preferences.emailNotifications ?? true,
          smsNotifications: preferences.smsNotifications ?? false,
          marketingEmails: preferences.marketingEmails ?? false,
          darkMode: preferences.darkMode ?? false,
          language: preferences.language ?? 'en',
          timezone: preferences.timezone ?? 'Africa/Lagos',
        }
      }
    } catch (error) {
      console.error('Error reading preferences from localStorage:', error)
    }

    // Default preferences
    return {
      emailNotifications: true,
      smsNotifications: false,
      marketingEmails: false,
      darkMode: false,
      language: 'en',
      timezone: 'Africa/Lagos',
    }
  },

  // Save preferences to localStorage
  savePreferences(preferences: Partial<UserPreferences>): void {
    if (typeof window === 'undefined') return

    try {
      const current = this.getPreferences()
      const updated = { ...current, ...preferences }
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated))
    } catch (error) {
      console.error('Error saving preferences to localStorage:', error)
    }
  },

  // Update a single preference
  updatePreference(key: keyof UserPreferences, value: any): void {
    if (typeof window === 'undefined') return

    try {
      const current = this.getPreferences()
      const updated = { ...current, [key]: value }
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated))
    } catch (error) {
      console.error('Error updating preference in localStorage:', error)
    }
  },

  // Clear all preferences
  clearPreferences(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(PREFERENCES_KEY)
    } catch (error) {
      console.error('Error clearing preferences from localStorage:', error)
    }
  }
} 