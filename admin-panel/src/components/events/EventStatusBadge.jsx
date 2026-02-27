import React from 'react';

export default function EventStatusBadge({ status }) {
  return (
    <span className="event-status-badge">
      {status}
    </span>
  );
}
