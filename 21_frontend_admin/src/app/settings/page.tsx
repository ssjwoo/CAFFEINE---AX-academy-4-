"use client";

import { useState } from 'react';
import { Bell, Lock, Shield, Save, User } from 'lucide-react';

export default function SettingsPage() {
    // 알림 설정 상태
    const [notifications, setNotifications] = useState({
        anomalyDetection: true,
        reports: true,
        marketing: false,
        threshold: 1000000 // 기본값 100만원
    });

    // 보안 및 계정 설정 상태 (슈퍼유저)
    const [security, setSecurity] = useState({
        name: '관리자',
        email: 'admin@caffeine.com',
        currentPassword: '',
        newPassword: '',
        twoFactorAuth: true
    });

    const handleNotificationChange = (key: string, value: any) => {
        setNotifications(prev => ({ ...prev, [key]: value }));
    };

    const handleSecurityChange = (key: string, value: any) => {
        setSecurity(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        // TODO: 백엔드 API 연동 (설정 저장)
        alert('설정이 저장되었습니다 (Mock)');
        console.log('Saved Settings:', { notifications, security });
    };

    return (
        <div className="space-y-6">
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
                >
                    취소
                </button>
                <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm flex items-center gap-2"
                >
                    <Save className="w-4 h-4" />
                    변경사항 저장
                </button>
            </div>
        </div>
    );
}
