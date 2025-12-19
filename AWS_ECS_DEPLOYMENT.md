# AWS ECS/ECR 배포 가이드

## 🎯 아키텍처 차이

### 로컬 개발 환경
```
브라우저 (localhost:3001)
    ↓
Nginx (localhost:80)
    ↓
Backend (backend:8000) + Frontend (admin_front:3000)
```

### AWS ECS/ECR 프로덕션
```
브라우저 (https://your-domain.com)
    ↓
CloudFront (CDN)
    ↓
Application Load Balancer (ALB)
    ├─→ Backend ECS Tasks (Target Group: /api/*)
    └─→ Frontend ECS Tasks (Target Group: /*)
```

---

## ⚙️ 필요한 설정 변경

### 1. FastAPI CORS 설정 수정

**현재 문제**: `main.py`에서 특정 origin만 허용
```python
allowed_origins = [
    "http://localhost:3001",
    "http://localhost:3000",
    # ...
]
```

**프로덕션 해결책**: 환경변수로 origin 관리

#### `10_backend/app/main.py` 수정:
```python
import os

# 환경변수에서 허용할 origin 목록 가져오기
ALLOWED_ORIGINS_ENV = os.getenv("ALLOWED_ORIGINS", "")
if ALLOWED_ORIGINS_ENV:
    allowed_origins = ALLOWED_ORIGINS_ENV.split(",")
else:
    # 기본값 (로컬 개발)
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### ECS Task Definition에서 환경변수 설정:
```json
{
  "environment": [
    {
      "name": "ALLOWED_ORIGINS",
      "value": "https://your-domain.com,https://www.your-domain.com,https://d26uyg5darllja.cloudfront.net"
    }
  ]
}
```

---

### 2. ALB 설정

#### Target Groups
1. **Backend Target Group**
   - Path pattern: `/api/*`, `/users/*`
   - Health check: `/health`
   - Port: 8000

2. **Frontend Target Group**
   - Path pattern: `/*` (default)
   - Health check: `/`
   - Port: 3000

#### Listener Rules
```
Priority 1: Path /api/* → Backend Target Group
Priority 2: Path /users/* → Backend Target Group  
Priority 3: Path /* → Frontend Target Group (default)
```

---

### 3. Docker 이미지 빌드

#### Backend Dockerfile
```dockerfile
FROM python:3.10-slim

WORKDIR /app

# 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 코드 복사
COPY . .

# 포트 노출
EXPOSE 8000

# 실행
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Frontend Dockerfile
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm ci

# 빌드
COPY . .
RUN npm run build

# 프로덕션 이미지
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm", "start"]
```

---

### 4. ECR 푸시 스크립트

```bash
#!/bin/bash

# 변수 설정
AWS_REGION="ap-northeast-2"
AWS_ACCOUNT_ID="your-account-id"
ECR_REPO_BACKEND="caffeine-backend"
ECR_REPO_FRONTEND="caffeine-frontend"

# ECR 로그인
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Backend 이미지 빌드 및 푸시
cd 10_backend
docker build -t $ECR_REPO_BACKEND .
docker tag $ECR_REPO_BACKEND:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_BACKEND:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_BACKEND:latest

# Frontend 이미지 빌드 및 푸시
cd ../21_frontend_admin
docker build -t $ECR_REPO_FRONTEND .
docker tag $ECR_REPO_FRONTEND:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_FRONTEND:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_FRONTEND:latest
```

---

### 5. ECS Task Definition (예시)

#### Backend Task
```json
{
  "family": "caffeine-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "your-account-id.dkr.ecr.ap-northeast-2.amazonaws.com/caffeine-backend:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "DATABASE_URL",
          "value": "postgresql://user:pass@rds-endpoint:5432/dbname"
        },
        {
          "name": "ALLOWED_ORIGINS",
          "value": "https://your-domain.com,https://d26uyg5darllja.cloudfront.net"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/caffeine-backend",
          "awslogs-region": "ap-northeast-2",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

---

## 🔐 보안 체크리스트

### ALB 보안 그룹
- [x] Inbound: 443 (HTTPS), 80 (HTTP) from 0.0.0.0/0
- [x] Outbound: All traffic to ECS security group

### ECS 보안 그룹  
- [x] Inbound: 8000 (Backend), 3000 (Frontend) from ALB security group
- [x] Outbound: 443 to 0.0.0.0/0 (for AWS API calls)

### RDS 보안 그룹
- [x] Inbound: 5432 from ECS security group

---

## 📊 비용 최적화

1. **Fargate Spot** 사용 고려
2. **Auto Scaling** 설정
   - Target tracking: CPU 70%
   - Min: 2, Max: 10
3. **CloudFront** 캐싱 활성화

---

## 🚀 배포 프로세스

### 1. 로컬에서 테스트
```bash
docker-compose -f docker-compose.prod.yml up --build
```

### 2. ECR 푸시
```bash
./deploy-to-ecr.sh
```

### 3. ECS 업데이트
```bash
aws ecs update-service \
  --cluster caffeine-cluster \
  --service caffeine-backend \
  --force-new-deployment
```

---

## ⚠️ 주의사항

### Nginx는 로컬 개발만!
- **로컬**: `docker-compose.yml` (Nginx 포함)
- **프로덕션**: ECS (Nginx 없이 ALB만)

### 환경변수 관리
- **로컬**: `.env` 파일
- **프로덕션**: ECS Task Definition 또는 AWS Secrets Manager

### CORS 설정
- **로컬**: localhost origin
- **프로덕션**: 실제 도메인 origin (환경변수로 관리)

---

## 📞 참고 자료

- [AWS ECS 가이드](https://docs.aws.amazon.com/ecs/)
- [ALB 설정](https://docs.aws.amazon.com/elasticloadbalancing/)
- [ECR 사용법](https://docs.aws.amazon.com/ecr/)
