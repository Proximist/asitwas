'use client'

import { useEffect, useState } from 'react'
import { WebApp } from '@twa-dev/types'
import Script from 'next/script'
import Link from 'next/link'
import IntroPage from './components/IntroPage'

declare global {
  interface Window {
    Telegram?: {
      WebApp: WebApp
    }
  }
}

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [showNotification, setShowNotification] = useState(false)

  const handleMenuItemClick = (item: string) => {
    if (item === 'Live Support') {
      window.location.href = '/LiveSupport.html'
    } else if (item === 'Home') {
      window.location.href = '/'
    } else if (item === 'Transaction History') {
      window.location.href = './transaction-history'
    } else if (item === 'Profile') {
      window.location.href = './profile'
    } else if (item === 'Invite & Earn') {
      window.location.href = './invite'
    } else if (item === 'Admin') {
      window.location.href = './admin/transactions'
    }
    setMenuOpen(false)
  }

  const handleBuyPi = () => {
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 3000)
  }

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
              setShowIntro(!data.introSeen)
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

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (showIntro) {
    return <IntroPage telegramId={user.telegramId} />
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 ${mounted ? 'fade-in' : ''}`}>
      <Script src="https://kit.fontawesome.com/18e66d329f.js"/>
      
      {/* Header */}
      <div className="w-full bg-[#670773] text-white p-4 shadow-lg flex items-center justify-between relative z-10 slide-down">
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className="hover:scale-110 transition-transform"
        >
          <i className="fas fa-bars text-2xl"></i>
        </button>
        <h1 className="text-2xl font-bold">Pi Trader Official</h1>
        <div className="w-8"></div>
      </div>

      {/* Notification */}
      {showNotification && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-[#670773] text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          This feature will be available soon
        </div>
      )}

      {/* Main Content - More Compact Layout */}
      <div className="container mx-auto px-4 py-4">
        <div className="bg-white rounded-lg p-4 shadow-md mb-4 text-center fade-in-up">
          <p className="text-[#670773] text-sm font-medium">
            Pi Coin has not launched. This is the premarket price set by our team and does not represent Official data
          </p>
        </div>

        <div className="text-center mb-6">
          <div className="bg-white rounded-lg p-4 shadow-md mb-4">
            <h2 className="text-4xl font-bold text-[#670773]">
              $0.65/Pi
            </h2>
          </div>

          <div className="relative w-48 h-48 mx-auto mb-6 scale-in">
            <img 
              src="/api/placeholder/400/320" 
              alt="Pi Coin" 
              className="w-full h-full object-cover rounded-full shadow-xl hover:scale-105 transition-transform duration-300"
            />
          </div>

          <div className="flex flex-col gap-3 items-center slide-up">
            <Link href="/PaymentMethods" className="w-full max-w-xs">
              <button className="w-full bg-[#670773] text-white text-lg font-bold py-3 px-6 rounded-full shadow-lg hover:bg-[#7a1b86] transform hover:scale-105 transition-all duration-300 active:scale-95">
                Sell Your Pi
              </button>
            </Link>
            <button 
              onClick={handleBuyPi}
              className="w-full max-w-xs bg-white text-[#670773] text-lg font-bold py-3 px-6 rounded-full shadow-lg border-2 border-[#670773] hover:bg-[#670773] hover:text-white transform hover:scale-105 transition-all duration-300 active:scale-95"
            >
              Buy Pi
            </button>
          </div>
        </div>
      </div>

      {/* Sliding Menu */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-[#670773] text-white shadow-2xl transform transition-transform duration-300 z-50 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-white/20">
          <button 
            onClick={() => setMenuOpen(false)} 
            className="absolute top-4 right-4 text-white hover:scale-110 transition-transform"
          >
            <i className="fas fa-times text-2xl"></i>
          </button>
          <h2 className="text-xl font-bold mt-8">Menu</h2>
        </div>
        <nav className="mt-4">
          <ul className="space-y-2">
            {['Home', 'Transaction History', 'Live Support', 'Profile', 'Invite & Earn', 'Admin'].map((item, index) => (
              <li key={index} className="menu-item" style={{animationDelay: `${index * 0.1}s`}}>
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault()
                    handleMenuItemClick(item)
                  }}
                  className="block py-3 px-6 hover:bg-white/10 transition-colors duration-300"
                >
                  <i className={`fas fa-${
                    item === 'Home' ? 'home' :
                    item === 'Transaction History' ? 'history' :
                    item === 'Live Support' ? 'headset' :
                    item === 'Profile' ? 'user' :
                    item === 'Invite & Earn' ? 'gift' :
                    'tools'
                  } mr-3`}></i>
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </nav>
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
        .slide-up {
          opacity: 0;
          transform: translateY(50px);
          animation: slideUp 0.5s ease-out forwards;
        }
        .scale-in {
          opacity: 0;
          transform: scale(0.8);
          animation: scaleIn 0.5s ease-out forwards;
        }
        .menu-item {
          opacity: 0;
          animation: slideIn 0.3s ease-out forwards;
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
        @keyframes slideUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scaleIn {
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes slideIn {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}
