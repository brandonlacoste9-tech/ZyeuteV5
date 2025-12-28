const API_BASE = '/api/tiguy';

export const tiguyService = {
  async sendMessage(message: string, image?: string) {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, image })
    });
    if (!response.ok) throw new Error('TI-GUY unavailable');
    return response.json();
  },

  async getJoke() {
    const response = await fetch(`${API_BASE}/joke`);
    if (!response.ok) throw new Error('TI-GUY unavailable');
    return response.json();
  },

  async checkStatus() {
    const response = await fetch(`${API_BASE}/status`);
    return response.ok;
  }
};
