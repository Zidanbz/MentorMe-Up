
import { runAllReminders } from '@/services/notificationService';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log("Cron job started via API route...");
    await runAllReminders();
    console.log("Cron job finished successfully.");
    return NextResponse.json({ message: 'Cron job executed successfully.' });
  } catch (error) {
    console.error('Error running cron job:', error);
    return NextResponse.json({ message: 'Cron job failed.', error: (error as Error).message }, { status: 500 });
  }
}
