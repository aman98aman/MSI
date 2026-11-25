import { NextRequest, NextResponse } from 'next/server';
import {
  confirmPaidRegistrationIdempotent,
  verifyExamRazorpaySignatureStrict,
} from '@/lib/examPaymentHelper';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const razorpay_order_id = String(body.razorpay_order_id || '').trim();
    const razorpay_payment_id = String(body.razorpay_payment_id || '').trim();
    const razorpay_signature = String(body.razorpay_signature || '').trim();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, message: 'Missing Razorpay payment verification parameters.' },
        { status: 400 }
      );
    }

    const isValid = verifyExamRazorpaySignatureStrict(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return NextResponse.json(
        { success: false, verified: false, message: 'Payment signature verification failed.' },
        { status: 400 }
      );
    }

    const result = await confirmPaidRegistrationIdempotent({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      via: 'verify_endpoint',
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || 'Unable to confirm registration.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
      alreadyConfirmed: Boolean(result.alreadyConfirmed),
      uid: result.registration?.uid,
      registration: result.registration,
    });
  } catch (err: any) {
    console.error('[POST /api/exams/payments/verify Error]', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Payment verification error.' },
      { status: 500 }
    );
  }
}
