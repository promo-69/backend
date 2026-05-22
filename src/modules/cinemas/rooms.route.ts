import { Router } from 'express';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';
import { ControllerBase } from '@bases/controller.base.js';
import RoomsService from '../rooms/_.service.js';

class CinemaRoomsController extends ControllerBase {
    // GET /cinemas/:cinemaId/rooms
    async findAll() {
        const { cinemaId } = this.getParams();
        const data = await RoomsService.findAll(Number(cinemaId), this.getQueryFilters());
        return data;
    }

    // POST /cinemas/:cinemaId/rooms
    async create() {
        const { cinemaId } = this.getParams();
        const body = this.getBody();
        const session = this.getSession<any>();
        const data = await RoomsService.createRoom(Number(cinemaId), body, session?.userId);
        return this.created(data, 'Sala registrada exitosamente');
    }
}

const cinemaRoomsController = new CinemaRoomsController();

const router = Router({ mergeParams: true });

router.get('/', verifySession, verifyPermission('CRUD:READ:ROOMS'), cinemaRoomsController.findAll);
router.post('/', verifySession, verifyPermission('CRUD:CREATE:ROOMS'), cinemaRoomsController.create);

export default router;
