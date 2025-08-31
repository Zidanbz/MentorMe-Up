import { getProjects } from './projectService';
import { Timestamp } from 'firebase/firestore';
import { differenceInDays, startOfDay } from 'date-fns';
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

  const projects = await getProjects();
  const today = startOfDay(new Date());

  const allUsers = await getUsers();
  const targetUsers = allUsers.filter(u => u.role === 'CEO' || u.role === 'COO');
  const targetNumbers = targetUsers.map(u => u.phone).filter(Boolean) as string[];


  if (targetNumbers.length === 0) {
    console.warn("No phone numbers configured for CEO or COO. Skipping reminders.");
    return;
  }

  for (const project of projects) {
    for (const milestone of project.milestones) {
      if (milestone.reminderEnabled && milestone.dueDate) {
        const dueDate = (milestone.dueDate as Timestamp).toDate();
        const daysUntilDue = differenceInDays(dueDate, today);

        if (daysUntilDue >= 0 && daysUntilDue <= 7) {
          const daysText = daysUntilDue === 0 ? "hari ini" : `${daysUntilDue} hari lagi`;
          const message = `PENGINGAT: Milestone "${milestone.name}" dari proyek "${project.name}" akan jatuh tempo ${daysText}.`;

          // Kirim notifikasi ke semua nomor target
          for (const number of targetNumbers) {
            await sendFonnteMessage(number, message);
          }
        }
      }
    }
  }

  console.log("Scheduled reminder check finished.");
}
