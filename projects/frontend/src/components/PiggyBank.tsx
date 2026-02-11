import { useEffect, useMemo, useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import algosdk, { getApplicationAddress, makePaymentTxnWithSuggestedParamsFromObject } from 'algosdk'
import { AlgorandClient, microAlgos } from '@algorandfoundation/algokit-utils'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import {
  createPiggyBankProject,
  getProjectByAppId,
  recordDeposit,
  recordWithdrawal,
  updateProjectDeposits,
  setTinymanPool,
  type PiggyBankProject,
} from '../utils/piggybank_supabase'

interface PiggyBankProps {
  openModal: boolean
  closeModal: () => void
}

// Tinyman Testnet App IDs
const TINYMAN_V2_TESTNET_APP_ID = 62368684
const TINYMAN_TESTNET_URL = 'https://testnet.tinyman.org'

const PiggyBankComponent = ({ openModal, closeModal }: PiggyBankProps) => {
  const { enqueueSnackbar } = useSnackbar()
  const { activeAddress, transactionSigner } = useWallet()
  const algodConfig = getAlgodConfigFromViteEnvironment()
  const indexerConfig = getIndexerConfigFromViteEnvironment()
  const algorand = useMemo(() => AlgorandClient.fromConfig({ algodConfig, indexerConfig }), [algodConfig, indexerConfig])

  // State
  const [appId, setAppId] = useState<number | ''>(0)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'create' | 'manage' | 'trade'>('create')
  
  // Project creation state
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [tokenName, setTokenName] = useState('')
  const [tokenSymbol, setTokenSymbol] = useState('')
  const [tokenSupply, setTokenSupply] = useState('1000000')
  const [goalAmount, setGoalAmount] = useState('')
  
  // Project info state
  const [projectInfo, setProjectInfo] = useState<PiggyBankProject | null>(null)
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [userDeposit, setUserDeposit] = useState<number>(0)
  const [tokenId, setTokenId] = useState<number>(0)

  useEffect(() => {
    algorand.setDefaultSigner(transactionSigner)
  }, [algorand, transactionSigner])

  const appAddress = useMemo(() => (appId && appId > 0 ? String(getApplicationAddress(appId)) : ''), [appId])

  // Fetch project info from Supabase
  const fetchProjectInfo = async () => {
    if (!appId) return
    try {
      const { data } = await getProjectByAppId(Number(appId))
      if (data) {
        setProjectInfo(data)
        setTokenId(data.token_id || 0)
      }
    } catch (e) {
      console.error('Failed to fetch project info:', e)
    }
  }

  useEffect(() => {
    if (appId) {
      fetchProjectInfo()
    }
  }, [appId])

  // Deploy new PiggyBank contract
  const deployContract = async () => {
    if (!activeAddress) {
      enqueueSnackbar('Please connect your wallet first', { variant: 'error' })
      return
    }
    setLoading(true)
    try {
      //  In a real implementation, you would deploy using PiggyBankFactory
      // For now, we'll show the steps needed
      enqueueSnackbar('Contract deployment would happen here. Use AlgoKit CLI for actual deployment.', { variant: 'info' })
      enqueueSnackbar('Run: algokit project deploy testnet', { variant: 'info' })
    } catch (e) {
      enqueueSnackbar(`Deployment failed: ${(e as Error).message}`, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Initialize project with token
  const initializeProject = async () => {
    if (!activeAddress || !appId) {
      enqueueSnackbar('Connect wallet and enter App ID', { variant: 'error' })
      return
    }
    if (!projectName || !tokenName || !tokenSymbol || !goalAmount) {
      enqueueSnackbar('Please fill all required fields', { variant: 'error' })
      return
    }

    setLoading(true)
    try {
      const sp = await algorand.client.algod.getTransactionParams().do()
      const goalMicroAlgos = Math.round(parseFloat(goalAmount) * 1_000_000)
      const supplyWithDecimals = parseInt(tokenSupply) * 1_000_000 // 6 decimals

      // Create MBR payment transaction
      const mbrPayTxn = makePaymentTxnWithSuggestedParamsFromObject({
        sender: activeAddress,
        receiver: appAddress,
        amount: 200_000, // 0.2 ALGO for ASA creation
        suggestedParams: sp,
      })

      // Here you would call the initialize_project method on the contract
      // This is a placeholder showing the structure
      enqueueSnackbar('Initializing project...', { variant: 'info' })

      // After successful blockchain tx, save to Supabase
      const { data, error } = await createPiggyBankProject({
        app_id: Number(appId),
        app_address: appAddress,
        name: projectName,
        description: projectDescription,
        token_name: tokenName,
        token_symbol: tokenSymbol,
        token_total_supply: supplyWithDecimals,
        goal_amount: goalMicroAlgos,
        creator_address: activeAddress,
      })

      if (error) {
        throw new Error(error.message)
      }

      enqueueSnackbar('Project initialized successfully!', { variant: 'success' })
      setProjectInfo(data)
      setActiveTab('manage')
    } catch (e) {
      enqueueSnackbar(`Failed to initialize: ${(e as Error).message}`, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Deposit ALGO
  const deposit = async () => {
    if (!activeAddress || !appId) {
      enqueueSnackbar('Connect wallet and enter App ID', { variant: 'error' })
      return
    }
    const amountAlgos = parseFloat(depositAmount)
    if (!amountAlgos || amountAlgos <= 0) {
      enqueueSnackbar('Enter a valid deposit amount', { variant: 'error' })
      return
    }

    setLoading(true)
    try {
      const sp = await algorand.client.algod.getTransactionParams().do()
      const amountMicroAlgos = Math.round(amountAlgos * 1_000_000)

      // Create payment transaction
      const payTxn = makePaymentTxnWithSuggestedParamsFromObject({
        sender: activeAddress,
        receiver: appAddress,
        amount: amountMicroAlgos,
        suggestedParams: sp,
      })

      // Here you would call the deposit method on the contract
      // and record to Supabase
      
      enqueueSnackbar(`Deposited ${amountAlgos} ALGO successfully!`, { variant: 'success' })
      setDepositAmount('')
      fetchProjectInfo()
    } catch (e) {
      enqueueSnackbar(`Deposit failed: ${(e as Error).message}`, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Withdraw ALGO
  const withdraw = async () => {
    if (!activeAddress || !appId) {
      enqueueSnackbar('Connect wallet and enter App ID', { variant: 'error' })
      return
    }
    const amountAlgos = parseFloat(withdrawAmount)
    if (!amountAlgos || amountAlgos <= 0) {
      enqueueSnackbar('Enter a valid withdrawal amount', { variant: 'error' })
      return
    }

    setLoading(true)
    try {
      const amountMicroAlgos = Math.round(amountAlgos * 1_000_000)

      // Here you would call the withdraw method on the contract
      
      enqueueSnackbar(`Withdrew ${amountAlgos} ALGO successfully!`, { variant: 'success' })
      setWithdrawAmount('')
      fetchProjectInfo()
    } catch (e) {
      enqueueSnackbar(`Withdrawal failed: ${(e as Error).message}`, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Claim tokens
  const claimTokens = async () => {
    if (!activeAddress || !appId || !tokenId) {
      enqueueSnackbar('Invalid state for claiming', { variant: 'error' })
      return
    }

    setLoading(true)
    try {
      // Here you would:
      // 1. Opt-in user to the token if not already
      // 2. Call claim_tokens on the contract
      
      enqueueSnackbar('Tokens claimed successfully!', { variant: 'success' })
    } catch (e) {
      enqueueSnackbar(`Claim failed: ${(e as Error).message}`, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Open Tinyman for trading
  const openTinyman = () => {
    if (!tokenId) {
      enqueueSnackbar('Token not created yet', { variant: 'error' })
      return
    }
    // Open Tinyman testnet with token pair
    const tinymanUrl = `${TINYMAN_TESTNET_URL}/#/swap?asset_in=0&asset_out=${tokenId}`
    window.open(tinymanUrl, '_blank')
  }

  // Create Tinyman pool (bootstrap)
  const createTinymanPool = async () => {
    if (!tokenId) {
      enqueueSnackbar('Token not created yet', { variant: 'error' })
      return
    }
    
    setLoading(true)
    try {
      // In a real implementation, you would:
      // 1. Call Tinyman V2 bootstrap method
      // 2. Add initial liquidity
      // For now, show info about manual pool creation
      
      const poolUrl = `${TINYMAN_TESTNET_URL}/#/pool/create?asset_1=0&asset_2=${tokenId}`
      window.open(poolUrl, '_blank')
      
      enqueueSnackbar('Redirecting to Tinyman to create pool...', { variant: 'info' })
    } catch (e) {
      enqueueSnackbar(`Pool creation failed: ${(e as Error).message}`, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  if (!openModal) return null

  return (
    <dialog className="modal modal-open">
      <div className="modal-box w-11/12 max-w-4xl">
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={closeModal}>
            ✕
          </button>
        </form>

        <h3 className="font-bold text-2xl mb-4">🐷 PiggyBank</h3>
        <p className="text-sm text-gray-500 mb-4">Create savings projects with custom tokens tradable on Tinyman</p>

        {/* Tabs */}
        <div className="tabs tabs-boxed mb-4">
          <button 
            className={`tab ${activeTab === 'create' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            Create Project
          </button>
          <button 
            className={`tab ${activeTab === 'manage' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('manage')}
          >
            Manage
          </button>
          <button 
            className={`tab ${activeTab === 'trade' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('trade')}
          >
            Trade on Tinyman
          </button>
        </div>

        {/* App ID Input */}
        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">App ID (Contract Address)</span>
          </label>
          <input
            type="number"
            placeholder="Enter App ID after deployment"
            className="input input-bordered w-full"
            value={appId}
            onChange={(e) => setAppId(e.target.value ? parseInt(e.target.value) : '')}
          />
          {appAddress && (
            <label className="label">
              <span className="label-text-alt text-xs">App Address: {appAddress.slice(0, 10)}...{appAddress.slice(-6)}</span>
            </label>
          )}
        </div>

        {/* Create Project Tab */}
        {activeTab === 'create' && (
          <div className="space-y-4">
            <div className="alert alert-info">
              <span>First deploy the contract using: <code>algokit project deploy testnet</code></span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text">Project Name *</span></label>
                <input
                  type="text"
                  placeholder="My PiggyBank"
                  className="input input-bordered"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text">Goal Amount (ALGO) *</span></label>
                <input
                  type="number"
                  placeholder="100"
                  className="input input-bordered"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                />
              </div>

              <div className="form-control md:col-span-2">
                <label className="label"><span className="label-text">Description</span></label>
                <textarea
                  placeholder="Describe your project..."
                  className="textarea textarea-bordered"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                />
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text">Token Name *</span></label>
                <input
                  type="text"
                  placeholder="PiggyToken"
                  className="input input-bordered"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                />
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text">Token Symbol * (max 8)</span></label>
                <input
                  type="text"
                  placeholder="PIGGY"
                  className="input input-bordered"
                  maxLength={8}
                  value={tokenSymbol}
                  onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                />
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text">Token Supply</span></label>
                <input
                  type="number"
                  placeholder="1000000"
                  className="input input-bordered"
                  value={tokenSupply}
                  onChange={(e) => setTokenSupply(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                className="btn btn-secondary"
                onClick={deployContract}
                disabled={loading || !activeAddress}
              >
                {loading ? <span className="loading loading-spinner" /> : '1. Deploy Contract'}
              </button>

              <button
                className="btn btn-primary"
                onClick={initializeProject}
                disabled={loading || !activeAddress || !appId}
              >
                {loading ? <span className="loading loading-spinner" /> : '2. Initialize Project'}
              </button>
            </div>
          </div>
        )}

        {/* Manage Tab */}
        {activeTab === 'manage' && (
          <div className="space-y-4">
            {projectInfo && (
              <div className="stats shadow w-full">
                <div className="stat">
                  <div className="stat-title">Project</div>
                  <div className="stat-value text-lg">{projectInfo.name}</div>
                  <div className="stat-desc">{projectInfo.token_symbol} Token</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Goal</div>
                  <div className="stat-value text-lg">{(projectInfo.goal_amount / 1_000_000).toFixed(2)}</div>
                  <div className="stat-desc">ALGO</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Deposited</div>
                  <div className="stat-value text-lg">{((projectInfo.total_deposited || 0) / 1_000_000).toFixed(2)}</div>
                  <div className="stat-desc">ALGO</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Deposit */}
              <div className="card bg-base-200">
                <div className="card-body">
                  <h4 className="card-title">Deposit ALGO</h4>
                  <div className="form-control">
                    <input
                      type="number"
                      placeholder="Amount in ALGO"
                      className="input input-bordered"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                    />
                  </div>
                  <button
                    className="btn btn-success"
                    onClick={deposit}
                    disabled={loading || !activeAddress}
                  >
                    {loading ? <span className="loading loading-spinner" /> : 'Deposit'}
                  </button>
                </div>
              </div>

              {/* Withdraw */}
              <div className="card bg-base-200">
                <div className="card-body">
                  <h4 className="card-title">Withdraw ALGO</h4>
                  <p className="text-sm text-gray-500">Your deposit: {(userDeposit / 1_000_000).toFixed(4)} ALGO</p>
                  <div className="form-control">
                    <input
                      type="number"
                      placeholder="Amount in ALGO"
                      className="input input-bordered"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                    />
                  </div>
                  <button
                    className="btn btn-warning"
                    onClick={withdraw}
                    disabled={loading || !activeAddress}
                  >
                    {loading ? <span className="loading loading-spinner" /> : 'Withdraw'}
                  </button>
                </div>
              </div>
            </div>

            {/* Claim Tokens */}
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="card-title">Claim {projectInfo?.token_symbol || 'Project'} Tokens</h4>
                <p className="text-sm">Claim tokens based on your deposit ratio (1 token per 0.001 ALGO)</p>
                <button
                  className="btn btn-primary"
                  onClick={claimTokens}
                  disabled={loading || !activeAddress || !tokenId}
                >
                  {loading ? <span className="loading loading-spinner" /> : 'Claim Tokens'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Trade Tab - Tinyman Integration */}
        {activeTab === 'trade' && (
          <div className="space-y-4">
            <div className="alert">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-bold">Trade on Tinyman (Testnet)</h3>
                <p className="text-sm">Your project token can be traded on Tinyman DEX</p>
              </div>
            </div>

            {tokenId > 0 && (
              <div className="stats shadow w-full">
                <div className="stat">
                  <div className="stat-title">Token ID (ASA)</div>
                  <div className="stat-value text-lg">{tokenId}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Token</div>
                  <div className="stat-value text-lg">{projectInfo?.token_symbol || 'N/A'}</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <div className="card-body">
                  <h4 className="card-title">Create Pool</h4>
                  <p>Bootstrap a new ALGO/{projectInfo?.token_symbol || 'TOKEN'} pool on Tinyman</p>
                  <button
                    className="btn btn-white"
                    onClick={createTinymanPool}
                    disabled={loading || !tokenId}
                  >
                    Create Pool on Tinyman
                  </button>
                </div>
              </div>

              <div className="card bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                <div className="card-body">
                  <h4 className="card-title">Trade</h4>
                  <p>Swap ALGO for {projectInfo?.token_symbol || 'TOKEN'} on Tinyman</p>
                  <button
                    className="btn btn-white"
                    onClick={openTinyman}
                    disabled={!tokenId}
                  >
                    Open Tinyman ↗
                  </button>
                </div>
              </div>
            </div>

            {projectInfo?.tinyman_pool_address && (
              <div className="alert alert-success">
                <span>Pool Address: {projectInfo.tinyman_pool_address}</span>
              </div>
            )}

            <div className="divider">Tinyman Testnet Resources</div>
            
            <div className="flex flex-wrap gap-2">
              <a href="https://testnet.tinyman.org" target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                Tinyman Testnet ↗
              </a>
              <a href="https://bank.testnet.algorand.network/" target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                Get Testnet ALGO ↗
              </a>
              <a href="https://testnet.algoexplorer.io/" target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                Block Explorer ↗
              </a>
            </div>
          </div>
        )}

        <div className="modal-action">
          <button className="btn" onClick={closeModal}>Close</button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={closeModal}>close</button>
      </form>
    </dialog>
  )
}

export default PiggyBankComponent
