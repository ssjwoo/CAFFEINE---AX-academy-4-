import logging
import httpx

logger = logging.getLogger(__name__)

async def send_push_notification(token: str, title: str, body: str, data: dict = None) -> bool:
    """
    Expo Push API를 사용하여 푸시 알림 발송
    
    Args:
        token (str): Expo Push Token (ExponentPushToken[...])
        title (str): 알림 제목
        body (str): 알림 내용
        data (dict, optional): 알림과 함께 보낼 추가 데이터
        
    Returns:
        bool: 발송 성공 여부
    """
    if not token:
        logger.warning("푸시 토큰 누락: 알림 발송 건너뜀")
        return False

    if not token.startswith("ExponentPushToken["):
        logger.warning(f"유효하지 않은 토큰 형식: {token}")
        return False

    url = "https://exp.host/--/api/v2/push/send"
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    
    payload = {
        "to": token,
        "title": title,
        "body": body,
        "sound": "default",
        "data": data or {},
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            
            result = response.json()
            
            # Expo API 응답에서 status 체크
            if result.get("data", {}).get("status") == "error":
                logger.error(f"Expo API 오류: {result}")
                return False
            
            logger.info(f"푸시 알림 발송 성공: {title}")
            return True
            
    except Exception as e:
        logger.error(f"푸시 알림 발송 중 예외 발생: {str(e)}")
        return False
