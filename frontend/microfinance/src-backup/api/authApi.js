import api from './api';

export const authApi = {
  register:       (data) => api.post('/auth/register', data),
  login:          (email, password) => api.post('/auth/login', { email, password }),
  logout:         () => api.post('/auth/logout'),
  forgotPassword:         (email) => api.post('/auth/forgot-password', { email }),
  verifyOtp:              (email, otp) => api.post('/auth/verify-otp', { email, otp }),
  verifyRegistrationOtp:  (email, otp) => api.post('/auth/verify-registration-otp', { email, otp }),
  resendRegistrationOtp:  (email) => api.post('/auth/resend-registration-otp', { email }),
  resetPassword:          (email, otp, newPassword) => api.post('/auth/reset-password', { email, otp, newPassword }),
};

