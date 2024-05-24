const express = require('express');
const router = express.Router();
const ReservationController = require('../controllers/ReservationController');
const { verifyAccessToken } = require('../Helpers/JwtHelper');

router.post('/create', verifyAccessToken, ReservationController.createReservation);
//router.get('/user', verifyAccessToken, ReservationController.getUserReservations);
router.get('/vendor', verifyAccessToken, ReservationController.getVendorReservations);
//router.delete('/cancel/:reservationId', verifyAccessToken, ReservationController.cancelReservation);
router.get('/user', verifyAccessToken, ReservationController.updateExpiredReservations, ReservationController.getUserReservations);
router.put('/cancel/customer/:reservationId/:itemId', verifyAccessToken, ReservationController.cancelReservationCustomer);
router.put('/cancel/vendor/:reservationId/:itemId', verifyAccessToken, ReservationController.cancelReservationVendor);
router.put('/complete/vendor/:reservationId/:itemId', verifyAccessToken, ReservationController.completeReservationVendor);

module.exports = router;
