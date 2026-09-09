import { NotFoundException } from '@nestjs/common';
import { FindOptionsWhere, Repository } from 'typeorm';

/**
 * Multi-tenant isolation is enforced HERE, centrally, rather than trusted to
 * be repeated correctly in every service method: every read/write this class
 * exposes takes `distributorId` as a required first argument and folds it
 * into the `where` clause. A module service extends this instead of using
 * its injected Repository directly, so "forgot to scope this query" is not
 * a mistake an individual endpoint can make silently.
 *
 * Entities used here must carry a `distributorId` column.
 */
export abstract class TenantScopedRepository<
  T extends { id: string; distributorId: string },
> {
  protected constructor(protected readonly repository: Repository<T>) {}

  findAll(distributorId: string, where: FindOptionsWhere<T> = {} as any): Promise<T[]> {
    return this.repository.find({
      where: { ...where, distributorId } as FindOptionsWhere<T>,
    });
  }

  async findOneOrFail(distributorId: string, id: string): Promise<T> {
    const entity = await this.repository.findOne({
      where: { id, distributorId } as FindOptionsWhere<T>,
    });
    if (!entity) {
      throw new NotFoundException(`${this.repository.metadata.name} ${id} not found`);
    }
    return entity;
  }

  async findOne(distributorId: string, where: FindOptionsWhere<T>): Promise<T | null> {
    return this.repository.findOne({ where: { ...where, distributorId } });
  }

  create(distributorId: string, data: Partial<T>): Promise<T> {
    const entity = this.repository.create({ ...data, distributorId } as T);
    return this.repository.save(entity);
  }

  async update(distributorId: string, id: string, data: Partial<T>): Promise<T> {
    // Fetch-then-save (rather than a bare `update()` by id) so an id from
    // another distributor can never be written to, even if a caller upstream
    // forgot to check ownership first.
    const entity = await this.findOneOrFail(distributorId, id);
    Object.assign(entity as object, data);
    return this.repository.save(entity);
  }

  async remove(distributorId: string, id: string): Promise<void> {
    const entity = await this.findOneOrFail(distributorId, id);
    await this.repository.remove(entity);
  }
}
