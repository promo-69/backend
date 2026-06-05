import { Request, Response } from 'express';
import { ControllerBase } from '@bases/controller.base.js';
import { OrdersService } from './_.service.js';
import { ShoppingSessionService } from '@services/shopping-session.service.js';

export class OrdersController extends ControllerBase {
	private _ordersService: OrdersService;
	private _shoppingSessionService: ShoppingSessionService;

	constructor() {
		super();
		this._ordersService = new OrdersService();
		this._shoppingSessionService = new ShoppingSessionService();
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
		return await this._shoppingSessionService.cancelShoppingSession(this.getSession());
	}

	async checkout() {
		return await this._ordersService.processCheckout(this.getBody(), this.getSession());
	}

	async processPayment() {
		return await this._ordersService.registerPayment(this.getBody(), this.getSession());
	}

	async getOrderById() {
		return await this._ordersService.getOrderById(Number(this.requireParam('id')));
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
