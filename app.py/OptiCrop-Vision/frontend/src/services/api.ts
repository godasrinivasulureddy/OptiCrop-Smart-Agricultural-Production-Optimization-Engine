export const API_URL = "http://127.0.0.1:8000/api";

export const getAuthHeaders = () => {
  const token = localStorage.getItem("opticrop_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const headers = getAuthHeaders();
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers }
  });
  if (!response.ok) {
    let errorDetail = "An error occurred";
    try {
      const errorData = await response.json();
      errorDetail = errorData.detail || errorDetail;
    } catch (e) {}
    throw new Error(errorDetail);
  }
  return response.json();
};
