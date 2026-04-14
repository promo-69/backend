import { Router } from 'express';
import cinemasRoute from './cinemas/_.route.js';
import moviesRoute from './movies/_.route.js';
import roomsRoute from './rooms/_.route.js';

const router = Router();

router.use('/cinemas', cinemasRoute);
router.use('/movies', moviesRoute);
router.use('/rooms', roomsRoute);

export default router;
