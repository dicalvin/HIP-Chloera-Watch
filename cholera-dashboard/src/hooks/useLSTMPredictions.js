import { useState, useEffect, useCallback } from 'react'

// API URL: Use environment variable, or default to localhost for development
// For production, set VITE_LSTM_API_URL in Vercel environment variables
// Example: https://your-api.railway.app
const LSTM_API_URL = import.meta.env.VITE_LSTM_API_URL || 'http://localhost:5001'

/**
 * Custom hook for LSTM model predictions
 */
export function useLSTMPredictions() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [modelAvailable, setModelAvailable] = useState(false)

  // Check if LSTM API is available
  useEffect(() => {
    const checkModel = async () => {
      try {
        const response = await fetch(`${LSTM_API_URL}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        if (response.ok) {
          const data = await response.json()
          // API is available - model might use fallback, that's okay
          setModelAvailable(true)
          console.log('LSTM API available:', data)
        } else {
          console.warn('LSTM API health check failed:', response.status)
          setModelAvailable(false)
        }
      } catch (err) {
        console.warn('LSTM API not available:', err.message)
        setModelAvailable(false)
      }
    }
    checkModel()
    // Check every 10 seconds
    const interval = setInterval(checkModel, 10000)
    return () => clearInterval(interval)
  }, [])

  /**
   * Get single prediction from LSTM model
   */
  const getPrediction = useCallback(async (predictionData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${LSTM_API_URL}/api/lstm/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(predictionData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (err) {
      setError(err.message)
      console.error('LSTM prediction error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Get multi-step forecast from LSTM model
   */
  const getForecast = useCallback(async (forecastData, steps = 7) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${LSTM_API_URL}/api/lstm/forecast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...forecastData,
          steps,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (err) {
      setError(err.message)
      console.error('LSTM forecast error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    modelAvailable,
    getPrediction,
    getForecast,
  }
}

export default useLSTMPredictions

