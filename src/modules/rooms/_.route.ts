import { Router } from 'express';
import roomsController from './_.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router({ mergeParams: true });

// GET /rooms — todas las salas del sistema (o de la sucursal implícita si el usuario tiene cinemaId)
router.get('/', verifySession, verifyPermission('CRUD:READ:ROOMS'), roomsController.findAll);

// Detalle y actualización de sala
router.get('/:id', verifySession, verifyPermission('CRUD:READ:ROOMS'), roomsController.findById);
router.patch('/:id', verifySession, verifyPermission('CRUD:UPDATE:ROOMS'), roomsController.update);
router.delete('/:id', verifySession, verifyPermission('CRUD:DELETE:ROOMS'), roomsController.remove);

// Tipos de proyección
router.get(
    '/:id/projection-types',
    verifySession,
    verifyPermission('CRUD:READ:ROOMS'),
    roomsController.findProjectionTypes,
);
router.post(
    '/:id/projection-types',
    verifySession,
    verifyPermission('CRUD:UPDATE:ROOMS'),
    roomsController.createProjectionType,
);
router.delete(
    '/:id/projection-types/:projectionTypeId',
    verifySession,
    verifyPermission('CRUD:UPDATE:ROOMS'),
    roomsController.deleteProjectionType,
);

// Asientos
router.get('/:id/seats', verifySession, verifyPermission('CRUD:READ:SEATS'), roomsController.getSeatMap);
router.post('/:id/seats', verifySession, verifyPermission('CRUD:CREATE:SEATS'), roomsController.createSeat);

export default router;
