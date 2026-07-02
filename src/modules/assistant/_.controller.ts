import { ControllerBase } from '@bases/controller.base.js';
import AssistantService from './_.service.js';

class AssistantController extends ControllerBase {
	async chat() {
		const body = this.getBody();
		const session = this.getSession<any>();
		const requestContext = {
			path: this.getRequest().path,
			method: this.getRequest().method,
			headers: this.getHeaders(),
			query: this.getQuery(),
			body,
		};
		const response = await AssistantService.processChatMessage(body, session, requestContext);
		return this.success(response, 'Respuesta del asistente generada correctamente');
	}

	async audio() {
		const body = this.getBody();
		const session = this.getSession<any>();
		const request = this.getRequest();
		const audioFile = request.file as Express.Multer.File | undefined;
		const requestContext = {
			path: request.path,
			method: request.method,
			headers: this.getHeaders(),
			query: this.getQuery(),
			body,
			attachment: audioFile
				? {
						fieldname: audioFile.fieldname,
						originalname: audioFile.originalname,
						size: audioFile.size,
						mimetype: audioFile.mimetype,
					}
				: null,
		};
		const response = await AssistantService.processAudioMessage(
			body,
			session,
			requestContext,
			audioFile?.buffer,
			audioFile?.mimetype,
		);
		return this.success(response, 'Respuesta del asistente por audio generada correctamente');
	}
}

export default new AssistantController();
