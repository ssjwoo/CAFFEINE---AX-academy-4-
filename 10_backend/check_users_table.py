import asyncio
from sqlalchemy import create_async_engine, text

async def check_users_table():
    # RDS 접속 정보
    DB_URL = "postgresql+asyncpg://postgres:caffeineapprds@caffeine-database.c58og6ke6t36.ap-northeast-2.rds.amazonaws.com:5432/postgres"
    
    engine = create_async_engine(DB_URL, echo=False)
    
    async with engine.begin() as conn:
        # users 테이블 구조 확인
        result = await conn.execute(text("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'users'
            ORDER BY ordinal_position;
        """))
        
        print(" users 테이블 구조 확인")
        print("="*60)
        for row in result:
            nullable = "NULL" if row[2] == 'YES' else "NOT NULL"
            print(f"{row[0]:20} {row[1]:20} {nullable}")
            
            # birth_date 컬럼 확인
            if 'birth' in row[0].lower():
                print(f"\n✅ 생년월일 컬럼 발견: {row[0]}")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_users_table())
