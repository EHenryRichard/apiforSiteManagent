import * as backupService from '../services/backupService.js';
export const getBackup = async (req, res) => {
  const { siteId } = req.params;
  if (!siteId) {
    return res.status(404).json({
      sucess: false,
      error: 'site name is required',
    });
  }
};
