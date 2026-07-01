import { ControllerBase } from '@bases/controller.base.js';
import AssistantService from './_.service.js';

class AssistantController extends ControllerBase {
	async chat() {
		const body = this.getBody();
		const session = this.getSession<any>();
		const response = await AssistantService.processChatMessage(body, session);
		return this.success(response, 'Respuesta del asistente generada correctamente');
	}
}

export default new AssistantController();
