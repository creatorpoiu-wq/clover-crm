import React from 'react';

// Invisible honeypot field. Bots will fill this out, humans won't see it.
// If the server receives a value for 'website_url_honey', it knows it's a bot and rejects it.
export default function Honeypot() {
  return (
    <div style={{ display: 'none', visibility: 'hidden', opacity: 0, position: 'absolute', left: '-9999px' }} aria-hidden="true">
      <label htmlFor="website_url_honey">Website</label>
      <input
        type="text"
        id="website_url_honey"
        name="website_url_honey"
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}
