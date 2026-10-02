// The backend's API root. `uvicorn app.main:app` serves on port 8000; set VITE_API_BASE_URL to point elsewhere.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/V1';
