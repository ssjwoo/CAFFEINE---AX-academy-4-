"""Add birth_date column to users table

This migration adds a birth_date column to the users table for demographic analysis.
Can be run manually if Alembic is not set up.
"""

import asyncio
from sqlalchemy import text
from app.db.database import engine, init_db

async def upgrade():
    """Add birth_date column to users table"""
    async with engine.begin() as conn:
        # Check if column already exists
        check_query = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='birth_date'
        """)
        result = await conn.execute(check_query)
        exists = result.fetchone()
        
        if not exists:
            # Add the column
            alter_query = text("""
                ALTER TABLE users 
                ADD COLUMN birth_date DATE NULL
            """)
            await conn.execute(alter_query)
            print("✅ Successfully added birth_date column to users table")
        else:
            print("ℹ️  birth_date column already exists")

async def downgrade():
    """Remove birth_date column from users table"""
    async with engine.begin() as conn:
        alter_query = text("""
            ALTER TABLE users 
            DROP COLUMN IF EXISTS birth_date
        """)
        await conn.execute(alter_query)
        print("✅ Successfully removed birth_date column from users table")

if __name__ == "__main__":
    print("Running migration: add_birth_date")
    asyncio.run(upgrade())
    print("Migration completed!")
