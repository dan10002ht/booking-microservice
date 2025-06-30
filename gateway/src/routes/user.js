import express from 'express';

// Import handlers
import {
  getProfileHandler,
  updateProfileHandler,
  getAddressesHandler,
  addAddressHandler,
  updateAddressHandler,
  deleteAddressHandler,
} from '../handlers/index.js';

// Import validation middleware
import {
  validateUserProfileUpdate,
  validateUserAddress,
  validateUserAddressUpdate,
} from '../middlewares/index.js';

const router = express.Router();

router.get('/profile', getProfileHandler);
router.put('/profile', validateUserProfileUpdate, updateProfileHandler);
router.get('/addresses', getAddressesHandler);
router.post('/addresses', validateUserAddress, addAddressHandler);
router.put('/addresses/:addressId', validateUserAddressUpdate, updateAddressHandler);
router.delete('/addresses/:addressId', deleteAddressHandler);

export default router;
