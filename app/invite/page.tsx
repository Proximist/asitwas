// app/invite/page.tsx
'use client'

import React, { useEffect, useState } from 'react';
import { WebApp } from '@twa-dev/types';
import Link from 'next/link';

declare global {
  interface Window {
    Telegram?: {
      WebApp: WebApp
    }
  }
}

interface InvitedUserData {
  username: string;
  totalPoints: number;
  earnedPoints: number;
}

interface UserData {
  telegramId: number;
  username: string;
  firstName?: string;
  lastName?: string;
  totalPoints: number;
  invitePoints: number;
  invitedUsers: string[];
  invitedBy?: string;
}

export default function InvitePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState('');
  const [invitedUsers, setInvitedUsers] = useState<InvitedUserData[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notification, setNotification] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // For manual refresh

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      setIsDarkMode(tg.colorScheme === 'dark');
      document.body.classList.toggle('dark-mode', tg.colorScheme === 'dark');

      const initDataUnsafe = tg.initDataUnsafe || {};
      if (initDataUnsafe.user) {
        fetchUserData(initDataUnsafe.user);
      } else {
        setError('No user data available');
        setIsLoading(false);
      }
    } else {
      setError('This app should be opened in Telegram');
      setIsLoading(false);
    }
  }, [refreshKey]);

  // Fetch updated data every 20 minutes
  useEffect(() => {
    const fetchInterval = setInterval(() => {
      if (user) {
        setRefreshKey(prev => prev + 1);
      }
    }, 20 * 60 * 1000);

    return () => clearInterval(fetchInterval);
  }, [user]);

  const fetchUserData = async (userData: any) => {
    setIsLoading(true);
    try {
      // Fetch basic user data
      const response = await fetch('/api/member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      if (data.error) {
        setError(data.error);
        return;
      }

      setUser(data.user);
      setInviteLink(`http://t.me/your_bot/start?startapp=${data.user.telegramId}`);

      // Fetch invited users details
      const invitedResponse = await fetch('/api/getInvitedUsersDetails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: data.user.telegramId })
      });
      
      const invitedData = await invitedResponse.json();
      if (!invitedData.error) {
        setInvitedUsers(invitedData.invitedUsersDetails);
      }

      // Update invite points
      await fetch('/api/updateInvitePoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: data.user.telegramId })
      });

    } catch (err) {
      setError('Failed to fetch user data');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteLink)
      .then(() => {
        setNotification('Invite link copied!');
        setTimeout(() => setNotification(''), 3000);
      })
      .catch(() => {
        setNotification('Failed to copy link');
        setTimeout(() => setNotification(''), 3000);
      });
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'
      }`}>
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen p-4 flex items-center justify-center ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'
      }`}>
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-20 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Invite Friends</h1>
          <p className="text-sm opacity-75">
            Earn 20% of your invited friends' total points!
          </p>
          
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          
          {/* Invite Button */}
          <button
            onClick={handleCopyInvite}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              isDarkMode 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            Copy Invite Link
          </button>
          
          {notification && (
            <div className={`text-sm p-2 rounded ${
              notification.includes('Failed') 
                ? 'text-red-500' 
                : 'text-green-500'
            }`}>
              {notification}
            </div>
          )}
        </div>

        {/* User Stats Card */}
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-sm opacity-75">Total Points</p>
              <p className="text-xl font-bold">{user?.totalPoints || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-sm opacity-75">Earned from Invites</p>
              <p className="text-xl font-bold text-green-500">{user?.invitePoints || 0}</p>
            </div>
          </div>
        </div>

        {/* Invited By Section */}
        {user?.invitedBy && (
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-lg font-medium mb-2">Invited By</h2>
            <p className="text-blue-500">{user.invitedBy}</p>
          </div>
        )}

        {/* Invited Users Section */}
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className="text-lg font-medium mb-4">Your Invited Friends</h2>
          
          {invitedUsers.length > 0 ? (
            <div className="space-y-4">
              {invitedUsers.map((invitedUser, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-blue-500">
                      {invitedUser.username}
                    </span>
                    <span className="text-sm opacity-75">
                      Points: {invitedUser.totalPoints}
                    </span>
                  </div>
                  <div className="text-sm text-green-500">
                    You earn: {invitedUser.earnedPoints} points (20%)
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 opacity-75">
              <p>No invited friends yet</p>
              <p className="text-sm mt-2">Share your invite link to start earning!</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className={`fixed bottom-0 left-0 right-0 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      } border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="max-w-md mx-auto px-4 py-3 flex justify-around">
          <Link href="/">
            <span className={`flex flex-col items-center ${
              isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}>
              <i className="fas fa-home mb-1"></i>
              <span className="text-xs">Home</span>
            </span>
          </Link>
          <Link href="/invite">
            <span className="flex flex-col items-center text-blue-500">
              <i className="fas fa-users mb-1"></i>
              <span className="text-xs">Friends</span>
            </span>
          </Link>
          <Link href="/task">
            <span className={`flex flex-col items-center ${
              isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}>
              <i className="fas fa-clipboard mb-1"></i>
              <span className="text-xs">Tasks</span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
