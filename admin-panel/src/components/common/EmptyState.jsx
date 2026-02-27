export default function EmptyState({ emoji = '📭', title, subtitle }) {
  return (
    <div className="empty-state">
      <div className="emoji">{emoji}</div>
      <h3>{title}</h3>
      <p>{subtitle}</p>
    </div>
  )
}