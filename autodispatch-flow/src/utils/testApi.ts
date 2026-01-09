/**
 * Test script to verify API connection
 * Run this in browser console or as a test
 */
import { getApprovedUserCreditsByUserId } from '../services/approvedUserCreditsService'

export async function testApiConnection() {
  console.log('Testing API connection to ApprovedUserCredits...')
  console.log('Base URL: https://gw5cn.geowise.ai')
  
  try {
    const result = await getApprovedUserCreditsByUserId()
    console.log('✅ API Connection Successful!')
    console.log('Response:', result)
    return { success: true, data: result }
  } catch (error) {
    console.error('❌ API Connection Failed!')
    console.error('Error:', error)
    
    if (error instanceof Error) {
      // Check for common error types
      if (error.message.includes('401') || error.message.includes('403')) {
        console.warn('⚠️ Authentication issue - make sure you are logged in')
      } else if (error.message.includes('404')) {
        console.warn('⚠️ Endpoint not found - check the API URL')
      } else if (error.message.includes('CORS')) {
        console.warn('⚠️ CORS issue - check backend CORS settings')
      } else if (error.message.includes('Failed to fetch')) {
        console.warn('⚠️ Network error - check if backend is running')
      }
    }
    
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testApiConnection = testApiConnection
}
