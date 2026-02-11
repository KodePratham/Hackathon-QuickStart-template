import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ellipseAddress } from '../utils/ellipseAddress'
import { useSnackbar } from 'notistack'
import ConnectWallet from '../components/ConnectWallet'

const Profile: React.FC = () => {
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()
  const { isAuthenticated, isLoading, userProfile, walletAddress, saveProfile, isNewUser } = useAuth()

  const [openWalletModal, setOpenWalletModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    twitter_url: '',
    linkedin_url: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  // Initialize form data when profile loads
  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        description: userProfile.description || '',
        twitter_url: userProfile.twitter_url || '',
        linkedin_url: userProfile.linkedin_url || '',
      })
    }
  }, [userProfile])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated) {
      enqueueSnackbar('Please connect your wallet first', { variant: 'warning' })
      return
    }

    setIsSaving(true)
    const result = await saveProfile(formData)
    setIsSaving(false)

    if (result.success) {
      enqueueSnackbar('Profile saved successfully!', { variant: 'success' })
    } else {
      enqueueSnackbar(`Error saving profile: ${result.error}`, { variant: 'error' })
    }
  }

  const toggleWalletModal = () => {
    setOpenWalletModal(!openWalletModal)
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-950 via-black to-gray-900">
      {/* Animated background blobs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-pink-600/20 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute top-1/2 right-0 h-[500px] w-[500px] rounded-full bg-pink-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-fuchsia-600/15 blur-3xl" />

      {/* Top Navigation */}
      <div className="absolute top-6 left-6 z-10">
        <button
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          onClick={() => navigate('/')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to Home
        </button>
      </div>

      <div className="absolute top-6 right-6 z-10">
        <button
          className="bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-700 hover:to-fuchsia-700 text-white px-6 py-2.5 text-sm font-semibold rounded-full shadow-lg shadow-pink-500/30 transition-all duration-200 hover:scale-105"
          onClick={toggleWalletModal}
        >
          {isAuthenticated ? '✓ Connected' : 'Connect Wallet'}
        </button>
      </div>

      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-2xl">
          {/* Profile Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
              <span className="bg-gradient-to-r from-pink-400 via-fuchsia-400 to-pink-300 bg-clip-text text-transparent">
                {isNewUser ? 'Create Your Profile' : 'Your Profile'}
              </span>
            </h1>
            {walletAddress && (
              <p className="text-gray-400">
                Wallet: <span className="text-pink-400 font-mono">{ellipseAddress(walletAddress)}</span>
              </p>
            )}
          </div>

          {/* Profile Form Card */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-pink-500/30 rounded-2xl p-8 shadow-xl shadow-pink-500/10">
            {!isAuthenticated ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🔐</div>
                <h3 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h3>
                <p className="text-gray-400 mb-6">Please connect your wallet to view and edit your profile.</p>
                <button
                  className="bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-700 hover:to-fuchsia-700 text-white px-8 py-3 font-semibold rounded-lg transition-all duration-200 hover:scale-105"
                  onClick={toggleWalletModal}
                >
                  Connect Wallet
                </button>
              </div>
            ) : isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading profile...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors"
                    maxLength={100}
                  />
                </div>

                {/* Description Field */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                    Bio / Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.description.length}/500 characters</p>
                </div>

                {/* Social Links */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span>🔗</span> Social Links
                  </h3>

                  {/* Twitter URL */}
                  <div>
                    <label htmlFor="twitter_url" className="block text-sm font-medium text-gray-300 mb-2">
                      Twitter / X Profile URL
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </span>
                      <input
                        type="url"
                        id="twitter_url"
                        name="twitter_url"
                        value={formData.twitter_url}
                        onChange={handleInputChange}
                        placeholder="https://twitter.com/username"
                        className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* LinkedIn URL */}
                  <div>
                    <label htmlFor="linkedin_url" className="block text-sm font-medium text-gray-300 mb-2">
                      LinkedIn Profile URL
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      </span>
                      <input
                        type="url"
                        id="linkedin_url"
                        name="linkedin_url"
                        value={formData.linkedin_url}
                        onChange={handleInputChange}
                        placeholder="https://linkedin.com/in/username"
                        className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-700 hover:to-fuchsia-700 text-white py-3 font-semibold rounded-lg transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <span>💾</span>
                        {isNewUser ? 'Create Profile' : 'Save Changes'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Profile Preview Card */}
          {isAuthenticated && !isLoading && formData.name && (
            <div className="mt-8 bg-gradient-to-br from-gray-900/50 to-gray-800/50 border border-pink-500/20 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span>👁️</span> Profile Preview
              </h3>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-fuchsia-500 flex items-center justify-center text-2xl font-bold text-white">
                  {formData.name.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-white">{formData.name || 'Your Name'}</h4>
                  <p className="text-gray-400 text-sm mt-1">{formData.description || 'Your bio will appear here...'}</p>
                  <div className="flex items-center gap-4 mt-3">
                    {formData.twitter_url && (
                      <a
                        href={formData.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-400 hover:text-pink-300 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </a>
                    )}
                    {formData.linkedin_url && (
                      <a
                        href={formData.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-400 hover:text-pink-300 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
    </div>
  )
}

export default Profile
