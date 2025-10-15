import React from 'react';
import Hero from './components/Hero';
import LiveStats from './components/LiveStats';
import DaoStats from './components/DaoStats';
import DaoProposals from './components/DaoProposals';
import VotingActivity from './components/VotingActivity';
import WaitlistTabs from './components/WaitlistTabs';
import BlockchainVerification from './components/BlockchainVerification';
import HowItWorks from './components/HowItWorks';
import RecentActivity from './components/RecentActivity';
import Footer from './components/Footer';
import './styles/landing.css';
import './styles/hero.css';
import './styles/stats.css';
import './styles/daoproposals.css';
import './styles/waitlist.css';

function App() {
  return (
    <div className="app">
      <Hero />
      <main className="main-content">
        {/* Live Patient Statistics */}
        <LiveStats />

        {/* DAO Governance Transparency Section */}
        <DaoStats />
        <DaoProposals />
        <VotingActivity />

        {/* Patient Waitlist Management */}
        <WaitlistTabs />

        {/* Blockchain Verification & How It Works */}
        <BlockchainVerification />
        <HowItWorks />
        <RecentActivity />
      </main>
      <Footer />
    </div>
  );
}

export default App;
