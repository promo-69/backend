import { Router } from 'express';
import showtimesController from './_.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router();

router.get('/', verifySession, verifyPermission('CRUD:READ:SHOWTIMES'), showtimesController.findAll);
router.get('/:id', verifySession, verifyPermission('CRUD:READ:SHOWTIMES'), showtimesController.findById);
router.post('/', verifySession, verifyPermission('CRUD:CREATE:SHOWTIMES'), showtimesController.create);
router.patch('/:id', verifySession, verifyPermission('CRUD:UPDATE:SHOWTIMES'), showtimesController.update);
router.delete('/:id', verifySession, verifyPermission('CRUD:DELETE:SHOWTIMES'), showtimesController.remove);

export default router;
