// File: root/app/invite/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { WebApp } from '@twa-dev/types';
import './invite.css';

declare global {
  interface Window {
    Telegram?: {
      WebApp: WebApp;
    };
  }
}

export default function Invite() {
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [invitedUsers, setInvitedUsers] = useState<string[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [buttonState, setButtonState] = useState('initial');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      const isDark = tg.colorScheme === 'dark';
      setIsDarkMode(isDark);
      document.body.classList.toggle('dark-mode', isDark);

      const initDataUnsafe = tg.initDataUnsafe || {};

      if (initDataUnsafe.user) {
        fetch('/api/invite', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...initDataUnsafe.user, start_param: initDataUnsafe.start_param || null })
        })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error);
          } else {
            setUser(data.user);
            setInviteLink(`http://t.me/pixel_dogs_bot/Pixel_dogs_web/start?startapp=${data.user.telegramId}`);
            setInvitedUsers(data.user.invitedUsers || []);
          }
        })
        .catch(() => {
          setError('Failed to fetch user data');
        });
      } else {
        setError('No user data available');
      }
    } else {
      setError('This app should be opened in Telegram');
    }
  }, []);

  const handleInvite = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink).then(() => {
        setButtonState('copied');
        setNotification('Invite link copied to clipboard!');
        setTimeout(() => {
          setButtonState('initial');
          setNotification('');
        }, 5000);
      }).catch(err => {
        console.error('Failed to copy: ', err);
        setNotification('Failed to copy invite link. Please try again.');
      });
    }
  };

  return (
    <div className={`container ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="backgroundShapes"></div>
      <div className={`content ${isDarkMode ? 'dark-mode' : ''}`}>
        {error ? (
          <div className="error">{error}</div>
        ) : !user ? (
          <div className="loader"></div>
        ) : (
          <>
            <div className={`header ${isDarkMode ? 'dark-mode' : ''}`}>
              <div className="iconContainer">
                <svg className="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="4" fill="currentColor"/>
                </svg>
                <svg className="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="4" fill="currentColor"/>
                </svg>
              </div>
              <p className={`title ${isDarkMode ? 'dark-mode' : ''}`}>
                Invite your friends and earn 2,500 points for each one you bring!
              </p>
            </div>

            <button 
              onClick={handleInvite} 
              className={`inviteButton ${buttonState} ${isDarkMode ? 'dark-mode' : ''}`}
            >
              <span className="buttonText">Copy Invite Link</span>
              <span className="buttonIcon">
                <i className="fas fa-copy"></i> Copied
              </span>
            </button>

            {user.invitedBy && (
              <div className={`invitedBy ${isDarkMode ? 'dark-mode' : ''}`}>
                Invited by: {user.invitedBy}
              </div>
            )}

            <div className={`invitedSection ${isDarkMode ? 'dark-mode' : ''}`}>
              <div className={`invitedHeader ${isDarkMode ? 'dark-mode' : ''}`}>
                <svg className="invitedIcon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h2 className={`invitedTitle ${isDarkMode ? 'dark-mode' : ''}`}>Invited Friends: {invitedUsers.length}</h2>
              </div>
              {invitedUsers.length > 0 ? (
                <ul className="invitedList">
                  {invitedUsers.map((user, index) => (
                    <li key={index}>{user}</li>
                  ))}
                </ul>
              ) : (
                <div className={`emptyState ${isDarkMode ? 'dark-mode' : ''}`}>
                  <p className="emptyStateText">The Invite List is empty</p>
                </div>
              )}
            </div>

            {notification && (
              <div className={`notification ${isDarkMode ? 'dark-mode' : ''}`}>{notification}</div>
            )}
          </>
        )}
      </div>
      <div className={`footerContainer ${isDarkMode ? 'dark-mode' : ''}`}>
        <Link href="/">
          <a className={`footerLink ${isDarkMode ? 'dark-mode' : ''}`}>
            <i className="fas fa-home"></i>
            <span>Home</span>
          </a>
        </Link>
        <Link href="/invite">
          <a className={`activeFooterLink ${isDarkMode ? 'dark-mode' : ''}`}>
            <i className="fas fa-users"></i>
            <span>Friends</span>
          </a>
        </Link>
        <Link href="/task">
          <a className={`footerLink ${isDarkMode ? 'dark-mode' : ''}`}>
            <i className="fas fa-clipboard"></i>
            <span>Tasks</span>
          </a>
        </Link>
      </div>
    </div>
  );
}
