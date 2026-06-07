import { Request, Response } from 'express';
import { ControllerBase } from '@bases/controller.base.js';
import { OrdersService } from './_.service.js';
import { BadRequestError } from '@errors/index.js';

export class OrdersController extends ControllerBase {
	constructor() {
		super();
		this._ordersService = new OrdersService();
	}

	async createQuote() {
		return await this._ordersService.createQuote(this.getBody(), this.getSession());
	}

	async getShoppingSessionState() {
		return await this._ordersService.getShoppingSessionState(this.getSession());
	}

	async getShoppingSessionDetails() {
		return await this._ordersService.getShoppingSessionDetails(this.getSession());
	}

	async cancelShoppingSession() {
		return await this._ordersService.cancelShoppingSession(this.getSession());
	}

	async checkout() {
		const body = this.getBody();
		if (body.tickets && Array.isArray(body.tickets)) {
			for (const ticket of body.tickets) {
				if (typeof ticket.seatId !== 'number' || typeof ticket.audienceCategoryId !== 'number') {
					throw new BadRequestError('Cada boleto debe contener seatId y audienceCategoryId y deben ser numéricos');
				}
			}
		}
		return await this._ordersService.processCheckout(body, this.getSession());
	}

	async processPayment() {
		return await this._ordersService.registerPayment(this.getBody(), this.getSession());
	}

	async processBilling() {
		return await this._ordersService.processBilling(this.getBody(), this.getSession());
	}

	async getOrderById() {
		const idStr = this.requireParam('id');
		const id = Number(idStr);
		if (isNaN(id)) throw new BadRequestError('El ID de la orden debe ser un número válido');
		return await this._ordersService.getOrderById(id);
	}

	async getConcessionsByQr() {
		return await this._ordersService.getConcessionsByQr(this.requireParam('qrCode'));
	}

	async getTicketsByQr() {
		return await this._ordersService.getTicketsByQr(this.requireParam('qrCode'));
	}

	async validateQr() {
		return await this._ordersService.validateQr(this.requireParam('qrCode'), this.getBody(), this.getSession());
	}
}
