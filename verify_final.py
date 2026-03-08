from playwright.sync_api import sync_playwright

def verify_flexbox_playground():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto('http://localhost:4321/flexbox-playground.html')
        page.wait_for_load_state('networkidle')

        # Click on item 2
        page.locator('.flex-item:nth-child(2)').click()
        page.wait_for_timeout(500)

        # Change align-self of item 2 to center
        page.locator('#i-align-self').select_option('center')
        page.wait_for_timeout(500)

        # Take screenshot
        page.screenshot(path='final_verification.png', full_page=True)
        browser.close()

if __name__ == '__main__':
    verify_flexbox_playground()