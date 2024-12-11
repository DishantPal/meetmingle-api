import { customAlphabet } from 'nanoid';

type GenerateIdOptions = {
  /**
   * Length of the ID (excluding prefix). Defaults to 21.
   */
  length?: number;
  /**
   * Optional prefix for the ID. If provided, will be added with an underscore separator.
   * @example With prefix 'user' -> 'user_123abc'
   */
  prefix?: string;
};

const ALPHANUMERIC = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * Generates a unique alphanumeric ID with optional prefix and customizable length.
 * 
 * @param options Configuration options for ID generation
 * @returns Generated ID string
 * 
 * @example
 * // Generate default ID (21 chars)
 * generateId() // => "7LSv6IqK9XmYzR4Nej2Ht"
 * 
 * @example
 * // Generate ID with prefix
 * generateId({ prefix: 'user' }) // => "user_7LSv6IqK9XmYzR4Nej2Ht"
 * 
 * @example
 * // Generate shorter ID with prefix
 * generateId({ prefix: 'tx', length: 16 }) // => "tx_7LSv6IqK9XmYzR4"
 */
export const generateId = (options: GenerateIdOptions = {}): string => {
  const { length = 21, prefix } = options;
  
  // Create nanoid generator with alphanumeric alphabet and specified length
  const nanoid = customAlphabet(ALPHANUMERIC, length);
  
  // Generate the base ID
  const id = nanoid();
  
  // Return ID with prefix if provided, otherwise just the ID
  return prefix ? `${prefix}_${id}` : id;
};