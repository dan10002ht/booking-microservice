import { masterDb, getSlaveDb } from '../config/databaseConfig.js';
import IRepository from './interfaces/IRepository.js';

/**
 * Base Repository với Master-Slave Pattern
 * Tự động route operations dựa trên loại operation
 * Implements IRepository interface
 */
class BaseRepository extends IRepository {
  constructor(tableName) {
    super();
    this.tableName = tableName;
  }

  /**
   * Lấy master database connection cho write operations
   */
  getMasterDb() {
    return masterDb(this.tableName);
  }

  /**
   * Lấy slave database connection cho read operations
   */
  getSlaveDb() {
    // for testing before master-slave pattern
    return masterDb(this.tableName);
    // return getSlaveDb()(this.tableName);
  }

  // ========== READ OPERATIONS (Sử dụng Slave) ==========

  /**
   * Tìm tất cả records
   */
  async findAll(options = {}) {
    const { limit, offset, orderBy, orderDirection = 'asc' } = options;
    let query = this.getSlaveDb().select('*');

    if (orderBy) {
      query = query.orderBy(orderBy, orderDirection);
    }

    if (limit) {
      query = query.limit(limit);
    }

    if (offset) {
      query = query.offset(offset);
    }

    return await query;
  }

  /**
   * Tìm record theo ID (internal)
   */
  async findById(id) {
    const results = await this.getSlaveDb().select('*').where('id', id).limit(1);

    return results[0] || null;
  }

  /**
   * Tìm record theo điều kiện
   */
  async findOne(conditions) {
    const results = await this.getSlaveDb().select('*').where(conditions).limit(1);

    return results[0] || null;
  }

  /**
   * Tìm nhiều records theo điều kiện
   */
  async findMany(conditions, options = {}) {
    const { limit, offset, orderBy, orderDirection = 'asc' } = options;
    let query = this.getSlaveDb().select('*').where(conditions);

    if (orderBy) {
      query = query.orderBy(orderBy, orderDirection);
    }

    if (limit) {
      query = query.limit(limit);
    }

    if (offset) {
      query = query.offset(offset);
    }

    return await query;
  }

  /**
   * Đếm số records theo điều kiện
   */
  async count(conditions = {}) {
    const result = await this.getSlaveDb().count('* as total').where(conditions);

    return parseInt(result[0].total);
  }

  /**
   * Kiểm tra record có tồn tại không
   */
  async exists(conditions) {
    const result = await this.getSlaveDb().select('id').where(conditions).limit(1);

    return result.length > 0;
  }

  /**
   * Tìm record theo public_id (external)
   */
  async findByPublicId(publicId) {
    const results = await this.getSlaveDb().select('*').where('public_id', publicId).limit(1);

    return results[0] || null;
  }

  // ========== WRITE OPERATIONS (Sử dụng Master) ==========

  /**
   * Tạo record mới
   */
  async create(data) {
    const [result] = await this.getMasterDb().insert(data).returning('*');

    return result;
  }

  /**
   * Tạo nhiều records cùng lúc
   */
  async createMany(dataArray) {
    const results = await this.getMasterDb().insert(dataArray).returning('*');

    return results;
  }

  /**
   * Cập nhật record theo ID
   */
  async updateById(id, data) {
    const [result] = await this.getMasterDb().where('id', id).update(data).returning('*');

    return result;
  }

  /**
   * Cập nhật records theo điều kiện
   */
  async update(conditions, data) {
    const results = await this.getMasterDb().where(conditions).update(data).returning('*');

    return results;
  }

  /**
   * Cập nhật record theo public_id
   */
  async updateByPublicId(publicId, data) {
    const [result] = await this.getMasterDb()
      .where('public_id', publicId)
      .update(data)
      .returning('*');

    return result;
  }

  /**
   * Xóa record theo ID
   */
  async deleteById(id) {
    const [result] = await this.getMasterDb().where('id', id).del().returning('*');

    return result;
  }

  /**
   * Xóa records theo điều kiện
   */
  async delete(conditions) {
    const results = await this.getMasterDb().where(conditions).del().returning('*');

    return results;
  }

  /**
   * Xóa record theo public_id
   */
  async deleteByPublicId(publicId) {
    const [result] = await this.getMasterDb().where('public_id', publicId).del().returning('*');

    return result;
  }

  /**
   * Upsert - Insert hoặc Update
   */
  async upsert(data, uniqueColumns = ['id']) {
    const conflictColumns = uniqueColumns.join(', ');
    const [result] = await this.getMasterDb()
      .insert(data)
      .onConflict(conflictColumns)
      .merge()
      .returning('*');

    return result;
  }

  // ========== TRANSACTION OPERATIONS ==========

  /**
   * Thực hiện transaction với master database
   */
  async transaction(callback) {
    return await this.getMasterDb().transaction(callback);
  }

  // ========== ADVANCED QUERY OPERATIONS ==========

  /**
   * Raw query với slave database
   */
  async rawQuery(sql, params = []) {
    return await getSlaveDb().raw(sql, params);
  }

  /**
   * Raw query với master database
   */
  async rawQueryMaster(sql, params = []) {
    return await masterDb.raw(sql, params);
  }

  /**
   * Join query với slave database
   */
  async join(joinTable, joinCondition, options = {}) {
    const { select = '*', where = {}, limit, offset, orderBy, orderDirection = 'asc' } = options;

    let query = this.getSlaveDb().select(select).join(joinTable, joinCondition).where(where);

    if (orderBy) {
      query = query.orderBy(orderBy, orderDirection);
    }

    if (limit) {
      query = query.limit(limit);
    }

    if (offset) {
      query = query.offset(offset);
    }

    return await query;
  }

  /**
   * Pagination helper
   */
  async paginate(page = 1, pageSize = 10, conditions = {}, options = {}) {
    const offset = (page - 1) * pageSize;
    const { orderBy, orderDirection = 'asc' } = options;

    const [data, totalCount] = await Promise.all([
      this.findMany(conditions, { limit: pageSize, offset, orderBy, orderDirection }),
      this.count(conditions),
    ]);

    return {
      data,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasNext: page < Math.ceil(totalCount / pageSize),
        hasPrev: page > 1,
      },
    };
  }
}

export default BaseRepository;
