"""Non-deployment verification of VPS SSH host-key trust policy."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS = [
    ROOT / ".github/workflows/deploy-vps.yml",
    ROOT / ".github/workflows/deploy.yml",
    ROOT / ".github/workflows/deploy-cv.yml",
]


class DeploySecurityContractTests(unittest.TestCase):
    def test_manual_only(self):
        for path in WORKFLOWS:
            source = path.read_text()
            with self.subTest(path=path.name):
                self.assertIn("  workflow_dispatch:", source)
                self.assertNotIn("\n  push:\n", source)

    def test_host_identity_must_be_explicitly_pinned(self):
        for path in WORKFLOWS:
            source = path.read_text()
            with self.subTest(path=path.name):
                self.assertIn("secrets.VPS_SSH_KNOWN_HOSTS", source)
                self.assertIn("StrictHostKeyChecking=yes", source)
                self.assertNotIn("ssh-keyscan ", source.replace("# Never trust unauthenticated ssh-keyscan output during deployment.", ""))
                self.assertNotIn("StrictHostKeyChecking=no", source)

    def test_missing_host_key_fails_closed(self):
        for path in WORKFLOWS:
            source = path.read_text()
            with self.subTest(path=path.name):
                self.assertIn("test -n", source)
                self.assertIn("chmod 600 ~/.ssh/known_hosts", source)


if __name__ == "__main__":
    unittest.main()
