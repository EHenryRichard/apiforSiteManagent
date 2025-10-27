import * as UserModule from './user.js';
import * as ValidationModule from './validation.js';

export const getUserModel = () => UserModule.default();
export const getValidationModel = () =>
  ValidationModule.default();
