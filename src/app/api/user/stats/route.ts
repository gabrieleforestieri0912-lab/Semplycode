import { NextRequest } from 'next/server';
import { GET as usageGet } from '@/app/api/usage/stats/route';

export async function GET(req: NextRequest) {
  return usageGet(req);
}
