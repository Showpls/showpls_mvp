import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const MAX_AGE_SEC = Number(process.env.TELEGRAM_INITDATA_TTL_SEC ?? 3600); // 1 hour

function getSecretKey(token: string) {
  return crypto.createHmac("sha256", "WebAppData").update(token).digest();
}

function parseInitData(str: string) {
  return new URLSearchParams(str);
}

function calcHash(initData: URLSearchParams, secretKey: Buffer) {
  const entries = Array.from(initData.entries())
    .filter(([k]) => k !== "hash")
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join("\n");
  return crypto.createHmac("sha256", secretKey).update(entries).digest("hex");
}

export function telegramInitAuth(req: Request, res: Response, next: NextFunction) {
  const raw = (req.headers["x-telegram-init-data"] as string)
        || (req.body?.__twaInitData as string)
        || (req.query?.__twaInitData as string);

  if (!raw) return res.status(401).json({ error: "Missing Telegram initData" });

  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('[AUTH] TELEGRAM_BOT_TOKEN not set - authentication disabled in development');
    // For development, create a mock user
    (req as any).tgUser = {
      id: 12345,
      username: 'dev_user',
      first_name: 'Dev',
      last_name: 'User',
      language_code: 'en'
    };
    return next();
  }

  try {
    const initData = parseInitData(raw);
    const providedHash = initData.get("hash");
    if (!providedHash) return res.status(401).json({ error: "Missing hash" });

    const authDate = Number(initData.get("auth_date") || "0");
    const now = Math.floor(Date.now() / 1000);
    if (!authDate || now - authDate > MAX_AGE_SEC) {
      return res.status(401).json({ error: "Expired initData" });
    }

    const secret = getSecretKey(TELEGRAM_BOT_TOKEN);
    const computed = calcHash(initData, secret);

    if (computed !== providedHash) {
      return res.status(401).json({ error: "Invalid initData signature" });
    }

    // Parse user data and pass it along
    const userJson = initData.get("user");
    const tgUser = userJson ? JSON.parse(userJson) : null;
    (req as any).tgUser = tgUser; // {id, username, first_name, last_name, language_code}

    console.log('[AUTH] Telegram user authenticated:', {
      id: tgUser?.id,
      username: tgUser?.username,
      authDate: new Date(authDate * 1000).toISOString()
    });

    next();
  } catch (e) {
    console.error('[AUTH] Telegram auth error:', e);
    return res.status(401).json({ error: "Invalid initData format" });
  }
}