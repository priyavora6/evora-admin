import EmptyState from '../common/EmptyState'

export default function TaskList({ tasks }) {
  if (tasks.length === 0) return <EmptyState emoji="✅" title="No tasks" subtitle="No tasks added yet" />

  const completed = tasks.filter(t => t.isCompleted).length

  return (
    <div>
      <div style={{ marginBottom: 16, fontSize: 14, color: 'var(--text-medium)' }}>
        {completed}/{tasks.length} tasks completed
      </div>
      <div className="item-list">
        {tasks.map(t => {
          const due = t.dueDate?.toDate?.() || (t.dueDate?.seconds ? new Date(t.dueDate.seconds * 1000) : null)
          return (
            <div className="item-row" key={t.id}>
              <div>
                <div className="name" style={{ textDecoration: t.isCompleted ? 'line-through' : 'none' }}>
                  {t.isCompleted ? '✅' : '⬜'} {t.title}
                </div>
                {t.description && <div className="meta">{t.description}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={`status-badge ${t.priority || 'medium'}`}>{t.priority || 'medium'}</span>
                {due && <div className="meta" style={{ marginTop: 4 }}>{due.toLocaleDateString()}</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}