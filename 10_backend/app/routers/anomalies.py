
"""
이상 거래 탐지 API (ML 기반 + 히리스틱)

통계적 규칙(Heuristics)과 ML 모델을 결합하여 이상 거래를 탐지합니다.
"""

from fastapi import APIRouter, HTTPException, Depends, Query, status, Header, Body
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
from typing import Optional, List
from datetime import datetime, timedelta
import logging
import httpx
import asyncio
import math

from app.db.database import get_db
from app.db.model.transaction import Transaction, Category, Anomaly
from app.db.model.user import User
from app.routers.user import get_current_user

# Fix for /api/api problem
from fastapi.security import OAuth2PasswordRequestForm
from app.db.schema.auth import Token
from app.routers.user import login_for_user as original_login_function

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="",
    tags=["anomalies"],
    responses={404: {"description": "Not found"}},
)

# Ugly hack router to fix /api/api login issue as per user request
fix_router = APIRouter()

@fix_router.post("/users/login", response_model=Token, include_in_schema=False)
async def fixed_login_for_user_route(
    user: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
    user_agent: str | None = Header(default=None),
):
    """
    This is a workaround to handle incorrect /api/api/login paths.
    It delegates the call to the original login function.
    """
    return await original_login_function(user, db, user_agent)


# ML Service URL
ML_SERVICE_URL = "http://caf_llm_analysis:9102/predict"

# ============================================================
# Fraud Model Loading
# ============================================================
import joblib
import pandas as pd
import os
import numpy as np
from app.services.fraud_preprocessing import FraudPreprocessor

fraud_model = None
fraud_preprocessor = FraudPreprocessor()

# Category absolute cutoffs for cold start (KRW)
CATEGORY_CUTOFFS = {
    "식비": 5_000_000,
    "쇼핑": 9_990_000,
    "공과금": 5_000_000,
    "여가": 9_990_000,
    "문화": 9_990_000,
    "교통": 1_000_000,
    "의료": 9_990_000,
    "교육": 5_000_000,
    "기타": 9_990_000,
}

# Default cutoff if category not matched
DEFAULT_CUTOFF = 9_990_000

def load_fraud_model():
    """
    Load the XGBoost Fraud Detection Model.
    """
    global fraud_model
    try:
        app_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        model_path = os.path.join(app_dir, "models", "paysim_generic_no_flag_featplus.joblib")
        
        if os.path.exists(model_path):
            fraud_model = joblib.load(model_path)
            logger.info(f"Fraud model loaded from {model_path}")
        else:
            logger.warning(f"Fraud model not found at {model_path}")
    except Exception as e:
        logger.error(f"Failed to load fraud model: {e}")

# Load model on module import (or first use)
load_fraud_model()

# ============================================================
# Pydantic Models
# ============================================================

class AnomalyResponse(BaseModel):
    """이상 거래 응답"""
    id: int              # anomaly id
    transactionId: int   # underlying transaction id
    userId: str
    userName: str
    merchant: str
    category: str
    amount: float
    date: str
    riskLevel: str
    reason: str
    status: str
    
    class Config:
        from_attributes = True

# ============================================================
# Feature Calculation & Heuristics
# ============================================================

def calculate_features(tx: Transaction, avg_amt: float, user_txs: List[Transaction]) -> dict:
    """
    ML 모델 및 히리스틱에 사용할 피쳐 계산
    """
    features = {}
    
    # 1. Amount Z-Score-like (Simple Ratio)
    # Fix TypeError: Decimal vs Float
    amt_val = float(tx.amount)
    # If avg_amt is 0 (first time in category), ratio is 1.0 (Normal)
    features['amt_ratio'] = (amt_val / avg_amt) if avg_amt > 0 else 1.0
    
    # 2. Time Features
    hour = tx.transaction_time.hour
    features['is_night'] = 1 if 0 <= hour < 5 else 0
    
    # 3. Burst Detection (Same merchant in short time)
    burst_count = 0
    current_time = tx.transaction_time
    for other in user_txs:
        if other.id == tx.id: continue
        time_diff = abs((current_time - other.transaction_time).total_seconds())
        if time_diff < 600: # 10 minutes
            burst_count += 1
    features['burst_count'] = burst_count
    
    # 4. Keyword Checks
    merchant = tx.merchant_name or ""
    features['is_gangnam'] = 1 if "강남" in merchant else 0
    features['is_foreign'] = 1 if tx.currency != 'KRW' else 0
    
    return features

def apply_heuristics(tx: Transaction, features: dict) -> tuple[Optional[str], Optional[str]]:
    """
    Apply statistical rules.
    Only one rule: Average Amount Deviation (Ratio)
    """
    reasons = []
    
    # Single Rule: Ratio Check (Leave-One-Out Average)
    # Threshold: 100x (User requested refinement)
    if features['amt_ratio'] >= 100.0:
        return ("위험", f"평균액의 {features['amt_ratio']:.1f}배")

    # Cold-start absolute cutoff by category
    cat_name = (tx.category.name if tx.category else tx.merchant_name) or ""
    cutoff = DEFAULT_CUTOFF
    for key, val in CATEGORY_CUTOFFS.items():
        if key in cat_name:
            cutoff = val
            break
    if float(tx.amount) >= cutoff:
        return ("위험", f"카테고리 컷오프 초과 ({cutoff:,.0f}원)")

    return None, None


# ============================================================
# API Endpoints
# ============================================================

def detect_fraud_with_model(tx: Transaction, history: List[Transaction]) -> tuple[str, str]:
    """
    ML 모델 기반 이상 탐지
    Returns: (risk_level, reason)
    """
    global fraud_model, fraud_preprocessor
    
    if not fraud_model:
        return ("정상", "정상")
        
    try:
        # Preprocess
        df_features = fraud_preprocessor.preprocess_transaction(tx, history)
        
        # Ensure columns match model expectation (simple check/padding if needed)
        # XGBoost handles missing columns often, but order matters if no feature names.
        # Our preprocessor ensures names match metadata.
        
        # Predict Probability
        # Assuming model supports predict_proba
        if hasattr(fraud_model, "predict_proba"):
            probs = fraud_model.predict_proba(df_features)
            # Binary classification: [prob_normal, prob_fraud]
            fraud_prob = probs[0][1]
            
            # Threshold from metadata is 0.955, but that might be conservative/aggressive.
            # strict (high precision) vs loose (high recall).
            # Metadata says best_threshold 0.955 for F1 0.753.
            threshold = 0.955
            
            if fraud_prob >= threshold:
                return ("위험", f"AI 모델 탐지 (확률 {(fraud_prob*100):.1f}%)")
            elif fraud_prob >= 0.8: # Lower threshold for warning
                return ("주의", f"AI 모델 의심 (확률 {(fraud_prob*100):.1f}%)")
                
        else:
            # Fallback to hard prediction
            pred = fraud_model.predict(df_features)
            if pred[0] == 1:
                return ("위험", "AI 모델 탐지")
                
    except Exception as e:
        logger.error(f"Error in AI fraud detection: {e}")
        # Fail safe
        return ("정상", "정상")
        
    return ("정상", "정상")

# ============================================================
# API Endpoints
# ============================================================

@router.get("/anomalies", response_model=List[AnomalyResponse])
async def get_anomalies(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    days: int = Query(60),
    status: Optional[str] = Query(None), 
    risk_level: Optional[str] = Query(None)
):
    try:
        anomalies = []
        
        # ============================================================
        # 1. Fetch Persisted Anomalies (Prioritize DB Records)
        # ============================================================
        anom_query = (
            select(Anomaly)
            .options(
                selectinload(Anomaly.transaction).selectinload(Transaction.user),
                selectinload(Anomaly.transaction).selectinload(Transaction.category)
            )
            .order_by(Anomaly.created_at.desc())
        )
        
        # User Filter
        if not current_user.is_superuser:
            anom_query = anom_query.where(Anomaly.user_id == current_user.id)
            
        # Status Filter (Basic mapping)
        if status == 'reported':
             # User Reported implies explicit report
             anom_query = anom_query.where(Anomaly.reason == "User Reported")
        elif status == 'pending':
             # Pending implies unresolved
             anom_query = anom_query.where(Anomaly.is_resolved == False)
        elif status is None:
             # Default: Show only Unresolved (Hidden Ignored from User)
             # User Request: "무시하기를 누르면... 유저에게도 안보이게끔 해줘"
             anom_query = anom_query.where(Anomaly.is_resolved == False)
             
        # Execute Anomaly Query
        anom_res = await db.execute(anom_query)
        persisted_anomalies = anom_res.scalars().all()
        
        details = []
        for a in persisted_anomalies:
            details.append(f"ID={a.id}, TxID={a.transaction_id}, HasTx={a.transaction is not None}")
            
        
        # Map to Response & Track IDs to avoid duplicates
        persisted_ids = set()
        
        for anom in persisted_anomalies:
            tx = anom.transaction
            if not tx: continue # Should not happen unless referential integrity broken
            
            persisted_ids.add(tx.id)
            
            # Use 'pending' status for unresolved items so they appear in Admin Dashboard list
            response_status = "pending" if not anom.is_resolved else "resolved"
            
            if anom.is_resolved and anom.reason == 'User Ignored':
                response_status = "ignored"
            elif not anom.is_resolved and anom.reason == 'User Reported':
                response_status = "reported"
            
            # If specifically filtering for 'reported' via API param, and we found it via query, ensure it passes
            # (Query filter above handles this mostly, but response status might need to be consistent?)
            # Actually, frontend filters by response's 'status' field being 'pending'.
            # So unresolved items should return status='pending' regardless of source.
            
            anomalies.append(AnomalyResponse(
                id=anom.id,
                transactionId=tx.id,
                userId=f"user_{tx.user_id}",
                userName=tx.user.name if tx.user else f"User {tx.user_id}",
                merchant=tx.merchant_name or "Unknown",
                category=tx.category.name if tx.category else "기타",
                amount=float(tx.amount),
                date=tx.transaction_time.strftime("%Y-%m-%d %H:%M"),
                riskLevel=anom.severity or "위험",
                reason=anom.reason or "System Detected",
                status=response_status
            ))
            
        # ============================================================
        # 2. Heuristic & AI Check on Recent Transactions (Catch NEW anomalies)
        # ============================================================
        # If user asked for specific 'reported' (User Reported), we usually only care about DB records.
        # But if they ask for 'pending' or all, we should check heuristics too.
        
        if status != 'reported':
            start_date = datetime.now() - timedelta(days=days)
            
            # Print Debug Info
            print(f"DEBUG: Checking for new anomalies. User={current_user.id}, Start={start_date}")
            
            tx_query = (
                select(Transaction)
                .where(Transaction.transaction_time >= start_date)
                # Exclude already processed/persisted transactions from this check
                .where(Transaction.id.not_in(persisted_ids))
                .options(selectinload(Transaction.user), selectinload(Transaction.category))
                .order_by(Transaction.transaction_time.desc())
            )
            
            if not current_user.is_superuser:
                tx_query = tx_query.where(Transaction.user_id == current_user.id)
                
            # ============================================================
            # 2. Heuristic Check (General - Last 1000)
            # ============================================================
            # (Existing logic remains for general pattern matching)
            
            tx_query = tx_query.limit(1000) 
            
            tx_res = await db.execute(tx_query)
            recent_txs = tx_res.scalars().all()
            
            # ============================================================
            # 3. Safety Net: Force Include High Value Transactions (>= 100M)
            #    Ensure explicit high-value items are never missed by limit(1000)
            # ============================================================
            high_val_query = (
                select(Transaction)
                .where(Transaction.transaction_time >= start_date)
                .where(Transaction.amount >= 100000000) # 100 Million
                .where(Transaction.id.not_in(persisted_ids))
                .options(selectinload(Transaction.user), selectinload(Transaction.category))
            )
            if not current_user.is_superuser:
                 high_val_query = high_val_query.where(Transaction.user_id == current_user.id)
            
            high_val_res = await db.execute(high_val_query)
            high_val_txs = high_val_res.scalars().all()
            
            # Merchant 'recent_txs' with 'high_val_txs' without duplicates
            recent_tx_ids = set(t.id for t in recent_txs)
            for hv in high_val_txs:
                if hv.id not in recent_tx_ids:
                    recent_txs.append(hv)
            
            # Sort again to be safe (though loops handle it)
            # recent_txs.sort(key=lambda x: x.transaction_time, reverse=True)
            
            # Calculate Averages (Optimization: Only if needed)
            if recent_txs:
                user_ids = list(set(tx.user_id for tx in recent_txs))
                user_category_avg_map = {} 
                
                # User Request: Average of Recent 30 transactions per category (Leave-One-Out)
                # Replaced SQL Window Function with Python aggregation for stability/compatibility.
                
                # Fetch history for relevant users (Optimized: fetch necessary columns only)
                history_query = (
                    select(
                        Transaction.user_id,
                        Transaction.category_id,
                        Transaction.amount,
                        Transaction.id,
                        Transaction.transaction_time
                    )
                    .where(Transaction.user_id.in_(user_ids))
                    .order_by(Transaction.transaction_time.desc())
                )
                
                history_res = await db.execute(history_query)
                rows = history_res.fetchall()
                
                # Dictionary to store list of (amount, id) per user-category
                # Structure: {user_id: {category_id: [(amount, id), ...]}}
                # rows are already sorted by time DESC.
                user_cat_history: dict[int, dict[int, list[tuple[float, int]]]] = {}

                for uid, cat_id, amt, tx_id, tx_time in rows:
                    if uid not in user_cat_history:
                        user_cat_history[uid] = {}
                    if cat_id not in user_cat_history[uid]:
                        user_cat_history[uid][cat_id] = []
                    
                    # We only need the top ~31 for each category to ensure we have 30 after filtering.
                    # Since filtered rows are ordered, we can just append.
                    # Optimization: If list already has 50+, skip (ample buffer).
                    if len(user_cat_history[uid][cat_id]) < 50:
                        user_cat_history[uid][cat_id].append((float(amt), int(tx_id)))

                for tx in recent_txs:
                    # Skip if already in persisted_ids (already handled)
                    if tx.id in persisted_ids:
                        continue

                    # 1. Heuristic Calculation (Recent 30 Avg, Leave-One-Out)
                    cat_id = tx.category_id
                    
                    history_list = user_cat_history.get(tx.user_id, {}).get(cat_id, [])
                    
                    # Filter out the current transaction (Leave-One-Out)
                    # We compare by ID.
                    valid_history = [amt for amt, tid in history_list if tid != tx.id]
                    
                    # Take top 30 (Most recent)
                    recent_30_amts = valid_history[:30]
                    
                    if not recent_30_amts:
                        # No history other than self -> Cold Start
                        # Average is self amount (Ratio 1.0)
                        avg_amt = float(tx.amount) if tx.amount else 1.0
                    else:
                        avg_amt = sum(recent_30_amts) / len(recent_30_amts)
                        
                    # Avoid division by zero
                    if avg_amt == 0: avg_amt = 1.0

                    user_recent_history = [t for t in recent_txs if t.user_id == tx.user_id]
                    features = calculate_features(tx, avg_amt, user_recent_history)
                    
                    risk, reason = apply_heuristics(tx, features)
                    
                    # 2. AI Model Calculation (if not already flagged)
                    if risk == "정상" or risk is None: # Check if heuristic didn't flag it
                        risk, reason = detect_fraud_with_model(tx, user_recent_history)
                    
                    if risk != "정상" and risk is not None:
                        # Check if already added to current batch results
                        is_duplicate = False
                        for a in anomalies:
                            if a.id == tx.id:
                                is_duplicate = True
                                break
                        
                        if not is_duplicate:
                            # Create Anomaly Record
                            # Ensure 'reason' is not too long
                            reason_str = reason[:255] if reason else "System Detected"
                            
                            # Add to DB
                            new_anomaly = Anomaly(
                                user_id=tx.user_id,
                                transaction_id=tx.id,
                                reason=reason_str,
                                severity=risk, # Use risk as severity
                                is_resolved=False, # New detections are pending
                                created_at=datetime.utcnow()
                            )
                            db.add(new_anomaly)
                            await db.flush()  # assign ID
                            
                            # Add to response list
                            anomalies.append(AnomalyResponse(
                                id=new_anomaly.id,
                                transactionId=tx.id,
                                userId=f"user_{tx.user_id}",
                                userName=tx.user.name if tx.user else f"User {tx.user_id}",
                                merchant=tx.merchant_name or "Unknown",
                                category=tx.category.name if tx.category else "기타",
                                amount=float(tx.amount),
                                date=tx.transaction_time.strftime("%Y-%m-%d %H:%M"),
                                riskLevel=risk,
                                reason=reason_str,
                                status="pending" # New heuristic detections are pending
                            ))
                await db.commit() # Commit new anomalies found by heuristics/AI

        logger.info(f"Returned {len(anomalies)} anomalies (Persisted: {len(persisted_ids)})")
        return anomalies
        
    except Exception as e:
        logger.error(f"Error getting anomalies: {e}", exc_info=True)
        raise e
        # return []


@router.post("/anomalies/{anomaly_id}/report")
async def report_anomaly(
    anomaly_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    사용자가 이상거래를 신고함 (User Reported)
    """
    query = select(Anomaly).where(Anomaly.id == anomaly_id)
    result = await db.execute(query)
    anomaly = result.scalar_one_or_none()
    
    if not anomaly or (not current_user.is_superuser and anomaly.user_id != current_user.id):
        raise HTTPException(status_code=404, detail="Anomaly not found")
        
    anomaly.is_resolved = False
    anomaly.reason = 'User Reported'
    
    await db.commit()
    await db.refresh(anomaly)
    return {"status": "reported", "id": anomaly.id, "transactionId": anomaly.transaction_id}

@router.post("/anomalies/{anomaly_id}/ignore")
async def ignore_anomaly(
    anomaly_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    사용자가 이상거래를 무시함 (User Ignored)
    """
    query = select(Anomaly).where(Anomaly.id == anomaly_id)
    result = await db.execute(query)
    anomaly = result.scalar_one_or_none()
    
    if not anomaly or (not current_user.is_superuser and anomaly.user_id != current_user.id):
        raise HTTPException(status_code=404, detail="Anomaly not found")
        
    anomaly.is_resolved = True
    anomaly.reason = 'User Ignored'
    
    await db.commit()
    await db.refresh(anomaly)
    return {"status": "ignored", "id": anomaly.id, "transactionId": anomaly.transaction_id}

@router.post("/anomalies/{anomaly_id}/verify")
async def verify_anomaly(
    anomaly_id: int,
    action: str = Body(..., embed=True), # "confirm" or "dismiss"
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 관리자 권한 체크 필요 (여기서는 생략하고 로직만 구현)
    query = select(Anomaly).where(Anomaly.id == anomaly_id)
    result = await db.execute(query)
    anomaly = result.scalar_one_or_none()
    
    if not anomaly or (not current_user.is_superuser and anomaly.user_id != current_user.id):
        raise HTTPException(status_code=404, detail="Anomaly not found")
    
    if action == "confirm":
        # 실제 이상거래로 확정
        anomaly.is_resolved = True
        # 추가 조치 로직...
    elif action == "dismiss":
        # 오탐지로 처리
        anomaly.is_resolved = True
        
    await db.commit()
    return {"status": "processed", "action": action}

@router.post("/anomalies/{anomaly_id}/approve")
async def approve_anomaly(
    anomaly_id: int,
    db: AsyncSession = Depends(get_db),
    # Admin checks can be added here
):
    query = select(Anomaly).where(Anomaly.id == anomaly_id)
    result = await db.execute(query)
    anomaly = result.scalar_one_or_none()
    
    if not anomaly or (not current_user.is_superuser and anomaly.user_id != current_user.id):
        raise HTTPException(status_code=404, detail="Anomaly not found")
        
    anomaly.is_resolved = True
    await db.commit()
    return {"status": "approved", "id": anomaly_id}

@router.post("/anomalies/{anomaly_id}/reject")
async def reject_anomaly(
    anomaly_id: int,
    db: AsyncSession = Depends(get_db),
    # Admin checks can be added here
):
    query = select(Anomaly).where(Anomaly.id == anomaly_id)
    result = await db.execute(query)
    anomaly = result.scalar_one_or_none()
    
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly not found")
        
    anomaly.is_resolved = True
    await db.commit()
    return {"status": "rejected", "id": anomaly_id}
