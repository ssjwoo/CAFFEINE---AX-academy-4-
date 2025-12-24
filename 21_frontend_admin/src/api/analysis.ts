import { apiClient } from './baseClient';

// Analysis API (Admin)
export async function getFullAnalysis(year?: number, month?: number) {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    const queryString = params.toString();
    return apiClient.get(`/analysis/admin/full${queryString ? '?' + queryString : ''}`);
}

export async function getDashboardStats() {
    return apiClient.get('/analysis/summary');
}

export async function getCategoryBreakdown(userId?: number, months = 1, year?: number, month?: number) {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId.toString());
    params.append('months', months.toString());
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    const queryString = params.toString();
    return apiClient.get(`/analysis/categories${queryString ? '?' + queryString : ''}`);
}

export async function getMonthlyTrend(months = 6) {
    return apiClient.get(`/analysis/monthly-trend?months=${months}`);
}

// Analytics Summary APIs
export async function getAnalyticsSummary(startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/analytics/summary${query}`);
}

export async function getTopCategories(limit: number = 5, startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return apiClient.get(`/analytics/top-categories?${params.toString()}`);
}

export async function getAnalyticsMonthlyTrend(months: number = 6): Promise<any> {
    return apiClient.get(`/analytics/monthly-trend?months=${months}`);
}

export async function getHourlyHeatmap(days: number = 30): Promise<any> {
    return apiClient.get(`/analytics/hourly-heatmap?days=${days}`);
}

export async function getInsights(): Promise<any> {
    return apiClient.get('/analytics/insights');
}

// Demographics APIs
export async function getAgeDistribution() {
    return apiClient.get('/analytics/demographics/age-groups');
}

export async function getConsumptionByAge() {
    return apiClient.get('/analytics/demographics/consumption-by-age');
}

export async function getCategoryPreferencesByAge() {
    return apiClient.get('/analytics/demographics/category-preferences');
}
