import type { Product } from '../../domain/entities/Product';
import type { FilterEffectPayload } from '../../domain/entities/AnswerEffect';

export interface ProductRepository {
  findByFilters(filters: FilterEffectPayload[]): Promise<Product[]>;
  findByIds(ids: string[]): Promise<Product[]>;
}
