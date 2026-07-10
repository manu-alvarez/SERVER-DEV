import os
import re

directories = ['apps/mapfre']
extensions = ['.ts', '.tsx', '.py', '.md', '.json', '.yaml', '.toml', '.txt', 'LICENSE']

for root, dirs, files in os.walk(directories[0]):
    if 'node_modules' in root or '.next' in root or 'venv' in root or 'dist' in root or '.git' in root:
        continue
    for file in files:
        if any(file.endswith(ext) for ext in extensions) or file == 'LICENSE':
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = content
                new_content = new_content.replace('InfoCol', 'Gestión')
                new_content = new_content.replace('INFOCOL', 'GESTION')
                new_content = new_content.replace('InfoCOL', 'Gestión')
                new_content = new_content.replace('infocol', 'gestion')

                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Replaced in {filepath}")
            except Exception as e:
                print(f"Failed {filepath}: {e}")

