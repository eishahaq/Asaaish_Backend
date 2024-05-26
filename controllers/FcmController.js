// FCMController.js
const FCMToken = require('../Models/Fcm');
const { verifyAccessToken } = require('../Helpers/JwtHelper');
const createError = require('http-errors');

const FCMController = {
  async storeToken(req, res, next) {
    try {
      const userId = req.payload.aud;
      const { token } = req.body;

      const existingToken = await FCMToken.findOne({ user: userId });
      if (existingToken) {
        existingToken.token = token;
        await existingToken.save();
      } else {
        await FCMToken.create({ user: userId, token });
      }

      res.status(200).json({ message: 'Token stored successfully' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = FCMController;
