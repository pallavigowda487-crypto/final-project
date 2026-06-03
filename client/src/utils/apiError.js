export const getApiErrorMessage = (err, fallback = 'Something went wrong') => {
  if (!err.response) {
    return 'Cannot reach the server. Make sure the backend is running on port 5000.';
  }

  const { data } = err.response;
  if (data?.message) return data.message;

  if (Array.isArray(data?.errors) && data.errors.length) {
    return data.errors.map((e) => e.msg || e.message).filter(Boolean).join('. ');
  }

  return fallback;
};
