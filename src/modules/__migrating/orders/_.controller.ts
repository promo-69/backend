import { ControllerBase } from '@bases/controller.base.js';
import OrdersService from './_.service.js';

export class OrdersController extends ControllerBase {
	constructor() {
		super();
	}

	async createQuote() {
		return await OrdersService.createQuote(this.getBody(), this.getSession());
	}

	async getShoppingSessionState() {
		return await OrdersService.getShoppingSessionState(this.getSession());
	}

	async getShoppingSessionDetails() {
		return await OrdersService.getShoppingSessionDetails(this.getSession());
	}

	async cancelShoppingSession() {
		return await OrdersService.cancelShoppingSession(this.getSession());
	}

	async checkout() {
		return await OrdersService.processCheckout(this.getBody(), this.getSession());
	}

	async processPayment() {
		return await OrdersService.registerPayment(this.getBody(), this.getSession());
	}

	async processBilling() {
		return await OrdersService.processBilling(this.getBody(), this.getSession());
	}

	async getOrderById() {
		return await OrdersService.getOrderById(this.requireParam('id'), this.getSession());
	}

	async getConcessionsByQr() {
		return await OrdersService.getConcessionsByQr(this.requireParam('qrCode'));
	}

	async getTicketsByQr() {
		return await OrdersService.getTicketsByQr(this.requireParam('qrCode'));
	}

	async validateQr() {
		return await OrdersService.validateQr(this.requireParam('qrCode'), this.getBody(), this.getSession());
	}
}
