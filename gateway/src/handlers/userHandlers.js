import grpcClients from '../grpc/clients.js';
import { sendSuccessResponse, createHandler, createSimpleHandler } from '../utils/responseHandler.js';

/**
 * Get user profile
 */
const getUserProfile = async (req, res) => {
  const result = await grpcClients.userService.getProfile({
    userId: req.user.id
  });
  sendSuccessResponse(res, 200, result, req.correlationId);
};

/**
 * Update user profile
 */
const updateUserProfile = async (req, res) => {
  const result = await grpcClients.userService.updateProfile({
    userId: req.user.id,
    ...req.body
  });
  sendSuccessResponse(res, 200, result, req.correlationId);
};

/**
 * Get user addresses
 */
const getUserAddresses = async (req, res) => {
  const result = await grpcClients.userService.getAddresses({
    userId: req.user.id
  });
  sendSuccessResponse(res, 200, result, req.correlationId);
};

/**
 * Add user address
 */
const addUserAddress = async (req, res) => {
  const result = await grpcClients.userService.addAddress({
    userId: req.user.id,
    ...req.body
  });
  sendSuccessResponse(res, 201, result, req.correlationId);
};

/**
 * Update user address
 */
const updateUserAddress = async (req, res) => {
  const result = await grpcClients.userService.updateAddress({
    userId: req.user.id,
    addressId: req.params.addressId,
    ...req.body
  });
  sendSuccessResponse(res, 200, result, req.correlationId);
};

/**
 * Delete user address
 */
const deleteUserAddress = async (req, res) => {
  await grpcClients.userService.deleteAddress({
    userId: req.user.id,
    addressId: req.params.addressId
  });
  sendSuccessResponse(res, 200, { message: 'Address deleted successfully' }, req.correlationId);
};

// Export wrapped handlers
export const getProfileHandler = createSimpleHandler(getUserProfile, 'user', 'getProfile');
export const updateProfileHandler = createHandler(updateUserProfile, 'user', 'updateProfile');

export const getAddressesHandler = createSimpleHandler(getUserAddresses, 'user', 'getAddresses');
export const addAddressHandler = createHandler(addUserAddress, 'user', 'addAddress');
export const updateAddressHandler = createHandler(updateUserAddress, 'user', 'updateAddress');
export const deleteAddressHandler = createSimpleHandler(deleteUserAddress, 'user', 'deleteAddress'); 