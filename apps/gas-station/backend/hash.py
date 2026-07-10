import sys
import os
sys.path.append('venv/lib/python3.11/site-packages')
sys.path.append('/home/ubuntu/MSBrossAI/apps/iaprod-os/backend/venv/lib/python3.11/site-packages')
import bcrypt
print(bcrypt.hashpw(b'1234', bcrypt.gensalt()).decode())
print(bcrypt.hashpw(b'0000', bcrypt.gensalt()).decode())
