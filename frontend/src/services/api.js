// Automatically switch between localhost and relative path for production
const API_URL = import.meta.env.PROD
    ? '/api'
    : 'http://localhost:8000/api';

export const api = {
    calculateAmortization: async (payload) => {
        try {
            const response = await fetch(`${API_URL}/calculate-amortization`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    },

    calculateProjections: async (payload) => {
        try {
            const response = await fetch(`${API_URL}/calculate-projections`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                console.error('Server Error:', await response.text());
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    }
};