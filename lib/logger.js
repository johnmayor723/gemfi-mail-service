import fs from 'node:fs';
import path from 'node:path';
import pino from 'pino';

const logDir = path.join(process.cwd(), 'logs');
fs.mkdirSync(logDir, { recursive: true });

const destination = pino.destination({
  dest: path.join(logDir, 'mail-service.log'),
  mkdir: true,
});

export const logger = pino(
  { level: process.env.LOG_LEVEL || 'info' },
  pino.multistream([{ stream: process.stdout }, { stream: destination }])
);
