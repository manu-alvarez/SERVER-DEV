import os
import re

app_dir = "/Users/manu/Desktop/SERVER-DEV/apps/traductor-pro"

# 1. client/src/App.tsx
app_path = os.path.join(app_dir, "client/src/App.tsx")
with open(app_path, "r") as f:
    content = f.read()

# Fix localStorage setItem
content = content.replace(
    "localStorage.setItem('arantxa_history', JSON.stringify(history));",
    "try { localStorage.setItem('arantxa_history', JSON.stringify(history)); } catch (e) { console.error('Storage error', e); }"
)

# Fix type: type as any, -> type: type as "traduccion" | "resumen" | "extras"
content = re.sub(
    r'type: type as any,',
    r'type: type,',
    content
)
with open(app_path, "w") as f:
    f.write(content)

# 2. client/src/components/ExtrasTab.tsx
extras_path = os.path.join(app_dir, "client/src/components/ExtrasTab.tsx")
with open(extras_path, "r") as f:
    content = f.read()

content = content.replace(
    "} catch (e: any) {",
    "} catch (e) {"
).replace(
    "setError(e?.message || 'Error');",
    "setError(e instanceof Error ? e.message : 'Error');"
).replace(
    "provider: data.provider as any",
    "provider: data.provider as Provider"
).replace(
    "provider={result.provider as any}",
    "provider={result.provider}"
)
with open(extras_path, "w") as f:
    f.write(content)

# 3. client/src/components/ResumirTab.tsx
resumir_path = os.path.join(app_dir, "client/src/components/ResumirTab.tsx")
with open(resumir_path, "r") as f:
    content = f.read()

content = content.replace(
    "} catch (e: any) {",
    "} catch (e) {"
).replace(
    "setError(e?.message || 'Error');",
    "setError(e instanceof Error ? e.message : 'Error');"
).replace(
    "modo: mode as any",
    "modo: mode as 'resumir'"
).replace(
    "provider: data.provider as any",
    "provider: data.provider as Provider"
).replace(
    "provider={result.provider as any}",
    "provider={result.provider}"
)
with open(resumir_path, "w") as f:
    f.write(content)

# 4. client/src/components/TraducirTab.tsx
traducir_path = os.path.join(app_dir, "client/src/components/TraducirTab.tsx")
with open(traducir_path, "r") as f:
    content = f.read()

content = content.replace(
    "} catch (e: any) {",
    "} catch (e) {"
).replace(
    "setError(e?.message || 'Error');",
    "setError(e instanceof Error ? e.message : 'Error');"
).replace(
    "provider: data.provider as any",
    "provider: data.provider as Provider"
).replace(
    "provider={result.provider as any}",
    "provider={result.provider}"
)
with open(traducir_path, "w") as f:
    f.write(content)

# 5. client/src/components/UnifiedInput.tsx
unified_path = os.path.join(app_dir, "client/src/components/UnifiedInput.tsx")
with open(unified_path, "r") as f:
    content = f.read()

content = content.replace(
    "} catch (err: any) {",
    "} catch (err) {"
).replace(
    "setErrorMsg(err?.message || 'Error al extraer texto');",
    "setErrorMsg(err instanceof Error ? err.message : 'Error al extraer texto');"
).replace(
    "setErrorMsg(err?.message || 'Error en OCR');",
    "setErrorMsg(err instanceof Error ? err.message : 'Error en OCR');"
)
with open(unified_path, "w") as f:
    f.write(content)

# 6. server/src/routes/process.ts
s_process_path = os.path.join(app_dir, "server/src/routes/process.ts")
with open(s_process_path, "r") as f:
    content = f.read()

content = content.replace(
    "let lastError: any = null;",
    "let lastError: Error | null = null;"
).replace(
    "let parsed: any = null;",
    "let parsed: Record<string, string> | null = null;"
).replace(
    "} catch (err: any) {",
    "} catch (err) {"
).replace(
    "console.warn(`[process] Proveedor ${providerName} falló:`, err?.message || err);",
    "console.warn(`[process] Proveedor ${providerName} falló:`, err instanceof Error ? err.message : err);"
).replace(
    "lastError = err;",
    "lastError = err instanceof Error ? err : new Error(String(err));"
).replace(
    "details: err?.message,",
    "details: err instanceof Error ? err.message : 'Unknown error',"
)
with open(s_process_path, "w") as f:
    f.write(content)

# 7. server/src/routes/extras.ts
s_extras_path = os.path.join(app_dir, "server/src/routes/extras.ts")
with open(s_extras_path, "r") as f:
    content = f.read()

content = content.replace(
    "let lastError: any = null;",
    "let lastError: Error | null = null;"
).replace(
    "} catch (err: any) {",
    "} catch (err) {"
).replace(
    "console.warn(`[extras] Proveedor ${providerName} falló:`, err?.message || err);",
    "console.warn(`[extras] Proveedor ${providerName} falló:`, err instanceof Error ? err.message : err);"
).replace(
    "lastError = err;",
    "lastError = err instanceof Error ? err : new Error(String(err));"
).replace(
    "details: err?.message,",
    "details: err instanceof Error ? err.message : 'Unknown error',"
)
with open(s_extras_path, "w") as f:
    f.write(content)

# 8. server/src/routes/documents.ts
s_docs_path = os.path.join(app_dir, "server/src/routes/documents.ts")
with open(s_docs_path, "r") as f:
    content = f.read()

content = content.replace(
    "} catch (err: any) {",
    "} catch (err) {"
).replace(
    "details: err?.message",
    "details: err instanceof Error ? err.message : 'Unknown error'"
)
with open(s_docs_path, "w") as f:
    f.write(content)

# 9. server/src/providers/index.ts
s_prov_path = os.path.join(app_dir, "server/src/providers/index.ts")
with open(s_prov_path, "r") as f:
    content = f.read()

content = content.replace(
    "chat: { completions: any };",
    "chat: { completions: { create: (params: any) => Promise<any> } };"
)
with open(s_prov_path, "w") as f:
    f.write(content)

print("traductor-pro refactored.")
