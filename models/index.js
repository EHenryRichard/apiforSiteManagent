import * as UserModule from './user.js';
import * as ValidationModule from './validation.js';
import * as ClientModule from './client.js';
import * as SiteModule from './site.js';

export const getUserModel = () => UserModule.default();
export const getValidationModel = () =>
  ValidationModule.default();
export const getClientModel = () => ClientModule.default();
export const getSiteModel = () => SiteModule.default();
