# Límites técnicos conocidos y decisiones (estabilización previa a Fase 9)

Estado: Fase 8 aceptada. Este documento registra los tres límites identificados por
producto, su alcance REAL y la decisión de tratamiento. Nada de esto reescribe subsistemas
desplegados; se resuelve solo donde hay riesgo real.

## 1. Idempotencia — ámbito de operación y caducidad

**Límite**: la clave del libro de idempotencia es determinista sobre
(integración + método + path + hash del body). Dos operaciones externas legítimamente
idénticas (mismo efecto deseado) comparten clave — es exactamente el comportamiento
deseado para reanudación, pero significa que una repetición INTENCIONAL del mismo efecto
(p. ej. "crear el mismo recurso dos veces") se reproducirá en lugar de ejecutarse dos
veces dentro de la ventana.

**Decisión**:
- **Caducidad: ya implementada** — TTL de 24 h por entrada con purga perezosa en cada
  escritura (`reliability.service`); pasada la ventana, la misma operación se ejecuta de
  nuevo. Documentado como política: los efectos externos son único-dentro-de-24-h.
- **Ámbito de operación: la clave YA separa por integración+método+path+body** —
  operaciones distintas nunca colisionan. Para casos que requieran repetición
  intencional idéntica dentro de la ventana, la vía correcta es una integración nueva
  (id distinto) o esperar la caducidad — no se añade bypass (superficie de riesgo).
- Efectos que NECESITAN repetición exacta dentro de la ventana → deben modelarse con
  idempotencia del lado del proveedor (cabeceras estándar) — responsabilidad del
  proveedor, no del libro.

## 2. Resultados inciertos — exactly-once no existe de forma general

**Límite**: ninguna garantía universal de "exactamente una vez" contra servicios
externos. Un fallo de red tras enviar deja un resultado INCIERTO (el efecto pudo llegar).

**Decisión (implementada en Fase 8)**: el libro registra `uncertain` y NO lo reproduce
como éxito — la re-ejecución es explícita. **Política de reconciliación ANTES de
reintentar** (cuando el proveedor soporte consultar el resultado, p. ej. un GET de
estado): el flujo recomendado es nodo de consulta → condición → reintento condicional,
en lugar de reintento ciego. Los reintentos automáticos del workflow engine quedan
pensados para fallos ANTES del envío (provider 5xx inicial, conexión rechazada); el
operador decide en el diseño del workflow cuándo un efecto externo requiere
reconciliación manual. No se reescribe nada: es una guía de diseño de workflows.

## 3. Métricas en memoria — se pierden al reiniciar

**Límite**: las métricas por plano (llamadas/errores/latencia) viven en el proceso; un
reinicio del contenedor las pierde. Suficiente para diagnóstico operativo inmediato;
insuficiente para análisis histórico.

**Decisión**: mantener en memoria (MVP). Cuando se necesite histórico: persistir
agregados periódicos (snapshot JSON bajo DATA_DIR — cubierto por el backup existente) o
exportar a un colector externo. NO se introduce ahora: la auditoría JSONL (persistente)
YA conserva el rastro de eventos individuales con su latencia/correlación — el análisis
histórico puntual puede hacerse sobre ella.

## Verificación de binario servido (lección de Fase 8 — procedimiento estándar)

Todo cierre de fase incluye, antes de la batería de evidencia:
1. Commit del backend JUNTO a su fase (nada de commits solo-web tras cambios de motor).
2. `docker exec uiep-backend grep -c <símbolo-nuevo> dist/...` — el binario del
   contenedor contiene lo esperado.
3. Sólo entonces: batería de evidencia contra producción.
