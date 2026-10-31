import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Debe importarse PRIMERO en los tests que usan el registro: fija DATA_DIR en un
 * directorio temporal antes de que los módulos del backend resuelvan su valor.
 */
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'uiep-specs-'));
