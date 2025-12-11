import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import axios from 'axios';

const MLTestScreen = () => {
    // 초기값: CSV 샘플 데이터
    const [form, setForm] = useState({
        날짜: '2025-12-03',
        시간: '09:09',
        타입: '지출',
        대분류: '식비',
        소분류: '커피/음료',
        내용: '스타벅스 강남점',
        금액: '-3750',
        화폐: 'KRW',
        결제수단: 'KB국민카드',
        메모: '팀원들과 커피'
    });

    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (name, value) => {
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handlePredict = async () => {
        setLoading(true);
        setPrediction(null);
        try {
            // 금액을 숫자로 변환해야 할 수도 있지만, 일단 문자열로 보냄 (백엔드/모델 처리 방식에 따라 다름)
            // 만약 모델이 숫자를 기대한다면 여기서 변환: Number(form.금액)

            // 백엔드 API 호출
            // 주의: 안드로이드 에뮬레이터에서는 localhost 대신 10.0.2.2 사용
            // 웹에서는 localhost 사용 가능
            const apiUrl = 'http://localhost:8001/ml/predict';

            console.log("Sending data:", form);

            const response = await axios.post(apiUrl, {
                features: form
            });

            console.log("Response:", response.data);
            setPrediction(response.data.prediction);
        } catch (error) {
            console.error("Prediction Error:", error);
            const errorMessage = error.response?.data?.detail || error.message;
            Alert.alert('예측 실패', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>가계부 데이터 예측 테스트</Text>

            <View style={styles.formContainer}>
                {Object.keys(form).map((key) => (
                    <View key={key} style={styles.inputGroup}>
                        <Text style={styles.label}>{key}</Text>
                        <TextInput
                            style={styles.input}
                            value={form[key]}
                            onChangeText={(text) => handleChange(key, text)}
                            placeholder={key}
                        />
                    </View>
                ))}
            </View>

            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handlePredict}
                disabled={loading}
            >
                <Text style={styles.buttonText}>{loading ? "예측 중..." : "예측하기"}</Text>
            </TouchableOpacity>

            {prediction !== null && (
                <View style={styles.resultContainer}>
                    <Text style={styles.resultLabel}>예측 결과</Text>
                    <Text style={styles.resultValue}>{JSON.stringify(prediction)}</Text>
                    <Text style={styles.resultDesc}>
                        {prediction === 0 ? "정상 거래" : prediction === 1 ? "이상 거래" : "알 수 없음"}
                    </Text>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#f5f5f5',
        paddingBottom: 50,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    formContainer: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    inputGroup: {
        marginBottom: 10,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 5,
        color: '#555',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 10,
        borderRadius: 5,
        backgroundColor: '#fafafa',
        fontSize: 16,
    },
    button: {
        backgroundColor: '#4A90E2',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#a0c4e8',
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    resultContainer: {
        marginTop: 30,
        padding: 20,
        backgroundColor: '#e6f7ff',
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1890ff',
    },
    resultLabel: {
        fontSize: 16,
        color: '#555',
    },
    resultValue: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#1890ff',
        marginVertical: 10,
    },
    resultDesc: {
        fontSize: 16,
        color: '#666',
    }
});

export default MLTestScreen;
