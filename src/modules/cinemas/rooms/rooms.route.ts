import { Router } from 'express';
import cinemaRoomsController from './rooms.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router({ mergeParams: true });

// GET /cinemas/:cinemaId/rooms — contexto explícito (gerencia general)
router.get('/', verifySession, verifyPermission('CRUD:READ:CINEMAS-ROOMS'), cinemaRoomsController.findAll);

// POST /cinemas/:cinemaId/rooms
router.post('/', verifySession, verifyPermission('CRUD:CREATE:ROOMS'), cinemaRoomsController.create);

export default router;
