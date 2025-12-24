import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Modal, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useTransactions } from '../contexts/TransactionContext';
import FadeInView from '../components/FadeInView';
import { useChatbot } from '../hooks/useChatbot';

// 상수 분리
const DEFAULT_BUDGET = 1000000;

// 잠깐만AI 챗봇
export default function MoreScreen({ navigation, route }) {
    const { colors } = useTheme();
    const { transactions } = useTransactions();

    // 챗봇 훅 사용
    const {
        messages,
        isTyping,
        chatStarted,
        startChat,
        endChat,
        sendMessage,
    } = useChatbot({ transactions, budget: DEFAULT_BUDGET });

    const [inputText, setInputText] = useState('');
    const scrollViewRef = useRef(null);
    const [naggingLevel, setNaggingLevel] = useState('중');

    // 대시보드에서 "잠깐만" 버튼 누르면 바로 챗봇 시작
    useEffect(() => {
        if (route?.params?.openChat) {
            startChat();
            navigation?.setParams({ openChat: false });
        }
    }, [route?.params?.openChat, startChat, navigation]);

    // 메시지 전송 핸들러
    const handleSendMessage = async () => {
        if (!inputText.trim()) return;
        const text = inputText;
        setInputText('');
        await sendMessage(text);
    };

    // 예산 알림 상태
    const [budgetAlertEnabled, setBudgetAlertEnabled] = useState(false);
    const [monthlyBudget, setMonthlyBudget] = useState('0');

    // 백엔드에서 예산 설정 불러오기
    useEffect(() => {
        const loadBudgetSettings = async () => {
            try {
                const { getUserProfile } = await import('../api/users');
                const profile = await getUserProfile();
                if (profile) {
                    setBudgetAlertEnabled(profile.budget_alert_enabled || false);
                    setMonthlyBudget(String(profile.budget_limit || 0));
                }
            } catch (error) {
                console.log('예산 설정 로드 실패:', error);
            }
        };
        loadBudgetSettings();
    }, []);

    // 토글 변경 시 백엔드에 저장
    const handleToggleBudgetAlert = async (value) => {
        setBudgetAlertEnabled(value);
        try {
            const { updateUserProfile } = await import('../api/users');
            await updateUserProfile({ budget_alert_enabled: value });
        } catch (error) {
            console.error('토글 저장 실패:', error);
        }
    };


    // 고객센터 Q&A 모달 상태
    const [qnaModalVisible, setQnaModalVisible] = useState(false);
    const [expandedQna, setExpandedQna] = useState(null);

    // Q&A 데이터
    const qnaData = [
        {
            id: 1,
            question: '잠깐만 AI는 무엇인가요?',
            answer: '잠깐만 AI는 AI 잔소리 모드입니다! 소비 습관에 대해 따끔하게 조언해주는 챗봇이에요. 난이도를 상/중/하로 설정하면 잔소리 강도를 조절할 수 있습니다. 더보기 화면에서 "잠깐만 AI" 버튼을 눌러 시작해보세요!'
        },
        {
            id: 2,
            question: '거래 내역은 어떻게 동기화하나요?',
            answer: '더보기 → 프로필 → 데이터 동기화에서 CSV 파일을 업로드하면 됩니다. 카드사 앱에서 내보내기한 CSV 파일을 사용해주세요.'
        },
        {
            id: 3,
            question: '이상 거래 알림은 어떻게 확인하나요?',
            answer: '대시보드 상단에 빨간색 알림 카드로 표시됩니다. AI가 평소와 다른 소비 패턴을 감지하면 자동으로 알려드립니다.'
        },
        {
            id: 4,
            question: '다크모드는 어디서 설정하나요?',
            answer: '더보기 → 설정 → 다크모드에서 on/off 할 수 있습니다.'
        },
        {
            id: 5,
            question: '쿠폰은 어떻게 사용하나요?',
            answer: '쿠폰함에서 사용할 쿠폰을 선택하고 "사용하기" 버튼을 누르면 됩니다. 한 번에 1개 쿠폰만 선택 가능합니다.'
        },
        {
            id: 6,
            question: '예산 설정은 어떻게 하나요?',
            answer: '더보기 → 예산 설정에서 월별 총 예산과 카테고리별 예산을 설정할 수 있습니다.'
        },
        {
            id: 7,
            question: '데이터를 초기화하고 싶어요',
            answer: '더보기 → 프로필 → 거래 데이터 초기화에서 모든 데이터를 삭제할 수 있습니다. 이 작업은 되돌릴 수 없으니 신중하게 결정해주세요.'
        }
    ];

    // 예산 저장 버튼 (백엔드 연동)
    const handleSaveBudget = async () => {
        try {
            const { updateUserProfile } = await import('../api/users');
            await updateUserProfile({
                budget_alert_enabled: budgetAlertEnabled,
                budget_limit: parseInt(monthlyBudget) || 0
            });
            alert(`예산이 저장되었습니다!\n\n월 예산: ${Number(monthlyBudget).toLocaleString()}원`);
        } catch (error) {
            console.error('예산 저장 실패:', error);
            alert('예산 저장에 실패했습니다.');
        }
    };

    // 예산 초기화 핸들러 (백엔드 연동)
    const handleResetBudget = async () => {
        try {
            const { updateUserProfile } = await import('../api/users');
            await updateUserProfile({
                budget_alert_enabled: false,
                budget_limit: 0
            });
            setMonthlyBudget('0');
            setBudgetAlertEnabled(false);
            alert('예산이 초기화되었습니다!');
        } catch (error) {
            console.error('예산 초기화 실패:', error);
            alert('예산 초기화에 실패했습니다.');
        }
    };

    const menuItems = [
        {
            title: '지출 분석',
            description: '월별/카테고리별 상세 분석',
            icon: 'bar-chart-2',
            color: '#10B981',
            bgColor: '#D1FAE5',
            onPress: () => navigation?.navigate('분석')
        },
    ];


    const profileItems = [
        {
            title: '프로필',
            description: '계정 정보, 데이터 동기화',
            icon: 'user',
            color: '#3B82F6',
            bgColor: '#DBEAFE',
            onPress: () => navigation?.navigate('프로필')
        },
    ];

    const settingsItems = [
        {
            title: '앱 설정',
            description: '테마, 알림, 보안 설정',
            icon: 'settings',
            color: '#6366F1',
            bgColor: '#E0E7FF',
            onPress: () => navigation?.navigate('설정')
        },
    ];

    // 챗봇 화면
    if (chatStarted) {
        return (
            <LinearGradient colors={colors.screenGradient} style={styles.container}>
                {/* 챗봇 헤더 */}
                <View style={[styles.chatHeader, { backgroundColor: colors.cardBackground }]}>
                    <TouchableOpacity onPress={() => endChat()} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <View style={styles.chatHeaderInfo}>
                        <View style={styles.chatBotAvatar}>
                            <Feather name="message-circle" size={20} color="#6366F1" />
                        </View>
                        <View>
                            <Text style={[styles.chatBotName, { color: colors.text }]}>잠깐만 AI</Text>
                            <Text style={[styles.chatBotStatus, { color: colors.textSecondary }]}>난이도: {naggingLevel}</Text>
                        </View>
                    </View>
                </View>


                {/* 메시지 리스트 */}
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messageList}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                >
                    {messages.map((message) => (
                        <View
                            key={message.id}
                            style={[
                                styles.messageBubble,
                                message.type === 'user' ? styles.userBubble : styles.botBubble,
                                message.type === 'user'
                                    ? { backgroundColor: '#6366F1' }
                                    : { backgroundColor: colors.cardBackground }
                            ]}
                        >
                            <Text style={[
                                styles.messageText,
                                { color: message.type === 'user' ? '#FFFFFF' : colors.text }
                            ]}>
                                {message.text}
                            </Text>
                            <Text style={[
                                styles.messageTime,
                                { color: message.type === 'user' ? 'rgba(255,255,255,0.7)' : colors.textSecondary }
                            ]}>
                                {message.time}
                            </Text>
                        </View>
                    ))}
                    {/* Typing Indicator */}
                    {isTyping && (
                        <View style={[styles.messageBubble, styles.botBubble, { backgroundColor: colors.cardBackground }]}>
                            <Text style={[styles.messageText, { color: colors.textSecondary, fontStyle: 'italic' }]}>
                                AI가 생각 중... 💬
                            </Text>
                        </View>
                    )}
                    <View style={{ height: 20 }} />
                </ScrollView>

                {/* 입력창 */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={[styles.inputContainer, { backgroundColor: colors.cardBackground }]}
                >
                    <TextInput
                        style={[styles.textInput, { color: colors.text, backgroundColor: colors.background }]}
                        placeholder="메시지를 입력하세요..."
                        placeholderTextColor={colors.textSecondary}
                        value={inputText}
                        onChangeText={setInputText}
                        onSubmitEditing={sendMessage}
                    />
                    <TouchableOpacity
                        style={styles.sendButton}
                        onPress={handleSendMessage}
                    >
                        <LinearGradient
                            colors={['#6366F1', '#4F46E5']}
                            style={styles.sendButtonGradient}
                        >
                            <Feather name="send" size={20} color="#FFFFFF" />
                        </LinearGradient>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </LinearGradient>
        );
    }

    // 기본 더보기 화면
    return (
        <LinearGradient colors={colors.screenGradient} style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <FadeInView style={styles.header} delay={0}>
                    <Text style={[styles.title, { color: colors.text }]}>더보기</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>추가 기능을 이용해보세요</Text>
                </FadeInView>

                {/* 잠깐만 AI 시작 버튼 */}
                <FadeInView style={styles.chatSection} delay={50}>
                    <TouchableOpacity
                        style={styles.startChatButton}
                        onPress={startChat}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#6366F1', '#4F46E5']}
                            style={styles.startChatGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.chatIconContainer}>
                                <Feather name="message-circle" size={32} color="#FFFFFF" />
                            </View>
                            <View style={styles.chatTextContainer}>
                                <Text style={styles.chatButtonTitle}>🤖 잠깐만 AI</Text>
                                <Text style={styles.chatButtonDesc}>AI와 소비 습관에 대해 상담해보세요</Text>
                            </View>
                            <Feather name="chevron-right" size={24} color="#FFFFFF" />
                        </LinearGradient>
                    </TouchableOpacity>
                </FadeInView>

                <FadeInView style={styles.menuSection} delay={100}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.menuItem, { backgroundColor: colors.cardBackground }]}
                            onPress={item.onPress}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.menuIcon, { backgroundColor: item.bgColor }]}>
                                <Feather name={item.icon} size={24} color={item.color} />
                            </View>
                            <View style={styles.menuContent}>
                                <Text style={[styles.menuTitle, { color: colors.text }]}>{item.title}</Text>
                                <Text style={[styles.menuDesc, { color: colors.textSecondary }]}>{item.description}</Text>
                            </View>
                            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    ))}

                    {/* 예산 초과 알림 토글 */}
                    <View style={[styles.menuItem, { backgroundColor: colors.cardBackground }]}>
                        <View style={[styles.menuIcon, { backgroundColor: '#EDE9FE' }]}>
                            <Feather name="bell" size={24} color="#8B5CF6" />
                        </View>
                        <View style={styles.menuContent}>
                            <Text style={[styles.menuTitle, { color: colors.text }]}>예산 초과 알림</Text>
                            <Text style={[styles.menuDesc, { color: colors.textSecondary }]}>예산 80% 도달 시 알림</Text>
                        </View>
                        <Switch
                            value={budgetAlertEnabled}
                            onValueChange={handleToggleBudgetAlert}
                            trackColor={{ false: '#767577', true: '#3B82F6' }}
                            thumbColor={budgetAlertEnabled ? '#fff' : '#f4f3f4'}
                        />
                    </View>

                    {/* 예산 입력 (토글 켜진 경우) */}
                    {budgetAlertEnabled && (
                        <View style={[styles.budgetInlineSection, { backgroundColor: colors.cardBackground }]}>
                            <View style={styles.budgetInlineRow}>
                                <Text style={[styles.budgetInlineLabel, { color: colors.text }]}>💰 월 목표 예산</Text>
                            </View>
                            <View style={[styles.budgetInlineInputContainer, { backgroundColor: colors.background }]}>
                                <TextInput
                                    style={[styles.budgetInlineInput, { color: colors.text }]}
                                    value={Number(monthlyBudget || 0).toLocaleString()}
                                    onChangeText={(value) => {
                                        const numericValue = value.replace(/[^0-9]/g, '');
                                        const cleaned = numericValue.replace(/^0+/, '') || '0';
                                        setMonthlyBudget(cleaned);
                                    }}
                                    keyboardType="numeric"
                                    placeholder="예산 입력"
                                    placeholderTextColor={colors.textSecondary}
                                />
                                <Text style={[styles.budgetInlineUnit, { color: colors.textSecondary }]}>원</Text>
                            </View>
                            <View style={styles.budgetInlineButtons}>
                                <TouchableOpacity
                                    style={[styles.budgetSaveButton, { backgroundColor: colors.primary }]}
                                    onPress={handleSaveBudget}
                                >
                                    <Text style={styles.budgetSaveButtonText}>저장</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.budgetResetButton, { backgroundColor: '#FEE2E2' }]}
                                    onPress={handleResetBudget}
                                >
                                    <Text style={[styles.budgetResetButtonText, { color: '#EF4444' }]}>초기화</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={[styles.budgetInlineHint, { color: colors.textSecondary }]}>
                                예산의 80%에 도달하면 알림을 보내드립니다
                            </Text>
                        </View>
                    )}

                    {/* 고객센터 */}
                    <TouchableOpacity
                        style={[styles.menuItem, { backgroundColor: colors.cardBackground }]}
                        onPress={() => setQnaModalVisible(true)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.menuIcon, { backgroundColor: '#F3F4F6' }]}>
                            <Feather name="help-circle" size={24} color="#6B7280" />
                        </View>
                        <View style={styles.menuContent}>
                            <Text style={[styles.menuTitle, { color: colors.text }]}>고객센터</Text>
                            <Text style={[styles.menuDesc, { color: colors.textSecondary }]}>자주 묻는 질문 (Q&A)</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </FadeInView>

                {/* 프로필 섹션 */}
                <FadeInView style={styles.menuSection} delay={150}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>프로필</Text>
                    {profileItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.menuItem, { backgroundColor: colors.cardBackground }]}
                            onPress={item.onPress}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.menuIcon, { backgroundColor: item.bgColor }]}>
                                <Feather name={item.icon} size={24} color={item.color} />
                            </View>
                            <View style={styles.menuContent}>
                                <Text style={[styles.menuTitle, { color: colors.text }]}>{item.title}</Text>
                                <Text style={[styles.menuDesc, { color: colors.textSecondary }]}>{item.description}</Text>
                            </View>
                            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    ))}
                </FadeInView>

                {/* 설정 섹션 */}
                <FadeInView style={styles.menuSection} delay={200}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>설정</Text>
                    {settingsItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.menuItem, { backgroundColor: colors.cardBackground }]}
                            onPress={item.onPress}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.menuIcon, { backgroundColor: item.bgColor }]}>
                                <Feather name={item.icon} size={24} color={item.color} />
                            </View>
                            <View style={styles.menuContent}>
                                <Text style={[styles.menuTitle, { color: colors.text }]}>{item.title}</Text>
                                <Text style={[styles.menuDesc, { color: colors.textSecondary }]}>{item.description}</Text>
                            </View>
                            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    ))}
                </FadeInView>

                <FadeInView style={styles.versionSection} delay={250}>
                    <Text style={styles.versionText}>앱 버전 1.0.0</Text>
                </FadeInView>

                <View style={{ height: 100 }} />
            </ScrollView>




            {/* Q&A 모달 */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={qnaModalVisible}
                onRequestClose={() => setQnaModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.cardBackground, maxHeight: '85%' }]}>
                        <View style={styles.modalHandle} />
                        <Text style={[styles.modalTitle, { color: colors.text }]}>❓ 자주 묻는 질문</Text>

                        <ScrollView style={styles.qnaList} showsVerticalScrollIndicator={false}>
                            {qnaData.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[
                                        styles.qnaItem,
                                        { backgroundColor: colors.background },
                                        expandedQna === item.id && styles.qnaItemExpanded
                                    ]}
                                    onPress={() => setExpandedQna(expandedQna === item.id ? null : item.id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.qnaHeader}>
                                        <View style={styles.qnaQuestion}>
                                            <Text style={styles.qnaIcon}>Q</Text>
                                            <Text style={[styles.qnaQuestionText, { color: colors.text }]}>
                                                {item.question}
                                            </Text>
                                        </View>
                                        <Feather
                                            name={expandedQna === item.id ? "chevron-up" : "chevron-down"}
                                            size={20}
                                            color={colors.textSecondary}
                                        />
                                    </View>
                                    {expandedQna === item.id && (
                                        <View style={styles.qnaAnswer}>
                                            <Text style={styles.qnaAnswerIcon}>A</Text>
                                            <Text style={[styles.qnaAnswerText, { color: colors.textSecondary }]}>
                                                {item.answer}
                                            </Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.closeQnaButton}
                            onPress={() => setQnaModalVisible(false)}
                        >
                            <Text style={styles.closeQnaButtonText}>닫기</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1F2937',
        fontFamily: 'Inter_700Bold',
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 12,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // 챗봇 시작 버튼
    chatSection: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    startChatButton: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    startChatGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
    },
    chatIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    chatTextContainer: {
        flex: 1,
    },
    chatButtonTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    chatButtonDesc: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
    },

    // 메뉴
    menuSection: {
        paddingHorizontal: 16,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    menuIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuContent: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    menuDesc: {
        fontSize: 13,
        color: '#6B7280',
    },
    versionSection: {
        alignItems: 'center',
        paddingTop: 32,
    },
    versionText: {
        fontSize: 12,
        color: '#9CA3AF',
    },

    // 챗봇 화면
    chatHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    chatHeaderInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    chatBotAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#E0E7FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    chatBotName: {
        fontSize: 16,
        fontWeight: '600',
    },
    chatBotStatus: {
        fontSize: 12,
    },
    messageList: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 14,
        borderRadius: 20,
        marginBottom: 12,
    },
    userBubble: {
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    botBubble: {
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    messageTime: {
        fontSize: 11,
        marginTop: 6,
        textAlign: 'right',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    textInput: {
        flex: 1,
        height: 44,
        borderRadius: 22,
        paddingHorizontal: 16,
        fontSize: 15,
        marginRight: 12,
    },
    sendButton: {
        borderRadius: 22,
        overflow: 'hidden',
    },
    sendButtonGradient: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // 난이도 선택 UI 스타일
    levelSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    levelLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    levelButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    levelButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    levelButtonActive: {
        backgroundColor: '#E0E7FF',
        borderColor: '#6366F1',
    },
    levelButtonHigh: {
        backgroundColor: '#FEE2E2',
        borderColor: '#EF4444',
    },
    levelButtonLow: {
        backgroundColor: '#D1FAE5',
        borderColor: '#10B981',
    },
    levelButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    levelButtonTextActive: {
        color: '#1F2937',
    },

    // 모달 공통 스타일
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '80%',
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 20,
        textAlign: 'center',
    },

    // 예산 설정 모달 스타일
    budgetSection: {
        marginBottom: 20,
    },
    budgetLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
    },
    budgetInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        padding: 16,
        borderWidth: 2,
        borderColor: '#8B5CF6',
    },
    budgetInput: {
        flex: 1,
        fontSize: 24,
        fontWeight: '700',
        padding: 0,
    },
    budgetUnit: {
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 8,
    },
    budgetSubtitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    categoryBudgetList: {
        maxHeight: 200,
        marginBottom: 20,
    },
    categoryBudgetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    categoryName: {
        fontSize: 15,
        fontWeight: '500',
        width: 60,
    },
    categoryInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        padding: 10,
        flex: 1,
        marginLeft: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    categoryInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        padding: 0,
        textAlign: 'right',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        padding: 8,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#6B7280',
    },
    saveButton: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    saveButtonGradient: {
        padding: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    resetBudgetButton: {
        padding: 12,
        borderRadius: 10,
        backgroundColor: '#FEF3C7',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FCD34D',
    },
    resetBudgetButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#D97706',
    },

    // 인라인 예산 입력 스타일
    budgetInlineSection: {
        marginTop: 12,
        marginBottom: 20,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    budgetInlineRow: {
        marginBottom: 12,
    },
    budgetInlineLabel: {
        fontSize: 16,
        fontWeight: '700',
    },
    budgetInlineInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    budgetInlineInput: {
        flex: 1,
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'left',
    },
    budgetInlineUnit: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    budgetInlineButtons: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    budgetSaveButton: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    budgetResetButton: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    budgetSaveButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    budgetResetButtonText: {
        fontSize: 14,
        fontWeight: '700',
    },
    budgetInlineHint: {
        fontSize: 12,
        textAlign: 'center',
    },

    qnaList: {
        marginBottom: 20,
    },
    qnaItem: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
    },
    qnaItemExpanded: {
        borderWidth: 1,
        borderColor: '#6366F1',
    },
    qnaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    qnaQuestion: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        flex: 1,
        marginRight: 10,
    },
    qnaIcon: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
        backgroundColor: '#6366F1',
        width: 24,
        height: 24,
        borderRadius: 12,
        textAlign: 'center',
        lineHeight: 24,
        marginRight: 10,
    },
    qnaQuestionText: {
        fontSize: 15,
        fontWeight: '500',
        flex: 1,
        lineHeight: 22,
    },
    qnaAnswer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    qnaAnswerIcon: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
        backgroundColor: '#10B981',
        width: 24,
        height: 24,
        borderRadius: 12,
        textAlign: 'center',
        lineHeight: 24,
        marginRight: 10,
    },
    qnaAnswerText: {
        fontSize: 14,
        flex: 1,
        lineHeight: 22,
    },
    closeQnaButton: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#6366F1',
        alignItems: 'center',
    },
    closeQnaButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
