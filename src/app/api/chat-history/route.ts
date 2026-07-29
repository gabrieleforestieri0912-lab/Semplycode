import { NextRequest, NextResponse } from 'next/server';

const TARGET = '/api/chat/history';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  url.pathname = TARGET;
  return NextResponse.redirect(url);
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  url.pathname = TARGET;
  return NextResponse.redirect(url);
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  url.pathname = TARGET;
  return NextResponse.redirect(url);
}
