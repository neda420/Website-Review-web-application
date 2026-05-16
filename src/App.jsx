import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const MICROLINK_ENDPOINT = 'https://api.microlink.io/?screenshot=true&url='
const PAGESPEED_ENDPOINT =
  'https://www.googleapis.com/pagespeedonline/v5/runPagespeed?category=performance&category=seo&url='

const ringColorByScore = (score) => {
  if (score >= 90) return 'text-emerald-400'
  if (score >= 50) return 'text-amber-400'
  return 'text-rose-400'
}

const normalizeUrl = (value) => {
  const trimmed = value.trim()
  if (!trimmed) return null

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  try {
    return new URL(candidate).toString()
  } catch {
    return null
  }
}

const parseMicrolink = (payload) => {
  if (payload?.status !== 'success' || !payload?.data) {
    throw new Error('Unable to fetch website metadata right now.')
  }

  const { data } = payload

  return {
    title: data.title || 'Untitled website',
    description: data.description || 'No description available for this website.',
    logo: typeof data.logo === 'string' ? data.logo : data.logo?.url || null,
    screenshot: data.screenshot?.url || null,
  }
}

const parsePageSpeed = (payload) => {
  const categories = payload?.lighthouseResult?.categories
  const performance = categories?.performance?.score
  const seo = categories?.seo?.score

  if (typeof performance !== 'number' || typeof seo !== 'number') {
    throw new Error('Unable to fetch performance metrics right now.')
  }

  return {
    performance: Math.round(performance * 100),
    seo: Math.round(seo * 100),
  }
}

const createFallbackMetadata = (url) => {
  const hostname = new URL(url).hostname.replace(/^www\./i, '')

  return {
    title: hostname || 'Website',
    description: 'Live metadata is currently unavailable for this URL.',
    logo: null,
    screenshot: null,
  }
}

const createFallbackMetrics = () => ({
  performance: 50,
  seo: 50,
})

const fetchJson = async (endpoint, normalizedUrl) => {
  try {
    const response = await fetch(`${endpoint}${encodeURIComponent(normalizedUrl)}`)
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

const MetricRing = ({ label, value }) => {
  const radius = 54
  const strokeWidth = 10
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  const tone = ringColorByScore(value)

  return (
    <div className="rounded-2xl border border-white/15 bg-slate-900/50 p-5 shadow-xl backdrop-blur-xl">
      <p className="mb-4 text-sm font-medium tracking-wide text-slate-300">{label}</p>
      <div className="relative mx-auto h-32 w-32">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128" aria-hidden="true">
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-white/15"
          />
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`${tone} transition-[stroke-dashoffset] duration-700`}
          />
        </svg>
        <span className={`absolute inset-0 grid place-items-center text-2xl font-semibold ${tone}`}>{value}</span>
      </div>
    </div>
  )
}

const LoadingSkeleton = () => (
  <motion.div
    key="skeleton"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 12 }}
    className="space-y-6"
  >
    <div className="h-12 w-full animate-pulse rounded-2xl border border-white/10 bg-white/10" />
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
      <div className="mb-6 h-64 w-full animate-pulse rounded-2xl bg-slate-600/40" />
      <div className="mb-4 h-8 w-2/3 animate-pulse rounded-lg bg-slate-600/40" />
      <div className="h-4 w-full animate-pulse rounded-lg bg-slate-600/30" />
      <div className="mt-2 h-4 w-4/5 animate-pulse rounded-lg bg-slate-600/30" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="h-44 animate-pulse rounded-2xl bg-slate-600/35" />
        <div className="h-44 animate-pulse rounded-2xl bg-slate-600/35" />
      </div>
    </div>
  </motion.div>
)

function App() {
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [review, setReview] = useState(null)

  const canSubmit = useMemo(() => inputValue.trim().length > 0 && !loading, [inputValue, loading])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const normalizedUrl = normalizeUrl(inputValue)
    if (!normalizedUrl) {
      setReview(null)
      setError('Please enter a valid URL.')
      return
    }

    setLoading(true)

    try {
      const [metaPayload, speedPayload] = await Promise.all([
        fetchJson(MICROLINK_ENDPOINT, normalizedUrl),
        fetchJson(PAGESPEED_ENDPOINT, normalizedUrl),
      ])

      let usedFallback = false
      let metadata = createFallbackMetadata(normalizedUrl)
      let metrics = createFallbackMetrics()

      if (metaPayload) {
        try {
          metadata = parseMicrolink(metaPayload)
        } catch {
          usedFallback = true
        }
      } else {
        usedFallback = true
      }

      if (speedPayload) {
        try {
          metrics = parsePageSpeed(speedPayload)
        } catch {
          usedFallback = true
        }
      } else {
        usedFallback = true
      }

      setReview({
        url: normalizedUrl,
        metadata,
        metrics,
      })

      if (usedFallback) {
        setError('Some live review services are unavailable right now. Showing a best-effort result.')
      }
    } catch {
      setReview(null)
      setError('We could not review that website right now. Double-check the URL and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-white/20 bg-slate-900/55 p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">Website Review Dashboard</h1>
          <p className="text-sm text-slate-300 sm:text-base">
            Paste any website URL to inspect metadata and Lighthouse-based performance + SEO metrics.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mb-6 flex flex-col gap-3 sm:flex-row">
          <input
            type="url"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="https://example.com"
            className="h-12 flex-1 rounded-xl border border-white/20 bg-slate-950/50 px-4 text-slate-100 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!canSubmit}
            className="h-12 rounded-xl bg-indigo-500 px-6 font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            {loading ? 'Reviewing...' : 'Review Website'}
          </button>
        </form>

        {error && <p className="mb-6 rounded-xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</p>}

        <AnimatePresence mode="wait">
          {loading ? (
            <LoadingSkeleton />
          ) : review ? (
            <motion.section
              key={review.url}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="space-y-6"
            >
              <article className="overflow-hidden rounded-3xl border border-white/15 bg-slate-900/45 shadow-xl backdrop-blur-xl">
                <div className="aspect-video w-full overflow-hidden bg-slate-950/70">
                  {review.metadata.screenshot ? (
                    <img
                      src={review.metadata.screenshot}
                      alt={`Live screenshot for ${review.metadata.title}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-sm text-slate-400">Screenshot unavailable</div>
                  )}
                </div>
                <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/20 bg-slate-950/70">
                    {review.metadata.logo ? (
                      <img src={review.metadata.logo} alt="Website logo" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <span className="text-xs text-slate-400">No logo</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold text-slate-100">{review.metadata.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">{review.metadata.description}</p>
                    <a
                      href={review.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-block text-sm text-indigo-300 hover:text-indigo-200"
                    >
                      {review.url}
                    </a>
                  </div>
                </div>
              </article>

              <div className="grid gap-4 sm:grid-cols-2">
                <MetricRing label="Performance" value={review.metrics.performance} />
                <MetricRing label="SEO" value={review.metrics.seo} />
              </div>
            </motion.section>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="rounded-2xl border border-dashed border-white/20 bg-slate-900/35 p-8 text-center text-sm text-slate-300"
            >
              Enter a URL above to generate a complete website review dashboard.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}

export default App
