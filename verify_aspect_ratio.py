from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    page.goto("http://localhost:4321/aspect-ratio-calc.html")
    page.wait_for_selector("text=Aspect Ratio Calculator")
    page.wait_for_timeout(2000)
    page.screenshot(path="aspect_ratio_calc.png", full_page=True)
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
