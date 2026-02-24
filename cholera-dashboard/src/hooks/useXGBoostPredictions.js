import { useState, useEffect, useCallback } from 'react'

// API URL: use VITE_XGBOOST_API_URL or VITE_LSTM_API_URL (legacy), default localhost
const API_URL = import.meta.env.VITE_XGBOOST_API_URL || import.meta.env.VITE_LSTM_API_URL || 'http://localhost:5001'

/**
 * Hook for XGBoost prediction API (predict & forecast).
 */
export function useXGBoostPredictions() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [modelAvailable, setModelAvailable] = useState(false)

  useEffect(() => {
    const checkModel = async () => {
      try {
        const response = await fetch(`${API_URL}/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
        if (response.ok) {
          const data = await response.json()
          setModelAvailable(true)
          if (data.model_type === 'XGBoost') {
            console.log('XGBoost API available:', data)
          }
        } else {
          setModelAvailable(false)
        }
      } catch (err) {
        setModelAvailable(false)
      }
    }
    checkModel()
    const interval = setInterval(checkModel, 10000)
    return () => clearInterval(interval)
  }, [])

  const getPrediction = useCallback(async (predictionData) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_URL}/api/lstm/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(predictionData),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      return await response.json()
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const getForecast = useCallback(async (forecastData, steps = 7) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_URL}/api/lstm/forecast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...forecastData, steps }),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      return await response.json()
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, modelAvailable, getPrediction, getForecast }
}

export default useXGBoostPredictions
