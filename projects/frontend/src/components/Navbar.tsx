import { useWallet } from '@txnlab/use-wallet-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import ConnectWallet from './ConnectWallet'
import { ellipseAddress } from '../utils/ellipseAddress'

const Navbar = () => {
  const [openWalletModal, setOpenWalletModal] = useState(false)
  const { activeAddress } = useWallet()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <>
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🐷</span>
            <span className="text-xl font-bold tracking-tight text-gray-900">PiggyBag</span>
          </Link>

          {/* Center Nav */}
          <div className="hidden md:flex items-center gap-1 bg-gray-100/80 p-1 rounded-lg">
            <Link
              to="/"
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                isActive('/') ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Explore
            </Link>
            <Link
              to="/create"
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                isActive('/create') ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Create
            </Link>
            <Link
              to="/guide"
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                isActive('/guide') ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Guide
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {activeAddress && (
              <Link
                to="/profile"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold">
                  {activeAddress.charAt(0)}
                </div>
                <span className="text-sm font-medium text-gray-600 font-mono">
                  {ellipseAddress(activeAddress)}
                </span>
              </Link>
            )}
            <button
              onClick={() => setOpenWalletModal(true)}
              className={`text-sm font-medium px-5 py-2 rounded-full transition-all duration-200 ${
                activeAddress
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-gray-900 text-white hover:bg-black shadow-lg shadow-gray-900/20'
              }`}
            >
              {activeAddress ? 'Wallet' : 'Connect Wallet'}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden flex items-center gap-1 px-4 pb-2">
          <Link
            to="/"
            className={`flex-1 text-center px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              isActive('/') ? 'bg-gray-100 text-gray-900' : 'text-gray-500'
            }`}
          >
            Explore
          </Link>
          <Link
            to="/create"
            className={`flex-1 text-center px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              isActive('/create') ? 'bg-gray-100 text-gray-900' : 'text-gray-500'
            }`}
          >
            Create
          </Link>
          <Link
            to="/guide"
            className={`flex-1 text-center px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              isActive('/guide') ? 'bg-gray-100 text-gray-900' : 'text-gray-500'
            }`}
          >
            Guide
          </Link>
          {activeAddress && (
            <Link
              to="/profile"
              className={`flex-1 text-center px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                isActive('/profile') ? 'bg-gray-100 text-gray-900' : 'text-gray-500'
              }`}
            >
              Profile
            </Link>
          )}
        </div>
      </nav>

      <ConnectWallet openModal={openWalletModal} closeModal={() => setOpenWalletModal(false)} />
    </>
  )
}

export default Navbar
