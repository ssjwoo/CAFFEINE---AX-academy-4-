import { apiClient } from './baseClient';

// Settings API
export async function getAdminSettings() {
    return apiClient.get('/api/admin/settings');
}

export async function updateAdminSettings(settings: any) {
    return apiClient.put('/api/admin/settings', settings);
}

// Reports API
export async function sendWeeklyReport() {
    return apiClient.post('/api/admin/reports/send-weekly', {});
}

export async function sendMonthlyReport() {
    return apiClient.post('/api/admin/reports/send-monthly', {});
}

// Users API
export async function getAllUsers() {
    return apiClient.get('/api/admin/users/');
}

export async function getCurrentUser() {
    return apiClient.get('/users/me');
}

export async function createUser(userData: { email: string; name: string; password: string }) {
    return apiClient.post('/users/signup', userData);
}

export async function updateUser(userData: { name?: string; email?: string }) {
    return apiClient.patch('/users/me', userData);
}

export async function deleteUser() {
    return apiClient.delete('/users/me');
}

// User Analytics
export async function getNewSignups(days: number = 30) {
    return apiClient.get(`/api/admin/users/new-signups?days=${days}`);
}

export async function getChurnedUsers(days: number = 30) {
    return apiClient.get(`/api/admin/users/churned?days=${days}`);
}

export async function getChurnMetrics(churnDays: number = 30, signupDays: number = 30) {
    return apiClient.get(`/api/admin/users/stats/churn-rate?churn_days=${churnDays}&signup_days=${signupDays}`);
}
