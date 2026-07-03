import os
import re
import glob

components_dir = "/Users/manu/Desktop/SERVER-DEV/apps/industrialpro/src/components"

for filepath in glob.glob(os.path.join(components_dir, "*.tsx")):
    with open(filepath, "r") as f:
        content = f.read()
    
    # Replace empty catch with alert
    new_content = re.sub(
        r'\} catch \{\}', 
        r'} catch (err) { alert("Operación fallida. Revisa tu conexión o permisos."); console.error(err); }', 
        content
    )
    
    # OperationsView has one special case:
    # catch { setError('Error al cargar'); }
    # which is fine, but there might be others.
    
    # OperationsView line 53 is inside setInterval, alerting there every 3s would be bad if it fails.
    # Let's fix that specifically:
    if "OperationsView.tsx" in filepath:
        # Re-replace the one inside setInterval
        new_content = re.sub(
            r'const iv = setInterval\(async \(\) => \{(.*?)\} catch \(err\) \{ alert\("Operación fallida. Revisa tu conexión o permisos."\); console\.error\(err\); \}(.*?)\}, 3000\);',
            r'const iv = setInterval(async () => {\1} catch (err) { console.error("Polling error", err); }\2}, 3000);',
            new_content,
            flags=re.DOTALL
        )

    if content != new_content:
        with open(filepath, "w") as f:
            f.write(new_content)
        print(f"Updated {os.path.basename(filepath)}")

print("Frontend refactor done.")
