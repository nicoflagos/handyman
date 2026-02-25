import admin from 'firebase-admin';
import { Types } from 'mongoose';
import { User } from '../models/mongo/user.schema';

type PushMessage = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

let inited = false;

function initIfNeeded() {
  if (inited) return;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    inited = true;
    return;
  }

  try {
    const trimmed = raw.trim();
    const jsonText =
      trimmed.startsWith('base64:')
        ? Buffer.from(trimmed.slice('base64:'.length), 'base64').toString('utf8')
        : trimmed;
    const cred = JSON.parse(jsonText);
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(cred) });
    }
  } catch (err) {
    console.log(`[push] firebase init failed: ${(err as any)?.message || err}`);
  } finally {
    inited = true;
  }
}

export class PushService {
  async notifyUser(userId: Types.ObjectId, msg: PushMessage) {
    initIfNeeded();
    if (!admin.apps.length) return { sent: 0, skipped: true, reason: 'firebase_not_configured' as const };

    const user: any = await User.findById(userId).select('pushTokens').exec();
    const tokens: string[] = Array.isArray(user?.pushTokens) ? user.pushTokens : [];
    if (tokens.length === 0) return { sent: 0, skipped: true, reason: 'no_push_tokens' as const };

    // Use sendEachForMulticast for multiple devices.
    const res = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title: msg.title, body: msg.body },
      data: msg.data || {},
    });

    // Remove invalid tokens.
    const invalid: string[] = [];
    const errors: Array<{ code?: string; message?: string }> = [];
    res.responses.forEach((r, idx) => {
      if (r.success) return;
      const code = (r.error as any)?.code as string | undefined;
      const message = (r.error as any)?.message as string | undefined;
      if (errors.length < 3) errors.push({ code, message });
      if (
        code === 'messaging/invalid-registration-token' ||
        code === 'messaging/registration-token-not-registered'
      ) {
        invalid.push(tokens[idx]);
      }
    });
    if (invalid.length > 0) {
      await User.updateOne({ _id: userId }, { $pull: { pushTokens: { $in: invalid } } }).exec();
    }

    return { sent: res.successCount, failed: res.failureCount, errors: errors.length ? errors : undefined };
  }
}

export const pushService = new PushService();
