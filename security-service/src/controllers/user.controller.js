import userService from '../services/user.service.js';

const getUser = async (call, callback) => {
  try {
    const user = await userService.getUserById(call.request.id);
    callback(null, user);
  } catch (err) {
    callback(err);
  }
};

export default { getUser };