import { useState, useEffect, useMemo } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

function formatLiveAgo(date) {
  if (!date || !(date instanceof Date) || Number.isNaN(date.valueOf())) return null
  const sec = Math.floor((Date.now() - date.getTime()) / 1000)
  if (sec < 10) return 'Just now'
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const h = Math.floor(min / 60)
  return `${h}h ago`
}

const navLinks = [
  { to: '/', label: 'Overview', end: true, icon: 'overview' },
  { to: '/analytics', label: 'Analytics & Filters', end: false, icon: 'analytics' },
  { to: '/response-insights', label: 'Response Insights', end: false, icon: 'insights' },
  { to: '/early-warning', label: 'Early Warning', end: false, icon: 'warning' },
  { to: '/weather', label: 'Weather', end: false, icon: 'weather' },
  { to: '/resource-planning', label: 'Resource Planning', end: false, icon: 'planning' },
]

const icons = {
  overview: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  analytics: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  insights: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  warning: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  weather: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  planning: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  admin: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3.6 15a1.65 1.65 0 0 0-1.51-1H2a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 3.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 3.6a1.65 1.65 0 0 0 1-1.51V2a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 16 3.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.19.53.19 1.11 0 1.64A1.65 1.65 0 0 0 20.91 12H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
}

function Layout({ children, loading, summary, lastUpdatedAt }) {
  const totals = summary || { totalReports: 0, totalConfirmed: 0 }
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(true)
  const [liveLabel, setLiveLabel] = useState(() => formatLiveAgo(lastUpdatedAt))
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const isAdmin =
    !!profile && profile.status === 'approved' && profile.role === 'system_admin'

  const displayName = useMemo(() => {
    const name = profile?.full_name?.trim()
    if (name) return name
    return 'User'
  }, [profile])

  const initials = useMemo(() => {
    const base = (profile?.full_name || user?.email || 'U').trim()
    const parts = base.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return String(parts[0][0] || 'U').toUpperCase()
  }, [profile, user])

  useEffect(() => {
    setLiveLabel(formatLiveAgo(lastUpdatedAt))
    const t = setInterval(() => setLiveLabel(formatLiveAgo(lastUpdatedAt)), 15_000)
    return () => clearInterval(t)
  }, [lastUpdatedAt])

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <div className={`app-shell ${isDesktop ? 'app-shell--sidebar' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar__brand">
          <span className="sidebar__brand-primary">Health Intelligence</span>
          <strong className="sidebar__brand-accent">Platform</strong>
          <small className="sidebar__brand-tag">Cholera Watch</small>
        </div>
        <nav className="sidebar__nav" aria-label="Main navigation">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
              }
            >
              <span className="sidebar__icon">{icons[link.icon]}</span>
              <span className="sidebar__label">{link.label}</span>
            </NavLink>
          ))}
          {isAdmin && (
            <>
              <div className="sidebar__admin-label">Admin</div>
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `sidebar__link sidebar__link--admin ${
                    isActive ? 'sidebar__link--active' : ''
                  }`
                }
              >
                <span className="sidebar__icon">{icons.admin}</span>
                <span className="sidebar__label">Admin</span>
              </NavLink>
            </>
          )}
        </nav>
        <div className="sidebar__meta">
          {loading ? (
            <span>Loading data…</span>
          ) : (
            <>
              <span className="sidebar__live">
                <span className="sidebar__live-dot" aria-hidden="true" /> Data live
                {liveLabel && <span className="sidebar__live-ago"> · {liveLabel}</span>}
              </span>
              <span>{totals.totalReports.toLocaleString()} reports</span>
              <span>{totals.totalConfirmed.toLocaleString()} confirmed</span>
            </>
          )}
        </div>

        {user && (
          <div className="sidebar__account">
            <NavLink to="/profile" className="sidebar__account-link">
              <span className="sidebar__avatar" aria-hidden="true">{initials}</span>
              <span className="sidebar__account-text">
                <span className="sidebar__account-name">{displayName}</span>
                <span className="sidebar__account-role">{profile?.role || 'user'}</span>
              </span>
            </NavLink>
            <button
              type="button"
              className="sidebar__logout"
              onClick={async () => {
                try {
                  await signOut()
                } finally {
                  // Always redirect even if signOut fails/hangs
                  window.location.assign('/login')
                }
              }}
            >
              Log out
            </button>
          </div>
        )}
      </aside>

      <div className="top-nav top-nav--mobile">
        <div className="brand">
          <div className="brand-primary">
            <span>Health Intelligence</span>
            <strong>Platform</strong>
          </div>
          <small className="brand-secondary">Cholera Watch</small>
        </div>
        <div className="top-nav__actions">
          {user && (
            <NavLink to="/profile" className="top-nav__profile">
              <span className="top-nav__avatar" aria-hidden="true">{initials}</span>
              <span className="top-nav__name">{displayName}</span>
            </NavLink>
          )}
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className={mobileMenuOpen ? 'open' : ''} />
            <span className={mobileMenuOpen ? 'open' : ''} />
            <span className={mobileMenuOpen ? 'open' : ''} />
          </button>
        </div>
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              className="nav-links nav-links--mobile"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `nav-link-with-icon ${isActive ? 'active' : ''}`
                  }
                >
                  <span className="nav-link-icon">{icons[link.icon]}</span>
                  {link.label}
                </NavLink>
              ))}
              {isAdmin && (
                <>
                  <hr style={{ margin: '0.75rem 0', borderColor: '#e2e8f0' }} />
                  <NavLink
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `nav-link-with-icon nav-link-with-icon--admin ${
                        isActive ? 'active' : ''
                      }`
                    }
                  >
                    <span className="nav-link-icon">{icons.admin}</span>
                    Admin
                  </NavLink>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="nav-meta nav-meta--mobile">
          {loading ? (
            <span>Loading…</span>
          ) : (
            <>
              <span className="sidebar__live">
                <span className="sidebar__live-dot" aria-hidden="true" /> Live
                {liveLabel && <span className="sidebar__live-ago"> {liveLabel}</span>}
              </span>
              <span>{totals.totalReports.toLocaleString()} reports</span>
              <span>{totals.totalConfirmed.toLocaleString()} confirmed</span>
            </>
          )}
        </div>
      </div>

      <main className="main-content">{children}</main>
    </div>
  )
}

export default Layout
