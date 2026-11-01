/**
 * Puerto ÚNICO del sandbox para el fichero e2e-platform (node --test corre
 * los ficheros de test en PROCESOS PARALELOS: dos hijos del sandbox en el
 * mismo puerto colisionan → EADDRINUSE silencioso y ejecuciones fallidas).
 */
process.env.SANDBOX_TEST_PORT = '4183';
