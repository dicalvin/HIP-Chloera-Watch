import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const [magicLoading, setMagicLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')

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
      setError('Login failed. Please check your credentials and try again.')
      // eslint-disable-next-line no-console
      console.error('Supabase login error', signInError)
      return
    }

    const session = signInData?.session || (await supabase.auth.getSession()).data.session

    if (session?.user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role,status')
        .eq('id', session.user.id)
        .maybeSingle()

      if (profile && profile.status === 'approved' && profile.role === 'system_admin') {
        setLoading(false)
        navigate('/admin', { replace: true })
        return
      }
    }

    setLoading(false)
    navigate(from, { replace: true })
  }

  const handleForgotPassword = async () => {
    setError('')
    setNotice('')
    if (!email) {
      setError('Enter your email first so we can send a reset link.')
      return
    }
    setLoading(true)
    const redirectUrl = `${window.location.origin}/login`
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    })
    setLoading(false)
    if (resetError) {
      // eslint-disable-next-line no-console
      console.error('Supabase reset password error', resetError)
      setError('Unable to send reset email. Please try again.')
      return
    }
    setNotice('Password reset email sent. Check your inbox for the link.')
  }

  const handleMagicLink = async () => {
    setError('')
    setNotice('')
    if (!email) {
      setError('Enter your email to receive a magic sign-in link.')
      return
    }
    setMagicLoading(true)
    const redirectUrl = `${window.location.origin}/`
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    })
    setMagicLoading(false)
    if (otpError) {
      // eslint-disable-next-line no-console
      console.error('Supabase magic link error', otpError)
      setError('Unable to send magic link. Please try again.')
      return
    }
    setNotice('Magic sign-in link sent. Check your email to continue.')
  }

  return (
    <div className="page auth-page">
      <motion.div
        className="auth-shell auth-shell--centered"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <section className="auth-card chart-card">
          <div className="section-header">
            <h3>Welcome back</h3>
            <p>Access the Cholera Watch dashboard and administration tools.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* Email Field */}
              <div className="form-field">
                <label htmlFor="login-email" className="form-label">
                  <span className="label-text">📧 Email</span>
                  <span className="label-required">required</span>
                </label>
                <div className="input-wrapper">
                  <span className="input-icon"></span>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    placeholder="john@example.com"
                    className="form-input with-icon"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="form-field">
                <label htmlFor="login-password" className="form-label">
                  <span className="label-text">🔒 Password</span>
                  <span className="label-required">required</span>
                </label>
                <div className="input-wrapper">
                  <span className="input-icon"></span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    minLength={8}
                    placeholder="Enter your password"
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
                
                {/* Password Hint */}
                <p className="input-hint">Minimum 8 characters</p>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="checkbox"
                  />
                  <span className="checkbox-text">Remember me for 30 days</span>
                </label>
                
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="forgot-password-link"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="form-actions">
              <button
                type="submit"
                className="button primary login-button"
                disabled={loading}
              >
                {loading ? (
                  <span className="button-content">
                    <span className="spinner" />
                    Signing in...
                  </span>
                ) : (
                  <span className="button-content">
                    <span>Sign in to dashboard</span>
                    <span className="button-icon">→</span>
                  </span>
                )}
              </button>
            </div>
          </form>

          {notice && !error && (
            <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#15803d' }}>
              {notice}
            </p>
          )}

          {/* Error Message */}
          {error && (
            <motion.div 
              className="status-message error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="status-icon">⚠️</span>
              <div className="status-content">
                <span className="status-title">Login failed</span>
                <span className="status-text">{error}</span>
              </div>
            </motion.div>
          )}

          <div className="magic-link-section">
            <p className="magic-link-title">Prefer a one-time email link?</p>
            <button
              type="button"
              className="button secondary magic-link-button"
              onClick={handleMagicLink}
              disabled={magicLoading || loading}
            >
              {magicLoading ? 'Sending magic link…' : 'Send magic sign-in link'}
            </button>
          </div>

          {/* Quick Tips */}
          <div className="quick-tips">
            <p className="tips-title">💡 Quick tips</p>
            <ul className="tips-list">
              <li>Use your registered email address</li>
              <li>Password is case-sensitive</li>
              <li>Contact admin if you can't access</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="auth-footer">
            <p className="auth-footer-text">
              Need an account?
              {' '}
              <Link to="/signup" className="auth-link">Create one now</Link>
            </p>

            <p className="auth-footer-text" style={{ marginTop: '0.25rem' }}>
              System admin?
              {' '}
              <Link to="/admin-login" className="auth-link">Go to admin sign in</Link>
            </p>

            <div className="auth-divider">
              <span className="divider-text">or</span>
            </div>

            <p className="auth-footer-small">
              By signing in, you agree to our{' '}
              <a href="/terms" className="auth-link">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" className="auth-link">Privacy Policy</a>
            </p>
          </div>
        </section>
      </motion.div>

      <style jsx>{`
        .login-form {
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
          border-color: #0284c7;
          box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.1);
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
          color: #0284c7;
        }

        .input-hint {
          font-size: 0.75rem;
          color: #94a3b8;
          margin-top: 0.25rem;
        }

        /* Form Options */
        .form-options {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 0.5rem;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-size: 0.9rem;
          color: #475569;
        }

        .checkbox {
          width: 1rem;
          height: 1rem;
          border-radius: 0.25rem;
          border: 1px solid #cbd5e1;
          cursor: pointer;
          accent-color: #0284c7;
        }

        .checkbox-text {
          user-select: none;
        }

        .forgot-password-link {
          background: none;
          border: none;
          color: #0284c7;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.2s ease;
          text-decoration: none;
        }

        .forgot-password-link:hover {
          color: #0ea5e9;
          text-decoration: underline;
        }

        /* Form Actions */
        .form-actions {
          margin-top: 2rem;
        }

        .login-button {
          width: 100%;
          padding: 0.875rem;
          font-size: 1rem;
          font-weight: 600;
          background: linear-gradient(135deg, #0284c7, #0ea5e9);
          border: none;
          border-radius: 0.75rem;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .login-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);
        }

        .login-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .button-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .button-icon {
          font-size: 1.25rem;
          transition: transform 0.2s ease;
        }

        .login-button:hover .button-icon {
          transform: translateX(4px);
        }

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

        /* Status Message */
        .status-message {
          margin-top: 1.5rem;
          padding: 1rem;
          border-radius: 0.75rem;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          font-size: 0.95rem;
        }

        .status-message.error {
          background: #fef2f2;
          border: 1px solid #fee2e2;
        }

        .status-icon {
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .status-content {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .status-title {
          font-weight: 600;
          color: #991b1b;
        }

        .status-text {
          color: #b91c1c;
        }

        /* Quick Tips */
        .quick-tips {
          margin-top: 1.5rem;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
        }

        .tips-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: #475569;
          margin-bottom: 0.5rem;
        }

        .tips-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .tips-list li {
          font-size: 0.8rem;
          color: #64748b;
          padding: 0.25rem 0.75rem;
          background: white;
          border-radius: 2rem;
          border: 1px solid #e2e8f0;
        }

        /* Auth Footer */
        .auth-footer {
          margin-top: 1.5rem;
          text-align: center;
        }

        .magic-link-section {
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .magic-link-title {
          margin: 0;
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 500;
        }

        .magic-link-button {
          width: 100%;
          padding: 0.75rem;
          border-radius: 0.75rem;
          border: 1px solid #cbd5f5;
          background: linear-gradient(135deg, #eff6ff, #e0f2fe);
          color: #1d4ed8;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .magic-link-button:hover:not(:disabled) {
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
          transform: translateY(-1px);
        }

        .auth-footer-text {
          color: #64748b;
          font-size: 0.95rem;
        }

        .auth-divider {
          margin: 1rem 0;
          position: relative;
          text-align: center;
        }

        .auth-divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: #e2e8f0;
          z-index: 0;
        }

        .divider-text {
          position: relative;
          background: white;
          padding: 0 0.75rem;
          color: #94a3b8;
          font-size: 0.85rem;
          z-index: 1;
        }

        .auth-footer-small {
          font-size: 0.8rem;
          color: #94a3b8;
        }

        .auth-link {
          color: #0284c7;
          font-weight: 500;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .auth-link:hover {
          color: #0ea5e9;
          text-decoration: underline;
        }

        /* Responsive Adjustments */
        @media (max-width: 480px) {
          .form-options {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }

          .tips-list {
            flex-direction: column;
          }

          .tips-list li {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </div>
  )
}

export default Login