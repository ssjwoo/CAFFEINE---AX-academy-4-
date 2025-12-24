/**
 * useChatbot - 챗봇 커스텀 훅
 * 챗봇 상태 관리 및 메시지 처리 로직을 캡슐화
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendChatMessage, getErrorMessage } from '../api/chatbot';
import { buildSpendingHistory } from '../utils/spendingAnalyzer';

// 초기 인사말
const INITIAL_GREETING = {
    type: 'bot',
    text: '안녕! 나는 소비 습관 개선을 도와주는 잠깐만 AI야 \n\n궁금한 점이나 상담하고 싶은 내용을 말해줘!',
};

/**
 * 메시지 객체 생성 헬퍼
 */
const createMessage = (type, text, id) => ({
    id,
    type,
    text,
    time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
});

/**
 * useChatbot 훅
 * @param {Object} options - 옵션
 * @param {Array} options.transactions - 거래 목록
 * @param {number} options.budget - 월 예산 (기본값: 1,000,000)
 * @returns {Object} 챗봇 상태 및 제어 함수
 */
export const useChatbot = ({ transactions = [], budget = 1000000 } = {}) => {
    // 상태
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [chatStarted, setChatStarted] = useState(false);
    const [error, setError] = useState(null);

    // 메시지 ID 카운터
    const messageIdRef = useRef(1);

    /**
     * 캐시에서 대화 내역 불러오기
     */
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const cached = await AsyncStorage.getItem('chatbot_history');
                if (cached) {
                    const history = JSON.parse(cached);
                    setMessages(history);
                    // setChatStarted(true);
                    // ID 카운터 업데이트
                    const maxId = Math.max(...history.map(m => m.id || 0));
                    messageIdRef.current = maxId + 1;
                }
            } catch (error) {
                console.log('Chat history load failed:', error);
            }
        };
        loadHistory();
    }, []);

    /**
     * 메시지 변경시 캐시에 저장
     */
    useEffect(() => {
        if (messages.length > 0) {
            AsyncStorage.setItem('chatbot_history', JSON.stringify(messages)).catch(err => {
                console.log('Chat history save failed:', err);
            });
        }
    }, [messages]);

    /**
     * 다음 메시지 ID 생성
     */
    const getNextMessageId = useCallback(() => {
        return messageIdRef.current++;
    }, []);

    /**
     * 챗봇 시작
     */
    const startChat = useCallback(() => {
        setChatStarted(true);
        setError(null);
        const greeting = createMessage('bot', INITIAL_GREETING.text, getNextMessageId());
        setMessages([greeting]);
    }, [getNextMessageId]);

    /**
     * 챗봇 종료/리셋
     */
    const endChat = useCallback(async () => {
        setChatStarted(false);
        setMessages([]);
        setIsTyping(false);
        setError(null);
        messageIdRef.current = 1;
        // 캐시 삭제
        try {
            await AsyncStorage.removeItem('chatbot_history');
        } catch (error) {
            console.log('Chat history clear failed:', error);
        }
    }, []);

    /**
     * 메시지 전송
     * @param {string} text - 사용자 메시지
     */
    const sendMessage = useCallback(async (text) => {
        if (!text.trim()) return;

        // 사용자 메시지 추가
        const userMessage = createMessage('user', text, getNextMessageId());
        setMessages(prev => [...prev, userMessage]);
        setIsTyping(true);
        setError(null);

        try {
            // 지출 분석 데이터 생성
            const spendingHistory = buildSpendingHistory(transactions, budget);

            // API 호출
            const response = await sendChatMessage({
                message: text,
                budget,
                spendingHistory,
            });

            // 봇 응답 추가
            const botMessage = createMessage('bot', response.message, getNextMessageId());
            setMessages(prev => [...prev, botMessage]);

        } catch (err) {
            console.error('Chatbot Error:', err);
            setError(err);

            // 에러 메시지 추가
            const errorMessage = createMessage('bot', getErrorMessage(err), getNextMessageId());
            setMessages(prev => [...prev, errorMessage]);

        } finally {
            setIsTyping(false);
        }
    }, [transactions, budget, getNextMessageId]);

    /**
     * 메시지 목록 초기화 (대화 유지하며 메시지만 삭제)
     */
    const clearMessages = useCallback(() => {
        const greeting = createMessage('bot', INITIAL_GREETING.text, getNextMessageId());
        setMessages([greeting]);
        setError(null);
    }, [getNextMessageId]);

    /**
     * 마지막 메시지 재전송 (에러 발생 시)
     */
    const retryLastMessage = useCallback(() => {
        const lastUserMessage = [...messages].reverse().find(m => m.type === 'user');
        if (lastUserMessage) {
            // 마지막 봇 메시지(에러) 제거
            setMessages(prev => prev.slice(0, -1));
            // 재전송
            sendMessage(lastUserMessage.text);
        }
    }, [messages, sendMessage]);

    return {
        // 상태
        messages,
        isTyping,
        chatStarted,
        error,

        // 액션
        startChat,
        endChat,
        sendMessage,
        clearMessages,
        retryLastMessage,

        // 유틸
        messageCount: messages.length,
        hasError: error !== null,
    };
};

export default useChatbot;
