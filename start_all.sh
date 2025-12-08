#!/bin/bash

# Caffeine 전체 시스템 실행 스크립트 (백엔드 + 프론트엔드)

echo "=========================================="
echo "  Caffeine 전체 시스템 시작"
echo "=========================================="
echo ""

# 스크립트가 있는 디렉토리로 이동
cd /root/caffeine

# 백엔드와 프론트엔드를 병렬로 실행
# tmux나 screen이 있으면 사용, 없으면 백그라운드로 실행

if command -v tmux &> /dev/null; then
    echo "✅ tmux 사용 - 세션으로 분리 실행"

    # tmux 세션 생성 및 백엔드 실행
    tmux new-session -d -s caffeine_backend "bash /root/caffeine/start_backend.sh"

    # 새 윈도우에서 프론트엔드 실행
    tmux new-window -t caffeine_backend -n frontend "bash /root/caffeine/start_frontend.sh"

    echo ""
    echo "✅ 백엔드와 프론트엔드가 tmux 세션에서 실행 중입니다."
    echo ""
    echo "세션 확인:"
    echo "  tmux attach -t caffeine_backend"
    echo ""
    echo "세션 종료:"
    echo "  tmux kill-session -t caffeine_backend"
    echo ""

elif command -v screen &> /dev/null; then
    echo "✅ screen 사용 - 세션으로 분리 실행"

    # screen 세션으로 백엔드 실행
    screen -dmS caffeine_backend bash /root/caffeine/start_backend.sh

    # screen 세션으로 프론트엔드 실행
    screen -dmS caffeine_frontend bash /root/caffeine/start_frontend.sh

    echo ""
    echo "✅ 백엔드와 프론트엔드가 screen 세션에서 실행 중입니다."
    echo ""
    echo "세션 확인:"
    echo "  screen -r caffeine_backend   # 백엔드"
    echo "  screen -r caffeine_frontend  # 프론트엔드"
    echo ""
    echo "세션 종료:"
    echo "  screen -S caffeine_backend -X quit"
    echo "  screen -S caffeine_frontend -X quit"
    echo ""

else
    echo "⚠️  tmux/screen이 없습니다. 백그라운드로 실행합니다."
    echo ""

    # 백그라운드로 실행
    bash /root/caffeine/start_backend.sh > /tmp/caffeine_backend.log 2>&1 &
    BACKEND_PID=$!

    # 잠시 대기 후 프론트엔드 실행
    sleep 2
    bash /root/caffeine/start_frontend.sh > /tmp/caffeine_frontend.log 2>&1 &
    FRONTEND_PID=$!

    echo "✅ 백엔드 (PID: $BACKEND_PID) 실행 중"
    echo "✅ 프론트엔드 (PID: $FRONTEND_PID) 실행 중"
    echo ""
    echo "로그 확인:"
    echo "  tail -f /tmp/caffeine_backend.log"
    echo "  tail -f /tmp/caffeine_frontend.log"
    echo ""
    echo "프로세스 종료:"
    echo "  kill $BACKEND_PID $FRONTEND_PID"
    echo ""
fi

echo "=========================================="
echo "  시스템 접속 정보"
echo "=========================================="
echo "🔗 백엔드 API:  http://localhost:8000"
echo "📚 API 문서:    http://localhost:8000/docs"
echo "📱 프론트엔드:  Expo Metro Bundler 참조"
echo "=========================================="
