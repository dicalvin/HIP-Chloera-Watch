import { useState } from 'react'
import { motion } from 'framer-motion'
import Papa from 'papaparse'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

const EXPECTED_COLUMNS = [
  'Index',
  'Location',
  'TL',
  'TR',
  'deaths',
  'sCh',
  'cCh',
  'CFR',
  'reporting_date',
  'source_index',
  'source',
  'confidence_weight',
  'processing_notes',
  'source_database',
  'District',
  'Region',
]

const mapCsvRowToDb = (row) => ({
  index: row.Index ? Number(row.Index) : null,
  location: row.Location || null,
  tl: row.TL || null,
  tr: row.TR || null,
  deaths: row.deaths ? Number(row.deaths) : 0,
  sch: row.sCh ? Number(row.sCh) : 0,
  cch: row.cCh ? Number(row.cCh) : 0,
  cfr: row.CFR ? Number(row.CFR) : 0,
  reporting_date: row.reporting_date || null,
  source_index: row.source_index ? Number(row.source_index) : null,
  source: row.source || null,
  confidence_weight: row.confidence_weight
    ? Number(row.confidence_weight)
    : null,
  processing_notes: row.processing_notes || null,
  source_database: row.source_database || null,
  district: row.District || null,
  region: row.Region || null,
})

function DataAdmin() {
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setStatus('')
    setError('')

    if (!isSupabaseConfigured || !supabase) {
      setError(
        'Supabase is not configured. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.',
      )
      return
    }

    setIsUploading(true)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const { data: rows, errors: parseErrors, meta } = results

          if (parseErrors && parseErrors.length > 0) {
            setError(
              `CSV parse error on row ${parseErrors[0].row}: ${parseErrors[0].message}`,
            )
            setIsUploading(false)
            return
          }

          const headers = meta.fields || []
          const missing = EXPECTED_COLUMNS.filter(
            (col) => !headers.includes(col),
          )

          if (missing.length > 0) {
            setError(
              `CSV format mismatch. Missing columns: ${missing.join(
                ', ',
              )}. Expected columns: ${EXPECTED_COLUMNS.join(', ')}.`,
            )
            setIsUploading(false)
            return
          }

          const mapped = rows
            .map(mapCsvRowToDb)
            .filter((row) => row.index !== null)

          if (!mapped.length) {
            setError(
              'No valid rows with Index values were found in the CSV file.',
            )
            setIsUploading(false)
            return
          }

          // Upsert in chunks to avoid payload size limits
          const chunkSize = 500
          let processed = 0

          // eslint-disable-next-line no-plusplus
          for (let i = 0; i < mapped.length; i += chunkSize) {
            const chunk = mapped.slice(i, i + chunkSize)
            // eslint-disable-next-line no-await-in-loop
            const { error: upsertError } = await supabase
              .from('cholera_reports')
              .upsert(chunk, {
                onConflict: 'index',
              })

            if (upsertError) {
              throw upsertError
            }
            processed += chunk.length
          }

          setStatus(
            `Upload complete. Processed ${processed.toLocaleString()} rows (new and updated).`,
          )
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Supabase upsert error:', err)
          setError(
            err.message ||
              'Failed to upload data to Supabase. Please try again.',
          )
        } finally {
          setIsUploading(false)
        }
      },
      error: (err) => {
        setError(err.message || 'Failed to read CSV file.')
        setIsUploading(false)
      },
    })
  }

  return (
    <div className="page">
      <motion.section
        className="hero secondary"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <div>
          <p className="eyebrow">Data management</p>
          <h1>Cholera dataset administration</h1>
          <p className="lede">
            Upload incremental CSV updates. The system validates the format and
            upserts non-duplicate records into the Supabase{' '}
            <code>cholera_reports</code> table using <code>index_csv</code> as
            the unique key.
          </p>
        </div>
      </motion.section>

      <section className="chart-card">
        <div className="section-header">
          <h3>Upload CSV updates</h3>
          <p>
            Ensure your CSV has the exact columns:
            {' '}
            {EXPECTED_COLUMNS.join(', ')}
            .
          </p>
        </div>

        <div className="form-grid">
          <label htmlFor="csv-upload" className="button primary">
            {isUploading ? 'Uploading…' : 'Choose CSV file'}
            <input
              id="csv-upload"
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              disabled={isUploading}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {status && <p className="status-text">{status}</p>}
        {error && <p className="status-text error">{error}</p>}

        {!isSupabaseConfigured && (
          <p className="status-text error">
            Supabase is not configured. Add
            {' '}
            <code>VITE_SUPABASE_URL</code>
            {' '}
            and
            {' '}
            <code>VITE_SUPABASE_ANON_KEY</code>
            {' '}
            to your
            {' '}
            <code>.env</code>
            {' '}
            file and restart the dev server.
          </p>
        )}
      </section>
    </div>
  )
}

export default DataAdmin


