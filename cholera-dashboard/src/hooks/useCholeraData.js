import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

const numberValue = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const parseRow = (row, idx) => {
  let reportingDate = null

  if (row.reporting_date) {
    const dateValue = new Date(row.reporting_date)
    if (!Number.isNaN(dateValue.valueOf())) {
      reportingDate = dateValue
    }
  }

  return {
    id: row.id ?? row.index ?? idx,
    location: row.location ?? row.district ?? 'Unknown',
    region:
      row.region && row.region.trim()
        ? row.region.trim()
        : 'Unknown',
    district:
      row.district && row.district.trim()
        ? row.district.trim()
        : '',
    sCh: numberValue(row.sch ?? row.sCh),
    cCh: numberValue(row.cch ?? row.cCh),
    CFR: numberValue(row.cfr ?? row.CFR),
    deaths: numberValue(row.deaths),
    reportingDate,
    reportingDateRaw: row.reporting_date ?? '',
    TL: row.tl ?? row.TL,
    TR: row.tr ?? row.TR,
    source: row.source,
    raw: row,
  }
}

const POLL_INTERVAL_MS = 30_000 // 30s fallback when Realtime is unavailable
const MAX_RETRIES = 4
const RETRY_DELAYS_MS = [1000, 3000, 6000, 15000]

function useCholeraData() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [minDate, setMinDate] = useState(null)
  const [maxDate, setMaxDate] = useState(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null)

  const fetchData = async (isRetry = false) => {
    if (!isSupabaseConfigured || !supabase) {
      setError(
        'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      )
      setLoading(false)
      return
    }

    const attempt = async (retryCount = 0) => {
      try {
        const { data: rows, error: supaError } = await supabase
          .from('cholera_reports')
          .select(
            'id,index,location,tl,tr,deaths,sch,cch,cfr,reporting_date,source_index,source,confidence_weight,processing_notes,source_database,district,region',
          )

        if (supaError) {
          if (retryCount < MAX_RETRIES) {
            const delay = RETRY_DELAYS_MS[retryCount] ?? 15000
            setTimeout(() => attempt(retryCount + 1), delay)
            if (!isRetry) setError('Reconnecting…')
            return
          }
          console.error('Supabase query error:', supaError)
          setError(supaError.message || 'Failed to load dataset from Supabase.')
          setLoading(false)
          return
        }

        if (!rows || rows.length === 0) {
          if (retryCount < MAX_RETRIES) {
            const delay = RETRY_DELAYS_MS[retryCount] ?? 15000
            setTimeout(() => attempt(retryCount + 1), delay)
            return
          }
          setError('No records found in Supabase table cholera_reports.')
          setLoading(false)
          return
        }

        const parsedRows = rows.map(parseRow)
        const validRows = parsedRows.filter((row) => row.reportingDate)

        if (!validRows.length) {
          setError(
            'No dated records were found in the Supabase dataset. Check reporting_date values.',
          )
          setLoading(false)
          return
        }

        const timestamps = validRows.map((row) => row.reportingDate.valueOf())
        const min = new Date(Math.min(...timestamps))
        const max = new Date(Math.max(...timestamps))

        setMinDate(min)
        setMaxDate(max)
        setData(validRows)
        setError('')
        setLastUpdatedAt(new Date())
      } catch (err) {
        console.error('Unexpected Supabase fetch error:', err)
        if (retryCount < MAX_RETRIES) {
          const delay = RETRY_DELAYS_MS[retryCount] ?? 15000
          setTimeout(() => attempt(retryCount + 1), delay)
          if (!isRetry) setError('Reconnecting…')
          return
        }
        setError(err.message || 'Failed to load dataset from Supabase.')
        // Keep previous data so the UI does not go blank
      } finally {
        setLoading(false)
      }
    }

    await attempt(0)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Realtime: refetch when cholera_reports changes. Requires in Supabase:
  // Database → Replication → add cholera_reports to supabase_realtime publication.
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    const channel = supabase
      .channel('cholera_reports_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cholera_reports',
        },
        () => {
          fetchData()
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn(
            '[Cholera] Realtime not available. Enable it in Supabase: Database → Replication → add cholera_reports to supabase_realtime. Polling will refresh data every 45s.',
          )
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Polling fallback: refresh regularly so new rows appear even if Realtime isn't enabled
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return
    const interval = setInterval(fetchData, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  return { data, loading, error, minDate, maxDate, lastUpdatedAt, refetch: fetchData }
}

export default useCholeraData


