import { revalidatePath } from 'next/cache';

export async function POST() {
  revalidatePath('/browse');
  return new Response('ok');
}
