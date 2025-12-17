"""
Simple migration script to add birth_date column to users table.
Run this with: python -c "exec(open('migrations/simple_add_birth_date.py').read())"
"""

import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.database import get_engine

async def main():
    engine = get_engine()
    
    async with engine.begin() as conn:
        # Check if column exists
        check_result = await conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'users' 
            AND column_name = 'birth_date'
        """))
        
        exists = check_result.fetchone()
        
        if exists:
            print("✅ birth_date column already exists in users table")
        else:
            # Add the column
            await conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN birth_date DATE NULL
            """))
            print("✅ Successfully added birth_date column to users table")
    
    await engine.dispose()
    print("Migration complete!")

if __name__ == "__main__":
    asyncio.run(main())
