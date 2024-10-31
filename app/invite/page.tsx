'use client'

import React, { useEffect, useState } from 'react'
import { WebApp } from '@twa-dev/types'
import Script from 'next/script'
import Link from 'next/link'

interface User {
  telegramId: number
  username: string
  firstName: string
  lastName: string
  points: number
  invitedUsers: string[]
  invitedBy: string | null
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: WebApp
    }
  }
}

export default function InvitePage() {
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()

      const initDataUnsafe = tg.initDataUnsafe || {}

      if (initDataUnsafe.user) {
        fetch('/api/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(initDataUnsafe.user),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.error) {
              setError(data.error)
            } else {
              setUser(data)
            }
          })
          .catch((err) => {
            setError('Failed to fetch user data')
          })
          .finally(() => {
            setLoading(false)
          })
      } else {
        setError('No user data available')
        setLoading(false)
      }
    } else {
      setError('This App Should Be Opened On Telegram')
      setLoading(false)
    }
  }, [])

  const handleCopyInviteLink = async () => {
    if (!user?.telegramId) return

    const inviteLink = `http://t.me/miniappw21bot/cdprojekt/start?startapp=${user.telegramId}`
    
    try {
      await navigator.clipboard.writeText(inviteLink)
      setNotificationMessage('Invite link copied successfully!')
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 3000)
    } catch (err) {
      setNotificationMessage('Failed to copy invite link')
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 3000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="bg-white p-6 rounded-lg shadow-lg text-red-500 text-center">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 ${mounted ? 'fade-in' : ''}`}>
      <Script src="https://kit.fontawesome.com/18e66d329f.js"/>
      
      {/* Header */}
      <div className="w-full bg-[#670773] text-white p-4 shadow-lg flex items-center justify-between relative z-10 slide-down">
        <Link href="/" className="hover:scale-110 transition-transform">
          <i className="fas fa-arrow-left text-2xl"></i>
        </Link>
        <h1 className="text-2xl font-bold">Invite & Earn</h1>
        <div className="w-8"></div>
      </div>

      {/* Notification */}
      {showNotification && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-[#670773] text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          {notificationMessage}
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Invite Card */}
        <div className="bg-white rounded-lg p-6 shadow-md mb-6 fade-in-up">
          <div className="text-center mb-6">
            <i className="fas fa-gift text-5xl text-[#670773] mb-4"></i>
            <h2 className="text-2xl font-bold text-[#670773] mb-2">Earn 2,500 Points</h2>
            <p className="text-gray-600">For each friend who joins using your invite link</p>
          </div>
          
          <button
            onClick={handleCopyInviteLink}
            className="w-full bg-[#670773] text-white text-lg font-bold py-3 px-6 rounded-full shadow-lg hover:bg-[#7a1b86] transform hover:scale-105 transition-all duration-300 active:scale-95 mb-6"
          >
            <i className="fas fa-copy mr-2"></i>
            Copy Invite Link
          </button>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-[#670773]">{user?.invitedUsers?.length || 0}</p>
              <p className="text-gray-600">Friends Invited</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-[#670773]">{user?.points || 0}</p>
              <p className="text-gray-600">Total Points</p>
            </div>
          </div>

          {/* Invited Friends List */}
          {user?.invitedUsers && user.invitedUsers.length > 0 ? (
            <div>
              <h3 className="text-lg font-bold text-[#670773] mb-3">Invited Friends</h3>
              <div className="space-y-2">
                {user.invitedUsers.map((username, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg flex items-center">
                    <i className="fas fa-user-circle text-[#670773] mr-3"></i>
                    <span>{username}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <p>No friends invited yet</p>
            </div>
          )}
        </div>

        {/* Invited By Section */}
        {user?.invitedBy && (
          <div className="bg-white rounded-lg p-4 shadow-md text-center fade-in-up">
            <p className="text-gray-600">Invited by: <span className="font-bold text-[#670773]">{user.invitedBy}</span></p>
          </div>
        )}
      </div>

      <style jsx>{`
        .loading-spinner {
          border: 4px solid rgba(103, 7, 115, 0.1);
          border-left-color: #670773;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .fade-in {
          opacity: 0;
          animation: fadeIn 0.5s ease-out forwards;
        }
        .fade-in-up {
          opacity: 0;
          transform: translateY(20px);
          animation: fadeInUp 0.5s ease-out forwards;
        }
        .slide-down {
          transform: translateY(-100%);
          animation: slideDown 0.5s ease-out forwards;
        }
        @keyframes fadeIn {
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideDown {
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
