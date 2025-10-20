import * as userService from '../services/userService.js';

export const getAllUser = async (req, res) => {
  const user = await userService.getUser();
  res.json(user);
};
