/**
 * Debe importarse ANTES que cualquier módulo que lea SANDBOX_URL /
 * SANDBOX_EXEC_TOKEN / UIEP_RUNNER_TOKEN (sandbox-client los captura al
 * cargarse): fija el entorno del sandbox de test con env por defecto.
 */
process.env.SANDBOX_URL = process.env.SANDBOX_URL || 'http://127.0.0.1:4177';
process.env.SANDBOX_EXEC_TOKEN = process.env.SANDBOX_EXEC_TOKEN || 'sandbox-token-de-test-m14';
process.env.UIEP_RUNNER_TOKEN = process.env.UIEP_RUNNER_TOKEN || 'runner-token-de-test-m14';
