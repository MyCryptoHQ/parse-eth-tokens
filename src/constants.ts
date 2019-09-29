import { resolve } from 'path';
import { tmpdir } from 'os';
import { number, object, string } from '@hapi/joi';

export const VERSION = '1.0.0';
export const REPO_URL = 'https://github.com/ethereum-lists/tokens.git';
export const OUTPUT_PATH = resolve(tmpdir(), 'ethereum-lists/tokens');
export const NETWORKS = ['ED', 'ella', 'esn', 'etc', 'eth', 'gor', 'kov', 'rin', 'rop', 'ubq'];

/**
 * Validation schema.
 */
export const TOKEN_SCHEMA = object({
  symbol: string().required(),
  address: string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .required(),
  decimal: number()
    .min(0)
    .required()
})
  .options({ stripUnknown: true })
  .rename('decimals', 'decimal');

/**
 * Raw token data that is loaded from the JSON files.
 */
export interface RawToken {
  address?: string;
  symbol?: string;
  decimals?: number | string;
}

/**
 * Parsed token data.
 */
export interface Token {
  address: string;
  symbol: string;
  decimal: number;
}
