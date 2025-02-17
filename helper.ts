import { v4 as uuidv4 } from 'uuid';

function generateShortUUID(): string {
  return Buffer.from(uuidv4()).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
}

export { generateShortUUID };