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
          <h1 className="text-4xl font-black text-violet-400 italic mb-8 drop-shadow-[0_2px_10px_rgba(139,92,246,0.3)]">PRIVACY POLICY & TERMS OF SERVICE</h1>
          
          <section className="mb-10">
            <h3 className="text-2xl font-bold text-white mb-4 border-b border-white/10 pb-2">1. Privacy and Data Collection</h3>
            <p className="text-white/60 mb-4 leading-relaxed">
              At Rarecade, we believe in a pure, uninterrupted gaming experience. We are committed to your privacy and have designed our platform from the ground up to respect it. 
            </p>
            <p className="text-white/60 mb-4 leading-relaxed">
              <strong>We do not collect, sell, or share your personal data.</strong> The only information we store on our servers is the basic account information required for authentication (such as your username and password) and your game history strictly for displaying match results and leaderboards within the platform.
            </p>
            <p className="text-white/60 leading-relaxed">
              We do not use third-party analytics trackers, advertising cookies, or invasive profiling. Your gameplay is your own.
            </p>
          </section>

          <section className="mb-10">
            <h3 className="text-2xl font-bold text-white mb-4 border-b border-white/10 pb-2">2. Account Security</h3>
            <p className="text-white/60 mb-4 leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials. While we employ industry-standard security measures to protect the minimal data we do store, we cannot guarantee absolute security against unauthorized access.
            </p>
            <p className="text-white/60 leading-relaxed">
              If you wish to delete your account and all associated match history from our servers, you may do so at any time by contacting our support team or using the account deletion tools provided in your profile settings.
            </p>
          </section>

          <section className="mb-10">
            <h3 className="text-2xl font-bold text-white mb-4 border-b border-white/10 pb-2">3. Terms of Service & Fair Play</h3>
            <p className="text-white/60 leading-relaxed">
              Rarecade is a community built on competition and respect. By using our service, you agree to adhere to fair play and respectful conduct in all public and private match rooms. We reserve the right to suspend or ban accounts that violate these terms, engage in harassment, or use malicious software to disrupt the gaming experience for others.
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
