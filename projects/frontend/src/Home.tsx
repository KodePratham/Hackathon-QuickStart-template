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
    <div className="min-h-screen bg-white text-apple-dark font-sans selection:bg-apple-blue/20">
      
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="text-lg font-semibold tracking-tight cursor-default">PiggyBag</div>
          <div className="flex items-center gap-4">
            {activeAddress && (
              <Link
                to="/profile"
                className="text-sm font-medium text-apple-subtext hover:text-apple-dark transition-colors"
              >
                Profile
              </Link>
            )}
            <button
              data-test-id="connect-wallet"
              className={`text-sm font-medium px-4 py-1.5 rounded-full transition-all duration-200 ${
                activeAddress 
                  ? 'bg-apple-gray text-apple-dark hover:bg-gray-200' 
                  : 'bg-apple-dark text-white hover:bg-black/80 shadow-sm'
              }`}
              onClick={toggleWalletModal}
            >
              {activeAddress ? 'Connected' : 'Connect'}
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-24 fade-in-up">
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full bg-apple-gray/50 border border-gray-100">
            <span className="text-[11px] font-semibold tracking-wide uppercase text-apple-subtext">Student Fundraising</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-6 text-apple-dark leading-[0.95]">
            PiggyBag
          </h1>
          
          <p className="text-xl md:text-2xl text-apple-subtext font-medium leading-relaxed max-w-2xl mx-auto mb-8">
            Empower student dreams with instant, <br className="hidden md:block" /> transparent micro-donations.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
             {!activeAddress && (
                <button 
                  onClick={toggleWalletModal}
                  className="px-8 py-3 bg-apple-blue text-white font-medium rounded-full hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
                >
                  Start Fundraising
                </button>
             )}
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-32">
          <div className="flex flex-col items-center p-6 rounded-2xl bg-apple-gray/30">
            <span className="text-3xl font-bold text-apple-dark mb-1">12+</span>
            <span className="text-sm font-medium text-apple-subtext">Active Campaigns</span>
          </div>
          <div className="flex flex-col items-center p-6 rounded-2xl bg-apple-gray/30">
            <span className="text-3xl font-bold text-apple-dark mb-1">5.2K</span>
            <span className="text-sm font-medium text-apple-subtext">ALGO Raised</span>
          </div>
          <div className="flex flex-col items-center p-6 rounded-2xl bg-apple-gray/30">
            <span className="text-3xl font-bold text-apple-dark mb-1">240+</span>
            <span className="text-sm font-medium text-apple-subtext">Supporters</span>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-12">
           <h2 className="text-3xl font-bold text-center mb-12 tracking-tight">Everything you need</h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Donate */}
            <div className="group p-8 rounded-[2rem] bg-white border border-gray-100 shadow-apple hover:shadow-apple-hover transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl mb-6 group-hover:scale-110 transition-transform">
                💸
              </div>
              <h3 className="text-xl font-semibold mb-2">Donate</h3>
              <p className="text-apple-subtext leading-relaxed mb-6">
                Support campaigns instantly with minimal fees.
              </p>
              <button 
                onClick={() => setSendAlgoModal(true)}
                className="text-sm font-semibold text-apple-blue hover:text-blue-700 flex items-center gap-1 group/btn"
                disabled={!activeAddress}
              >
                {activeAddress ? 'Send Donation' : 'Connect Wallet'} 
                <span className="group-hover/btn:translate-x-0.5 transition-transform">→</span>
              </button>
            </div>

            {/* Campaign NFT */}
            <div className="group p-8 rounded-[2rem] bg-white border border-gray-100 shadow-apple hover:shadow-apple-hover transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl mb-6 group-hover:scale-110 transition-transform">
                🎨
              </div>
              <h3 className="text-xl font-semibold mb-2">Rewards</h3>
              <p className="text-apple-subtext leading-relaxed mb-6">
                Create unique NFT rewards for your supporters.
              </p>
              <button 
                onClick={() => setMintNftModal(true)}
                 className="text-sm font-semibold text-apple-blue hover:text-blue-700 flex items-center gap-1 group/btn"
                disabled={!activeAddress}
              >
                {activeAddress ? 'Mint NFT' : 'Connect Wallet'}
                <span className="group-hover/btn:translate-x-0.5 transition-transform">→</span>
              </button>
            </div>

            {/* Create Component */}
            <div className="group p-8 rounded-[2rem] bg-white border border-gray-100 shadow-apple hover:shadow-apple-hover transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center text-xl mb-6 group-hover:scale-110 transition-transform">
                🪙
              </div>
              <h3 className="text-xl font-semibold mb-2">Tokens</h3>
              <p className="text-apple-subtext leading-relaxed mb-6">
                Launch custom ASA tokens for fundraising.
              </p>
              <button 
                onClick={() => setCreateAsaModal(true)}
                 className="text-sm font-semibold text-apple-blue hover:text-blue-700 flex items-center gap-1 group/btn"
                disabled={!activeAddress}
              >
               {activeAddress ? 'Create Token' : 'Connect Wallet'}
               <span className="group-hover/btn:translate-x-0.5 transition-transform">→</span>
              </button>
            </div>

             {/* Opt-In */}
            <div className="group p-8 rounded-[2rem] bg-white border border-gray-100 shadow-apple hover:shadow-apple-hover transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center text-xl mb-6 group-hover:scale-110 transition-transform">
                ✨
              </div>
              <h3 className="text-xl font-semibold mb-2">Participate</h3>
              <p className="text-apple-subtext leading-relaxed mb-6">
                Opt-in to securely receive campaign assets.
              </p>
              <button 
                onClick={() => setAssetOptInModal(true)}
                 className="text-sm font-semibold text-apple-blue hover:text-blue-700 flex items-center gap-1 group/btn"
                disabled={!activeAddress}
              >
                {activeAddress ? 'Opt-In' : 'Connect Wallet'}
                <span className="group-hover/btn:translate-x-0.5 transition-transform">→</span>
              </button>
            </div>

            {/* Stats */}
             <div className="group p-8 rounded-[2rem] bg-white border border-gray-100 shadow-apple hover:shadow-apple-hover transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl mb-6 group-hover:scale-110 transition-transform">
                📊
              </div>
              <h3 className="text-xl font-semibold mb-2">Analytics</h3>
              <p className="text-apple-subtext leading-relaxed mb-6">
                Real-time on-chain engagement metrics.
              </p>
              <button 
                onClick={toggleAppCallsModal}
                 className="text-sm font-semibold text-apple-blue hover:text-blue-700 flex items-center gap-1 group/btn"
                disabled={!activeAddress}
              >
                {activeAddress ? 'View Dashboard' : 'Connect Wallet'}
                <span className="group-hover/btn:translate-x-0.5 transition-transform">→</span>
              </button>
            </div>

            {/* Vault */}
            <div className="group p-8 rounded-[2rem] bg-white border border-gray-100 shadow-apple hover:shadow-apple-hover transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-xl mb-6 group-hover:scale-110 transition-transform">
                🏦
              </div>
              <h3 className="text-xl font-semibold mb-2">Vault</h3>
              <p className="text-apple-subtext leading-relaxed mb-6">
                Secure management of campaign funds.
              </p>
              <button 
                onClick={() => setBankModal(true)}
                 className="text-sm font-semibold text-apple-blue hover:text-blue-700 flex items-center gap-1 group/btn"
                disabled={!activeAddress}
              >
                {activeAddress ? 'Open Vault' : 'Connect Wallet'}
                <span className="group-hover/btn:translate-x-0.5 transition-transform">→</span>
              </button>
            </div>

           </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-100 pt-12 pb-6 text-center">
            <p className="text-sm text-apple-subtext">Built on Algorand. Designed for Impact.</p>
        </footer>

      </main>

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
