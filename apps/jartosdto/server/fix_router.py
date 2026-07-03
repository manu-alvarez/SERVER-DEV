import re

file_path = "/Users/manu/Desktop/SERVER-DEV/apps/jartosdto/server/app/api/router.py"
with open(file_path, "r") as f:
    content = f.read()

# Make sure logger is imported
if "import logging" not in content:
    content = "import logging\nlogger = logging.getLogger(__name__)\n" + content

# Replace empty excepts
content = re.sub(r'except:\s+pass', r'except Exception as e:\n                logger.error(f"Error checking model: {e}")', content)
content = re.sub(r'except Exception:\s+pass', r'except Exception as e:\n                logger.error(f"Error checking model provider: {e}")', content)
content = re.sub(r'except Exception as e:\s+pass', r'except Exception as e:\n                logger.error(f"Error checking model: {e}")', content)

# Some excepts were just "except:" without pass but with assignments like api_keys = {}
content = re.sub(r'except:\s+api_keys = \{\}', r'except Exception as e:\n        logger.warning(f"Failed to parse x-custom-api-keys: {e}")\n        api_keys = {}', content)

with open(file_path, "w") as f:
    f.write(content)

print("Router updated.")
