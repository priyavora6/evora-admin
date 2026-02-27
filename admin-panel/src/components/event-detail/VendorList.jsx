import EmptyState from '../common/EmptyState'
import StatusBadge from '../common/StatusBadge'

export default function VendorList({ vendors }) {
  if (vendors.length === 0) return <EmptyState emoji="🏪" title="No vendors" subtitle="No vendors added yet" />

  return (
    <div className="data-table">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Service</th>
            <th>Phone</th>
            <th>Cost</th>
            <th>Paid</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map(v => (
            <tr key={v.id}>
              <td style={{ fontWeight: 600 }}>{v.name}</td>
              <td>{v.service}</td>
              <td>{v.phone}</td>
              <td>₹{(v.cost || 0).toLocaleString()}</td>
              <td>₹{(v.paidAmount || 0).toLocaleString()}</td>
              <td><StatusBadge status={v.status || 'pending'} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}