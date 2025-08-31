import { getReminders, deleteReminder } from './projectService';
import { Timestamp } from 'firebase/firestore';
import { isToday, startOfDay } from 'date-fns';
import { getUsers } from './userService';

const FONNTE_API_URL = 'https://api.fonnte.com/send';

// Fungsi untuk mengirim pesan menggunakan Fonnte
async function sendFonnteMessage(target: string, message: string) {
  const token = process.env.FONNTE_API_TOKEN;

  if (!token) {
    console.error("Fonnte API token is not configured in .env file.");
    return;
  }
  
  // Pastikan nomor diawali dengan '62' dan bukan '0'
  const formattedTarget = target.startsWith('0') ? '62' + target.substring(1) : target;

  try {
    const response = await fetch(FONNTE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: formattedTarget,
        message: message,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      console.error(`Failed to send message to ${target}:`, data);
    } else {
      console.log(`Successfully sent message to ${target}.`);
    }
  } catch (error) {
    console.error(`Error sending Fonnte message to ${target}:`, error);
  }
}

// Fungsi utama yang akan dipanggil oleh cron job
export async function sendScheduledReminders() {
  console.log("Running scheduled reminder check...");

  const reminders = await getReminders();
  const allUsers = await getUsers();
  const today = startOfDay(new Date());

  const remindersForToday = reminders.filter(r => isToday((r.reminderDate as Timestamp).toDate()));

  if (remindersForToday.length === 0) {
    console.log("No reminders scheduled for today.");
    return;
  }

  for (const reminder of remindersForToday) {
    const targetUsers = allUsers.filter(u => u.role === reminder.targetRole && u.phone);

    if (targetUsers.length > 0) {
      console.log(`Sending reminder "${reminder.message}" to role ${reminder.targetRole}`);
      for (const user of targetUsers) {
        await sendFonnteMessage(user.phone!, reminder.message);
      }
    } else {
      console.warn(`No users with phone numbers found for role: ${reminder.targetRole}`);
    }

    // After sending, delete the reminder so it doesn't get sent again
    await deleteReminder(reminder.id);
    console.log(`Reminder ${reminder.id} sent and deleted.`);
  }

  console.log("Scheduled reminder check finished.");
}
