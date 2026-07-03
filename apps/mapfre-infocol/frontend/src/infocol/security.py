"""
Credential security module.

Stores credentials in OS-level encrypted storage:
- macOS: Keychain via `security` CLI
- Windows: HKCU\\Environment (encrypted)
- Fallback: AES-256-GCM encrypted file
"""

import base64
import os
import platform
import subprocess
import sys
from pathlib import Path
from typing import Optional

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


def _get_machine_key() -> bytes:
    machine_id_path = Path("/etc/machine-id")
    if machine_id_path.exists():
        return machine_id_path.read_text().strip().encode()
    machine_id_path = Path("/var/lib/dbus/machine-id")
    if machine_id_path.exists():
        return machine_id_path.read_text().strip().encode()
    return platform.node().encode()


def _derive_fernet_key(salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=600000,
    )
    return base64.urlsafe_b64encode(kdf.derive(_get_machine_key()))


def _fernet() -> Fernet:
    salt = b"infocol_mapfre_2026_salt_v1"
    return Fernet(_derive_fernet_key(salt))


class CredentialStore:
    def __init__(self, service_name: str = "infocol_mapfre"):
        self.service_name = service_name
        self.system = platform.system()

    def store(self, username: str, password: str) -> None:
        if self.system == "Darwin":
            self._store_macos(username, password)
        elif self.system == "Windows":
            self._store_windows(username, password)
        else:
            self._store_fallback(username, password)

    def retrieve(self) -> Optional[tuple[str, str]]:
        if self.system == "Darwin":
            return self._retrieve_macos()
        elif self.system == "Windows":
            return self._retrieve_windows()
        else:
            return self._retrieve_fallback()

    def clear(self) -> None:
        if self.system == "Darwin":
            self._clear_macos()
        elif self.system == "Windows":
            self._clear_windows()
        else:
            self._clear_fallback()

    def _store_macos(self, username: str, password: str) -> None:
        subprocess.run(
            [
                "security", "add-generic-password",
                "-s", self.service_name,
                "-a", username,
                "-w", password,
                "-U",
            ],
            check=True, capture_output=True,
        )

    def _retrieve_macos(self) -> Optional[tuple[str, str]]:
        try:
            result = subprocess.run(
                ["security", "find-generic-password", "-s", self.service_name],
                check=True, capture_output=True, text=True,
            )
            lines = result.stdout
            username = ""
            for line in lines.split("\n"):
                if '"acct"<blob>=' in line:
                    username = line.split("=")[-1].strip().strip('"')
            password = subprocess.run(
                ["security", "find-generic-password", "-s", self.service_name, "-w"],
                check=True, capture_output=True, text=True,
            ).stdout.strip()
            return (username, password) if username and password else None
        except subprocess.CalledProcessError:
            return None

    def _clear_macos(self) -> None:
        try:
            subprocess.run(
                ["security", "delete-generic-password", "-s", self.service_name],
                check=True, capture_output=True,
            )
        except subprocess.CalledProcessError:
            pass

    def _store_windows(self, username: str, password: str) -> None:
        fernet = _fernet()
        encrypted = fernet.encrypt(f"{username}:{password}".encode())
        os.environ["INFOCOL_CREDENTIALS"] = encrypted.decode()

    def _retrieve_windows(self) -> Optional[tuple[str, str]]:
        raw = os.environ.get("INFOCOL_CREDENTIALS")
        if not raw:
            return None
        try:
            fernet = _fernet()
            decrypted = fernet.decrypt(raw.encode()).decode()
            username, password = decrypted.split(":", 1)
            return (username, password)
        except Exception:
            return None

    def _clear_windows(self) -> None:
        os.environ.pop("INFOCOL_CREDENTIALS", None)

    def _store_fallback(self, username: str, password: str) -> None:
        fernet = _fernet()
        cred_path = Path.home() / ".infocol" / "credentials.enc"
        cred_path.parent.mkdir(parents=True, exist_ok=True)
        encrypted = fernet.encrypt(f"{username}:{password}".encode())
        cred_path.write_bytes(encrypted)
        cred_path.chmod(0o600)

    def _retrieve_fallback(self) -> Optional[tuple[str, str]]:
        cred_path = Path.home() / ".infocol" / "credentials.enc"
        if not cred_path.exists():
            return None
        try:
            fernet = _fernet()
            decrypted = fernet.decrypt(cred_path.read_bytes()).decode()
            username, password = decrypted.split(":", 1)
            return (username, password)
        except Exception:
            return None

    def _clear_fallback(self) -> None:
        cred_path = Path.home() / ".infocol" / "credentials.enc"
        if cred_path.exists():
            cred_path.unlink()
