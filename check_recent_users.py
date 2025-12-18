import psycopg2
from datetime import datetime

try:
    conn = psycopg2.connect(
        host="caffeine-database.c58og6ke6t36.ap-northeast-2.rds.amazonaws.com",
        port=5432,
        database="caffeine",
        user="postgres",
        password="postgres1234"
    )
    
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, created_at FROM users ORDER BY created_at DESC LIMIT 10")
    
    print("\n📊 최근 가입한 사용자 (최신 10명):\n")
    print(f"{'ID':<5} {'Name':<20} {'Email':<30} {'Created At'}")
    print("=" * 80)
    
    for row in cursor.fetchall():
        user_id, name, email, created_at = row
        print(f"{user_id:<5} {name:<20} {email:<30} {created_at}")
    
    cursor.close()
    conn.close()
    print("\n✅ 조회 완료!")
    
except Exception as e:
    print(f"❌ 에러 발생: {e}")
