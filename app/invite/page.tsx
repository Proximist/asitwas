'use client'

import React, { useEffect, useState } from 'react';
import { WebApp } from '@twa-dev/types'
import './invite.css';

declare global {
  interface Window {
    Telegram?: {
      WebApp: WebApp
    }
  }
}

export default function Invite() {
  const [user, setUser] = useState<any>(null);
  const [inviteLink, setInviteLink] = useState('');
  const [invitedUsers, setInvitedUsers] = useState<string[]>([]);
  const [notification, setNotification] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      setIsDarkMode(tg.colorScheme === 'dark');

      const initDataUnsafe = tg.initDataUnsafe || {};

      if (initDataUnsafe.user) {
        fetch('/api/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...initDataUnsafe.user, start_param: initDataUnsafe.start_param || null })
        })
          .then(res => res.json())
          .then(data => {
            if (!data.error) {
              setUser(data.user);
              setInviteLink(`https://t.me/your_bot_username/start?startapp=${data.user.telegramId}`);
              setInvitedUsers(data.user.invitedUsers || []);
              
              // If there's a start_param (meaning this user was invited), increase inviter's points
              if (initDataUnsafe.start_param) {
                fetch('/api/increase-points', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ inviterId: parseInt(initDataUnsafe.start_param) })
                });
              }
            }
          });
      }
    }
  }, []);

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteLink)
      .then(() => {
        setNotification('Invite link copied!');
        setTimeout(() => setNotification(''), 3000);
      })
      .catch(() => setNotification('Failed to copy link'));
  };

  if (!user) return <div className="loader"></div>;

  return (
    <div className={`container ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="invite-card">
        <h1 className="title">Invite Friends</h1>
        <p className="subtitle">Earn 2,500 points for each friend you invite!</p>
        
        <div className="stats-container">
          <div className="stat-box">
            <h3>Your Points</h3>
            <p>{user.points}</p>
          </div>
          <div className="stat-box">
            <h3>Friends Invited</h3>
            <p>{user.invitedUsers?.length || 0}</p>
          </div>
        </div>

        {user.invitedBy && (
          <div className="invited-by">
            Invited by: {user.invitedBy}
          </div>
        )}

        <button onClick={handleCopyInvite} className="invite-button">
          Copy Invite Link
        </button>

        {user.invitedUsers?.length > 0 && (
          <div className="invited-list">
            <h3>Invited Friends</h3>
            <ul>
              {user.invitedUsers.map((invitedUser: string, index: number) => (
                <li key={index}>{invitedUser}</li>
              ))}
            </ul>
          </div>
        )}

        {notification && (
          <div className="notification">
            {notification}
          </div>
        )}
      </div>
    </div>
  );
}
