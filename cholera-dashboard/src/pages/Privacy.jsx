import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

function Privacy() {
  return (
    <div className="page legal-page">
      <motion.section
        className="chart-card legal-card"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <div className="section-header">
          <p className="eyebrow">Cholera Watch</p>
          <h3>Privacy Policy</h3>
          <p>
            This Policy explains how Cholera Watch handles account information and operational
            surveillance data.
          </p>
        </div>

        <div className="legal-content">
          <h4>1. What we collect</h4>
          <ul>
            <li>
              <strong>Account data</strong>: name fields, email, requested role, phone (optional),
              role and approval status.
            </li>
            <li>
              <strong>Usage and security data</strong>: authentication events and basic technical
              logs needed to operate and secure the service.
            </li>
            <li>
              <strong>Surveillance records</strong>: cholera reporting metrics stored in the project
              database for analytics and monitoring.
            </li>
          </ul>

          <h4>2. How we use information</h4>
          <ul>
            <li>Authenticate users and enforce role-based access controls.</li>
            <li>Support outbreak monitoring, analytics, and operational decision support.</li>
            <li>Maintain reliability, prevent abuse, and improve data quality.</li>
          </ul>

          <h4>3. Data access and sharing</h4>
          <p>
            Access is restricted to authorized users based on roles and approval status. Data may
            be shared within your organization for public health operations. Any external sharing
            should follow your organization’s policies and applicable laws.
          </p>

          <h4>4. Data retention</h4>
          <p>
            We retain information for as long as needed for surveillance operations, auditing, and
            compliance. Administrators may deactivate accounts and manage records according to the
            organization’s retention rules.
          </p>

          <h4>5. Security</h4>
          <p>
            We use authentication, access controls, and database security policies to protect data.
            No system is risk-free; please use strong passwords and report suspicious activity.
          </p>

          <h4>6. Your choices</h4>
          <ul>
            <li>You can request role changes through a System Administrator.</li>
            <li>You can request correction of your profile information if it is inaccurate.</li>
          </ul>

          <h4>7. Contact</h4>
          <p>
            For privacy questions or account changes, contact your organization’s designated
            Cholera Watch System Administrator.
          </p>
        </div>

        <div className="legal-footer">
          <Link className="button small legal-back" to="/login">
            Back to login
          </Link>
          <Link className="auth-link" to="/terms">
            View Terms of Service
          </Link>
        </div>
      </motion.section>
    </div>
  )
}

export default Privacy

