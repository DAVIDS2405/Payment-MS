import { Inject, Injectable } from '@nestjs/common';
import { envs, NATS_SERVICE } from 'src/config';
import { PaymentSessionDto } from 'src/dto/payment-session.dto';
import Stripe from 'stripe';
import { Request, Response } from 'express';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(envs.stipeSecret);

  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}
  async createPaymentSession(paymentSessionDto: PaymentSessionDto) {
    const { currency, items, orderId } = paymentSessionDto;
    const lineItems = items.map((item) => {
      return {
        price_data: {
          currency: currency,
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      };
    });
    const session = await this.stripe.checkout.sessions.create({
      payment_intent_data: {
        metadata: { orderId: orderId },
      },
      line_items: lineItems,
      mode: 'payment',
      success_url: 'http://localhost:3003/payments/success',
      cancel_url: 'http://localhost:3003/payments/cancel',
    });
    return {
      cancelUrl: session.cancel_url,
      successUrl: session.success_url,
      url: session.url,
    };
  }

  async stripeWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'];
    let event: Stripe.Event;
    const sign_secret = envs.signSecret;
    try {
      event = this.stripe.webhooks.constructEvent(
        req['rawBody'],
        sig,
        sign_secret,
      );
    } catch (error) {
      res.status(400).send(`webhook Error: ${error.message}`);
      return;
    }
    switch (event.type) {
      case 'charge.succeeded':
        const chargeSucceeded = event.data.object;
        const payload = {
          stripePaymentId: chargeSucceeded.id,
          orderId: chargeSucceeded.metadata.orderId,
          recipeUrl: chargeSucceeded.receipt_url,
        };
        this.client.emit('payment.succeeded', payload);
        break;

      default:
        console.log('Evento no controlado');
    }
    return res.status(200).json({ sig });
  }
}
