// hooks/usePlayers.ts
// Custom hook — đóng gói logic fetch + state cho component dùng

'use client';
import { useEffect, useState } from 'react';
import { playersService } from '@/services/players.service';

export function usePlayers() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    playersService
      .getAll()
      .then((data) => setPlayers(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { players, loading, error };
}
