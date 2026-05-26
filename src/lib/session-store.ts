import fs from 'fs';
import path from 'path';

interface StoredSession {
  sess: any;
  expire: number; // Unix ms timestamp
}

// In-memory fallback
const memorySessions = new Map<string, StoredSession>();

const SESSION_FILE = path.join(process.cwd(), '.local', 'sessions_fallback.json');

function readSessionsFromFile(): Record<string, StoredSession> {
  try {
    console.log(`[session-store] Reading sessions from file: ${SESSION_FILE}`);
    if (fs.existsSync(SESSION_FILE)) {
      const content = fs.readFileSync(SESSION_FILE, 'utf-8');
      const data = JSON.parse(content);
      console.log(`[session-store] Successfully read sessions from file. Session keys count: ${Object.keys(data).length}`);
      return data;
    } else {
      console.log(`[session-store] Sessions file does not exist at: ${SESSION_FILE}`);
    }
  } catch (err) {
    console.error('[session-store] Error reading sessions from file:', err);
  }
  return {};
}

function writeSessionsToFile(data: Record<string, StoredSession>) {
  try {
    const dir = path.dirname(SESSION_FILE);
    console.log(`[session-store] Writing sessions to file: ${SESSION_FILE}`);
    if (!fs.existsSync(dir)) {
      console.log(`[session-store] Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
    const content = JSON.stringify(data, null, 2);
    fs.writeFileSync(SESSION_FILE, content, 'utf-8');
    console.log(`[session-store] Successfully wrote sessions to file. Keys:`, Object.keys(data));
  } catch (err) {
    console.error('[session-store] Error writing sessions to file:', err);
  }
}

export function getLocalSession(sid: string): any | null {
  console.log(`[session-store] getLocalSession for sid: ${sid}`);
  
  let stored: StoredSession | undefined;
  try {
    const fileSessions = readSessionsFromFile();
    stored = fileSessions[sid];
    if (stored) {
      console.log(`[session-store] session found in file.`);
    } else {
      console.log(`[session-store] session not found in file.`);
    }
  } catch (err) {
    console.error(`[session-store] Error reading/getting session from file:`, err);
    stored = memorySessions.get(sid);
  }

  if (!stored) {
    stored = memorySessions.get(sid);
    if (stored) {
      console.log(`[session-store] session found in memory fallback.`);
    }
  }

  if (!stored) {
    console.log(`[session-store] session not found anywhere.`);
    return null;
  }

  if (stored.expire < Date.now()) {
    console.log(`[session-store] session expired (expire: ${stored.expire}, now: ${Date.now()}).`);
    deleteLocalSession(sid);
    return null;
  }

  console.log(`[session-store] session found:`, stored.sess);
  return stored.sess;
}

export function saveLocalSession(sid: string, sess: any, expire: Date): void {
  console.log(`[session-store] saveLocalSession for sid: ${sid}, sess:`, sess);
  const stored: StoredSession = { sess, expire: expire.getTime() };
  
  memorySessions.set(sid, stored);

  try {
    const fileSessions = readSessionsFromFile();
    fileSessions[sid] = stored;
    writeSessionsToFile(fileSessions);
  } catch (err) {
    console.error('[session-store] Exception during saveLocalSession file write:', err);
  }
}

export function deleteLocalSession(sid: string): void {
  console.log(`[session-store] deleteLocalSession for sid: ${sid}`);
  memorySessions.delete(sid);

  try {
    const fileSessions = readSessionsFromFile();
    if (fileSessions[sid]) {
      delete fileSessions[sid];
      writeSessionsToFile(fileSessions);
    }
  } catch (err) {
    console.error('[session-store] Exception during deleteLocalSession file write:', err);
  }
}


