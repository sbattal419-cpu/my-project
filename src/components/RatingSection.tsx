import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { getRatingStats, getUserRating, submitRating, type RatingStats } from '../lib/supabase-ipr'

function Stars({
  value, size = 32, interactive = false, onChange,
}: {
  value: number; size?: number; interactive?: boolean; onChange?: (v: number) => void
}) {
  const [hover, setHover] = useState(0)
  const display = interactive ? (hover || value) : value
  return (
    <div className="stars-row" onMouseLeave={() => interactive && setHover(0)}>
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          className={`star-btn${display >= i ? ' star-filled' : ''}`}
          style={{ fontSize: size }}
          onClick={() => interactive && onChange?.(i)}
          onMouseEnter={() => interactive && setHover(i)}
          disabled={!interactive}
          aria-label={`${i}`}
        >★</button>
      ))}
    </div>
  )
}

export default function RatingSection() {
  const { t } = useLang()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<RatingStats>({ avg: 0, count: 0 })
  const [userStars, setUserStars] = useState<number | null>(null)
  const [pending, setPending] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    getRatingStats().then(setStats).catch(() => {})
    if (user) getUserRating(user.id).then(setUserStars).catch(() => {})
  }, [user])

  const handleSubmit = async () => {
    if (!pending || !user) return
    setSaving(true)
    try {
      await submitRating(user.id, pending)
      setUserStars(pending)
      setSaved(true)
      setEditing(false)
      getRatingStats().then(setStats).catch(() => {})
    } finally {
      setSaving(false)
    }
  }

  const showForm = !userStars || editing

  return (
    <section className="rating-section-home" id="rating">
      <div className="container">
        <div className="rating-card">
          {/* Average */}
          <div className="rating-avg-block">
            <div className="rating-avg-num">{stats.avg || '—'}</div>
            <Stars value={stats.avg} size={22} />
            <p className="rating-count-label">
              {stats.count} {t('pub.rating.count')} · {t('pub.rating.avg')} {t('pub.rating.from')}
            </p>
          </div>

          <div className="rating-divider" />

          <h2 className="rating-title">{t('pub.rating.title')}</h2>
          <p className="rating-desc">{t('pub.rating.desc')}</p>

          {!user ? (
            <button className="btn-bc-primary rating-login-btn" onClick={() => navigate('/login')}>
              {t('pub.rating.login')}
            </button>
          ) : saved && !editing ? (
            <AnimatePresence>
              <motion.div className="rating-done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <span className="rating-done-icon">✓</span>
                <p>{t('pub.rating.done')}</p>
                <p className="rating-your-stars">{t('pub.rating.yours')}: {userStars} ★</p>
                <button className="btn-bc-ghost" style={{ marginTop: 12 }} onClick={() => { setEditing(true); setPending(userStars ?? 0); setSaved(false) }}>
                  {t('pub.rating.change')}
                </button>
              </motion.div>
            </AnimatePresence>
          ) : userStars && !editing ? (
            <div className="rating-done">
              <p>{t('pub.rating.done')}</p>
              <p className="rating-your-stars">{t('pub.rating.yours')}: {userStars} ★</p>
              <button className="btn-bc-ghost" style={{ marginTop: 12 }} onClick={() => { setEditing(true); setPending(userStars) }}>
                {t('pub.rating.change')}
              </button>
            </div>
          ) : showForm && (
            <div className="rating-form">
              <p className="rating-pick-label">{t('pub.rating.pick')}</p>
              <Stars value={pending} size={44} interactive onChange={setPending} />
              <button
                className="btn-bc-primary"
                disabled={!pending || saving}
                onClick={handleSubmit}
                style={{ marginTop: 16 }}
              >
                {saving ? <><span className="btn-spinner" /> …</> : t('pub.rating.submit')}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
