import React, { useState, useEffect, useRef } from 'react';
import mirrorAPI from '../services/mirrorApi';
import '../styles/stats.css';

function LiveStats() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    activePatients: 0,
    totalOrgans: 0,
    matchesCompleted: 0,
  });
  const [displayStats, setDisplayStats] = useState({
    totalPatients: 0,
    activePatients: 0,
    totalOrgans: 0,
    matchesCompleted: 0,
  });
  const [loading, setLoading] = useState(true);
  const [cacheInfo, setCacheInfo] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const statsRef = useRef(null);

  const fetchStats = async () => {
    try {
      const response = await mirrorAPI.getStats();
      const newStats = response.data.data;
      setStats(newStats);
      setCacheInfo({
        cached: response.data.cached,
        cacheAge: response.data.cacheAge,
      });
      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  // Animated counter function
  const animateValue = (key, start, end, duration = 2000) => {
    if (start === end) {
      setDisplayStats(prev => ({ ...prev, [key]: end }));
      return;
    }

    const range = end - start;
    const increment = range / (duration / 16); // 60fps
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

  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="live-stats">
        <div className="stats-header">
          <div>
            <h2>Live Blockchain Statistics</h2>
            <p className="stats-subtitle">Loading real-time data...</p>
          </div>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="live-stats" ref={statsRef}>
      <div className="stats-header">
        <div>
          <h2>Live Blockchain Statistics</h2>
          <p className="stats-subtitle">
            Real-time data from Hedera Mirror Node
            {cacheInfo?.cached ? ' • 📦 Cached' : ' • 🆕 Fresh'}
            {lastUpdate && ` • Last updated: ${formatTime(lastUpdate)}`}
          </p>
        </div>
        <button className="btn-refresh" onClick={fetchStats}>
          🔄 Refresh
        </button>
      </div>

      <div className="stats-grid">
        {/* Total Patients Card */}
        <div className="stat-card">
          <div className="stat-icon patients">👥</div>
          <div className="stat-content">
            <div className="stat-value counting">{displayStats.totalPatients || 0}</div>
            <div className="stat-label">Total Patients Registered</div>
          </div>
          <div className="stat-badge">On-Chain</div>
        </div>

        {/* Active Waitlist Card */}
        <div className="stat-card">
          <div className="stat-icon active">⏳</div>
          <div className="stat-content">
            <div className="stat-value counting">{displayStats.activePatients || 0}</div>
            <div className="stat-label">Active on Waitlist</div>
          </div>
          <div className="stat-badge">Live</div>
        </div>

        {/* Organs Registered Card */}
        <div className="stat-card">
          <div className="stat-icon organs">🫀</div>
          <div className="stat-content">
            <div className="stat-value counting">{displayStats.totalOrgans || 0}</div>
            <div className="stat-label">Organs Registered</div>
          </div>
          <div className="stat-badge">Available</div>
        </div>

        {/* Successful Transplants Card */}
        <div className="stat-card">
          <div className="stat-icon matches">🎉</div>
          <div className="stat-content">
            <div className="stat-value counting">{displayStats.matchesCompleted || 0}</div>
            <div className="stat-label">Successful Transplants</div>
          </div>
          <div className="stat-badge">Completed</div>
        </div>
      </div>

      <div className="stats-footer">
        <div className="footer-badge">
          <span className="badge-icon">💰</span>
          <span>FREE blockchain queries - No gas fees</span>
        </div>
        <div className="footer-badge">
          <span className="badge-icon">⛓️</span>
          <span>Powered by Hedera Mirror Node</span>
        </div>
      </div>
    </div>
  );
}

export default LiveStats;
