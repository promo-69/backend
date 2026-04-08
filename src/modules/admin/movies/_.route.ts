import { Router } from 'express';
import moviesController from './_.controller.js';
import { verifySession } from '@middlewares/auth.middleware.js';

const router = Router();

router.get('/', verifySession, moviesController.findAll);
router.get('/cartelera', verifySession, moviesController.findInCartelera);
router.get('/:id', verifySession, moviesController.findById);
router.post('/', verifySession, moviesController.create);
router.put('/:id', verifySession, moviesController.update);
router.delete('/:id', verifySession, moviesController.delete);

export default router;
