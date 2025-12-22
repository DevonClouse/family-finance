const API_URL = 'http://localhost:8000/api';

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

            // Check for server errors (like 422 or 500)
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