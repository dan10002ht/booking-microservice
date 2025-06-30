import userRepository from '../repositories/user.repository.js';

const getUserById = async (id) => {
  // Business logic có thể thêm ở đây
  return userRepository.findById(id);
};

export default { getUserById };