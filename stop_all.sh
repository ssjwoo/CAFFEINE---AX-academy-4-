#!/bin/bash

# Caffeine 전체 시스템 종료 스크립트

echo "======================================"
echo "  Caffeine 시스템 종료"
echo "======================================"

# tmux 세션 종료
if command -v tmux &> /dev/null; then
    if tmux has-session -t caffeine_backend 2>/dev/null; then
        echo "🛑 tmux 세션 종료 중..."
        tmux kill-session -t caffeine_backend
        echo "✅ tmux 세션 종료됨"
    fi
fi

# screen 세션 종료
if command -v screen &> /dev/null; then
    if screen -list | grep -q caffeine_backend; then
        echo "🛑 screen 세션 종료 중..."
        screen -S caffeine_backend -X quit 2>/dev/null
        screen -S caffeine_frontend -X quit 2>/dev/null
        echo "✅ screen 세션 종료됨"
    fi
fi

# uvicorn 프로세스 종료
if pgrep -f "uvicorn app.main:app" > /dev/null; then
    echo "🛑 백엔드 프로세스 종료 중..."
    pkill -f "uvicorn app.main:app"
    echo "✅ 백엔드 종료됨"
fi

# expo/node 프로세스 종료
if pgrep -f "expo start" > /dev/null; then
    echo "🛑 프론트엔드 프로세스 종료 중..."
    pkill -f "expo start"
    pkill -f "node.*metro"
    echo "✅ 프론트엔드 종료됨"
fi

echo ""
echo "✅ 모든 Caffeine 프로세스가 종료되었습니다."
