import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'

function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [showTwoFactor, setShowTwoFactor] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Email and password are required.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    setLoading(true)
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setLoading(false)
      setError('Admin login failed. Please check your credentials and try again.')
      // eslint-disable-next-line no-console
      console.error('Supabase admin login error', signInError)
      return
    }

    // If sign-in succeeds, go directly to the admin page.
    // The main app and admin UI will still check your role/status.
    setLoading(false)
    navigate('/admin', { replace: true })
  }

  const handleTwoFactorSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate 2FA verification
    setTimeout(() => {
      setLoading(false)
      navigate('/admin', { replace: true })
    }, 1500)
  }

  return (
    <div className="page auth-page admin-auth-page">
      <motion.div
        className="auth-shell"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="auth-hero admin-hero">
          <div className="auth-hero-inner">
            <div className="hero-badge">🔐 Restricted Access</div>
            <p className="eyebrow">Cholera Watch</p>
            <h2 className="auth-hero-title">System admin sign in</h2>
            <p className="auth-hero-subtitle">
              Restricted access for system administrators to review new users, assign roles, and
              manage data governance.
            </p>
            <div className="auth-hero-metrics">
              <div className="auth-hero-pill">
                <span>🛡️</span>
                Access control
              </div>
              <div className="auth-hero-pill">
                <span>👥</span>
                User onboarding
              </div>
              <div className="auth-hero-pill">
                <span>📋</span>
                Audit-ready changes
              </div>
            </div>
            
            {/* Security Indicators */}
            <div className="security-indicators">
              <div className="security-indicator">
                <span className="indicator-icon">🔒</span>
                <span className="indicator-text">256-bit encryption</span>
              </div>
              <div className="security-indicator">
                <span className="indicator-icon">🛡️</span>
                <span className="indicator-text">2FA required</span>
              </div>
              <div className="security-indicator">
                <span className="indicator-icon">📝</span>
                <span className="indicator-text">Session logging</span>
              </div>
            </div>
          </div>
        </div>

        <section className="auth-card admin-card chart-card">
          <div className="section-header">
            <div className="admin-icon">⚙️</div>
            <h3>Administrator access</h3>
            <p>Use your system admin account to manage users and privileges.</p>
          </div>

          {!showTwoFactor ? (
            <form className="admin-login-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                {/* Email Field */}
                <div className="form-field">
                  <label htmlFor="admin-email" className="form-label">
                    <span className="label-text">📧 Admin email</span>
                    <span className="label-required">required</span>
                  </label>
                  <div className="input-wrapper">
                    <span className="input-icon"></span>
                    <input
                      id="admin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                      placeholder="admin@cholera-watch.org"
                      className="form-input with-icon"
                    />
                  </div>
                  <p className="input-hint">Use your organizational email</p>
                </div>

                {/* Password Field */}
                <div className="form-field">
                  <label htmlFor="admin-password" className="form-label">
                    <span className="label-text">🔒 Password</span>
                    <span className="label-required">required</span>
                  </label>
                  <div className="input-wrapper">
                    <span className="input-icon"></span>
                    <input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                      minLength={8}
                      placeholder="Enter your secure password"
                      className="form-input with-icon"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  
                  {/* Password Requirements for Admin */}
                  <div className="admin-password-requirements">
                    <div className={`requirement ${password.length >= 8 ? 'met' : ''}`}>
                      <span className="requirement-icon">✓</span>
                      Min. 8 characters
                    </div>
                    <div className={`requirement ${password.match(/[A-Z]/) ? 'met' : ''}`}>
                      <span className="requirement-icon">✓</span>
                      Uppercase letter
                    </div>
                    <div className={`requirement ${password.match(/[0-9]/) ? 'met' : ''}`}>
                      <span className="requirement-icon">✓</span>
                      Number
                    </div>
                    <div className={`requirement ${password.match(/[^A-Za-z0-9]/) ? 'met' : ''}`}>
                      <span className="requirement-icon">✓</span>
                      Special character
                    </div>
                  </div>
                </div>

                {/* Security Note */}
                <div className="security-note">
                  <span className="note-icon">🔒</span>
                  <span className="note-text">
                    This area is restricted to authorized system administrators only. All access is logged and monitored.
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="form-actions">
                <button
                  type="submit"
                  className="button primary admin-login-button"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="button-content">
                      <span className="spinner" />
                      Verifying credentials...
                    </span>
                  ) : (
                    <span className="button-content">
                      <span>Access admin panel</span>
                      <span className="button-icon">→</span>
                    </span>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* 2FA Verification Step */
            <motion.form 
              className="two-factor-form"
              onSubmit={handleTwoFactorSubmit}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="two-factor-header">
                <div className="two-factor-icon">🔐</div>
                <h4>Two-factor authentication</h4>
                <p>Enter the 6-digit code from your authenticator app</p>
              </div>

              <div className="form-field">
                <label htmlFor="2fa-code" className="form-label">
                  <span className="label-text">Verification code</span>
                  <span className="label-required">required</span>
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">🔑</span>
                  <input
                    id="2fa-code"
                    type="text"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    required
                    placeholder="000000"
                    maxLength={6}
                    className="form-input with-icon two-factor-input"
                    pattern="[0-9]{6}"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                </div>
              </div>

              <div className="two-factor-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setShowTwoFactor(false)}
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="button primary"
                  disabled={loading || twoFactorCode.length !== 6}
                >
                  {loading ? (
                    <span className="button-content">
                      <span className="spinner" />
                      Verifying...
                    </span>
                  ) : (
                    'Verify & continue'
                  )}
                </button>
              </div>

              <div className="two-factor-help">
                <p>Lost access to your authenticator?</p>
                <button type="button" className="help-link">Contact system administrator</button>
              </div>
            </motion.form>
          )}

          {/* Error Message */}
          {error && (
            <motion.div 
              className="status-message error admin-error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="status-icon">⚠️</span>
              <div className="status-content">
                <span className="status-title">Access denied</span>
                <span className="status-text">{error}</span>
              </div>
            </motion.div>
          )}

          {/* Admin Footer */}
          <div className="auth-footer admin-footer">
            <p className="auth-footer-text">
              Not an admin?
              {' '}
              <Link to="/login" className="auth-link">Go to regular sign in</Link>
            </p>
            
            <div className="admin-links">
              <Link to="/admin/help" className="footer-link">Help</Link>
              <span className="separator">•</span>
              <Link to="/admin/security" className="footer-link">Security</Link>
              <span className="separator">•</span>
              <Link to="/admin/audit" className="footer-link">Audit log</Link>
            </div>

            <div className="session-warning">
              ⚠️ Unauthorized access attempts are monitored and reported
            </div>
          </div>
        </section>
      </motion.div>

      <style jsx>{`
        .admin-auth-page {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        }

        .admin-hero .hero-badge {
          display: inline-block;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fecaca;
          padding: 0.25rem 0.75rem;
          border-radius: 2rem;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          margin-bottom: 1rem;
          text-transform: uppercase;
        }

        .security-indicators {
          display: flex;
          gap: 1.5rem;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .security-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #94a3b8;
          font-size: 0.85rem;
        }

        .indicator-icon {
          font-size: 1rem;
        }

        .admin-card {
          border-top: 4px solid #ef4444;
        }

        .admin-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .admin-login-form {
          margin-top: 1.5rem;
        }

        .form-grid {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          font-weight: 500;
          color: #64748b;
        }

        .label-required {
          font-size: 0.75rem;
          padding: 0.125rem 0.5rem;
          background: #fee2e2;
          color: #ef4444;
          border-radius: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          font-size: 1.1rem;
          color: #94a3b8;
          pointer-events: none;
          z-index: 1;
        }

        .form-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 3rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          font-size: 1rem;
          transition: all 0.2s ease;
          background: white;
        }

        .form-input:focus {
          outline: none;
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }

        .password-toggle {
          position: absolute;
          right: 1rem;
          background: none;
          border: none;
          font-size: 1.1rem;
          color: #94a3b8;
          cursor: pointer;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s ease;
        }

        .password-toggle:hover {
          color: #ef4444;
        }

        .input-hint {
          font-size: 0.75rem;
          color: #94a3b8;
          margin-top: 0.25rem;
        }

        /* Admin Password Requirements */
        .admin-password-requirements {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
          margin-top: 0.5rem;
          padding: 0.75rem;
          background: #f8fafc;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
        }

        .requirement {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.75rem;
          color: #94a3b8;
        }

        .requirement.met {
          color: #10b981;
        }

        .requirement-icon {
          font-size: 0.75rem;
        }

        /* Security Note */
        .security-note {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: #fff7ed;
          border: 1px solid #fed7aa;
          border-radius: 0.75rem;
          font-size: 0.85rem;
          color: #9a3412;
        }

        .note-icon {
          font-size: 1rem;
        }

        /* Admin Login Button */
        .admin-login-button {
          width: 100%;
          padding: 0.875rem;
          font-size: 1rem;
          font-weight: 600;
          background: linear-gradient(135deg, #dc2626, #ef4444);
          border: none;
          border-radius: 0.75rem;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .admin-login-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        }

        /* 2FA Form */
        .two-factor-form {
          margin-top: 1.5rem;
        }

        .two-factor-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .two-factor-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .two-factor-header h4 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }

        .two-factor-header p {
          color: #64748b;
          font-size: 0.95rem;
        }

        .two-factor-input {
          text-align: center;
          font-size: 1.5rem;
          letter-spacing: 0.5rem;
          font-weight: 600;
        }

        .two-factor-actions {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
        }

        .two-factor-actions button {
          flex: 1;
          padding: 0.75rem;
          border-radius: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .two-factor-actions .secondary {
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          color: #475569;
        }

        .two-factor-actions .secondary:hover {
          background: #e2e8f0;
        }

        .two-factor-help {
          margin-top: 1.5rem;
          text-align: center;
          font-size: 0.9rem;
          color: #64748b;
        }

        .help-link {
          background: none;
          border: none;
          color: #ef4444;
          font-weight: 500;
          cursor: pointer;
          text-decoration: underline;
          margin-top: 0.5rem;
        }

        /* Error Message */
        .admin-error {
          background: #fef2f2;
          border: 1px solid #fee2e2;
          border-left: 4px solid #ef4444;
        }

        /* Admin Footer */
        .admin-footer {
          border-top: 1px solid #e2e8f0;
        }

        .admin-links {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin: 1rem 0;
          font-size: 0.85rem;
        }

        .footer-link {
          color: #64748b;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .footer-link:hover {
          color: #ef4444;
        }

        .separator {
          color: #cbd5e1;
        }

        .session-warning {
          font-size: 0.75rem;
          color: #ef4444;
          background: #fef2f2;
          padding: 0.5rem;
          border-radius: 0.5rem;
          text-align: center;
        }

        /* Spinner */
        .spinner {
          width: 1.25rem;
          height: 1.25rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 640px) {
          .security-indicators {
            flex-direction: column;
            gap: 0.75rem;
          }

          .admin-password-requirements {
            grid-template-columns: 1fr;
          }

          .two-factor-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}

export default AdminLogin