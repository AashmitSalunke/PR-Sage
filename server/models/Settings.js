import mongoose from 'mongoose';
import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

/**
 * Pad/truncate key to exactly 32 bytes for AES-256.
 * This avoids "Invalid key length" errors regardless of ENCRYPTION_KEY length.
 */
const getKey = () => {
  const raw = process.env.ENCRYPTION_KEY || 'default_key_please_change_NOW_32';
  const buf = Buffer.alloc(32, 0);
  Buffer.from(raw, 'utf8').copy(buf);
  return buf;
};

const encrypt = (text) => {
  if (!text) return '';
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

const decrypt = (text) => {
  if (!text) return '';
  try {
    const [ivHex, encryptedHex] = text.split(':');
    const key = getKey();
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    return Buffer.concat([decipher.update(encryptedText), decipher.final()]).toString();
  } catch {
    return '';
  }
};

const settingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    githubTokenEncrypted: {
      type: String,
      default: '',
    },
    geminiModel: {
      type: String,
      default: process.env.NEMOTRON_MODEL || 'nvidia/nemotron-3-nano-30b-a3b',
    },
    autoPostComments: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Virtual: decrypt GitHub token on read
settingsSchema.virtual('githubToken').get(function () {
  return decrypt(this.githubTokenEncrypted);
});

// Virtual: encrypt GitHub token on write
settingsSchema.virtual('githubToken').set(function (plainToken) {
  this.githubTokenEncrypted = encrypt(plainToken);
});

// Safe JSON — never exposes encrypted fields
settingsSchema.methods.toSafeJSON = function () {
  return {
    geminiModel: this.geminiModel,
    autoPostComments: this.autoPostComments,
    hasGithubToken: !!this.githubTokenEncrypted,
  };
};

const Settings = mongoose.model('Settings', settingsSchema);
export { encrypt, decrypt };
export default Settings;
