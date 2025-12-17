import asyncio
from playwright.async_api import async_playwright
import os

async def capture():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # Desktop context
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()

        # ========== Admin Dashboard (3001) ==========
        try:
            print("Capturing Admin Dashboard pages...")
            
            # 1. 메인 대시보드
            await page.goto("http://localhost:3001", timeout=15000)
            await page.wait_for_timeout(3000)
            await page.screenshot(path="80_psh/screenshots/admin_main.png")
            print("  - admin_main.png")
            
            # 2. 사용자 목록 페이지 (있으면)
            await page.goto("http://localhost:3001/users", timeout=10000)
            await page.wait_for_timeout(2000)
            await page.screenshot(path="80_psh/screenshots/admin_users.png")
            print("  - admin_users.png")
            
        except Exception as e:
            print(f"Admin Dashboard error: {e}")

        # ========== Backend Swagger (8001) ==========
        try:
            print("Capturing Backend API pages...")
            
            # 1. 전체 API 문서
            await page.goto("http://localhost:8001/docs", timeout=15000)
            await page.wait_for_timeout(2000)
            await page.screenshot(path="80_psh/screenshots/api_docs_main.png")
            print("  - api_docs_main.png")
            
            # 2. ML 엔드포인트 펼치기
            await page.click("text=ml", timeout=5000)
            await page.wait_for_timeout(1000)
            await page.screenshot(path="80_psh/screenshots/api_docs_ml.png")
            print("  - api_docs_ml.png")
            
        except Exception as e:
            print(f"Backend API error: {e}")

        # ========== Mobile App (8081) ==========
        # Mobile context
        mobile_context = await browser.new_context(
            viewport={'width': 375, 'height': 812},
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
        )
        mobile_page = await mobile_context.new_page()
        
        try:
            print("Capturing Mobile App pages...")
            
            # 1. 메인 화면
            await mobile_page.goto("http://localhost:8081", timeout=20000)
            await mobile_page.wait_for_timeout(5000)
            await mobile_page.screenshot(path="80_psh/screenshots/app_main.png")
            print("  - app_main.png")
            
            # 2. 다른 탭 클릭 시도 (Dashboard, Settings 등)
            try:
                await mobile_page.click("text=Dashboard", timeout=3000)
                await mobile_page.wait_for_timeout(2000)
                await mobile_page.screenshot(path="80_psh/screenshots/app_dashboard.png")
                print("  - app_dashboard.png")
            except:
                print("  - Dashboard tab not found, skipping")
            
            try:
                await mobile_page.click("text=Settings", timeout=3000)
                await mobile_page.wait_for_timeout(2000)
                await mobile_page.screenshot(path="80_psh/screenshots/app_settings.png")
                print("  - app_settings.png")
            except:
                print("  - Settings tab not found, skipping")
                
        except Exception as e:
            print(f"Mobile App error: {e}")
        
        await mobile_context.close()
        await context.close()
        await browser.close()
        print("Done!")

if __name__ == "__main__":
    os.makedirs("80_psh/screenshots", exist_ok=True)
    asyncio.run(capture())
