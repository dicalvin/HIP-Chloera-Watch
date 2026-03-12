import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Papa from 'papaparse'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

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
  const [users, setUsers] = useState([])
  const [userError, setUserError] = useState('')
  const [userLoading, setUserLoading] = useState(false)

  const { user, profile } = useAuth()

  const isAdmin =
    !!profile && profile.status === 'approved' && profile.role === 'system_admin'

  const loadUsers = async () => {
    if (!isAdmin) return
    setUserLoading(true)
    setUserError('')
    const { data, error: usersError } = await supabase
      .from('user_profiles')
      .select('id,email,first_name,last_name,full_name,phone,requested_role,role,status,created_at')
      .order('created_at', { ascending: true })
    setUserLoading(false)
    if (usersError) {
      setUserError(usersError.message)
      return
    }
    setUsers(data || [])
  }

  useEffect(() => {
    if (isAdmin) {
      loadUsers()
    }
  }, [isAdmin])

  const updateUser = async (id, changes) => {
    setUserError('')
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update(changes)
      .eq('id', id)
    if (updateError) {
      setUserError(updateError.message)
      return
    }
    await loadUsers()
  }

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
      {user && (
        <p className="status-text" style={{ marginBottom: '0.75rem' }}>
          Signed in as
          {' '}
          <strong>{user.email}</strong>
          {profile && ` (${profile.role}, ${profile.status})`}
        </p>
      )}
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
            Review and manage user access to the Cholera Watch dashboard. Approve new accounts and
            adjust roles for data entry, surveillance, and administration.
          </p>
        </div>
      </motion.section>

      {isAdmin && (
        <section className="chart-card">
          <div className="section-header">
            <h3>User access management</h3>
            <p>Review new signups, approve or decline access, and adjust roles.</p>
          </div>

          {userLoading ? (
            <p className="status-text">Loading users…</p>
          ) : (
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Requested</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.email}</td>
                      <td>{u.full_name || '-'}</td>
                      <td>{u.phone || '-'}</td>
                      <td>{u.requested_role || '-'}</td>
                      <td>
                        <select
                          className="admin-role-select"
                          value={u.role}
                          onChange={(e) => updateUser(u.id, { role: e.target.value })}
                        >
                          <option value="data_entry">Data Entry</option>
                          <option value="epidemiologist">Epidemiologist</option>
                          <option value="surveillance">Surveillance</option>
                          <option value="data_manager">Data Manager</option>
                          <option value="system_admin">System Admin</option>
                        </select>
                      </td>
                      <td>{u.status}</td>
                      <td>
                        <div className="button-row">
                          <button
                            type="button"
                            className="button small admin-action admin-action--primary"
                            onClick={() => updateUser(u.id, { status: 'approved' })}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="button small admin-action admin-action--secondary"
                            onClick={() => updateUser(u.id, { status: 'rejected' })}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {userError && <p className="status-text error">{userError}</p>}
        </section>
      )}
    </div>
  )
}

export default DataAdmin


