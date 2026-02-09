from playwright.sync_api import sync_playwright
import time
import os
import random

BASE_URL = "http://127.0.0.1:5000"
SCREENSHOT_DIR = "verification_screenshots"

if not os.path.exists(SCREENSHOT_DIR):
    os.makedirs(SCREENSHOT_DIR)

def generate_cpf():
    def calculate_digit(digits):
        weight = len(digits) + 1
        total = sum(d * (weight - i) for i, d in enumerate(digits))
        remainder = total % 11
        return 0 if remainder < 2 else 11 - remainder

    digits = [random.randint(0, 9) for _ in range(9)]
    digits.append(calculate_digit(digits))
    digits.append(calculate_digit(digits))
    return "".join(map(str, digits))

def format_cpf(cpf):
    return f"{cpf[:3]}.{cpf[3:6]}.{cpf[6:9]}-{cpf[9:]}"

def verify_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1366, 'height': 768})
        page = context.new_page()

        print("Navigating to Login...")
        page.goto(f"{BASE_URL}/login")
        page.screenshot(path=f"{SCREENSHOT_DIR}/0_login.png")

        # Try to register a new user to ensure we can login
        cpf_raw = generate_cpf()
        cpf_formatted = format_cpf(cpf_raw)
        email = f"user_{cpf_raw}@thalium.com"

        print(f"Registering new user: {email} / {cpf_formatted}")
        page.goto(f"{BASE_URL}/cadastro")
        page.fill("#name", "Test User")
        page.fill("#register-email", email)
        page.fill("#cpf", cpf_formatted)
        page.fill("#register-password", "123456")

        # Listen for alert
        page.on("dialog", lambda dialog: dialog.accept())

        page.click("button[type='submit']")

        # Wait for redirect to login
        page.wait_for_url(f"{BASE_URL}/login")

        # Login
        print("Logging in...")
        page.fill("#email", email)
        page.fill("#password", "123456")
        page.click("button[type='submit']")

        page.wait_for_url(f"{BASE_URL}/index")
        print("Login successful. Verifying Dashboard...")

        # Check for new UI elements
        assert page.is_visible("text=Patrimônio Total"), "Patrimônio Total card not found"
        assert page.is_visible("text=Ações Rápidas"), "Ações Rápidas section not found"
        assert page.is_visible("text=Evolução Patrimonial"), "Chart section not found"

        # Check if values are rendered (even if 0)
        assert page.is_visible(".patrimonio-value"), "Patrimonio value not visible"

        page.screenshot(path=f"{SCREENSHOT_DIR}/1_dashboard_new.png")
        print("Dashboard verified.")

        # Visit Subpages to ensure they load
        subpages = [
            ("Transferir", "/transfer"),
            ("Investimentos", "/investimentos"),
            ("Cartões", "/cartoes"),
            ("Extrato", "/historico")
        ]

        for link_text, expected_url_suffix in subpages:
            print(f"Verifying {link_text}...")
            # We need to go back to index or find the link
            page.goto(f"{BASE_URL}/index")
            # Click the link in "Ações Rápidas" or summary cards
            # Note: "Investir" might link to /investimentos too

            # Since link text might vary ("Transferir" vs "Transferência"), let's just go to URL directly to verify template rendering
            page.goto(f"{BASE_URL}{expected_url_suffix}")
            page.screenshot(path=f"{SCREENSHOT_DIR}/sub_{expected_url_suffix.strip('/')}.png")

            # Simple check for content card presence
            assert page.is_visible(".content-card"), f"Content card not found on {expected_url_suffix}"

        browser.close()

if __name__ == "__main__":
    try:
        verify_ui()
        print("UI Verification Passed!")
    except Exception as e:
        print(f"Verification Failed: {e}")
        exit(1)
