import { ValueTransformer } from 'typeorm';
import { getEncryptionUtil } from '../utils/encryption.util';

/**
 * Encrypts a numeric column (money amounts) at rest. Stored as text in
 * Postgres; transformed to/from a JS number at the entity boundary.
 *
 * Used for: dealers.credit_limit, dealers.current_balance, products.price.
 */
export const encryptedNumberTransformer: ValueTransformer = {
  to(value?: number | null): string | null {
    if (value === undefined || value === null) return null;
    return getEncryptionUtil().encrypt(value.toString());
  },
  from(value?: string | null): number | null {
    if (value === undefined || value === null) return null;
    return Number(getEncryptionUtil().decrypt(value));
  },
};
