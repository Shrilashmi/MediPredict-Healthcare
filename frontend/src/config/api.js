/**
 * API Configuration
 * Central place for API base URL and common fetch utilities
 */

// API Base URL - change this based on environment
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

/**
 * Fetch wrapper with automatic JSON parsing and error handling
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  // Add JWT token if available
  const token = localStorage.getItem('token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, config)
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type')
    const isJson = contentType && contentType.includes('application/json')
    
    const data = isJson ? await response.json() : await response.text()
    
    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP ${response.status}`)
    }
    
    return data
  } catch (error) {
    console.error('API Request Error:', error)
    throw error
  }
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: (endpoint, options = {}) => 
    apiRequest(endpoint, { method: 'GET', ...options }),
  
  post: (endpoint, data, options = {}) => 
    apiRequest(endpoint, { 
      method: 'POST', 
      body: JSON.stringify(data),
      ...options 
    }),
  
  put: (endpoint, data, options = {}) => 
    apiRequest(endpoint, { 
      method: 'PUT', 
      body: JSON.stringify(data),
      ...options 
    }),
  
  patch: (endpoint, data, options = {}) => 
    apiRequest(endpoint, { 
      method: 'PATCH', 
      body: JSON.stringify(data),
      ...options 
    }),
  
  delete: (endpoint, options = {}) => 
    apiRequest(endpoint, { method: 'DELETE', ...options }),
}
