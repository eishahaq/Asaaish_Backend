const express = require('express');
const router = express.Router();
const ReservationController = require('../controllers/ReservationController');
const { verifyAccessToken } = require('../Helpers/JwtHelper');

router.post('/create', verifyAccessToken, ReservationController.createReservation);

router.get('/vendor', verifyAccessToken, ReservationController.getVendorReservations);

router.get('/user', verifyAccessToken, ReservationController.updateExpiredReservations, ReservationController.getUserReservations);

router.put('/cancel/customer/:reservationId/:itemId', verifyAccessToken, ReservationController.cancelReservationCustomer);

router.get('/all', verifyAccessToken, ReservationController.getAllReservations);

router.delete('/:reservationId', verifyAccessToken, ReservationController.deleteReservation);

router.put('/:reservationId/:itemId', verifyAccessToken, ReservationController.editReservation);

module.exports = router;
