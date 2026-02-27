import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import '../styles/rsvp.css'; // Simple CSS for mobile friendly look

const Rsvp = () => {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    side: 'Bride Side',
    relation: 'Friend'
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!eventId) return alert("Invalid Event Link");

    try {
      await addDoc(collection(db, "userEvents", eventId, "guests"), {
        ...formData,
        rsvpStatus: 'confirmed', // Auto-confirm since they filled it
        qrCode: Math.random().toString(36).substring(7), // Simple ID for now
        createdAt: serverTimestamp()
      });
      setSubmitted(true);
    } catch (error) {
      console.error(error);
      alert("Error submitting RSVP");
    }
  };

  if (submitted) {
    return (
      <div className="rsvp-container success">
        <h1>🎉 Thank You!</h1>
        <p>Your RSVP has been received.</p>
        <p>See you at the event!</p>
      </div>
    );
  }

  return (
    <div className="rsvp-container">
      <h1>💌 You're Invited!</h1>
      <p>Please confirm your presence.</p>
      
      <form onSubmit={handleSubmit}>
        <label>Your Name</label>
        <input 
          required 
          type="text" 
          placeholder="Enter full name"
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
        />

        <label>Phone Number</label>
        <input 
          required 
          type="tel" 
          placeholder="Mobile number"
          value={formData.phone}
          onChange={e => setFormData({...formData, phone: e.target.value})}
        />

        <label>Which side?</label>
        <select 
          value={formData.side}
          onChange={e => setFormData({...formData, side: e.target.value})}
        >
          <option>Bride Side</option>
          <option>Groom Side</option>
          <option>Common Friend</option>
        </select>

        <label>Relation</label>
        <select 
          value={formData.relation}
          onChange={e => setFormData({...formData, relation: e.target.value})}
        >
          <option>Friend</option>
          <option>Family</option>
          <option>Colleague</option>
          <option>Relative</option>
        </select>

        <button type="submit">Confirm Presence ✅</button>
      </form>
    </div>
  );
};

export default Rsvp;
