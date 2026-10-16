import getpass
import secrets

import pyotp
from werkzeug.security import generate_password_hash


def main():
    password = getpass.getpass("管理者パスワード: ")
    confirmation = getpass.getpass("管理者パスワード（確認）: ")
    if len(password) < 12:
        raise SystemExit("パスワードは12文字以上にしてください。")
    if password != confirmation:
        raise SystemExit("パスワードが一致しません。")

    totp_secret = pyotp.random_base32()
    password_hash = generate_password_hash(password)
    flask_secret = secrets.token_hex(32)
    uri = pyotp.TOTP(totp_secret, digits=8, interval=30).provisioning_uri(
        name="admin", issuer_name="Science Learning Hub"
    )

    print("\n.envへ次の3行をコピーしてください（秘密情報です）:\n")
    print(f"FLASK_SECRET_KEY='{flask_secret}'")
    print(f"ADMIN_PASSWORD_HASH='{password_hash}'")
    print(f"ADMIN_TOTP_SECRET='{totp_secret}'")
    print("\n認証アプリへ次のセットアップURIを登録してください:\n")
    print(uri)
    print("\n認証方式が選べる場合は、8桁・30秒を指定してください。")


if __name__ == "__main__":
    main()
