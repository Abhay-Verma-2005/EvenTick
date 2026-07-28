import express from "express";
import { verifyJWT } from "../middlewares/verifyJWT.js";
import { bookTicket, cancelTicket, getMyTickets } from "../controllers/booking.controller.js";

const bookingRouter = express.Router();

bookingRouter.use(verifyJWT);

bookingRouter.get("/my-tickets", getMyTickets);
bookingRouter.post("/:eventId", bookTicket);
bookingRouter.post("/:bookingId/cancel", cancelTicket);

export default bookingRouter;
