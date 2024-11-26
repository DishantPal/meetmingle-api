/**
 * Removes specified keys from an object
 */
export function removeKeys<T extends object, K extends keyof T>(
    obj: T,
    keys: K[]
  ): Omit<T, K> {
    const result = { ...obj };
    for (const key of keys) {
      delete result[key];
    }
    return result;
  }
  
  /**
   * Picks specified keys from an object
   */
  export function pickKeys<T extends object, K extends keyof T>(
    obj: T,
    keys: K[]
  ): Pick<T, K> {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
      if (key in obj) {
        result[key] = obj[key];
      }
    }
    return result;
  }
  
  // Type helper for better type inference when using with arrays
  export type ArrayElement<ArrayType extends readonly unknown[]> = 
    ArrayType extends readonly (infer ElementType)[] ? ElementType : never;