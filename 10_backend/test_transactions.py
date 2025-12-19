import asyncio
import sys
sys.path.insert(0, '/app')

from app.db.database import get_async_session
from app.db.model.user import User
from sqlalchemy import select
from sqlalchemy.orm import selectinload

async def test():
    async for session in get_async_session():
        print("Testing eager loading...")
        result = await session.execute(
            select(User)
            .options(selectinload(User.transactions))
            .limit(1)
        )
        user = result.scalars().first()
        if user:
            print(f"User: {user.name}, ID: {user.id}")
            print(f"Has transactions attr: {hasattr(user, 'transactions')}")
            if hasattr(user, 'transactions'):
                print(f"Transactions count: {len(user.transactions)}")
                for i, tx in enumerate(user.transactions[:3]):
                    print(f"  TX {i+1}: {tx.amount}, {tx.merchant_name}")
            else:
                print("ERROR: transactions attribute not found!")
        else:
            print("No users found")
        break

if __name__ == "__main__":
    asyncio.run(test())
