// src/components/Home.tsx
import { useWallet } from '@txnlab/use-wallet-react'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import ConnectWallet from './components/ConnectWallet'
import AppCalls from './components/AppCalls'
import SendAlgo from './components/SendAlgo'
import MintNFT from './components/MintNFT'
import CreateASA from './components/CreateASA'
import AssetOptIn from './components/AssetOptIn'
import Bank from './components/Bank'

interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [appCallsDemoModal, setAppCallsDemoModal] = useState<boolean>(false)
  const [sendAlgoModal, setSendAlgoModal] = useState<boolean>(false)
  const [mintNftModal, setMintNftModal] = useState<boolean>(false)
  const [createAsaModal, setCreateAsaModal] = useState<boolean>(false)
  const [assetOptInModal, setAssetOptInModal] = useState<boolean>(false)
  const [bankModal, setBankModal] = useState<boolean>(false)
  const { activeAddress } = useWallet()

  const toggleWalletModal = () => {
    setOpenWalletModal(!openWalletModal)
  }

  const toggleAppCallsModal = () => {
    setAppCallsDemoModal(!appCallsDemoModal)
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-950 via-black to-gray-900">
      {/* Animated background blobs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-pink-600/20 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute top-1/2 right-0 h-[500px] w-[500px] rounded-full bg-pink-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-fuchsia-600/15 blur-3xl" />

      {/* Top-right navigation */}
      <div className="absolute top-6 right-6 z-10 flex items-center gap-3">
        {activeAddress && (
          <Link
            to="/profile"
            className="bg-gray-800/80 hover:bg-gray-700 text-white px-4 py-2.5 text-sm font-semibold rounded-full border border-pink-500/30 hover:border-pink-500/50 transition-all duration-200 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            Profile
          </Link>
        )}
        <button
          data-test-id="connect-wallet"
          className="bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-700 hover:to-fuchsia-700 text-white px-6 py-2.5 text-sm font-semibold rounded-full shadow-lg shadow-pink-500/30 transition-all duration-200 hover:scale-105"
          onClick={toggleWalletModal}
        >
          {activeAddress ? '✓ Connected' : 'Connect Wallet'}
        </button>
      </div>

      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12 max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-pink-600/20 border border-pink-500/30 px-4 py-1.5 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
            </span>
            <span className="text-xs font-semibold tracking-wide text-pink-300 uppercase">Student Powered Fundraising</span>
          </div>
          
          <h1 className="font-display text-6xl md:text-7xl lg:text-8xl font-extrabold mb-6">
            <span className="bg-gradient-to-r from-pink-400 via-fuchsia-400 to-pink-300 bg-clip-text text-transparent">
              PiggyBag
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-4 leading-relaxed">
            Empower student dreams, one donation at a time.
          </p>
          <p className="text-sm md:text-base text-gray-500">
            Built on Algorand for instant, low-fee micro-donations and transparent blockchain-verified impact.
          </p>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-pink-900/30 to-fuchsia-900/30 border border-pink-500/20 rounded-2xl p-4">
              <div className="text-2xl md:text-3xl font-bold text-pink-400">12+</div>
              <div className="text-xs md:text-sm text-gray-400 mt-1">Active Campaigns</div>
            </div>
            <div className="bg-gradient-to-br from-pink-900/30 to-fuchsia-900/30 border border-pink-500/20 rounded-2xl p-4">
              <div className="text-2xl md:text-3xl font-bold text-pink-400">5.2K</div>
              <div className="text-xs md:text-sm text-gray-400 mt-1">ALGO Raised</div>
            </div>
            <div className="bg-gradient-to-br from-pink-900/30 to-fuchsia-900/30 border border-pink-500/20 rounded-2xl p-4">
              <div className="text-2xl md:text-3xl font-bold text-pink-400">240+</div>
              <div className="text-xs md:text-sm text-gray-400 mt-1">Supporters</div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="max-w-6xl w-full">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Get Started</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Donate/Send Algo */}
            <div className="group relative bg-gradient-to-br from-gray-900 to-gray-800 border border-pink-500/30 rounded-2xl p-6 hover:border-pink-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/20">
              <div className="absolute top-0 right-0 w-24 h-24 bg-pink-600/10 rounded-full blur-2xl group-hover:bg-pink-600/20 transition-all"></div>
              <div className="relative">
                <div className="text-4xl mb-3">💸</div>
                <h3 className="text-xl font-bold text-white mb-2">Donate ALGO</h3>
                <p className="text-gray-400 text-sm mb-4">Send instant donations to student campaigns you believe in.</p>
                <button 
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={!activeAddress} 
                  onClick={() => setSendAlgoModal(true)}
                >
                  {activeAddress ? 'Donate Now' : 'Connect Wallet'}
                </button>
              </div>
            </div>

            {/* Create Campaign/Mint NFT */}
            <div className="group relative bg-gradient-to-br from-gray-900 to-gray-800 border border-pink-500/30 rounded-2xl p-6 hover:border-pink-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/20">
              <div className="absolute top-0 right-0 w-24 h-24 bg-fuchsia-600/10 rounded-full blur-2xl group-hover:bg-fuchsia-600/20 transition-all"></div>
              <div className="relative">
                <div className="text-4xl mb-3">🎨</div>
                <h3 className="text-xl font-bold text-white mb-2">Campaign NFT</h3>
                <p className="text-gray-400 text-sm mb-4">Create unique NFT rewards for your campaign supporters.</p>
                <button 
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={!activeAddress} 
                  onClick={() => setMintNftModal(true)}
                >
                  {activeAddress ? 'Mint NFT' : 'Connect Wallet'}
                </button>
              </div>
            </div>

            {/* Create Fundraiser Token */}
            <div className="group relative bg-gradient-to-br from-gray-900 to-gray-800 border border-pink-500/30 rounded-2xl p-6 hover:border-pink-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/20">
              <div className="absolute top-0 right-0 w-24 h-24 bg-pink-600/10 rounded-full blur-2xl group-hover:bg-pink-600/20 transition-all"></div>
              <div className="relative">
                <div className="text-4xl mb-3">🪙</div>
                <h3 className="text-xl font-bold text-white mb-2">Create Token</h3>
                <p className="text-gray-400 text-sm mb-4">Launch a custom ASA token for your fundraising campaign.</p>
                <button 
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={!activeAddress} 
                  onClick={() => setCreateAsaModal(true)}
                >
                  {activeAddress ? 'Create Token' : 'Connect Wallet'}
                </button>
              </div>
            </div>

            {/* Join Campaign/Asset Opt-In */}
            <div className="group relative bg-gradient-to-br from-gray-900 to-gray-800 border border-pink-500/30 rounded-2xl p-6 hover:border-pink-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/20">
              <div className="absolute top-0 right-0 w-24 h-24 bg-fuchsia-600/10 rounded-full blur-2xl group-hover:bg-fuchsia-600/20 transition-all"></div>
              <div className="relative">
                <div className="text-4xl mb-3">✨</div>
                <h3 className="text-xl font-bold text-white mb-2">Join Campaign</h3>
                <p className="text-gray-400 text-sm mb-4">Opt-in to receive campaign tokens and rewards.</p>
                <button 
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={!activeAddress} 
                  onClick={() => setAssetOptInModal(true)}
                >
                  {activeAddress ? 'Opt-In' : 'Connect Wallet'}
                </button>
              </div>
            </div>

            {/* Campaign Stats/Counter */}
            <div className="group relative bg-gradient-to-br from-gray-900 to-gray-800 border border-pink-500/30 rounded-2xl p-6 hover:border-pink-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/20">
              <div className="absolute top-0 right-0 w-24 h-24 bg-pink-600/10 rounded-full blur-2xl group-hover:bg-pink-600/20 transition-all"></div>
              <div className="relative">
                <div className="text-4xl mb-3">📊</div>
                <h3 className="text-xl font-bold text-white mb-2">Campaign Tracker</h3>
                <p className="text-gray-400 text-sm mb-4">Track engagement and milestones on-chain.</p>
                <button 
                  data-test-id="appcalls-demo"
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={!activeAddress} 
                  onClick={toggleAppCallsModal}
                >
                  {activeAddress ? 'View Stats' : 'Connect Wallet'}
                </button>
              </div>
            </div>

            {/* Fundraising Vault/Bank */}
            <div className="group relative bg-gradient-to-br from-gray-900 to-gray-800 border border-pink-500/30 rounded-2xl p-6 hover:border-pink-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/20">
              <div className="absolute top-0 right-0 w-24 h-24 bg-fuchsia-600/10 rounded-full blur-2xl group-hover:bg-fuchsia-600/20 transition-all"></div>
              <div className="relative">
                <div className="text-4xl mb-3">🏦</div>
                <h3 className="text-xl font-bold text-white mb-2">Fundraising Vault</h3>
                <p className="text-gray-400 text-sm mb-4">Manage campaign funds with secure deposits & withdrawals.</p>
                <button 
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={!activeAddress} 
                  onClick={() => setBankModal(true)}
                >
                  {activeAddress ? 'Open Vault' : 'Connect Wallet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
      <AppCalls openModal={appCallsDemoModal} setModalState={setAppCallsDemoModal} />
      <SendAlgo openModal={sendAlgoModal} closeModal={() => setSendAlgoModal(false)} />
      <MintNFT openModal={mintNftModal} closeModal={() => setMintNftModal(false)} />
      <CreateASA openModal={createAsaModal} closeModal={() => setCreateAsaModal(false)} />
      <AssetOptIn openModal={assetOptInModal} closeModal={() => setAssetOptInModal(false)} />
      <Bank openModal={bankModal} closeModal={() => setBankModal(false)} />
    </div>
  )
}

export default Home
