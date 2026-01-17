export interface Product {
  id: string;
  name: string;
  category: string;
  priceCents: number;
  /**
   * Semi-structured attributes that can be used for filtering.
   * Keep values simple (string/number/boolean) to make filtering predictable.
   */
  attributes: Record<string, string | number | boolean | null>;
}
