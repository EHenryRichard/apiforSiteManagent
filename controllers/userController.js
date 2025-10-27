import * as userService from '../services/userService.js';
import getClientInfo from '../utils/deviceInfo.js';

export const saveUser = async (req, res) => {
  try {
    const data = req.body;
    const clientInfo = await getClientInfo(req);
    data.ipAddress = clientInfo.ipAddress;
    data.userAgent = clientInfo.userAgent;
    data.userBrowser = clientInfo.browser;
    data.userOs = clientInfo.os;
    data.userDevice = clientInfo.device;
    data.userCountry = clientInfo.country;

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
