import os
import unittest

import pyotp
from werkzeug.security import generate_password_hash


TEST_PASSWORD = "correct-horse-battery-staple"
TEST_TOTP_SECRET = pyotp.random_base32()

os.environ["FLASK_SECRET_KEY"] = "test-secret-key-only"
os.environ["ADMIN_PASSWORD_HASH"] = generate_password_hash(TEST_PASSWORD)
os.environ["ADMIN_TOTP_SECRET"] = TEST_TOTP_SECRET

import app as app_module  # noqa: E402


class AuthenticationTestCase(unittest.TestCase):
    def setUp(self):
        app_module.app.config.update(TESTING=True)
        app_module._login_attempts.clear()
        self.client = app_module.app.test_client()

    def _login(self, password=TEST_PASSWORD, otp=None):
        code = otp or pyotp.TOTP(TEST_TOTP_SECRET, digits=8, interval=30).now()
        return self.client.post(
            "/api/auth/login",
            json={"password": password, "otp": code},
            headers={"Origin": "http://localhost:5173"},
        )

    def test_admin_endpoint_requires_login(self):
        self.assertEqual(self.client.get("/api/admin/submissions").status_code, 401)

    def test_login_requires_password_and_totp(self):
        self.assertEqual(self._login(password="wrong-password").status_code, 401)
        self.assertEqual(self._login(otp="00000000").status_code, 401)

    def test_login_session_and_csrf_protected_logout(self):
        login = self._login()
        self.assertEqual(login.status_code, 200)
        csrf_token = login.get_json()["csrf_token"]
        session_response = self.client.get("/api/auth/session")
        self.assertTrue(session_response.get_json()["authenticated"])
        self.assertEqual(self.client.post("/api/auth/logout", headers={"Origin": "http://localhost:5173"}).status_code, 403)
        self.assertEqual(
            self.client.post(
                "/api/auth/logout",
                headers={"Origin": "http://localhost:5173", "X-CSRF-Token": csrf_token},
            ).status_code,
            200,
        )

    def test_rejects_untrusted_origin(self):
        response = self.client.post(
            "/api/auth/login",
            json={"password": TEST_PASSWORD, "otp": "00000000"},
            headers={"Origin": "https://attacker.example"},
        )
        self.assertEqual(response.status_code, 403)


if __name__ == "__main__":
    unittest.main()
