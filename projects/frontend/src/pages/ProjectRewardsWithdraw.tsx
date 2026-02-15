import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { AlgorandClient, microAlgos } from '@algorandfoundation/algokit-utils'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import {
  createProjectReward,
  createProjectAnnouncement,
  getProjectByAppId,
  getProjectAnnouncements,
  getProjectDonors,
  getProjectRewards,
  markRewardDistributed,
  PiggyBankProjectAnnouncement,
  PiggyBankDonor,
  PiggyBankProject,
  PiggyBankReward,
  recordRewardDistribution,
  recordWithdrawal,
  updateProject,
  updateProjectTweetPostUrl,
} from '../utils/piggybank_supabase'
import { withdrawFromProject } from '../utils/algorand'
import Navbar from '../components/Navbar'
import { ellipseAddress } from '../utils/ellipseAddress'
import { normalizeTwitterStatusUrlInput, normalizeTwitterUrlInput } from '../utils/twitter'

const ProjectRewardsWithdraw = () => {
  const { appId } = useParams<{ appId: string }>()
  const { activeAddress, transactionSigner } = useWallet()
  const { enqueueSnackbar } = useSnackbar()
  const algodConfig = getAlgodConfigFromViteEnvironment()
  const indexerConfig = getIndexerConfigFromViteEnvironment()
  const algorand = useMemo(() => AlgorandClient.fromConfig({ algodConfig, indexerConfig }), [algodConfig, indexerConfig])

  const [project, setProject] = useState<PiggyBankProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const [donors, setDonors] = useState<PiggyBankDonor[]>([])
  const [rewards, setRewards] = useState<PiggyBankReward[]>([])
  const [rewardTitle, setRewardTitle] = useState('')
  const [rewardDescription, setRewardDescription] = useState('')
  const [rewardPoolAlgo, setRewardPoolAlgo] = useState('')
  const [distributingRewardId, setDistributingRewardId] = useState<string | null>(null)
  const [tweetPostUrlInput, setTweetPostUrlInput] = useState('')
  const [savingTweetPostUrl, setSavingTweetPostUrl] = useState(false)
  const [twitterUrlInput, setTwitterUrlInput] = useState('')
  const [discordUrlInput, setDiscordUrlInput] = useState('')
  const [savingSocialLinks, setSavingSocialLinks] = useState(false)
  const [announcementUrlInput, setAnnouncementUrlInput] = useState('')
  const [announcements, setAnnouncements] = useState<PiggyBankProjectAnnouncement[]>([])
  const [savingAnnouncement, setSavingAnnouncement] = useState(false)

  useEffect(() => {
    algorand.setDefaultSigner(transactionSigner)
  }, [algorand, transactionSigner])

  useEffect(() => {
    const loadProject = async () => {
      if (!appId) return
      setLoading(true)
      const { data } = await getProjectByAppId(parseInt(appId))
      setProject(data || null)
      setLoading(false)
    }

    loadProject()
  }, [appId])

  const isCreator = Boolean(activeAddress && project && activeAddress === project.creator_address)

  useEffect(() => {
    const loadCreatorData = async () => {
      if (!project?.id || !isCreator) {
        setDonors([])
        setRewards([])
        return
      }

      const [{ data: donorData }, { data: rewardData }, { data: announcementData }] = await Promise.all([
        getProjectDonors(project.id),
        getProjectRewards(project.id),
        getProjectAnnouncements(project.id),
      ])

      setDonors(donorData || [])
      setRewards(rewardData || [])
      setAnnouncements(announcementData || [])
    }

    loadCreatorData()
  }, [project?.id, isCreator])

  useEffect(() => {
    setTweetPostUrlInput(project?.tweet_post_url || '')
  }, [project?.tweet_post_url])

  useEffect(() => {
    setTwitterUrlInput(project?.twitter_url || '')
    setDiscordUrlInput(project?.discord_url || '')
  }, [project?.twitter_url, project?.discord_url])

  const projectPublicUrl = useMemo(
    () => (project ? `${window.location.origin}/project/${project.app_id}` : ''),
    [project],
  )

  const tweetIntentUrl = useMemo(() => {
    if (!projectPublicUrl || !project?.name) return ''
    const tweetText = `Update from ${project.name} on PiggyBag`
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(projectPublicUrl)}`
  }, [project?.name, projectPublicUrl])

  const handleWithdraw = async () => {
    if (!activeAddress || !appId || !project || !isCreator) {
      enqueueSnackbar('Only the project creator can withdraw', { variant: 'error' })
      return
    }

    const amountAlgo = parseFloat(withdrawAmount)
    if (!amountAlgo || amountAlgo <= 0) {
      enqueueSnackbar('Enter a valid amount', { variant: 'error' })
      return
    }

    setActionLoading(true)
    try {
      const { txnId } = await withdrawFromProject(
        algorand,
        parseInt(appId),
        activeAddress,
        amountAlgo,
      )

      const amountMicroAlgos = Math.round(amountAlgo * 1_000_000)
      await recordWithdrawal({
        project_id: project.id!,
        app_id: parseInt(appId),
        withdrawer_address: activeAddress,
        amount: amountMicroAlgos,
        txn_id: txnId,
      })

      const { data: refreshedProject } = await getProjectByAppId(parseInt(appId))
      if (refreshedProject) setProject(refreshedProject)

      setWithdrawAmount('')
      enqueueSnackbar(`Withdrew ${amountAlgo} ALGO`, { variant: 'success' })
    } catch (e) {
      enqueueSnackbar(`Withdrawal failed: ${(e as Error).message}`, { variant: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateReward = async () => {
    if (!activeAddress || !project?.id || !isCreator) {
      enqueueSnackbar('Only the project creator can create rewards', { variant: 'error' })
      return
    }

    const rewardPool = parseFloat(rewardPoolAlgo)
    if (!rewardTitle.trim() || !rewardPool || rewardPool <= 0) {
      enqueueSnackbar('Enter reward title and valid ALGO amount', { variant: 'error' })
      return
    }

    const rewardPoolMicro = Math.round(rewardPool * 1_000_000)
    const { error } = await createProjectReward({
      project_id: project.id,
      title: rewardTitle.trim(),
      description: rewardDescription.trim() || undefined,
      reward_pool_amount: rewardPoolMicro,
      created_by_address: activeAddress,
    })

    if (error) {
      enqueueSnackbar(`Failed to create reward: ${error.message}`, { variant: 'error' })
      return
    }

    const { data: rewardData } = await getProjectRewards(project.id)
    setRewards(rewardData || [])
    setRewardTitle('')
    setRewardDescription('')
    setRewardPoolAlgo('')
    enqueueSnackbar('Reward created', { variant: 'success' })
  }

  const handleSaveTweetVerificationUrl = async () => {
    if (!project) return

    const normalized = normalizeTwitterStatusUrlInput(tweetPostUrlInput)
    if (!normalized) {
      enqueueSnackbar('Enter a valid tweet URL from x.com or twitter.com', { variant: 'error' })
      return
    }

    setSavingTweetPostUrl(true)
    try {
      const { data, error } = await updateProjectTweetPostUrl(project.app_id, normalized)
      if (error) throw error
      if (data) setProject(data)
      setTweetPostUrlInput(normalized)
      enqueueSnackbar('Tweet verification link saved', { variant: 'success' })
    } catch (e) {
      enqueueSnackbar(`Failed to save tweet verification: ${(e as Error).message}`, { variant: 'error' })
    } finally {
      setSavingTweetPostUrl(false)
    }
  }

  const handleSaveSocialLinks = async () => {
    if (!project) return

    const twitterInput = twitterUrlInput.trim()
    const discordInput = discordUrlInput.trim()

    let normalizedTwitter: string | null = null
    if (twitterInput) {
      normalizedTwitter = normalizeTwitterUrlInput(twitterInput)
      if (!normalizedTwitter) {
        enqueueSnackbar('Enter a valid Twitter/X profile URL', { variant: 'error' })
        return
      }
    }

    if (discordInput) {
      try {
        new URL(discordInput.startsWith('http') ? discordInput : `https://${discordInput}`)
      } catch {
        enqueueSnackbar('Enter a valid Discord invite URL', { variant: 'error' })
        return
      }
    }

    setSavingSocialLinks(true)
    try {
      const { data, error } = await updateProject(project.app_id, {
        twitter_url: normalizedTwitter || undefined,
        discord_url: discordInput || undefined,
      })
      if (error) throw error
      if (data) setProject(data as PiggyBankProject)
      if (normalizedTwitter) setTwitterUrlInput(normalizedTwitter)
      enqueueSnackbar('Project social links updated', { variant: 'success' })
    } catch (e) {
      enqueueSnackbar(`Failed to update social links: ${(e as Error).message}`, { variant: 'error' })
    } finally {
      setSavingSocialLinks(false)
    }
  }

  const handleCreateAnnouncement = async () => {
    if (!project?.id || !activeAddress || !isCreator) return

    const normalized = normalizeTwitterStatusUrlInput(announcementUrlInput)
    if (!normalized) {
      enqueueSnackbar('Announcement must be a valid x.com/twitter.com status link', { variant: 'error' })
      return
    }

    setSavingAnnouncement(true)
    try {
      const { error } = await createProjectAnnouncement({
        project_id: project.id,
        tweet_url: normalized,
        created_by_address: activeAddress,
      })

      if (error) throw error

      const { data } = await getProjectAnnouncements(project.id)
      setAnnouncements(data || [])
      setAnnouncementUrlInput('')
      enqueueSnackbar('Announcement added', { variant: 'success' })
    } catch (e) {
      enqueueSnackbar(`Failed to add announcement: ${(e as Error).message}`, { variant: 'error' })
    } finally {
      setSavingAnnouncement(false)
    }
  }

  const handleDistributeReward = async (reward: PiggyBankReward) => {
    if (!activeAddress || !project?.id || !isCreator || !reward.id) {
      enqueueSnackbar('Only the project creator can distribute rewards', { variant: 'error' })
      return
    }

    const eligibleDonors = donors.filter((donor) => donor.total_donated > 0)
    if (eligibleDonors.length === 0) {
      enqueueSnackbar('No donors found to distribute rewards', { variant: 'error' })
      return
    }

    const totalDonated = eligibleDonors.reduce((sum, donor) => sum + donor.total_donated, 0)
    if (totalDonated <= 0) {
      enqueueSnackbar('Donor totals are invalid for distribution', { variant: 'error' })
      return
    }

    const allocations = eligibleDonors.map((donor) => ({
      donor,
      amount: Math.floor((reward.reward_pool_amount * donor.total_donated) / totalDonated),
    }))

    const remainder = reward.reward_pool_amount - allocations.reduce((sum, item) => sum + item.amount, 0)
    if (remainder > 0) allocations[0].amount += remainder

    const payouts = allocations.filter((item) => item.amount > 0)
    if (payouts.length === 0) {
      enqueueSnackbar('No positive payout could be computed', { variant: 'error' })
      return
    }

    setDistributingRewardId(reward.id)
    try {
      let distributedAmount = 0

      for (const payout of payouts) {
        const payment = await algorand.send.payment({
          sender: activeAddress,
          receiver: payout.donor.donor_address,
          amount: microAlgos(payout.amount),
        })

        await recordRewardDistribution({
          reward_id: reward.id,
          project_id: project.id,
          donor_address: payout.donor.donor_address,
          amount: payout.amount,
          txn_id: payment.transaction.txID(),
        })

        distributedAmount += payout.amount
      }

      await markRewardDistributed(reward.id, distributedAmount)
      const { data: rewardData } = await getProjectRewards(project.id)
      setRewards(rewardData || [])
      enqueueSnackbar('Reward distributed successfully', { variant: 'success' })
    } catch (e) {
      enqueueSnackbar(`Reward distribution failed: ${(e as Error).message}`, { variant: 'error' })
    } finally {
      setDistributingRewardId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50/40 via-white to-white">
        <Navbar />
        <main className="pt-32 md:pt-24 pb-16 px-6 max-w-5xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-40 bg-gray-100 rounded-2xl" />
          </div>
        </main>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50/40 via-white to-white">
        <Navbar />
        <main className="pt-32 md:pt-24 pb-16 px-6 max-w-5xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
          <Link to="/" className="text-pink-600 hover:underline font-medium">← Back to Explore</Link>
        </main>
      </div>
    )
  }

  if (!activeAddress || !isCreator) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50/40 via-white to-white">
        <Navbar />
        <main className="pt-32 md:pt-24 pb-16 px-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-pink-100 p-8 text-center">
            <div className="text-5xl mb-3">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Creator Access Only</h2>
            <p className="text-gray-500 mb-6">
              Rewards and withdrawals can only be managed by the project creator.
            </p>
            <Link to={`/project/${project.app_id}`} className="text-pink-600 hover:underline font-medium">
              ← Back to Project
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/40 via-white to-white">
      <Navbar />

      <main className="pt-32 md:pt-24 pb-16 px-6 max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Creator Rewards & Withdrawals</h1>
            <p className="text-sm text-gray-500 mt-1">{project.name} · {ellipseAddress(project.creator_address)}</p>
          </div>
          <Link to={`/project/${project.app_id}`} className="text-sm text-pink-600 hover:underline">
            ← Back to Project
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Withdraw Funds</h2>
          <p className="text-sm text-gray-500 mb-4">
            Available raised amount: {((project.total_deposited || 0) / 1_000_000).toFixed(3)} ALGO
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="Amount in ALGO"
              min="0"
              step="0.1"
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400"
            />
            <button
              onClick={handleWithdraw}
              disabled={actionLoading}
              className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-black disabled:opacity-40"
            >
              {actionLoading ? 'Withdrawing...' : 'Withdraw'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Project Social Links</h2>
          <p className="text-sm text-gray-500">Add or update Twitter and Discord links after launch.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="url"
              value={twitterUrlInput}
              onChange={(e) => setTwitterUrlInput(e.target.value)}
              placeholder="https://x.com/username"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20"
            />
            <input
              type="url"
              value={discordUrlInput}
              onChange={(e) => setDiscordUrlInput(e.target.value)}
              placeholder="https://discord.gg/..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20"
            />
          </div>
          <button
            onClick={handleSaveSocialLinks}
            disabled={savingSocialLinks}
            className="w-full py-2.5 bg-pink-600 text-white rounded-xl text-sm font-medium hover:bg-pink-700 disabled:opacity-40"
          >
            {savingSocialLinks ? 'Saving...' : 'Save Social Links'}
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Share & Tweet Verification</h2>
          <p className="text-sm text-gray-500">Project link: {projectPublicUrl}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(projectPublicUrl)
                enqueueSnackbar('Project link copied', { variant: 'success' })
              }}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200"
            >
              Copy Link
            </button>
            {tweetIntentUrl && (
              <a
                href={tweetIntentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-900"
              >
                Post Update on X
              </a>
            )}
          </div>

          <div className="space-y-2">
            <input
              type="url"
              value={tweetPostUrlInput}
              onChange={(e) => setTweetPostUrlInput(e.target.value)}
              placeholder="https://x.com/username/status/..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20"
            />
            <button
              onClick={handleSaveTweetVerificationUrl}
              disabled={savingTweetPostUrl || !tweetPostUrlInput.trim()}
              className="w-full py-2.5 bg-pink-600 text-white rounded-xl text-sm font-medium hover:bg-pink-700 disabled:opacity-40"
            >
              {savingTweetPostUrl ? 'Saving...' : 'Save Tweet Verification Link'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Create Reward</h2>
            <input
              type="text"
              value={rewardTitle}
              onChange={(e) => setRewardTitle(e.target.value)}
              placeholder="Reward title"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20"
            />
            <textarea
              value={rewardDescription}
              onChange={(e) => setRewardDescription(e.target.value)}
              placeholder="Reward description"
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 resize-none"
            />
            <div className="flex gap-2">
              <input
                type="number"
                value={rewardPoolAlgo}
                onChange={(e) => setRewardPoolAlgo(e.target.value)}
                placeholder="ALGO amount"
                min="0"
                step="0.1"
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20"
              />
              <button
                onClick={handleCreateReward}
                className="px-5 py-2.5 bg-pink-600 text-white rounded-xl text-sm font-medium hover:bg-pink-700"
              >
                Add Reward
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Donors ({donors.length})</h2>
            {donors.length === 0 ? (
              <p className="text-sm text-gray-400">No donors yet.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {donors.map((donor) => (
                  <div key={donor.id || donor.donor_address} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-gray-600">{ellipseAddress(donor.donor_address)}</span>
                    <span className="font-medium text-gray-900">{(donor.total_donated / 1_000_000).toFixed(3)} ALGO</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Rewards ({rewards.length})</h2>
          {rewards.length === 0 ? (
            <p className="text-sm text-gray-400">No rewards created yet.</p>
          ) : (
            <div className="space-y-3">
              {rewards.map((reward) => (
                <div key={reward.id} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{reward.title}</p>
                      {reward.description && <p className="text-sm text-gray-500 mt-1">{reward.description}</p>}
                      <p className="text-xs text-gray-500 mt-2">
                        Pool: {(reward.reward_pool_amount / 1_000_000).toFixed(3)} ALGO
                      </p>
                    </div>
                    <button
                      onClick={() => handleDistributeReward(reward)}
                      disabled={Boolean(reward.is_distributed) || distributingRewardId === reward.id}
                      className="px-4 py-2 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-black disabled:opacity-40"
                    >
                      {reward.is_distributed
                        ? 'Distributed'
                        : distributingRewardId === reward.id
                          ? 'Distributing...'
                          : 'Distribute Proportionally'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Announcements</h2>
          <p className="text-sm text-gray-500">Add project updates as tweet links from X/Twitter.</p>

          <div className="flex gap-2">
            <input
              type="url"
              value={announcementUrlInput}
              onChange={(e) => setAnnouncementUrlInput(e.target.value)}
              placeholder="https://x.com/username/status/..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20"
            />
            <button
              onClick={handleCreateAnnouncement}
              disabled={savingAnnouncement || !announcementUrlInput.trim()}
              className="px-5 py-2.5 bg-pink-600 text-white rounded-xl text-sm font-medium hover:bg-pink-700 disabled:opacity-40"
            >
              {savingAnnouncement ? 'Adding...' : 'Add'}
            </button>
          </div>

          {announcements.length === 0 ? (
            <p className="text-sm text-gray-400">No announcements yet.</p>
          ) : (
            <div className="space-y-2">
              {announcements.map((announcement) => (
                <a
                  key={announcement.id}
                  href={announcement.tweet_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border border-gray-200 p-3 text-sm text-pink-600 hover:bg-pink-50"
                >
                  {announcement.tweet_url}
                </a>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default ProjectRewardsWithdraw
