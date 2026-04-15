import { Router } from 'express';
import roomsController from './_.controller.js';
import { verifySession } from '@middlewares/auth.middleware.js';

const router = Router();

router.get('/', verifySession, roomsController.findAll);
router.get('/:id/projection-types', verifySession, roomsController.findProjectionTypes);
router.post('/:id/projection-types', verifySession, roomsController.createProjectionType);
router.delete('/:id/projection-types/:projectionTypeId', verifySession, roomsController.deleteProjectionType);
router.get('/:id', verifySession, roomsController.findById);
router.post('/', verifySession, roomsController.create);
router.put('/:id', verifySession, roomsController.update);
router.delete('/:id', verifySession, roomsController.delete);

export default router;
