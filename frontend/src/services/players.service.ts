// services/players.service.ts
// Layer gọi API từ Frontend → NestJS Backend

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const playersService = {
  // GET /api/players
  async getAll() {
    const res = await fetch(`${API_URL}/players`);
    if (!res.ok) throw new Error('Failed to fetch players');
    return res.json();
  },

  // GET /api/players/:id
  async getById(id: string) {
    const res = await fetch(`${API_URL}/players/${id}`);
    if (!res.ok) throw new Error(`Player ${id} not found`);
    return res.json();
  },

  // POST /api/players
  async create(data: { username: string; email: string }) {
    const res = await fetch(`${API_URL}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create player');
    return res.json();
  },

  // DELETE /api/players/:id
  async remove(id: string) {
    const res = await fetch(`${API_URL}/players/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete player');
    return res.json();
  },
};
