import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function EventAccessCenter({ eventId, expectedGuests, checkedIn }) {
  const [copied, setCopied] = useState(false);

  // The link guests will use to RSVP and get their tickets
  const rsvpLink = `https://online-voting-system-76856.web.app/rsvp.html?event=${eventId}`;
  
  const checkInRate = expectedGuests > 0 
    ? Math.round((checkedIn / expectedGuests) * 100) 
    : 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(rsvpLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      backgroundColor: '#111827', // Dark background matching your theme
      borderRadius: '16px',
      padding: '24px',
      color: 'white',
      marginBottom: '24px'
    }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        🎟️ Event Access Center
      </h3>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* LEFT: The RSVP Link Box */}
        <div style={{ flex: '1', minWidth: '250px' }}>
          <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
            Share this link with guests so they can RSVP and receive their digital entry pass.
          </p>
          
          <div style={{ 
            display: 'flex', 
            backgroundColor: '#1f2937', 
            borderRadius: '8px', 
            padding: '4px',
            border: '1px solid #374151'
          }}>
            <input 
              type="text" 
              readOnly 
              value={rsvpLink} 
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                border: 'none',
                color: '#d1d5db',
                padding: '8px 12px',
                outline: 'none',
                fontSize: '13px'
              }}
            />
            <button 
              onClick={handleCopy}
              style={{
                backgroundColor: copied ? '#059669' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
            >
              {copied ? <><Check size={16}/> Copied</> : <><Copy size={16}/> Copy Link</>}
            </button>
          </div>
        </div>

        {/* RIGHT: Stats & Optional Poster QR */}
        <div style={{ display: 'flex', gap: '16px', flex: '1', minWidth: '250px' }}>
          
          {/* Stats Box */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ backgroundColor: '#1f2937', padding: '16px', borderRadius: '12px', border: '1px solid #065f46' }}>
              <div style={{ color: '#10b981', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>TOTAL SCANS</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{checkedIn}</div>
            </div>
            
            <div style={{ backgroundColor: '#1f2937', padding: '16px', borderRadius: '12px', border: '1px solid #9f1239' }}>
              <div style={{ color: '#f43f5e', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>CHECK-IN RATE</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{checkInRate}%</div>
            </div>
          </div>

          {/* Optional: A QR code that points to the RSVP Link (For printing on physical cards) */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '12px', 
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '130px'
          }}>
            <div style={{ 
              width: '100px', 
              height: '100px', 
              backgroundColor: '#f0f0f0',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px'
            }}>
              📱 QR Code
            </div>
            <span style={{ color: '#6b7280', fontSize: '10px', marginTop: '8px', fontWeight: 'bold' }}>Scan to RSVP</span>
          </div>

        </div>
      </div>
    </div>
  );
}
