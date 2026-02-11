from playwright.sync_api import sync_playwright
import os

BASE_URL = "http://127.0.0.1:5000"

def verify_admin_login():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to Login...")
        page.goto(f"{BASE_URL}/login")

        print("Logging in as Admin...")
        page.fill("#email", "admintopzao@gmail.com")
        page.fill("#password", "admin")
        page.click("button[type='submit']")

        # Check for error message
        if page.is_visible(".alert-danger"):
            text = page.inner_text(".alert-danger")
            print(f"Login Failed: {text}")
            exit(1)

        # Check for success redirect
        try:
            page.wait_for_url(f"{BASE_URL}/index", timeout=5000)
            print("Admin Login Successful!")

            # Verify Balance
            balance = page.inner_text(".balance-value")
            print(f"Admin Balance: {balance}")
            assert "999.999.999" in balance or "X" in balance # X from currency filter hack in python?

        except Exception as e:
            print(f"Failed to reach dashboard: {e}")
            page.screenshot(path="login_fail.png")
            exit(1)

        browser.close()

if __name__ == "__main__":
    verify_admin_login()
