const express = require('express');
const router = express.Router();
const ReservationController = require('../controllers/ReservationController');
const { verifyAccessToken } = require('../Helpers/JwtHelper');

router.post('/create', verifyAccessToken, ReservationController.createReservation);

router.get('/vendor', verifyAccessToken, ReservationController.getVendorReservations);

router.get('/user', verifyAccessToken, ReservationController.updateExpiredReservations, ReservationController.getUserReservations);

router.put('/cancel/customer/:reservationId/:itemId', verifyAccessToken, ReservationController.cancelReservationCustomer);
router.put('/cancel/vendor/:reservationId/:itemId', verifyAccessToken, ReservationController.cancelReservationVendor);
router.put('/complete/vendor/:reservationId/:itemId', verifyAccessToken, ReservationController.completeReservationVendor);

router.get('/all', verifyAccessToken, ReservationController.getAllReservations);

router.delete('/reservations/:reservationId/items/:itemId', verifyAccessToken, ReservationController.deleteReservation);

router.put('/:reservationId/:itemId', verifyAccessToken, ReservationController.updateReservation);

module.exports = router;
