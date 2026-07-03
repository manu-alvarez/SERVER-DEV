import re

with open('/Users/manu/Desktop/SERVER-DEV/apps/livekit-nikolina/server/src/api/routes.py', 'r') as f:
    content = f.read()

# Fix the broken replacement
content = re.sub(r'def get_current_user_lazy\(\):\n    from src\.core\.auth import get_current_user\n    return get_current_user\n\n# Note.*?Depends\(lazy_auth\)`\)', 'Depends(get_current_user)', content, flags=re.DOTALL)

with open('/Users/manu/Desktop/SERVER-DEV/apps/livekit-nikolina/server/src/api/routes.py', 'w') as f:
    f.write(content)

