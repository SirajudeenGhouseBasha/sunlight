/**
 * Transactional email service (Resend)
 *
 * Sends order status notification emails to the customer email captured on
 * the order. Safe to call anywhere server-side: it never throws and is a
 * silent no-op when RESEND_API_KEY is missing (so dev/staging keep working
 * before the key is configured).
 */

import { Resend } from 'resend';

export type OrderEmailKind =
  | 'ORDER_PLACED'
  | 'PAYMENT_VERIFIED'
  | 'SHIPPED'
  | 'DELIVERED';

export interface OrderEmailPayload {
  /** Customer email from the order; empty string skips sending */
  to: string;
  orderNumber: string;
  customerName?: string | null;
  totalAmount?: number | string;
  trackingNumber?: string | null;
}

interface EmailMeta {
  subject: string;
  title: string;
  message: string;
  extra?: string;
}

const EMAIL_META: Record<OrderEmailKind, EmailMeta> = {
  ORDER_PLACED: {
    subject: 'Order placed — payment pending',
    title: 'Your order is placed',
    message:
      'We have received your order and it is now awaiting payment verification. Once your payment is confirmed, we will start preparing your case.',
  },
  PAYMENT_VERIFIED: {
    subject: 'Payment verified — order confirmed',
    title: 'Payment verified',
    message:
      'Your payment has been verified and your order is confirmed. We are now preparing your case for shipping.',
  },
  SHIPPED: {
    subject: 'Your order has been shipped',
    title: 'Your order is on the way',
    message:
      'Your order has been dispatched. You can track your shipment with the tracking number below.',
  },
  DELIVERED: {
    subject: 'Your order has been delivered',
    title: 'Order delivered',
    message: 'Your order has been delivered. We hope you love your new case!',
  },
};

function formatAmount(amount: number | string | undefined): string {
  if (amount === undefined) return '';
  return `₹${Number(amount).toFixed(2)}`;
}

function buildHtml(meta: EmailMeta, payload: OrderEmailPayload): string {
  const greeting = payload.customerName
    ? `Hi ${payload.customerName},`
    : 'Hi there,';
  const amount = formatAmount(payload.totalAmount);

  const rows = [
    `Order Number: <strong>${payload.orderNumber}</strong>`,
    amount ? `Total: <strong>${amount}</strong>` : '',
    payload.trackingNumber
      ? `Tracking Number: <strong>${payload.trackingNumber}</strong>`
      : '',
  ]
    .filter(Boolean)
    .join('<br/>');

  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f5f5f4;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:520px;margin:0 auto;padding:24px 16px;">
      <div style="background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e7e5e4;">
        <div style="background-color:#f97316;padding:24px;text-align:center;">
          <div style="color:#ffffff;font-size:20px;font-weight:bold;">Sunlight</div>
          <div style="color:#ffedd5;font-size:13px;margin-top:2px;">Handcrafted phone cases</div>
        </div>
        <div style="padding:24px;">
          <h1 style="margin:0 0 8px;font-size:18px;color:#1c1917;">${meta.title}</h1>
          <p style="margin:0 0 16px;font-size:14px;color:#44403c;line-height:1.6;">${greeting}</p>
          <p style="margin:0 0 16px;font-size:14px;color:#44403c;line-height:1.6;">${meta.message}</p>
          ${meta.extra ? `<p style="margin:0 0 16px;font-size:14px;color:#44403c;line-height:1.6;">${meta.extra}</p>` : ''}
          <div style="background-color:#fafaf9;border:1px solid #e7e5e4;border-radius:8px;padding:16px;font-size:14px;color:#292524;line-height:1.9;">${rows}</div>
          <p style="margin:20px 0 0;font-size:12px;color:#a8a29e;line-height:1.6;">
            This email was sent automatically because the status of order ${payload.orderNumber} changed.
            If you have any questions, reply to this email or contact us through the website.
          </p>
        </div>
      </div>
    </div>
  </body>
</html>`;
}

/**
 * Send a status-change notification email to the customer.
 * Never throws; logs failures. Skips silently when there is no
 * customer email or no RESEND_API_KEY configured.
 */
export async function sendOrderStatusEmail(
  kind: OrderEmailKind,
  payload: OrderEmailPayload
): Promise<void> {
  if (!payload.to) return;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      `[email] RESEND_API_KEY not set — skipping ${kind} email for order ${payload.orderNumber}`
    );
    return;
  }

  try {
    const meta = EMAIL_META[kind];
    if (kind === 'SHIPPED' && payload.trackingNumber) {
      meta.extra =
        `Track your shipment on the courier's website using the tracking number ` +
        `${payload.trackingNumber}.`;
    }

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Sunlight <onboarding@resend.dev>',
      to: payload.to,
      subject: meta.subject,
      html: buildHtml(meta, payload),
    });

    if (error) {
      console.error(
        `[email] Failed to send ${kind} email for order ${payload.orderNumber}: ${error.message}`
      );
    }
  } catch (e) {
    console.error(
      `[email] Error sending ${kind} email for order ${payload.orderNumber}:`,
      e
    );
  }
}

/**
 * Admin notification for a newly placed order.
 *
 * Sent to every admin user's email right after an order is created so the
 * store owner can verify the payment. Never throws; silently skips when
 * there are no admin emails or no RESEND_API_KEY configured.
 */
export interface AdminOrderItemSummary {
  name: string;
  variant?: string;
  quantity: number;
  unit_price: number;
}

export interface AdminOrderNotificationPayload {
  orderNumber: string;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  totalAmount?: number | string;
  paymentMethod?: string | null;
  upiTransactionId?: string | null;
  paymentScreenshotUrl?: string | null;
  items?: AdminOrderItemSummary[];
  shippingAddress?: Record<string, string> | null;
}

function esc(text: string | null | undefined): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildAdminHtml(payload: AdminOrderNotificationPayload): string {
  const amount = formatAmount(payload.totalAmount);

  const rows = [
    `<tr><td style="padding:4px 0;color:#78716c;">Order Number</td><td style="padding:4px 0;font-weight:bold;">${esc(payload.orderNumber)}</td></tr>`,
    payload.customerName
      ? `<tr><td style="padding:4px 0;color:#78716c;">Customer</td><td style="padding:4px 0;">${esc(payload.customerName)}${payload.customerPhone ? `<br/><span style="color:#a8a29e;">${esc(payload.customerPhone)}</span>` : ''}</td></tr>`
      : '',
    payload.customerEmail
      ? `<tr><td style="padding:4px 0;color:#78716c;">Email</td><td style="padding:4px 0;">${esc(payload.customerEmail)}</td></tr>`
      : '',
    amount
      ? `<tr><td style="padding:4px 0;color:#78716c;">Total</td><td style="padding:4px 0;font-weight:bold;font-size:15px;">${amount}</td></tr>`
      : '',
    payload.paymentMethod
      ? `<tr><td style="padding:4px 0;color:#78716c;">Payment</td><td style="padding:4px 0;">${esc(payload.paymentMethod).toUpperCase()}${payload.upiTransactionId ? `<br/><span style="font-family:monospace;font-size:12px;">TXN: ${esc(payload.upiTransactionId)}</span>` : ''}</td></tr>`
      : '',
    payload.paymentScreenshotUrl
      ? `<tr><td style="padding:4px 0;color:#78716c;">Screenshot</td><td style="padding:4px 0;"><a href="${esc(payload.paymentScreenshotUrl)}" style="color:#f97316;">View payment screenshot</a></td></tr>`
      : '',
  ].filter(Boolean).join('');

  const itemsHtml = (payload.items ?? []).map((it) => {
    const line = `${esc(it.name)}${it.variant && it.variant !== 'Standard' ? ` (${esc(it.variant)})` : ''} × ${it.quantity}`;
    return `<tr>
      <td style="padding:5px 0;color:#292524;">${line}</td>
      <td style="padding:5px 0;text-align:right;color:#57534e;white-space:nowrap;">${formatAmount(Number(it.unit_price) * it.quantity)}</td>
    </tr>`;
  }).join('');

  const address = payload.shippingAddress
    ? [
        esc(payload.shippingAddress.street),
        esc(payload.shippingAddress.city),
        [esc(payload.shippingAddress.state), esc(payload.shippingAddress.postal_code)].filter(Boolean).join(' '),
        esc(payload.shippingAddress.country),
      ].filter(Boolean).join(', ')
    : '';

  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f5f5f4;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:520px;margin:0 auto;padding:24px 16px;">
      <div style="background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e7e5e4;">
        <div style="background-color:#f97316;padding:24px;text-align:center;">
          <div style="color:#ffffff;font-size:20px;font-weight:bold;">Sunlight</div>
          <div style="color:#ffedd5;font-size:13px;margin-top:2px;">New order notification</div>
        </div>
        <div style="padding:24px;">
          <h1 style="margin:0 0 8px;font-size:18px;color:#1c1917;">New order — payment pending verification</h1>
          <p style="margin:0 0 16px;font-size:14px;color:#44403c;line-height:1.6;">
            A new order has been placed. Review the details below and verify the UPI payment in the admin panel.
          </p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">${rows}</table>
          ${itemsHtml ? `<div style="margin-top:16px;background-color:#fafaf9;border:1px solid #e7e5e4;border-radius:8px;padding:12px 16px;"><table style="width:100%;border-collapse:collapse;font-size:13px;">${itemsHtml}</table></div>` : ''}
          ${address ? `<p style="margin:14px 0 0;font-size:13px;color:#78716c;">Ship to: ${address}</p>` : ''}
          <p style="margin:20px 0 0;font-size:12px;color:#a8a29e;line-height:1.6;">
            This email was sent automatically because a new order was placed on the Sunlight store.
          </p>
        </div>
      </div>
    </div>
  </body>
</html>`;
}

export async function sendAdminOrderNotification(
  adminEmails: string[],
  payload: AdminOrderNotificationPayload
): Promise<void> {
  const recipients = [...new Set((adminEmails ?? []).filter(Boolean))];
  if (recipients.length === 0) return;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      `[email] RESEND_API_KEY not set — skipping admin notification for order ${payload.orderNumber}`
    );
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Sunlight <onboarding@resend.dev>',
      to: recipients,
      subject: `New order ${payload.orderNumber} — payment pending verification`,
      html: buildAdminHtml(payload),
    });

    if (error) {
      console.error(
        `[email] Failed to send admin notification for order ${payload.orderNumber}: ${error.message}`
      );
    }
  } catch (e) {
    console.error(
      `[email] Error sending admin notification for order ${payload.orderNumber}:`,
      e
    );
  }
}
