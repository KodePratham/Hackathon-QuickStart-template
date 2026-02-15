import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useNavigate } from 'react-router-dom'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import { createPiggyBankProject, updateProjectTweetPostUrl } from '../utils/piggybank_supabase'
import { deployAndInitializeProject, getTinymanPoolUrl } from '../utils/algorand'
import Navbar from '../components/Navbar'
import { normalizeTwitterStatusUrlInput } from '../utils/twitter'

const CreateProject = () => {
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()
  const { activeAddress, transactionSigner } = useWallet()
  const algodConfig = getAlgodConfigFromViteEnvironment()
  const indexerConfig = getIndexerConfigFromViteEnvironment()
  const algorand = useMemo(() => AlgorandClient.fromConfig({ algodConfig, indexerConfig }), [algodConfig, indexerConfig])

  useEffect(() => {
    algorand.setDefaultSigner(transactionSigner)
  }, [algorand, transactionSigner])

  // Form state
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [deployStatus, setDeployStatus] = useState('')

  // Step 1: Project Details
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [goalAmount, setGoalAmount] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [twitterUrl, setTwitterUrl] = useState('')
  const [discordUrl, setDiscordUrl] = useState('')
  const [projectPlanContent, setProjectPlanContent] = useState('')
  const [projectPlanFilename, setProjectPlanFilename] = useState('')
  const [projectPlanFormat, setProjectPlanFormat] = useState<'markdown' | 'text'>('text')

  // Step 2: Token Details
  const [tokenEnabled, setTokenEnabled] = useState(false)
  const [tokenName, setTokenName] = useState('')
  const [tokenSymbol, setTokenSymbol] = useState('')
  const [tokenSupply, setTokenSupply] = useState('1000000')

  // Deployment result
  const [deployResult, setDeployResult] = useState<{
    appId: number
    appAddress: string
    tokenId: number
    txnId: string
  } | null>(null)
  const [tweetPostUrlInput, setTweetPostUrlInput] = useState('')
  const [savedTweetPostUrl, setSavedTweetPostUrl] = useState('')
  const [savingTweetPostUrl, setSavingTweetPostUrl] = useState(false)

  const projectPublicUrl = useMemo(
    () => (deployResult ? `${window.location.origin}/project/${deployResult.appId}` : ''),
    [deployResult],
  )

  const tweetIntentUrl = useMemo(() => {
    if (!projectPublicUrl) return ''
    const tweetText = `I just launched my fundraiser on PiggyBag: ${projectName}`
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(projectPublicUrl)}`
  }, [projectName, projectPublicUrl])

  const handleDeploy = async () => {
    if (!activeAddress) {
      enqueueSnackbar('Please connect your wallet first', { variant: 'error' })
      return
    }
    if (!projectName || !goalAmount) {
      enqueueSnackbar('Please fill all required fields', { variant: 'error' })
      return
    }

    if (tokenEnabled && (!tokenName || !tokenSymbol)) {
      enqueueSnackbar('Please fill token name and symbol or disable token creation', { variant: 'error' })
      return
    }

    setLoading(true)
    setDeployStatus('Deploying smart contract...')

    try {
      const effectiveTokenName = tokenEnabled
        ? tokenName
        : `${projectName.slice(0, 20)} Support Token`
      const effectiveTokenSymbol = tokenEnabled
        ? tokenSymbol
        : 'SUPPORT'
      const effectiveTokenSupply = tokenEnabled
        ? parseInt(tokenSupply)
        : 1_000_000

      // 1. Deploy contract + initialize + mint token — all in one flow
      setDeployStatus('Deploying smart contract to Algorand...')
      const result = await deployAndInitializeProject({
        algorand,
        senderAddress: activeAddress,
        signer: transactionSigner,
        name: projectName,
        description: projectDescription || '',
        tokenEnabled,
        tokenName: effectiveTokenName,
        tokenSymbol: effectiveTokenSymbol,
        tokenSupply: effectiveTokenSupply,
        goalAlgos: parseFloat(goalAmount),
        tokenImageUrl: imageUrl || undefined,
      })

      setDeployResult(result)
      setDeployStatus('Saving project to database...')

      // 2. Save to Supabase
      const { data, error } = await createPiggyBankProject({
        app_id: result.appId,
        app_address: result.appAddress,
        name: projectName,
        description: projectDescription,
        token_id: result.tokenId,
        token_name: tokenEnabled ? tokenName : undefined,
        token_symbol: tokenEnabled ? tokenSymbol : undefined,
        token_total_supply: tokenEnabled ? parseInt(tokenSupply) * 1_000_000 : undefined,
        token_enabled: tokenEnabled,
        goal_amount: Math.round(parseFloat(goalAmount) * 1_000_000),
        creator_address: activeAddress,
        image_url: imageUrl || undefined,
        website_url: websiteUrl || undefined,
        twitter_url: twitterUrl || undefined,
        discord_url: discordUrl || undefined,
        project_plan_content: projectPlanContent || undefined,
        project_plan_filename: projectPlanFilename || undefined,
        project_plan_format: projectPlanFormat,
      })

      if (error) throw new Error(error.message)

      setDeployStatus('')
      setStep(4) // success step
      enqueueSnackbar('Project launched successfully!', { variant: 'success' })
    } catch (e) {
      console.error('Deployment failed:', e)
      setDeployStatus('')
      enqueueSnackbar(`Failed: ${(e as Error).message}`, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handlePlanFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0]
    if (!selected) return

    const fileName = selected.name || ''
    const isMarkdown = fileName.toLowerCase().endsWith('.md')
    const isText = fileName.toLowerCase().endsWith('.txt')

    if (!isMarkdown && !isText) {
      enqueueSnackbar('Please upload only .md or .txt files', { variant: 'error' })
      return
    }

    const content = await selected.text()
    setProjectPlanContent(content)
    setProjectPlanFilename(fileName)
    setProjectPlanFormat(isMarkdown ? 'markdown' : 'text')
  }

  const handleSaveTweetPostUrl = async () => {
    if (!deployResult) return

    const normalized = normalizeTwitterStatusUrlInput(tweetPostUrlInput)

    if (!normalized) {
      enqueueSnackbar('Please enter a valid tweet/status URL from x.com or twitter.com', { variant: 'error' })
      return
    }

    setSavingTweetPostUrl(true)
    try {
      const { error } = await updateProjectTweetPostUrl(deployResult.appId, normalized)
      if (error) throw error
      setSavedTweetPostUrl(normalized)
      setTweetPostUrlInput(normalized)
      enqueueSnackbar('Tweet verification link saved to your project', { variant: 'success' })
    } catch (e) {
      enqueueSnackbar(`Failed to save tweet link: ${(e as Error).message}`, { variant: 'error' })
    } finally {
      setSavingTweetPostUrl(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-32 md:pt-24 pb-16 px-6 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Create a Fundraiser</h1>
          <p className="text-gray-500 mt-2">
            Launch your project, mint a token, and receive on-chain support in minutes.
          </p>
        </div>

        {!activeAddress ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="text-5xl mb-4">🔐</div>
            <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-gray-500 mb-6">You need an Algorand wallet to create a fundraiser.</p>
            <a href="/guide" className="text-pink-600 hover:underline text-sm font-medium">
              New to Algorand? Read our guide →
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Step indicators */}
            <div className="flex flex-wrap items-center gap-2 mb-8">
                {[
                { num: 1, label: 'Project' },
                { num: 2, label: 'Token (Optional)' },
                { num: 3, label: 'Launch' },
                ...(deployResult ? [{ num: 4, label: 'Done' }] : []),
              ].map(({ num, label }) => (
                <button
                  key={num}
                  onClick={() => num < step && num < 4 && setStep(num)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                    step === num
                      ? 'bg-pink-600 text-white'
                      : step > num
                        ? 'bg-pink-100 text-pink-700'
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs">
                    {step > num ? '✓' : num}
                  </span>
                  {label}
                </button>
              ))}
            </div>

            {/* Step 1: Project Details */}
            {step === 1 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
                <h2 className="text-lg font-semibold">Project Details</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. Student Robotics Club"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Tell people what your project is about, why it matters, and how you'll use the funds..."
                    rows={5}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">{projectDescription.length}/1000 characters</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Project Plan & Donor Benefits (.md/.txt or paste)
                  </label>
                  <input
                    type="file"
                    accept=".md,.txt,text/plain,text/markdown"
                    onChange={handlePlanFileChange}
                    className="w-full text-sm text-gray-600 file:mr-3 file:px-3 file:py-2 file:border-0 file:rounded-lg file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                  />
                  <textarea
                    value={projectPlanContent}
                    onChange={(e) => {
                      setProjectPlanContent(e.target.value)
                      if (!projectPlanFilename) {
                        setProjectPlanFormat('text')
                      }
                    }}
                    placeholder="Paste your roadmap, execution plan, and what donors get in return..."
                    rows={7}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 resize-none"
                  />
                  <p className="text-xs text-gray-400">
                    {projectPlanFilename ? `Loaded from: ${projectPlanFilename}` : 'You can upload a file or paste directly.'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fundraising Goal (ALGO) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={goalAmount}
                      onChange={(e) => setGoalAmount(e.target.value)}
                      placeholder="100"
                      min="1"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                      ALGO
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Image URL (optional)
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
                    <input
                      type="url"
                      value={twitterUrl}
                      onChange={(e) => setTwitterUrl(e.target.value)}
                      placeholder="https://x.com/..."
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discord</label>
                    <input
                      type="url"
                      value={discordUrl}
                      onChange={(e) => setDiscordUrl(e.target.value)}
                      placeholder="https://discord.gg/..."
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!projectName || !goalAmount}
                  className="w-full py-3 bg-pink-600 text-white rounded-xl font-medium hover:bg-pink-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue to Token Setup →
                </button>
              </div>
            )}

            {/* Step 2: Token Details */}
            {step === 2 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
                <h2 className="text-lg font-semibold">Token Details</h2>
                <p className="text-sm text-gray-500">
                  Token minting is optional. Enable it if you want supporters to receive a tradeable ASA token.
                </p>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
                  <input
                    type="checkbox"
                    checked={tokenEnabled}
                    onChange={(e) => setTokenEnabled(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Create a project token</p>
                    <p className="text-xs text-gray-500">If off, your fundraiser works without token utilities.</p>
                  </div>
                </label>

                {tokenEnabled && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Token Name *</label>
                        <input
                          type="text"
                          value={tokenName}
                          onChange={(e) => setTokenName(e.target.value)}
                          maxLength={32}
                          placeholder="e.g. RoboToken"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Token Symbol * (max 8)</label>
                        <input
                          type="text"
                          value={tokenSymbol}
                          onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                          placeholder="e.g. ROBO"
                          maxLength={8}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Token Total Supply</label>
                      <input
                        type="number"
                        value={tokenSupply}
                        onChange={(e) => setTokenSupply(e.target.value)}
                        placeholder="1000000"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400"
                      />
                      <p className="text-xs text-gray-400 mt-1">Tokens have 6 decimals. 1,000,000 = 1M tokens.</p>
                    </div>
                  </>
                )}

                {/* What happens info */}
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <h4 className="text-sm font-semibold text-green-800 mb-1">✅ No CLI needed!</h4>
                  <p className="text-xs text-green-700 leading-relaxed">
                    Everything happens from your wallet. When you click &quot;Launch&quot;, we deploy the
                    smart contract, mint your token, and save your project — all in one step. Just approve
                    the transactions in your wallet.
                  </p>
                </div>

                {/* Liquidity info */}
                <div className="bg-pink-50 rounded-xl p-4 border border-pink-100">
                  <h4 className="text-sm font-semibold text-pink-800 mb-1">💧 Token Trading on Tinyman</h4>
                  <p className="text-xs text-pink-700 leading-relaxed">
                    After launching, you can create a trading pool on{' '}
                    <a
                      href="https://testnet.tinyman.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium"
                    >
                      Tinyman DEX
                    </a>
                    {' '}so supporters can buy/sell your token. We&apos;ll give you a direct link after launch.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={tokenEnabled && (!tokenName || !tokenSymbol)}
                    className="flex-1 py-3 bg-pink-600 text-white rounded-xl font-medium hover:bg-pink-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Review & Launch →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review & Launch */}
            {step === 3 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
                <h2 className="text-lg font-semibold">Review & Launch</h2>

                {/* Cost estimate */}
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 space-y-2">
                  <h4 className="text-sm font-semibold text-amber-900">💰 Estimated Cost</h4>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Deploying costs approximately <strong>{tokenEnabled ? '0.5' : '0.3'} ALGO</strong>
                    {' '}(contract creation{tokenEnabled ? ' + token minting fees' : ''}).
                    Make sure you have at least 1 ALGO in your wallet.
                  </p>
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700">Project Summary</h4>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                    <span className="text-gray-500">Project</span>
                    <span className="font-medium text-gray-900">{projectName}</span>
                    <span className="text-gray-500">Goal</span>
                    <span className="font-medium text-gray-900">{goalAmount} ALGO</span>
                    <span className="text-gray-500">Token</span>
                    <span className="font-medium text-gray-900">
                      {tokenEnabled ? `${tokenName} ($${tokenSymbol})` : 'Disabled'}
                    </span>
                    {tokenEnabled && (
                      <>
                        <span className="text-gray-500">Supply</span>
                        <span className="font-medium text-gray-900">{parseInt(tokenSupply).toLocaleString()} tokens</span>
                      </>
                    )}
                    <span className="text-gray-500">Creator</span>
                    <span className="font-mono text-xs text-gray-600">
                      {activeAddress.slice(0, 8)}...{activeAddress.slice(-6)}
                    </span>
                  </div>
                </div>

                {/* What happens */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700">What happens when you click Launch:</h4>
                  <ol className="text-xs text-gray-600 space-y-1.5 list-decimal ml-4">
                    <li>Smart contract is deployed on Algorand (you&apos;ll approve in wallet)</li>
                    <li>Contract is funded with minimum balance</li>
                    {tokenEnabled && <li>Your token <strong>${tokenSymbol}</strong> is minted on-chain as an ASA</li>}
                    <li>Project is saved and visible to everyone</li>
                  </ol>
                </div>

                {/* Deploy status */}
                {deployStatus && (
                  <div className="bg-pink-50 rounded-xl p-4 border border-pink-100 flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-pink-300/40 border-t-pink-600 rounded-full animate-spin flex-shrink-0" />
                    <p className="text-sm text-pink-800 font-medium">{deployStatus}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    disabled={loading}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-40"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleDeploy}
                    disabled={loading}
                    className="flex-1 py-3 bg-pink-600 text-white rounded-xl font-medium hover:bg-pink-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Deploying...
                      </>
                    ) : (
                      '🚀 Launch Fundraiser'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Success */}
            {step === 4 && deployResult && (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-6">
                <div className="text-6xl">🎉</div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Launched!</h2>
                  <p className="text-gray-500">
                    Your project is live on Algorand.
                    {tokenEnabled ? <> Token <strong>${tokenSymbol}</strong> has been minted.</> : null}
                  </p>
                </div>

                {/* Deployment details */}
                <div className="bg-gray-50 rounded-xl p-5 text-left space-y-2 text-sm max-w-md mx-auto">
                  <div className="flex justify-between">
                    <span className="text-gray-500">App ID</span>
                    <span className="font-mono font-medium">{deployResult.appId}</span>
                  </div>
                  {tokenEnabled && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Token ID (ASA)</span>
                      <span className="font-mono font-medium">{deployResult.tokenId}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Contract</span>
                    <span className="font-mono text-xs">
                      {deployResult.appAddress.slice(0, 10)}...{deployResult.appAddress.slice(-6)}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <button
                    onClick={() => navigate(`/project/${deployResult.appId}`)}
                    className="flex-1 py-3 bg-pink-600 text-white rounded-xl font-medium hover:bg-pink-700 transition-colors"
                  >
                    View Project →
                  </button>
                  {tokenEnabled && deployResult.tokenId > 0 && (
                    <a
                      href={getTinymanPoolUrl(deployResult.tokenId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-black transition-colors text-center"
                    >
                      💧 Create Trading Pool
                    </a>
                  )}
                </div>

                <div className="bg-white rounded-xl border border-pink-100 p-4 text-left max-w-md mx-auto space-y-3">
                  <h4 className="text-sm font-semibold text-gray-800">Tweet your project for verification</h4>
                  <p className="text-xs text-gray-500">
                    Post your project link from your real account, then paste that tweet URL below so donors can verify it.
                  </p>
                  {tweetIntentUrl && (
                    <a
                      href={tweetIntentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full py-2.5 text-center bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-900"
                    >
                      Post on X / Twitter
                    </a>
                  )}

                  <div className="space-y-2">
                    <input
                      type="url"
                      value={tweetPostUrlInput}
                      onChange={(e) => setTweetPostUrlInput(e.target.value)}
                      placeholder="https://x.com/username/status/..."
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                    />
                    <button
                      onClick={handleSaveTweetPostUrl}
                      disabled={savingTweetPostUrl || !tweetPostUrlInput.trim()}
                      className="w-full py-2.5 bg-pink-600 text-white rounded-lg text-sm font-medium hover:bg-pink-700 disabled:opacity-40"
                    >
                      {savingTweetPostUrl ? 'Saving...' : 'Save Tweet Verification Link'}
                    </button>
                  </div>

                  {savedTweetPostUrl && (
                    <a
                      href={savedTweetPostUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-pink-600 hover:underline"
                    >
                      View saved verification tweet ↗
                    </a>
                  )}
                </div>

                {/* Tinyman explainer */}
                {tokenEnabled && deployResult.tokenId > 0 && (
                  <div className="bg-pink-50 rounded-xl p-4 border border-pink-100 text-left max-w-md mx-auto">
                    <h4 className="text-sm font-semibold text-pink-800 mb-1">Make your token tradeable</h4>
                    <p className="text-xs text-pink-700 leading-relaxed">
                      Create a pool on Tinyman DEX to let anyone buy/sell your ${tokenSymbol} token.
                      You&apos;ll provide some ALGO + tokens as initial liquidity. Click the button above
                      to get started on Tinyman.
                    </p>
                  </div>
                )}

                {/* Explorer links */}
                <div className="flex flex-wrap gap-2 justify-center text-xs">
                  <a
                    href={`https://testnet.algoexplorer.io/application/${deployResult.appId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-600 hover:underline"
                  >
                    View on Explorer ↗
                  </a>
                  {tokenEnabled && (
                    <>
                      <span className="text-gray-300">|</span>
                      <a
                        href={`https://testnet.algoexplorer.io/asset/${deployResult.tokenId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 hover:underline"
                      >
                        View Token ↗
                      </a>
                    </>
                  )}
                  <span className="text-gray-300">|</span>
                  <a
                    href={`https://testnet.algoexplorer.io/tx/${deployResult.txnId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-600 hover:underline"
                  >
                    View Transaction ↗
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default CreateProject
