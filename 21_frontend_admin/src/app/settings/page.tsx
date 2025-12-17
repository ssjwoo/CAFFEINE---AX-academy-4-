"use client";

import { useState, useEffect } from 'react';
import { Bell, Lock, Shield, Save, User, Mail, CheckCircle, XCircle, Send } from 'lucide-react';
import { getAdminSettings, updateAdminSettings, sendWeeklyReport, sendMonthlyReport } from '@/api/client';

export default function SettingsPage() {
    // 알림 설정 상태
    const [notifications, setNotifications] = useState({
        anomalyDetection: true,
        reports: true,
        threshold: 1000000, // 기본값 100만원
        recipientEmail: '' // 리포트 수신 이메일
    });

    // 보안 및 계정 설정 상태 (슈퍼유저)
    const [security, setSecurity] = useState({
        name: '관리자',
        email: 'admin@caffeine.com',
        currentPassword: '',
        newPassword: '',
        twoFactorAuth: true
    });

    // 로딩 및 저장 상태
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sendingWeekly, setSendingWeekly] = useState(false);
    const [sendingMonthly, setSendingMonthly] = useState(false);

    // 토스트 알림 상태
    const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // 이메일 유효성 검사
    const isValidEmail = (email: string) => {
        if (!email) return true; // 빈 값은 허용
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // 페이지 로드 시 설정 불러오기
    useEffect(() => {
        loadSettings();
    }, []);

    // 토스트 자동 닫기
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const loadSettings = async () => {
        try {
            const data = await getAdminSettings();
            setNotifications({
                anomalyDetection: data.notifications.anomalyDetection ?? true,
                reports: data.notifications.reports ?? true,
                threshold: data.notifications.threshold ?? 1000000,
                recipientEmail: data.notifications.recipientEmail ?? ''
            });
            setLoading(false);
        } catch (error) {
            console.error('설정 로드 실패:', error);
            setToast({ type: 'error', message: '설정을 불러오는데 실패했습니다.' });
            setLoading(false);
        }
    };

    const handleNotificationChange = (key: string, value: any) => {
        setNotifications(prev => ({ ...prev, [key]: value }));
    };

    const handleSecurityChange = (key: string, value: any) => {
        setSecurity(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        // 이메일 유효성 검사
        if (notifications.recipientEmail && !isValidEmail(notifications.recipientEmail)) {
            setToast({ type: 'error', message: '올바른 이메일 형식을 입력해주세요.' });
            return;
        }

        setSaving(true);
        try {
            await updateAdminSettings({ notifications });
            setToast({ type: 'success', message: '설정이 저장되었습니다.' });
        } catch (error) {
            console.error('설정 저장 실패:', error);
            setToast({ type: 'error', message: '설정 저장에 실패했습니다.' });
        } finally {
            setSaving(false);
        }
    };

    const handleSendWeeklyReport = async () => {
        setSendingWeekly(true);
        try {
            const result = await sendWeeklyReport();
            setToast({
                type: 'success',
                message: `주간 리포트가 발송되었습니다. (${result.recipient})`
            });
        } catch (error: any) {
            console.error('주간 리포트 발송 실패:', error);
            const message = error.response?.data?.detail || '주간 리포트 발송에 실패했습니다.';
            setToast({ type: 'error', message });
        } finally {
            setSendingWeekly(false);
        }
    };

    const handleSendMonthlyReport = async () => {
        setSendingMonthly(true);
        try {
            const result = await sendMonthlyReport();
            setToast({
                type: 'success',
                message: `월간 리포트가 발송되었습니다. (${result.recipient})`
            });
        } catch (error: any) {
            console.error('월간 리포트 발송 실패:', error);
            const message = error.response?.data?.detail || '월간 리포트 발송에 실패했습니다.';
            setToast({ type: 'error', message });
        } finally {
            setSendingMonthly(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-500">설정을 불러오는 중...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 토스트 알림 */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                    } text-white`}>
                    {toast.type === 'success' ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : (
                        <XCircle className="w-5 h-5" />
                    )}
                    <span>{toast.message}</span>
                </div>
            )}

            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800">설정</h2>
                <p className="text-gray-500 mt-1">시스템 알림 및 관리자 계정을 설정합니다</p>
            </div>

            {/* 알림 설정 섹션 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-bold text-gray-800">알림 설정</h3>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium text-gray-800">이상 거래 탐지 알림</h4>
                            <p className="text-sm text-gray-500">위험 또는 경고 등급의 거래 감지 시 알림 수신</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={notifications.anomalyDetection}
                                onChange={(e) => handleNotificationChange('anomalyDetection', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium text-gray-800">주간/월간 리포트</h4>
                            <p className="text-sm text-gray-500">매주/매월 소비 분석 리포트 자동 발송</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={notifications.reports}
                                onChange={(e) => handleNotificationChange('reports', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>

                    {/* 리포트 수신 이메일 입력 */}
                    <div className="pt-4 border-t border-gray-100">
                        <label className="block font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Mail className="w-4 h-4 text-indigo-600" />
                            리포트 수신 이메일
                        </label>
                        <p className="text-sm text-gray-500 mb-3">
                            주간/월간 리포트를 받을 이메일 주소를 입력하세요.
                        </p>
                        <div className="relative max-w-md">
                            <input
                                type="email"
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${notifications.recipientEmail && !isValidEmail(notifications.recipientEmail)
                                    ? 'border-red-500'
                                    : 'border-gray-300'
                                    }`}
                                placeholder="example@email.com"
                                value={notifications.recipientEmail}
                                onChange={(e) => handleNotificationChange('recipientEmail', e.target.value)}
                            />
                            {notifications.recipientEmail && !isValidEmail(notifications.recipientEmail) && (
                                <p className="text-sm text-red-500 mt-1">올바른 이메일 형식을 입력해주세요.</p>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <label className="block font-medium text-gray-700 mb-2">알림 임계값 (원)</label>
                        <p className="text-sm text-gray-500 mb-3">설정된 금액 이상의 거래 발생 시 즉시 알림을 보냅니다.</p>
                        <div className="relative max-w-xs">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₩</span>
                            <input
                                type="number"
                                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={notifications.threshold}
                                onChange={(e) => handleNotificationChange('threshold', parseInt(e.target.value))}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 리포트 즉시 발송 섹션 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center gap-2">
                    <Send className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-bold text-gray-800">리포트 즉시 발송</h3>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-500 mb-4">
                        현재 시점 기준으로 주간/월간 리포트를 즉시 생성하여 설정된 이메일로 발송합니다.
                    </p>

                    {/* 이메일 미설정 경고 */}
                    {!notifications.recipientEmail && (
                        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-sm text-orange-800">
                                ⚠️ 수신자 이메일이 설정되지 않았습니다. 위의 알림 설정에서 이메일을 먼저 설정해주세요.
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 주간 리포트 발송 */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-medium text-gray-800 mb-2">주간 리포트</h4>
                            <p className="text-sm text-gray-500 mb-4">
                                최근 7일간의 소비 데이터를 분석한 리포트를 발송합니다.
                            </p>
                            <button
                                onClick={handleSendWeeklyReport}
                                disabled={sendingWeekly || !notifications.recipientEmail}
                                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors shadow-sm flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                <Send className="w-4 h-4" />
                                {sendingWeekly ? '발송 중...' : '주간 리포트 발송'}
                            </button>
                        </div>

                        {/* 월간 리포트 발송 */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-medium text-gray-800 mb-2">월간 리포트</h4>
                            <p className="text-sm text-gray-500 mb-4">
                                최근 30일간의 소비 데이터를 분석한 리포트를 발송합니다.
                            </p>
                            <button
                                onClick={handleSendMonthlyReport}
                                disabled={sendingMonthly || !notifications.recipientEmail}
                                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors shadow-sm flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                <Send className="w-4 h-4" />
                                {sendingMonthly ? '발송 중...' : '월간 리포트 발송'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 보안 및 계정 섹션 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-bold text-gray-800">보안 및 계정</h3>
                </div>
                <div className="p-6 space-y-6">
                    {/* Read-only Role */}
                    <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg text-blue-800">
                        <User className="w-5 h-5 mt-0.5" />
                        <div>
                            <h4 className="font-bold">슈퍼 관리자 (Super Admin)</h4>
                            <p className="text-sm text-blue-600 mt-1">
                                현재 계정은 시스템 최고 관리자 권한을 가지고 있습니다.<br />
                                모든 설정에 접근 가능하며, 계정 삭제는 불가능합니다.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                value={security.name}
                                onChange={(e) => handleSecurityChange('name', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                            <input
                                type="email"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                value={security.email}
                                onChange={(e) => handleSecurityChange('email', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">현재 비밀번호</label>
                            <input
                                type="password"
                                placeholder="변경하려면 입력하세요"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                value={security.currentPassword}
                                onChange={(e) => handleSecurityChange('currentPassword', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호</label>
                            <input
                                type="password"
                                placeholder="새 비밀번호 입력"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                value={security.newPassword}
                                onChange={(e) => handleSecurityChange('newPassword', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                        <div className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-gray-400" />
                            <div>
                                <h4 className="font-medium text-gray-800">2단계 인증 (2FA)</h4>
                                <p className="text-sm text-gray-500">로그인 시 추가 보안 인증 사용</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={security.twoFactorAuth}
                                onChange={(e) => handleSecurityChange('twoFactorAuth', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
                <button
                    className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    onClick={loadSettings}
                    disabled={saving}
                >
                    취소
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm flex items-center gap-2 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                >
                    <Save className="w-4 h-4" />
                    {saving ? '저장 중...' : '변경사항 저장'}
                </button>
            </div>
        </div>
    );
}
