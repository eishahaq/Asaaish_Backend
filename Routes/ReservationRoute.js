const express = require('express');
const router = express.Router();
const ReservationController = require('../controllers/ReservationController');
const { verifyAccessToken } = require('../Helpers/JwtHelper');

router.post('/create', verifyAccessToken, ReservationController.createReservation);
router.get('/user', verifyAccessToken, ReservationController.getUserReservations);
router.get('/user/all', verifyAccessToken, ReservationController.getAllUserReservations);
router.get('/vendor', verifyAccessToken, ReservationController.getVendorReservations);
router.patch('/cancel/:id', verifyAccessToken, ReservationController.cancelReservationByUser);
router.delete('/delete/:id', verifyAccessToken, ReservationController.deleteReservation);

module.exports = router;
