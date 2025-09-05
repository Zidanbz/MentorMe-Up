'use client';

import { AppLayout } from '@/components/shared/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function UserGuidePage() {
  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold">Panduan Pengguna</h1>
        <p className="text-muted-foreground">
          Selamat datang di mentorme Up! Panduan ini akan membantu Anda memahami fitur-fitur utama aplikasi.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Fitur Utama</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Dashboard</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pl-2">
                    <p>Halaman Dasbor memberikan gambaran umum tentang kondisi perusahaan Anda secara real-time.</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Kartu Metrik Utama:</strong> Menampilkan ringkasan data penting seperti Saldo Kas Saat Ini, Jumlah Dokumen, dan lainnya.</li>
                      <li><strong>Grafik Tinjauan Bulanan:</strong> Visualisasi pendapatan dan pengeluaran selama 6 bulan terakhir untuk analisis tren.</li>
                      <li><strong>Aktivitas Terbaru:</strong> Log dari transaksi dan unggahan dokumen terbaru yang dilakukan oleh tim.</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Manajemen Dokumen</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pl-2">
                    <p>Modul Dokumen adalah pusat penyimpanan file penting perusahaan dengan kontrol akses berbasis peran.</p>
                    <h4 className="font-semibold pt-2">Cara Menggunakan:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Melihat & Mengunduh:</strong> Semua pengguna dapat melihat dan mengunduh dokumen dari kategori apa pun.</li>
                      <li><strong>Mengunggah & Menghapus:</strong> Hanya pengguna dengan peran tertentu yang dapat mengunggah atau menghapus dokumen dalam kategori yang diizinkan.</li>
                      <li><strong>Pencarian:</strong> Gunakan kolom pencarian di bagian atas untuk memfilter dokumen berdasarkan nama.</li>
                      <li><strong>Penghapusan Massal:</strong> Centang kotak di samping dokumen untuk memilih beberapa file. Tombol "Delete" akan muncul untuk menghapus semua item yang dipilih sekaligus.</li>
                    </ul>
                    <h4 className="font-semibold pt-2">Izin Peran (Upload/Delete):</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>CEO:</strong> Dapat mengelola semua kategori.</li>
                      <li><strong>CFO:</strong> Mengelola kategori 'Finance' dan 'Investor & Fundraising'.</li>
                      <li><strong>COO:</strong> Mengelola kategori 'Operations' dan 'Legal'.</li>
                      <li><strong>CTO:</strong> Mengelola kategori 'Product & Development'.</li>
                      <li><strong>CMO:</strong> Mengelola kategori 'Marketing & Sales'.</li>
                      <li><strong>CHRO:</strong> Mengelola kategori 'HR'.</li>
                      <li><strong>CDO:</strong> Mengelola kategori 'Research & Insights'.</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Arus Kas (Cash Flow)</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pl-2">
                    <p>Fitur Arus Kas memungkinkan pencatatan pemasukan dan pengeluaran. Untuk menjaga integritas data, hanya satu peran yang memiliki akses penuh.</p>
                     <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Akses Penuh (CFO):</strong> Hanya pengguna dengan peran CFO (`cfo@mentorme.com`) yang dapat menambah, mengedit, dan menghapus transaksi.</li>
                      <li><strong>Akses Lihat (Lainnya):</strong> Semua pengguna lain hanya dapat melihat data transaksi yang ada.</li>
                      <li><strong>Input Suara:</strong> Saat menambahkan transaksi, CFO dapat menggunakan tombol "Record Voice" untuk mengisi deskripsi transaksi secara otomatis menggunakan suara dalam Bahasa Indonesia.</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5">
                <AccordionTrigger>Manajemen Proyek & Tugas</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pl-2">
                    <p>Fitur ini membantu Anda mengorganisir alur kerja dengan membuat proyek, milestone, dan tugas-tugas yang terkait.</p>
                    <h4 className="font-semibold pt-2">Cara Menggunakan:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Buat Proyek:</strong> Klik tombol "Add Project" untuk membuat sebuah proyek baru.</li>
                      <li><strong>Tambah Milestone:</strong> Di dalam setiap proyek, klik "Add Milestone" untuk membuat tahapan-tahapan penting.</li>
                      <li><strong>Tambah Tugas:</strong> Di dalam setiap milestone, klik "Add Task" untuk menambahkan tugas-tugas spesifik. Anda bisa memberikan deskripsi dan tanggal jatuh tempo untuk setiap tugas.</li>
                      <li><strong>Selesaikan Tugas:</strong> Centang kotak di samping nama tugas untuk menandainya sebagai selesai. Progres bar milestone akan diperbarui secara otomatis.</li>
                       <li><strong>Kelola Item:</strong> Gunakan menu tiga titik di samping setiap proyek, milestone, atau tugas untuk menghapusnya.</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
               <AccordionItem value="item-8">
                <AccordionTrigger>Pengingat (Reminders)</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pl-2">
                    <p>Fitur ini adalah pusat komando untuk mengirimkan notifikasi penting melalui WhatsApp. Hanya dapat diakses oleh CEO dan COO.</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Dua Jenis Pengingat:</strong>
                            <ul className="list-['-_'] pl-5 space-y-1 mt-1">
                                <li><strong>Pengingat Manual:</strong> Klik tombol "Create Reminder" untuk membuat pengingat kustom. Anda bisa menulis pesan, memilih siapa target penerimanya (berdasarkan peran), dan menentukan tanggal pengiriman.</li>
                                <li><strong>Pengingat Tugas Otomatis:</strong> Sistem secara otomatis akan memeriksa setiap hari. Jika ada tugas yang belum selesai dan akan jatuh tempo besok, pengingat akan dikirimkan ke CEO dan COO.</li>
                            </ul>
                        </li>
                      <li><strong>Tinjauan Semua Tugas:</strong> Halaman ini juga menampilkan tabel berisi semua tugas dari seluruh proyek, memudahkan Anda untuk memantau progres dan tenggat waktu dalam satu tampilan.</li>
                      <li><strong>Cara Kerja:</strong> Semua pengingat akan dikirimkan ke nomor WhatsApp pengguna yang sesuai dengan peran target pada tanggal yang telah dijadwalkan (membutuhkan pengaturan cron job di server).</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-6">
                <AccordionTrigger>Pengaduan Anggota</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pl-2">
                    <p>Fitur ini memungkinkan anggota tim untuk menyampaikan keluhan atau masukan secara rahasia. Hanya CEO yang dapat melihat semua pengaduan.</p>
                    <h4 className="font-semibold pt-2">Cara Menggunakan:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Membuat Pengaduan:</strong> Klik tombol "Buat Pengaduan". Isi subjek, deskripsi, dan lampirkan file jika perlu.</li>
                      <li><strong>Melihat Pengaduan (Anggota):</strong> Anda hanya dapat melihat daftar pengaduan yang telah Anda kirimkan sendiri.</li>
                      <li><strong>Notifikasi untuk CEO:</strong> CEO akan melihat ikon bintang <span className="inline-block text-amber-500">★</span> di menu navigasi "Pengaduan" jika ada pengaduan baru yang belum dilihat.</li>
                      <li><strong>Melihat Pengaduan (CEO):</strong> CEO dapat melihat semua pengaduan yang dikirim oleh seluruh anggota tim untuk ditindaklanjuti.</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-7">
                <AccordionTrigger>Umpan Balik & Interaksi</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pl-2">
                    <p>Aplikasi ini dirancang untuk memberikan umpan balik yang jelas kepada pengguna.</p>
                     <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Notifikasi Pop-up:</strong> Setelah melakukan aksi seperti mengunggah dokumen atau mengirim pengaduan, sebuah notifikasi akan muncul di pojok layar untuk memberitahu Anda apakah aksi tersebut berhasil atau gagal.</li>
                      <li><strong>Tombol Nonaktif:</strong> Saat sebuah proses sedang berjalan (misalnya mengunggah file), tombol terkait akan dinonaktifkan dan menampilkan ikon memuat. Ini untuk mencegah klik ganda yang tidak disengaja.</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>Manajemen Akun</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pl-2">
                    <p>Anda dapat mengelola akun Anda langsung dari aplikasi.</p>
                     <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Profil:</strong> Klik menu di pojok kanan atas, lalu pilih "Profile" untuk melihat detail akun Anda.</li>
                      <li><strong>Ubah Kata Sandi:</strong> Anda dapat mengubah kata sandi dari halaman profil atau langsung dari menu pengguna.</li>
                      <li><strong>Keluar:</strong> Klik "Log out" dari menu yang sama untuk keluar dari akun Anda dengan aman.</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
