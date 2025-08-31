
import { getReminders, deleteReminder, getProjects } from './projectService';
import { Timestamp } from 'firebase/firestore';
import { isToday, startOfDay, isTomorrow } from 'date-fns';
import { getUsers } from './userService';
import type { Task } from '@/types';

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

// Fungsi untuk mengirim pengingat manual yang dibuat oleh CEO/COO
async function sendManualReminders() {
  console.log("Running manual reminder check...");

  const reminders = await getReminders();
  const allUsers = await getUsers();
  
  const remindersForToday = reminders.filter(r => isToday((r.reminderDate as Timestamp).toDate()));

  if (remindersForToday.length === 0) {
    console.log("No manual reminders scheduled for today.");
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
    console.log(`Manual reminder ${reminder.id} sent and deleted.`);
  }

  console.log("Manual reminder check finished.");
}

// Fungsi baru untuk mengirim pengingat tugas otomatis
async function sendTaskReminders() {
    console.log("Running automatic task reminder check...");

    const projects = await getProjects();
    const allUsers = await getUsers();
    const managers = allUsers.filter(u => (u.role === 'CEO' || u.role === 'COO') && u.phone);

    if (managers.length === 0) {
        console.warn("No CEO or COO with a phone number found. Cannot send task reminders.");
        return;
    }

    const tasksDueTomorrow: Task[] = [];
    
    projects.forEach(project => {
        project.milestones.forEach(milestone => {
            milestone.tasks.forEach(task => {
                // Periksa apakah tugas belum selesai dan memiliki tanggal jatuh tempo
                if (!task.completed && task.dueDate) {
                    const dueDate = (task.dueDate as Timestamp).toDate();
                    // Kirim pengingat jika jatuh temponya adalah besok
                    if (isTomorrow(dueDate)) {
                        tasksDueTomorrow.push(task);
                    }
                }
            });
        });
    });

    if (tasksDueTomorrow.length === 0) {
        console.log("No pending tasks are due tomorrow.");
        return;
    }

    for (const task of tasksDueTomorrow) {
        const message = `PENGINGAT TUGAS: Tugas "${task.name}" akan jatuh tempo besok. Mohon segera ditindaklanjuti.`;
        console.log(`Preparing to send reminder for task: ${task.name}`);
        for (const manager of managers) {
            await sendFonnteMessage(manager.phone!, message);
        }
    }

    console.log("Automatic task reminder check finished.");
}


// Fungsi utama yang akan dipanggil oleh cron job
export async function runAllReminders() {
    await sendManualReminders();
    await sendTaskReminders();
}
