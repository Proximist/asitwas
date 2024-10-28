'use client'

import React, { useState, useEffect } from 'react';
import './profile.css';

const Profile = () => {
  const [profileData, setProfileData] = useState({
    totalPiSold: 0,
    xp: 0,
    level: 1,
    piPoints: 0,
  });

  const levels = [
    { name: 'Rookie', threshold: 1000, pointsPerHundredXP: 1 },
    { name: 'Bronze', threshold: 1200, pointsPerHundredXP: 3 },
    { name: 'Silver', threshold: 1300, pointsPerHundredXP: 5 },
    { name: 'Gold', threshold: 1400, pointsPerHundredXP: 7 },
    { name: 'Diamond', threshold: 1500, pointsPerHundredXP: 10 },
    { name: 'Platinum', threshold: 1600, pointsPerHundredXP: 15 }
  ];

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      const webAppUser = tg.initDataUnsafe?.user;
      if (webAppUser) {
        fetchProfileData(webAppUser.id);
      }
    }
  }, []);

  const fetchProfileData = async (userId: number) => {
    try {
      const response = await fetch(`/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId })
      });
      const data = await response.json();
      setProfileData(data);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  const getCurrentLevel = (xp: number) => {
    const level = levels.findIndex(lvl => xp < lvl.threshold);
    return level === -1 ? levels.length : level;
  };

  const getProgress = (xp: number) => {
    const currentLevel = getCurrentLevel(xp);
    const previousThreshold = currentLevel > 0 ? levels[currentLevel - 1].threshold : 0;
    const nextThreshold = levels[currentLevel]?.threshold || levels[levels.length - 1].threshold;
    const progress = ((xp - previousThreshold) / (nextThreshold - previousThreshold)) * 100;
    return Math.min(progress, 100);
  };

  const getLevelName = (level: number) => {
    return levels[level - 1]?.name || 'Max Level';
  };

  const getRequiredXP = (level: number) => {
    return levels[level - 1]?.threshold || levels[levels.length - 1].threshold;
  };

  return (
    <div className="profile-container">
      {/* Header */}
      <div className="profile-header">
        <h1>Profile</h1>
      </div>

      {/* Main Content */}
      <div className="profile-content">
        {/* Total Pi Sold Card */}
        <div className="profile-card">
          <h2>Total Pi Sold</h2>
          <div className="stat-value">
            <span className="number">{profileData.totalPiSold}</span>
            <span className="unit">Pi</span>
          </div>
        </div>

        {/* Level Progress Card */}
        <div className="profile-card">
          <h2>Level Progress</h2>
          <div className="level-info">
            <span className="level-name">
              Level {getCurrentLevel(profileData.xp)} - {getLevelName(getCurrentLevel(profileData.xp))}
            </span>
            <div className="xp-display">
              {profileData.xp}/{getRequiredXP(getCurrentLevel(profileData.xp))} XP
            </div>
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar"
              style={{ width: `${getProgress(profileData.xp)}%` }}
            ></div>
          </div>
        </div>

        {/* Pi Points Card */}
        <div className="profile-card">
          <h2>Pi Points</h2>
          <div className="stat-value">
            <span className="number">{profileData.piPoints}</span>
            <span className="unit">Points</span>
          </div>
          <div className="points-info">
            Current Rate: {levels[getCurrentLevel(profileData.xp) - 1]?.pointsPerHundredXP || 15} 
            points per 100 XP
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;