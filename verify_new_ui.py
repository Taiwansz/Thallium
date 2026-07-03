from playwright.sync_api import sync_playwright

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto('http://localhost:3000/cadastro')
        page.wait_for_timeout(2000)
        page.screenshot(path='verification_screenshots/cadastro.png', full_page=True)

        page.goto('http://localhost:3000/login')
        page.wait_for_timeout(2000)
        page.screenshot(path='verification_screenshots/login.png', full_page=True)

        browser.close()

if __name__ == "__main__":
    verify()
