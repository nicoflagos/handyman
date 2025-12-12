import React, { useEffect, useState } from 'react';
import { getHealth } from './api';

export default function Home() {
  const [status, setStatus] = useState<'loading'|'ok'|'error'>('loading');
  useEffect(() => {
    getHealth()
      .then(() => setStatus('ok'))
      .catch(() => setStatus('error'));
  }, []);

  return (
    <div>
      <h1>On-Demand Service — Client</h1>
      <p>API status: {status}</p>
    </div>
  );
}
