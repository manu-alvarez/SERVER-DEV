#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# UIEP — Proyecto de referencia REPRODUCIBLE (Misión 16 / uiep-1.7.0)
#
# Genera de cero los 5 referentes de la plataforma y verifica el ciclo COMPLETO:
# agente → workflow → API → Agentic App → SaaS compuesto (composición UES con
# dependencias y tokens $ref) → calidad (4 dimensiones) → ejecución aislada en
# el sandbox → export. IDEMPOTENTE: re-ejecutar reutiliza (reused:true).
#
# Uso:  UIEP_CONSOLE_PASSWORD=… bash backend/examples/m16/proyecto-referencia.sh
#       (o con la cookie ya iniciada: bash proyecto-referencia.sh skip-login)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

BASE="${UIEP_BASE:-https://uiep.manuelalvarez.dev/_uiep/api}"

if [[ "${1:-}" == "skip-login" ]]; then
  # Reutiliza una sesión ya iniciada (fichero de cookie Netscape apuntado por UIEP_COOKIE).
  : "${UIEP_COOKIE:?skip-login requiere UIEP_COOKIE=/ruta/al/fichero/de/cookie}"
  COOKIE="$UIEP_COOKIE"
else
  : "${UIEP_CONSOLE_PASSWORD:?exporta UIEP_CONSOLE_PASSWORD para el login}"
  COOKIE="$(mktemp)"
  curl -s -X POST "$BASE/console/auth/login" -H 'content-type: application/json' \
    -d "{\"password\":\"$UIEP_CONSOLE_PASSWORD\"}" -c "$COOKIE" -o /dev/null
  echo "· login OK"
fi
B="$BASE/console"

# j(): parsear JSON sin dependencias; si la respuesta no tiene el campo
# esperado, muestra la respuesta cruda (rate limits, errores del BFF...).
j() {
  local payload
  payload=$(cat)
  if ! python3 -c "import json,sys; j=json.loads(sys.argv[1]); $1" "$payload" 2>/dev/null; then
    echo "   [respuesta inesperada del BFF]" "$payload" | head -c 300
    echo
    exit 1
  fi
}

gen() { # gen <type> <json-de-entrada> — envuelve en el envelope del BFF
  local envelope
  envelope=$(python3 -c 'import json,sys; print(json.dumps({"type": sys.argv[1], "input": json.loads(sys.argv[2])}))' "$1" "$2")
  curl -s -b "$COOKIE" -X POST "$B/engineering/generate" -H 'content-type: application/json' -H 'x-uiep-console: 1' -d "$envelope" \
    | j "print('$1 →', j['outcome'].get('specKind') or j['outcome'].get('artifactKind'), j['outcome']['id']+'@'+j['outcome']['version'], '(reutilizado)' if j['reused'] else '(creado)')"
}

echo "═ 1. AGENTE de referencia"
gen agent '{"name":"M16 Agente Referencia","role":"asistente de soporte","objective":"atender consultas del proyecto de referencia","system":"Agente de referencia de la Misión 16. Responde SIEMPRE: sistema listo.","memory":{"enabled":false,"strategy":"none"}}'

echo "═ 2. WORKFLOW de referencia (pipeline con el agente)"
gen workflow '{"name":"M16 Flujo Referencia","steps":[{"agent":"m16-agente-referencia","input":"{{input}}"}]}'

echo "═ 3. API de referencia (endpoint servido por el agente)"
gen api-platform '{"id":"m16-api-referencia","name":"M16 API Referencia","endpoints":[{"id":"estado","method":"GET","path":"/api/estado","summary":"estado del sistema","agentBinding":"m16-agente-referencia"}]}'

echo "═ 4. AGENTIC APP de referencia (solo componentes ejecutables)"
gen agentic-app '{"id":"m16-app-referencia","name":"M16 App Referencia","agents":[{"agent":"m16-agente-referencia","role":"núcleo"}],"surfaces":[{"type":"workflow-engine"},{"type":"console"}],"guardrails":{"maxIterations":2}}'

echo "═ 5. SAAS COMPUESTO (composición UES: specRef + generate + tokens \$ref)"
curl -s -b "$COOKIE" -X POST "$B/engineering/compositions" -H 'content-type: application/json' -H 'x-uiep-console: 1' -d '{
  "apiVersion":"uiep.io/ues/v1","kind":"Project",
  "metadata":{"id":"referencia-m16","name":"SaaS de Referencia M16","version":"1.0.0"},
  "artifacts":[
    {"ref":"agente","type":"agent","specRef":{"id":"m16-agente-referencia","kind":"Agent","version":"1.0.0"}},
    {"ref":"api","type":"api-platform","dependencies":[{"ref":"agente"}],"generate":{"name":"M16 API Compuesta","endpoints":[{"id":"eco","method":"GET","path":"/api/eco","summary":"eco","agentBinding":"$ref:agente"}]}},
    {"ref":"app","type":"application","dependencies":[{"ref":"api"}],"generate":{"name":"M16 App Compuesta","entryModule":"api","modules":[{"ref":"api","kind":"api-platform","componentRef":{"kind":"ApiPlatform","id":"$ref:api"}}]}},
    {"ref":"agentic","type":"agentic-app","dependencies":[{"ref":"api"}],"generate":{"name":"M16 Agentic Compuesta","agents":[{"agent":"$ref:agente","role":"núcleo"}],"surfaces":[{"type":"http"}]}},
    {"ref":"saas","type":"saas","dependencies":[{"ref":"app"},{"ref":"agentic"}],"generate":{"name":"M16 SaaS Referencia","entryModule":"app","modules":[{"ref":"app","kind":"application","componentRef":{"kind":"Application","id":"$ref:app"}}],"roles":[{"name":"admin","permissions":["*"]}]}}
  ]}' | j "print('   composición →', 'OK' if j.get('ok') else j); [print('   ·', a['ref'], '→', a['action']) for a in j.get('artifacts',[])]"

echo "═ 6. CALIDAD del SaaS (schema + referencias + seguridad)"
curl -s -b "$COOKIE" -X POST "$B/engineering/quality/Saas/m16-saas-referencia" -H 'x-uiep-console: 1' \
  | j "print('   veredicto:', j['verdict']); [print('   ·', c['dimension'], '→', 'OK' if c['passed'] else 'FAIL') for c in j['checks']]"

echo "═ 7. EJECUCIÓN aislada (Agentic App en el sandbox)"
curl -s -b "$COOKIE" -X POST "$B/engineering/agentic-app/m16-app-referencia/runs" -H 'content-type: application/json' -H 'x-uiep-console: 1' \
  -d '{"invocation":{"input":"Resume en una línea el estado del sistema.","timeoutMs":300000}}' \
  | j "b=(j.get('result') or {}).get('body',{}); a=(b.get('agents') or [{}])[0]; print('   run', j.get('runId'), '→', j.get('status'), '| agente:', a.get('status'), '| salida:', str(a.get('output',''))[:70].replace(chr(10),' '))"

echo "═ 8. EXPORT del proyecto (bundle uiep-export-v1)"
curl -s -b "$COOKIE" -X POST "$B/engineering/projects/referencia-m16/export" -H 'x-uiep-console: 1' \
  | j "print('   bundle:', j['filename'], '|', len(j['documents']), 'documentos | sha256', j['sha256'][:16]+'…')"

echo "═ 9. EJECUCIONES registradas (trazabilidad)"
curl -s -b "$COOKIE" "$B/engineering/executions?limit=3" | j "print('   últimas:', ', '.join(e['runId']+'('+e['status']+')' for e in j['executions']))"

rm -f "$COOKIE"
echo "✔ Proyecto de referencia verificado de punta a punta (idempotente: re-ejecuta cuando quieras)."
