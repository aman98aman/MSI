import { NextRequest, NextResponse } from 'next/server';
import {
  confirmPaidRegistrationIdempotent,
  verifyExamWebhookSignatureStrict,
} from '@/lib/examPaymentHelper';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!verifyExamWebhookSignatureStrict(rawBody, signature)) {
      return NextResponse.json(
        { success: false, message: 'Invalid Razorpay webhook signature.' },
        { status: 400 }
      );
    }

    const payload = JSON.parse(rawBody);
    const event = payload?.event;

    if (event === 'payment.captured' || event === 'order.paid') {
      const payment = payload?.payload?.payment?.entity;
      if (payment?.order_id && payment?.id) {
        await confirmPaidRegistrationIdempotent({
          razorpayOrderId: payment.order_id,
          razorpayPaymentId: payment.id,
          via: 'webhook',
        });
      }
    }

    return NextResponse.json({ success: true, received: true, event });
  } catch (err: any) {
    console.error('[POST /api/exams/payments/webhook Error]', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Webhook processing error.' },
      { status: 500 }
    );
  }
}
