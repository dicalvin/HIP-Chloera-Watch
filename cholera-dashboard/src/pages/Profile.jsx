import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

function getInitials(nameOrEmail) {
  if (!nameOrEmail) return 'U'
  const parts = String(nameOrEmail).trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return String(parts[0][0] || 'U').toUpperCase()
}

function Profile() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  const [newEmail, setNewEmail] = useState('')
  const [emailStatus, setEmailStatus] = useState('')
  const [emailError, setEmailError] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)

  const displayName =
    profile?.full_name?.trim() || 'User'
  const initials = getInitials(profile?.full_name || user?.email)

  const handleLogout = async () => {
    try {
      await signOut()
    } finally {
      window.location.assign('/login')
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordStatus('')
    setPasswordError('')

    if (!newPassword || !confirmPassword) {
      setPasswordError('Please enter and confirm your new password.')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }

    setPasswordLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordLoading(false)
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Password update error', error)
      setPasswordError('Unable to update password. Please try again.')
      return
    }

    setNewPassword('')
    setConfirmPassword('')
    setPasswordStatus('Password updated successfully.')
  }

  const handleChangeEmail = async (e) => {
    e.preventDefault()
    setEmailStatus('')
    setEmailError('')

    if (!newEmail) {
      setEmailError('Please enter the new email address.')
      return
    }

    setEmailLoading(true)
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    setEmailLoading(false)
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Email update error', error)
      setEmailError('Unable to start email change. Please try again.')
      return
    }

    setEmailStatus('Check your new email inbox to confirm this change.')
  }

  return (
    <div className="page">
      <motion.section
        className="hero hero--secondary"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div>
          <p className="eyebrow">Account</p>
          <h1>Profile</h1>
          <p className="lede">Your account details and access level in the system.</p>
        </div>
      </motion.section>

      <section className="chart-card">
        <div className="profile-header">
          <div className="profile-avatar" aria-hidden="true">
            {initials}
          </div>
          <div className="profile-title">
            <h3 style={{ margin: 0 }}>{displayName}</h3>
            <p style={{ margin: 0, color: '#64748b', fontWeight: 600 }}>
              {profile?.role || '—'} {profile?.status ? `· ${profile.status}` : ''}
            </p>
          </div>
        </div>

        <div className="profile-details">
          <div className="profile-detail-row">
            <span className="profile-detail-label">First name</span>
            <span className="profile-detail-value">{profile?.first_name || '—'}</span>
          </div>
          <div className="profile-detail-row">
            <span className="profile-detail-label">Last name</span>
            <span className="profile-detail-value">{profile?.last_name || '—'}</span>
          </div>
          <div className="profile-detail-row">
            <span className="profile-detail-label">Full name</span>
            <span className="profile-detail-value">{profile?.full_name || '—'}</span>
          </div>
          <div className="profile-detail-row">
            <span className="profile-detail-label">Email</span>
            <span className="profile-detail-value">{user?.email || profile?.email || '—'}</span>
          </div>
          <div className="profile-detail-row">
            <span className="profile-detail-label">Phone</span>
            <span className="profile-detail-value">{profile?.phone || '—'}</span>
          </div>
          <div className="profile-detail-row">
            <span className="profile-detail-label">Requested role</span>
            <span className="profile-detail-value">{profile?.requested_role || '—'}</span>
          </div>
          <div className="profile-detail-row">
            <span className="profile-detail-label">Role</span>
            <span className="profile-detail-value">{profile?.role || '—'}</span>
          </div>
          <div className="profile-detail-row">
            <span className="profile-detail-label">Status</span>
            <span className="profile-detail-value">{profile?.status || '—'}</span>
          </div>
        </div>

        <div className="profile-actions" style={{ marginTop: '1.5rem', flexDirection: 'column', gap: '1rem', alignItems: 'stretch' }}>
          <div className="profile-security-card">
            <h4>Security</h4>
            <form onSubmit={handleChangePassword} className="profile-form">
              <label className="profile-form-label">
                New password
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  placeholder="Enter a new password"
                />
              </label>
              <label className="profile-form-label">
                Confirm password
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  placeholder="Re-enter new password"
                />
              </label>
              {passwordError && (
                <p className="profile-form-error">{passwordError}</p>
              )}
              {passwordStatus && !passwordError && (
                <p className="profile-form-success">{passwordStatus}</p>
              )}
              <button
                type="submit"
                className="button small"
                disabled={passwordLoading}
              >
                {passwordLoading ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </div>

          <div className="profile-security-card">
            <h4>Contact email</h4>
            <form onSubmit={handleChangeEmail} className="profile-form">
              <label className="profile-form-label">
                New email address
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="new-email@example.com"
                />
              </label>
              {emailError && (
                <p className="profile-form-error">{emailError}</p>
              )}
              {emailStatus && !emailError && (
                <p className="profile-form-success">{emailStatus}</p>
              )}
              <button
                type="submit"
                className="button small secondary"
                disabled={emailLoading}
              >
                {emailLoading ? 'Sending confirmation…' : 'Request email change'}
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="button primary" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Profile

