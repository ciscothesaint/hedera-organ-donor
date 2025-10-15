import React, { useState, useEffect, useRef } from 'react';
import mirrorAPI from '../services/mirrorApi';
import '../styles/daoproposals.css';

function DaoStats() {
  const [stats, setStats] = useState({
    totalProposals: 0,
    activeProposals: 0,
    approvedProposals: 0,
    rejectedProposals: 0,
    executedProposals: 0,
    totalVotes: 0,
    authorizedVoters: 0,
    averageParticipation: 0,
  });
  const [displayStats, setDisplayStats] = useState({
    totalProposals: 0,
    activeProposals: 0,
    approvedProposals: 0,
    rejectedProposals: 0,
    executedProposals: 0,
    totalVotes: 0,
    authorizedVoters: 0,
    averageParticipation: 0,
  });
  const [loading, setLoading] = useState(true);
  const [hasAnimated, setHasAnimated] = useState(false);
  const statsRef = useRef(null);

  const fetchStats = async () => {
    try {
      const response = await mirrorAPI.getDaoStats();
      const newStats = response.data.data;
      setStats(newStats);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching DAO stats:', error);
      setLoading(false);
    }
  };

  // Animated counter function
  const animateValue = (key, start, end, duration = 1500) => {
    if (start === end) {
      setDisplayStats(prev => ({ ...prev, [key]: end }));
      return;
    }

    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
        current = end;
        clearInterval(timer);
      }
      setDisplayStats(prev => ({ ...prev, [key]: Math.round(current) }));
    }, 16);
  };

  // Intersection Observer for scroll-triggered animation
  useEffect(() => {
    if (!statsRef.current || hasAnimated) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !loading) {
            setHasAnimated(true);
            // Animate all stats
            Object.keys(stats).forEach((key) => {
              animateValue(key, 0, stats[key], 1500);
            });
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(statsRef.current);

    return () => observer.disconnect();
  }, [stats, loading, hasAnimated]);

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="dao-stats">
        <div className="dao-stats-header">
          <h2>DAO Governance Statistics</h2>
          <p className="dao-stats-subtitle">Loading governance data...</p>
        </div>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="dao-stats" ref={statsRef} id="dao-governance">
      <div className="dao-stats-header">
        <h2>DAO Governance Transparency</h2>
        <p className="dao-stats-subtitle">
          Complete transparency of all proposals, votes, and decisions • 100% blockchain-verified
        </p>
      </div>

      <div className="dao-stats-grid">
        {/* Total Proposals Card */}
        <div className="dao-stat-card total">
          <div className="dao-stat-icon proposals">📋</div>
          <div className="dao-stat-content">
            <div className="dao-stat-value counting">{displayStats.totalProposals}</div>
            <div className="dao-stat-label">Total Proposals</div>
          </div>
          <div className="dao-stat-badge">All-Time</div>
        </div>

        {/* Active Proposals Card */}
        <div className="dao-stat-card active">
          <div className="dao-stat-icon active-proposals">🗳️</div>
          <div className="dao-stat-content">
            <div className="dao-stat-value counting">{displayStats.activeProposals}</div>
            <div className="dao-stat-label">Active Proposals</div>
          </div>
          <div className="dao-stat-badge live">
            <span className="pulse-dot"></span>
            Open for Voting
          </div>
        </div>

        {/* Total Votes Card */}
        <div className="dao-stat-card votes">
          <div className="dao-stat-icon total-votes">✅</div>
          <div className="dao-stat-content">
            <div className="dao-stat-value counting">{displayStats.totalVotes}</div>
            <div className="dao-stat-label">Total Votes Cast</div>
          </div>
          <div className="dao-stat-badge">On-Chain</div>
        </div>

        {/* Participation Rate Card */}
        <div className="dao-stat-card participation">
          <div className="dao-stat-icon participation-rate">📊</div>
          <div className="dao-stat-content">
            <div className="dao-stat-value counting">{displayStats.averageParticipation}%</div>
            <div className="dao-stat-label">Avg Participation Rate</div>
          </div>
          <div className="dao-stat-badge">Governance</div>
        </div>

        {/* Approved Proposals Card */}
        <div className="dao-stat-card approved">
          <div className="dao-stat-icon approved-icon">✓</div>
          <div className="dao-stat-content">
            <div className="dao-stat-value counting">{displayStats.approvedProposals}</div>
            <div className="dao-stat-label">Approved Proposals</div>
          </div>
          <div className="dao-stat-badge success">Passed</div>
        </div>

        {/* Executed Proposals Card */}
        <div className="dao-stat-card executed">
          <div className="dao-stat-icon executed-icon">⚡</div>
          <div className="dao-stat-content">
            <div className="dao-stat-value counting">{displayStats.executedProposals}</div>
            <div className="dao-stat-label">Executed Proposals</div>
          </div>
          <div className="dao-stat-badge executed-badge">Implemented</div>
        </div>

        {/* Authorized Voters Card */}
        <div className="dao-stat-card voters">
          <div className="dao-stat-icon voters-icon">👥</div>
          <div className="dao-stat-content">
            <div className="dao-stat-value counting">{displayStats.authorizedVoters}</div>
            <div className="dao-stat-label">Authorized Voters</div>
          </div>
          <div className="dao-stat-badge">Medical Staff</div>
        </div>

        {/* Rejected Proposals Card */}
        <div className="dao-stat-card rejected">
          <div className="dao-stat-icon rejected-icon">✗</div>
          <div className="dao-stat-content">
            <div className="dao-stat-value counting">{displayStats.rejectedProposals}</div>
            <div className="dao-stat-label">Rejected Proposals</div>
          </div>
          <div className="dao-stat-badge rejected-badge">Failed</div>
        </div>
      </div>

      <div className="dao-stats-footer">
        <div className="dao-footer-badge">
          <span className="badge-icon">⛓️</span>
          <span>100% Blockchain Verified</span>
        </div>
        <div className="dao-footer-badge">
          <span className="badge-icon">🔍</span>
          <span>Complete Transparency</span>
        </div>
        <div className="dao-footer-badge">
          <span className="badge-icon">🗳️</span>
          <span>Democratic Governance</span>
        </div>
      </div>
    </div>
  );
}

export default DaoStats;
