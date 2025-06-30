/**
 * Base Repository Interface
 * Định nghĩa contract cho tất cả repositories
 */
export default class IRepository {
  // ========== READ OPERATIONS ==========

  /**
   * Tìm tất cả records
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findAll(options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Tìm record theo ID
   * @param {string|number} id - Record ID
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    throw new Error('Method not implemented');
  }

  /**
   * Tìm record theo public_id
   * @param {string} publicId - Public ID
   * @returns {Promise<Object|null>}
   */
  async findByPublicId(publicId) {
    throw new Error('Method not implemented');
  }

  /**
   * Tìm record theo điều kiện
   * @param {Object} conditions - Query conditions
   * @returns {Promise<Object|null>}
   */
  async findOne(conditions) {
    throw new Error('Method not implemented');
  }

  /**
   * Tìm nhiều records theo điều kiện
   * @param {Object} conditions - Query conditions
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findMany(conditions, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Đếm số records theo điều kiện
   * @param {Object} conditions - Query conditions
   * @returns {Promise<number>}
   */
  async count(conditions = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Kiểm tra record có tồn tại không
   * @param {Object} conditions - Query conditions
   * @returns {Promise<boolean>}
   */
  async exists(conditions) {
    throw new Error('Method not implemented');
  }

  // ========== WRITE OPERATIONS ==========

  /**
   * Tạo record mới
   * @param {Object} data - Record data
   * @returns {Promise<Object>}
   */
  async create(data) {
    throw new Error('Method not implemented');
  }

  /**
   * Tạo nhiều records cùng lúc
   * @param {Array} dataArray - Array of record data
   * @returns {Promise<Array>}
   */
  async createMany(dataArray) {
    throw new Error('Method not implemented');
  }

  /**
   * Cập nhật record theo ID
   * @param {string|number} id - Record ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>}
   */
  async updateById(id, data) {
    throw new Error('Method not implemented');
  }

  /**
   * Cập nhật record theo public_id
   * @param {string} publicId - Public ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>}
   */
  async updateByPublicId(publicId, data) {
    throw new Error('Method not implemented');
  }

  /**
   * Cập nhật records theo điều kiện
   * @param {Object} conditions - Query conditions
   * @param {Object} data - Update data
   * @returns {Promise<Array>}
   */
  async update(conditions, data) {
    throw new Error('Method not implemented');
  }

  /**
   * Xóa record theo ID
   * @param {string|number} id - Record ID
   * @returns {Promise<Object>}
   */
  async deleteById(id) {
    throw new Error('Method not implemented');
  }

  /**
   * Xóa record theo public_id
   * @param {string} publicId - Public ID
   * @returns {Promise<Object>}
   */
  async deleteByPublicId(publicId) {
    throw new Error('Method not implemented');
  }

  /**
   * Xóa records theo điều kiện
   * @param {Object} conditions - Query conditions
   * @returns {Promise<Array>}
   */
  async delete(conditions) {
    throw new Error('Method not implemented');
  }

  /**
   * Upsert - Insert hoặc Update
   * @param {Object} data - Record data
   * @param {Array} uniqueColumns - Unique columns for conflict resolution
   * @returns {Promise<Object>}
   */
  async upsert(data, uniqueColumns = ['id']) {
    throw new Error('Method not implemented');
  }

  // ========== TRANSACTION OPERATIONS ==========

  /**
   * Thực hiện transaction
   * @param {Function} callback - Transaction callback
   * @returns {Promise<any>}
   */
  async transaction(callback) {
    throw new Error('Method not implemented');
  }

  // ========== ADVANCED QUERY OPERATIONS ==========

  /**
   * Raw query với slave database
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<any>}
   */
  async rawQuery(sql, params = []) {
    throw new Error('Method not implemented');
  }

  /**
   * Join query
   * @param {string} joinTable - Table to join
   * @param {string} joinCondition - Join condition
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async join(joinTable, joinCondition, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Pagination
   * @param {number} page - Page number
   * @param {number} pageSize - Page size
   * @param {Object} conditions - Query conditions
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async paginate(page = 1, pageSize = 10, conditions = {}, options = {}) {
    throw new Error('Method not implemented');
  }
}
