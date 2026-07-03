"""
CLI entry point for infocol package.

Usage:
    python -m infocol run
    python -m infocol config
    python -m infocol status
"""

import sys

from .main import cli

if __name__ == "__main__":
    sys.exit(cli())
