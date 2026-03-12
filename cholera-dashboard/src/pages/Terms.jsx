import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

function Terms() {
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
          <h3>Terms of Service</h3>
          <p>
            These Terms govern access to and use of the Cholera Watch surveillance dashboard and
            related services.
          </p>
        </div>

        <div className="legal-content">
          <h4>1. Purpose</h4>
          <p>
            Cholera Watch supports public health surveillance, analytics, early warning, and
            coordination. It is intended for authorized users (e.g., surveillance teams, data
            managers, epidemiologists, and administrators).
          </p>

          <h4>2. Eligibility and accounts</h4>
          <p>
            You must create an account and be approved by a System Administrator to access protected
            features. You are responsible for maintaining the confidentiality of your credentials
            and for all activity under your account.
          </p>

          <h4>3. Acceptable use</h4>
          <ul>
            <li>Use the system only for lawful public health and operational purposes.</li>
            <li>Do not attempt to bypass role-based access controls or security protections.</li>
            <li>Do not upload malicious content or attempt to disrupt service availability.</li>
            <li>
              Do not share access, export data, or disclose insights outside your authorized scope
              without permission from your organization.
            </li>
          </ul>

          <h4>4. Data integrity</h4>
          <p>
            Where you are permitted to add or update records, you agree to enter data accurately
            and promptly. Administrative users may review, correct, or revoke access if misuse or
            data quality issues are detected.
          </p>

          <h4>5. Analytics and model outputs</h4>
          <p>
            Forecasts and risk indicators are decision-support tools. They may be incomplete or
            inaccurate due to reporting delays, missing data, or model limitations. You should
            validate outputs against operational context and official guidance before taking action.
          </p>

          <h4>6. Availability and changes</h4>
          <p>
            We may modify, suspend, or discontinue features to maintain safety, performance, and
            compliance. We may update these Terms from time to time; continued use after updates
            means you accept the revised Terms.
          </p>

          <h4>7. Security</h4>
          <p>
            You agree not to probe, scan, test vulnerabilities, or reverse engineer the service. If
            you suspect unauthorized access, notify your System Administrator immediately.
          </p>

          <h4>8. Contact</h4>
          <p>
            For access requests, role changes, or security concerns, contact your organization’s
            designated Cholera Watch System Administrator.
          </p>
        </div>

        <div className="legal-footer">
          <Link className="button small legal-back" to="/login">
            Back to login
          </Link>
          <Link className="auth-link" to="/privacy">
            View Privacy Policy
          </Link>
        </div>
      </motion.section>
    </div>
  )
}

export default Terms

