'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { WebApp } from '@twa-dev/types'

interface User {
  telegramId: number;
  username: string;
  firstName: string;
  lastName: string;
  points: number;
  invitedUsers: string[];
  invitedBy: string | null;
  level: number;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: WebApp
    }
  }
}

export default function Invite() {
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [buttonState, setButtonState] = useState('initial')

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
      setIsDarkMode(tg.colorScheme === 'dark')

      const initDataUnsafe = tg.initDataUnsafe || {}

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
              setError(data.error)
            } else {
              setUser(data.user)
              // Update this URL to match your bot's username
              setInviteLink(`http://t.me/miniappw21bot/cdprojekt/start?startapp=${data.user.telegramId}`)
              setInvitedUsers(data.user.invitedUsers || [])
            }
          })
          .catch(() => {
            setError('Failed to fetch user data')
          })
      } else {
        setError('No user data available')
      }
    } else {
      setError('This app should be opened in Telegram')
    }
  }, [])

  const handleInvite = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink).then(() => {
        setButtonState('copied')
        setNotification('Invite link copied to clipboard!')
        setTimeout(() => {
          setButtonState('fadeOut')
          setTimeout(() => {
            setButtonState('initial')
            setNotification('')
          }, 300)
        }, 5000)
      }).catch(err => {
        console.error('Failed to copy: ', err)
        setNotification('Failed to copy invite link. Please try again.')
      })
    }
  }

  return (
    <div className={`container ${isDarkMode ? 'dark' : ''}`}>
      <div className="max-w-md mx-auto p-4">
        {error ? (
          <div className="text-red-500 p-4">{error}</div>
        ) : !user ? (
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-4">
              <h1 className="text-xl font-bold mb-4">
                Invite your friends and earn 2,500 points for each one you bring!
              </h1>

              <button 
                onClick={handleInvite}
                className={`w-full py-2 px-4 rounded-lg mb-4 transition-colors
                  ${buttonState === 'initial' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500'}
                  text-white font-semibold`}
              >
                {buttonState === 'initial' ? 'Copy Invite Link' : 'Copied!'}
              </button>

              {user.invitedBy && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Invited by: {user.invitedBy}
                </p>
              )}

              <div className="border-t pt-4">
                <h2 className="text-lg font-semibold mb-2">
                  Invited Friends: {user.invitedUsers?.length || 0}
                </h2>
                {user.invitedUsers?.length > 0 ? (
                  <ul className="space-y-2">
                    {user.invitedUsers.map((invitedUser, index) => (
                      <li key={index} className="text-gray-600 dark:text-gray-400">
                        {invitedUser}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No friends invited yet</p>
                )}
              </div>
            </div>

            {notification && (
              <div className="fixed bottom-4 left-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg text-center">
                {notification}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
