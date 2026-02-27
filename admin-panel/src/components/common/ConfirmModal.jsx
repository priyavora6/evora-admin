export default function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={e => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="actions">
          <button className="btn cancel" onClick={onCancel}>Cancel</button>
          <button className="btn confirm" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  )
}