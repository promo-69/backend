import { Router } from 'express';
import catalogsController from './_.controller.js';

const router = Router();

router.get('/:catalogName/metadata', catalogsController.getMetadata);
router.get('/:catalogName', catalogsController.list);
router.get('/:catalogName/:id', catalogsController.getById);
router.post('/:catalogName', catalogsController.create);
router.patch('/:catalogName/:id', catalogsController.update);
router.delete('/:catalogName/:id', catalogsController.remove);
router.patch('/:catalogName/:id/restore', catalogsController.restore);

export default router;
