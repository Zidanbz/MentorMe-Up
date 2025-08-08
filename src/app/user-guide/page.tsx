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
                    </ul>
                    <h4 className="font-semibold pt-2">Izin Peran:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>CEO:</strong> Dapat mengelola (unggah/hapus) semua kategori.</li>
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
              <AccordionItem value="item-4">
                <AccordionTrigger>Manajemen Akun</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pl-2">
                    <p>Anda dapat mengelola akun Anda langsung dari aplikasi.</p>
                     <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Ubah Kata Sandi:</strong> Klik ikon profil Anda di pojok kanan atas, lalu pilih "Change Password" untuk memperbarui kata sandi Anda.</li>
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
