from playwright.sync_api import sync_playwright
import time

def test_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:4321/crontab-guru.html')

        # Wait for initial load
        page.wait_for_selector('text=Runs every minute')
        page.screenshot(path='screenshot_initial.png')

        # Input a new cron expression
        page.fill('#cronInput', '0 9 * * 1-5')
        page.wait_for_selector('text=Runs at hour 9')
        page.screenshot(path='screenshot_updated.png')

        print("Screenshots captured.")
        browser.close()

test_page()
