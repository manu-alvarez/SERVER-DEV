import os

files = [
    'README.md',
    'docs/server_migration_blueprint.md',
    'docs/apps_detailed_analysis.md'
]

for filepath in files:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content = content
        new_content = new_content.replace('InfoCol', 'Gestión')
        new_content = new_content.replace('infocol', 'gestion')

        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Replaced in {filepath}")
