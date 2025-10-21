import * as userService from '../services/userService.js';

export const saveUser = async (req, res) => {
  try {
    const data = req.body;
    const savedUser = await userService.createUser(data);

    res.status(201).json({
      success: true,
      message: 'registration Successful',
      data: savedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// export const getAllUser = async (req, res) => {
//   const user = await userService.getUser();
//   res.json(user);
// };
