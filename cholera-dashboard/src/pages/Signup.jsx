import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'

function Signup() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [requestedRole, setRequestedRole] = useState('data_entry')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const navigate = useNavigate()

  const checkPasswordStrength = (pass) => {
    let strength = 0
    if (pass.length >= 8) strength += 25
    if (pass.match(/[a-z]+/)) strength += 25
    if (pass.match(/[A-Z]+/)) strength += 25
    if (pass.match(/[0-9]+/) || pass.match(/[$@#&!]+/)) strength += 25
    setPasswordStrength(strength)
  }

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value
    setPassword(newPassword)
    checkPasswordStrength(newPassword)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setStatus('')

    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required.')
      return
    }

    if (!email || !password) {
      setError('Email and password are required.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })

    if (signUpError) {
      setLoading(false)
      setError('Sign up failed. Please try again with a different email.')
      // eslint-disable-next-line no-console
      console.error('Supabase signup error', signUpError)
      return
    }

    if (data.user) {
      const full_name = `${firstName.trim()} ${lastName.trim()}`.trim()
      const { error: profileError } = await supabase.from('user_profiles').insert({
        id: data.user.id,
        email,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name,
        phone: phone.trim() || null,
        requested_role: requestedRole,
        role: 'data_entry',
        status: 'pending',
      })
      if (profileError) {
        // eslint-disable-next-line no-console
        console.error('Failed to create user profile', profileError)
      }
    }

    setLoading(false)
    setStatus('Account created. Please check your email to verify and wait for admin approval.')
    // Navigate to login after a short delay
    setTimeout(() => navigate('/login'), 2000)
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 25) return 'bg-red-500'
    if (passwordStrength <= 50) return 'bg-orange-500'
    if (passwordStrength <= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 25) return 'Weak'
    if (passwordStrength <= 50) return 'Fair'
    if (passwordStrength <= 75) return 'Good'
    return 'Strong'
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
            <h3>Create an account</h3>
            <p>Request access to the Cholera Watch dashboard. An admin will approve your role.</p>
          </div>

          <form className="signup-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* First Name Field */}
              <div className="form-field">
                <label htmlFor="signup-first-name" className="form-label">
                  <span className="label-text">👤 First name</span>
                  <span className="label-required">required</span>
                </label>
                <div className="input-wrapper">
                  <span className="input-icon"></span>
                  <input
                    id="signup-first-name"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                    placeholder="John"
                    className="form-input with-icon"
                    required
                  />
                </div>
              </div>

              {/* Last Name Field */}
              <div className="form-field">
                <label htmlFor="signup-last-name" className="form-label">
                  <span className="label-text">👤 Last name</span>
                  <span className="label-required">required</span>
                </label>
                <div className="input-wrapper">
                  <span className="input-icon"></span>
                  <input
                    id="signup-last-name"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                    placeholder="Doe"
                    className="form-input with-icon"
                    required
                  />
                </div>
              </div>

              {/* Role Field (requested) */}
              <div className="form-field">
                <label htmlFor="signup-role" className="form-label">
                  <span className="label-text">🧩 Requested role</span>
                  <span className="label-required">required</span>
                </label>
                <div className="input-wrapper">
                  <span className="input-icon"></span>
                  <select
                    id="signup-role"
                    value={requestedRole}
                    onChange={(e) => setRequestedRole(e.target.value)}
                    className="form-input with-icon"
                    required
                  >
                    <option value="data_entry">Data Entry</option>
                    <option value="epidemiologist">Epidemiologist</option>
                    <option value="surveillance">Surveillance</option>
                    <option value="data_manager">Data Manager</option>
                    <option value="system_admin">System Admin</option>
                  </select>
                </div>
                <p className="field-hint">
                  Your account will remain <strong>pending</strong> until a System Admin approves and assigns access.
                </p>
              </div>

              {/* Phone Field */}
              <div className="form-field">
                <label htmlFor="signup-phone" className="form-label">
                  <span className="label-text">📱 Phone number</span>
                  <span className="label-optional">optional</span>
                </label>
                <div className="input-wrapper">
                  <span className="input-icon"></span>
                  <input
                    id="signup-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    placeholder="+256 7XX XXX XXX"
                    className="form-input with-icon"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="form-field">
                <label htmlFor="signup-email" className="form-label">
                  <span className="label-text">📧 Email</span>
                  <span className="label-required">required</span>
                </label>
                <div className="input-wrapper">
                  <span className="input-icon"></span>
                  <input
                    id="signup-email"
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

              {/* Password Field with Strength Meter */}
              <div className="form-field">
                <label htmlFor="signup-password" className="form-label">
                  <span className="label-text">🔒Password</span>
                  <span className="label-required">required</span>
                </label>
                <div className="input-wrapper">
                  <span className="input-icon"></span>
                  <input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={handlePasswordChange}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    placeholder="Min. 8 characters"
                    className="form-input with-icon"
                  />
                </div>
                
                {/* Password Strength Meter */}
                {password && (
                  <div className="password-strength">
                    <div className="strength-bar-container">
                      <div 
                        className={`strength-bar ${getPasswordStrengthColor()}`}
                        style={{ width: `${passwordStrength}%` }}
                      />
                    </div>
                    <span className={`strength-text ${getPasswordStrengthColor().replace('bg-', 'text-')}`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                )}

                {/* Password Requirements */}
                <div className="password-requirements">
                  <div className={`requirement ${password.length >= 8 ? 'met' : ''}`}>
                    <span className="requirement-icon">
                      {password.length >= 8 ? '✓' : '○'}
                    </span>
                    At least 8 characters
                  </div>
                  <div className={`requirement ${password.match(/[a-z]+/) ? 'met' : ''}`}>
                    <span className="requirement-icon">
                      {password.match(/[a-z]+/) ? '✓' : '○'}
                    </span>
                    One lowercase letter
                  </div>
                  <div className={`requirement ${password.match(/[A-Z]+/) ? 'met' : ''}`}>
                    <span className="requirement-icon">
                      {password.match(/[A-Z]+/) ? '✓' : '○'}
                    </span>
                    One uppercase letter
                  </div>
                  <div className={`requirement ${password.match(/[0-9]+/) || password.match(/[$@#&!]+/) ? 'met' : ''}`}>
                    <span className="requirement-icon">
                      {password.match(/[0-9]+/) || password.match(/[$@#&!]+/) ? '✓' : '○'}
                    </span>
                    One number or special character
                  </div>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="form-field">
                <label htmlFor="signup-password-confirm" className="form-label">
                  <span className="label-text">🔐 Confirm password</span>
                  <span className="label-required">required</span>
                </label>
                <div className="input-wrapper">
                  <span className="input-icon"></span>
                  <input
                    id="signup-password-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    placeholder="Re-enter your password"
                    className={`form-input with-icon ${
                      confirmPassword && password !== confirmPassword ? 'error' : ''
                    }`}
                  />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="field-error">Passwords do not match</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="form-actions">
              <button
                type="submit"
                className="button primary signup-button"
                disabled={loading}
              >
                {loading ? (
                  <span className="button-content">
                    <span className="spinner" />
                    Creating account...
                  </span>
                ) : (
                  <span className="button-content">
                    <span>Sign up</span>
                    <span className="button-icon">→</span>
                  </span>
                )}
              </button>
            </div>
          </form>

          {/* Status Messages */}
          {error && (
            <motion.div 
              className="status-message error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="status-icon">⚠️</span>
              <span>{error}</span>
            </motion.div>
          )}
          
          {status && (
            <motion.div 
              className="status-message success"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="status-icon">✅</span>
              <span>{status}</span>
            </motion.div>
          )}

          {/* Footer */}
          <div className="auth-footer">
            <p className="auth-footer-text">
              Already have an account?
              {' '}
              <Link to="/login" className="auth-link">Sign in</Link>
            </p>
          </div>
        </section>
      </motion.div>

      <style jsx>{`
        .signup-form {
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

        .label-optional {
          font-size: 0.75rem;
          padding: 0.125rem 0.5rem;
          background: #e2e8f0;
          color: #475569;
          border-radius: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
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

        .field-hint {
          margin: 0.35rem 0 0;
          font-size: 0.85rem;
          color: #64748b;
          line-height: 1.4;
        }

        .form-input:focus {
          outline: none;
          border-color: #0284c7;
          box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.1);
        }

        .form-input.error {
          border-color: #ef4444;
        }

        .form-input.error:focus {
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }

        .field-error {
          font-size: 0.875rem;
          color: #ef4444;
          margin-top: 0.25rem;
        }

        /* Password Strength Meter */
        .password-strength {
          margin-top: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .strength-bar-container {
          flex: 1;
          height: 0.375rem;
          background: #e2e8f0;
          border-radius: 1rem;
          overflow: hidden;
        }

        .strength-bar {
          height: 100%;
          transition: width 0.3s ease, background-color 0.3s ease;
        }

        .strength-text {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Password Requirements */
        .password-requirements {
          margin-top: 0.75rem;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
          background: #f8fafc;
          padding: 0.75rem;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
        }

        .requirement {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.75rem;
          color: #94a3b8;
          transition: color 0.2s ease;
        }

        .requirement.met {
          color: #10b981;
        }

        .requirement-icon {
          font-size: 0.875rem;
        }

        /* Form Actions */
        .form-actions {
          margin-top: 2rem;
        }

        .signup-button {
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

        .signup-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);
        }

        .signup-button:disabled {
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

        .signup-button:hover .button-icon {
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

        /* Status Messages */
        .status-message {
          margin-top: 1.5rem;
          padding: 1rem;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.95rem;
        }

        .status-message.error {
          background: #fef2f2;
          border: 1px solid #fee2e2;
          color: #991b1b;
        }

        .status-message.success {
          background: #f0fdf4;
          border: 1px solid #dcfce7;
          color: #166534;
        }

        .status-icon {
          font-size: 1.25rem;
        }

        /* Auth Footer */
        .auth-footer {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e2e8f0;
          text-align: center;
        }

        .auth-footer-text {
          color: #64748b;
          font-size: 0.95rem;
        }

        .auth-link {
          color: #0284c7;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .auth-link:hover {
          color: #0ea5e9;
          text-decoration: underline;
        }

        /* Responsive Adjustments */
        @media (min-width: 640px) {
          .password-requirements {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        @media (max-width: 480px) {
          .password-requirements {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

export default Signup