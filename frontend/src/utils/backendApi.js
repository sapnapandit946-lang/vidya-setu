const apiRequest = async (path, body) => {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) throw new Error(data.message || `Request failed: ${response.status}`);
  return data;
};

export const saveProgressToBackend = (progress) => apiRequest('/api/progress', progress);
export const saveQuizAttemptToBackend = (attempt) => apiRequest('/api/quiz-attempts', attempt);