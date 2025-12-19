import asyncio
from app.db.database import create_engine_with_fallback, Base
from app.db.model.admin_settings import AdminSettings

async def init_models():
    print("Initializing models...")
    # Force getting the engine
    try:
        engine = await create_engine_with_fallback()
        print(f"Engine created: {engine.url}")
        
        async with engine.begin() as conn:
            print("Creating all tables...")
            await conn.run_sync(Base.metadata.create_all)
            print("Tables created.")
            
    except Exception as e:
        print(f"Failed to create tables: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    import sys
    # Increase timeout hack for script
    from app.core import settings as app_settings
    # We can't easily change settings instance, but we can verify what's happening
    asyncio.run(init_models())
