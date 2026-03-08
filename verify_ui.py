import time
import base64
import os
from playwright.sync_api import sync_playwright, expect

def verify_image_to_base64(page):
    print("Navigating to page...")
    page.goto("http://localhost:4321/image-to-base64.html")

    # Check that basic elements are present
    expect(page.locator("h1")).to_have_text("Image to Base64")

    # Create a dummy image file to test upload
    dummy_image_path = "/tmp/dummy.png"

    # Simple 1x1 transparent PNG base64
    transparent_png_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
    with open(dummy_image_path, "wb") as f:
        f.write(base64.b64decode(transparent_png_b64))

    print("Uploading file...")
    # Upload the dummy file
    page.locator("#fileInput").set_input_files(dummy_image_path)

    # Wait for the preview container to become visible
    print("Waiting for preview container...")
    expect(page.locator("#previewContainer")).to_be_visible()

    # Check that file name updated
    expect(page.locator("#fileName")).to_have_text("dummy.png")

    # Take a screenshot
    print("Taking screenshot...")
    os.makedirs("/home/jules/verification", exist_ok=True)
    screenshot_path = "/home/jules/verification/image-to-base64.png"
    page.screenshot(path=screenshot_path, full_page=True)

    print(f"Screenshot saved to {screenshot_path}")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context()
        page = context.new_page()
        try:
            # Wait a moment for dev server to boot
            time.sleep(2)
            verify_image_to_base64(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()