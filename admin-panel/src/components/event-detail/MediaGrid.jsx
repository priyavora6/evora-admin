import EmptyState from '../common/EmptyState'

export default function MediaGrid({ media }) {
  if (media.length === 0) return <EmptyState emoji="📸" title="No media" subtitle="No photos uploaded yet" />

  return (
    <div>
      <div style={{ marginBottom: 12, fontSize: 14, color: 'var(--text-medium)' }}>
        {media.length} photos
      </div>
      <div className="media-grid">
        {media.map(m => (
          <img
            key={m.id}
            src={m.imageUrl}
            alt={m.caption || ''}
            onError={(e) => { e.target.style.display = 'none' }}
          />
        ))}
      </div>
    </div>
  )
}