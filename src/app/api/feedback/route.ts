import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { FEEDBACK_TYPES } from '@/lib/feedback';

const resend = new Resend(process.env.RESEND_API_KEY);
const MAX_MESSAGE_LENGTH = 2000;
const HTML_TAG_RE = /<[^>]*>/g;

export async function POST(req: Request) {
  const { type, message } = await req.json();

  if (!FEEDBACK_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: 'Message too long' }, { status: 400 });
  }

  const stripped = message.replace(HTML_TAG_RE, '');
  const suspicious = stripped !== message;
  const subjectPrefix = suspicious ? '[ALERT] [Swipe Feedback]' : '[Swipe Feedback]';

  const { error } = await resend.emails.send({
    from: 'Swipe Feedback <onboarding@resend.dev>',
    to: 'sebastianswiecz458@gmail.com',
    subject: `${subjectPrefix} ${type}`,
    text: `Type: ${type}${suspicious ? '\n⚠️ HTML/script tags were detected and stripped from this message.' : ''}\n\n${stripped}`,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
