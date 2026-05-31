import { Link } from 'react-router-dom'

function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-black text-text-primary flex flex-col relative overflow-hidden" style={{ fontFamily: "'Courier New', monospace" }}>
      {/* Background with synthwave styling */}
      <div className="fixed inset-0 bg-gradient-to-br from-violet-900/20 to-black pointer-events-none" />
      
      {/* Header */}
      <header className="h-20 border-b border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between px-8 relative z-10">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer group"
          >
            <span className="text-white/50 group-hover:text-violet-400 transition-colors">←</span>
          </Link>
          <h2 className="text-xl font-bold tracking-tight text-white italic">
            LEGAL <span className="text-violet-400">DOCUMENTS</span>
          </h2>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-8 relative z-10">
        <div className="max-w-4xl mx-auto bg-black/40 border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
          <h1 className="text-4xl font-black text-violet-400 italic mb-8 drop-shadow-[0_2px_10px_rgba(139,92,246,0.3)]">PRIVACY POLICY & GDPR COMPLIANCE</h1>
          
          <section className="mb-10">
            <h3 className="text-2xl font-bold text-white mb-4 border-b border-white/10 pb-2">1. Data Collection & Analytics</h3>
            <p className="text-white/60 mb-4 leading-relaxed">
              To provide you with the best possible gaming experience, Rarcade collects performance and gameplay data. This data powers your personal <strong>Advanced Analytics Dashboard</strong>, where you can view interactive charts, graphs (including line, bar, and pie charts), and real-time updates of your gaming sessions.
            </p>
            <p className="text-white/60 mb-4 leading-relaxed">
              We believe your data belongs to you. Therefore, we provide robust <strong>data export and import functionality</strong>. You can export your analytics and historical match records in multiple formats (including PDF, JSON, CSV, and XML) and utilize customizable date ranges and filters to isolate specific data segments. Furthermore, our platform supports bulk operations and data imports with strict validation to maintain the integrity of your records.
            </p>
          </section>

          <section className="mb-10">
            <h3 className="text-2xl font-bold text-white mb-4 border-b border-white/10 pb-2">2. GDPR Compliance & Your Rights</h3>
            <p className="text-white/60 mb-4 leading-relaxed">
              Rarcade is fully committed to the General Data Protection Regulation (GDPR) and ensuring your digital privacy rights are respected. As a user of our platform, you are guaranteed the following rights regarding your personal information:
            </p>
            
            <div className="bg-violet-900/20 border border-violet-500/30 rounded-xl p-6 mb-4">
              <ul className="list-disc list-inside text-white/60 space-y-3 ml-2">
                <li><strong className="text-violet-300">Right to Access:</strong> You may request a complete archive of your personal data at any time.</li>
                <li><strong className="text-violet-300">Data Portability:</strong> You can export your user data in a structured, commonly used, and machine-readable format directly from your profile settings.</li>
                <li><strong className="text-violet-300">Right to Erasure:</strong> You have the "right to be forgotten." You may request permanent data deletion from our servers, subject to a strict confirmation process to prevent accidental loss.</li>
                <li><strong className="text-violet-300">Security & Verification:</strong> To protect your identity, confirmation emails are mandatory for all major data operations, including exports and deletions.</li>
              </ul>
            </div>
          </section>

          <section className="mb-10">
            <h3 className="text-2xl font-bold text-white mb-4 border-b border-white/10 pb-2">3. Terms of Service & Fair Play</h3>
            <p className="text-white/60 leading-relaxed">
              By using our service, you agree to adhere to fair play and respectful conduct in all public and private match rooms. We reserve the right to suspend accounts that violate our terms or engage in malicious activity that disrupts the gaming experience for others. All analytics data is collected solely to enhance gameplay, maintain competitive integrity, and improve the overall user experience.
            </p>
          </section>
          
          <div className="mt-12 text-center text-white/40 text-sm">
            <p>Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default PrivacyPolicy
