import { number, object, string } from '@hapi/joi';
import { RawToken, Token } from './constants';

/**
 * Validation schema.
 */
const schema = object({
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
 * Validate raw token data, by checking if the required values are set and if the decimals are larger than or equal to
 * zero. This will strip any unknown fields and rename the 'decimals' field to 'decimal' for compatibility.
 *
 * @param {RawToken} token
 * @return {boolean}
 */
export const validateTokenData = (token: RawToken): Token => {
  const result = schema.validate(token);

  if (result.error) {
    throw new Error(`Invalid JSON schema for token ${token.address}: ${result.error.message}`);
  }

  return result.value as Token;
};

/**
 * Sort tokens alphabetically by symbol.
 *
 * @param {Token[]} tokens
 * @return {Token[]}
 */
export const sortTokens = (tokens: Token[]): Token[] => {
  return tokens.sort((a, b) => a.symbol.localeCompare(b.symbol));
};
