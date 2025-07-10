# Aplikasi Penilaian dan Eliminasi ASN Kementerian Ketenagakerjaan

Aplikasi web untuk memfasilitasi proses penilaian dan eliminasi Aparatur Sipil Negara (ASN) di Kementerian Ketenagakerjaan dalam rangka **Anugerah ASN Teladan Tahun 2025**.

## 🌟 Fitur Utama

### 1. Manajemen Pengguna

- Login/registrasi dengan email dan password
- Profil pengguna dengan username dan nama lengkap
- Tidak ada pembatasan role - semua pengguna memiliki akses yang sama

### 2. Pengusulan Pegawai

- Daftarkan pegawai ASN dalam jumlah tidak terbatas
- Data lengkap: nama, NIP, jabatan, unit kerja, masa kerja
- Kriteria integritas: bebas temuan, tidak ada hukuman disiplin
- Prestasi dan inovasi: bukti inovasi dan penghargaan

### 3. Penilaian Komprehensif

Berdasarkan 9 aspek penilaian (skala 1-100):

- **Kinerja & Perilaku** - Hasil kerja dan perilaku sehari-hari
- **Inovasi & Dampak** - Kemampuan berinovasi dan dampak positif
- **Prestasi** - Pencapaian dan prestasi yang diraih
- **Inspiratif** - Kemampuan menginspirasi rekan kerja
- **Komunikasi** - Keterampilan komunikasi dan penyampaian ide
- **Kerjasama & Kolaborasi** - Kemampuan bekerja sama
- **Kepemimpinan** - Kemampuan memimpin dan mengambil inisiatif
- **Rekam Jejak** - Konsistensi dan track record kinerja
- **Integritas & Moralitas** - Kejujuran, etika, dan moral

### 4. Analisis AI Deepseek

- Analisis otomatis berdasarkan skor penilaian
- Generate analisis pro/kontra, kelebihan/kekurangan
- Wawasan mendalam untuk pengambilan keputusan

### 5. Sistem Eliminasi & Ranking

- Peringkat otomatis berdasarkan persentase akhir
- Filter berdasarkan unit kerja, status jabatan, skor minimum
- Pilih jumlah kandidat terbaik sesuai kebutuhan
- Export data ranking ke CSV

### 6. Dashboard Analitik

- Statistik real-time: total pegawai, evaluasi selesai
- Rata-rata skor dan jumlah kandidat ASN teladan
- Monitoring progress evaluasi

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 atau lebih baru)
- npm atau yarn
- Akun Supabase
- API Key Deepseek (opsional)

### Instalasi

1. **Clone repository**

   ```bash
   git clone <repository-url>
   cd asn-evaluation-app
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Setup environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` file:

   ```env
   # Deepseek AI API Key (opsional untuk analisis AI)
   VITE_DEEPSEEK_API_KEY=sk-your-deepseek-api-key-here
   ```

4. **Jalankan aplikasi**

   ```bash
   npm run dev
   ```

5. **Akses aplikasi**
   Buka browser ke `http://localhost:5173`

## 📊 Database Schema

Aplikasi menggunakan Supabase dengan 4 tabel utama:

### `unit_kerja`

- Unit kerja di lingkungan Kementerian Ketenagakerjaan

### `pegawai`

- Data pegawai ASN yang diusulkan
- Kriteria kelayakan dan prestasi

### `penilaian`

- Hasil evaluasi 9 aspek penilaian
- Skor akhir dan analisis AI
- Trigger otomatis untuk kalkulasi persentase

### `profiles`

- Profil pengguna yang terintegrasi dengan Supabase Auth

## 🎯 Alur Penggunaan

### 1. Registrasi & Login

- Buat akun baru atau login dengan akun existing
- Lengkapi profil dengan nama lengkap dan username

### 2. Tambah Pegawai

- Navigasi ke **Data Pegawai** → **Tambah Pegawai**
- Isi data pribadi dan kriteria kelayakan
- Centang prestasi dan inovasi jika ada

### 3. Lakukan Evaluasi

- Pergi ke menu **Evaluasi Pegawai**
- Pilih pegawai yang akan dievaluasi
- Isi skor untuk 9 aspek penilaian
- Gunakan fitur **Generate AI Analysis** untuk analisis otomatis

### 4. Lihat Ranking

- Akses menu **Ranking ASN**
- Filter berdasarkan kriteria yang diinginkan
- Pilih kandidat terbaik
- Export hasil ke CSV

## 🤖 AI Integration

### Setup Deepseek API

1. Daftar di [Deepseek Platform](https://platform.deepseek.com/)
2. Generate API key
3. Tambahkan ke environment variable `VITE_DEEPSEEK_API_KEY`

### Fitur AI

- **Automatic Analysis**: Generate analisis berdasarkan skor penilaian
- **Indonesian Language**: Hasil analisis dalam Bahasa Indonesia
- **Structured Output**: Format pro/kontra, kelebihan/kekurangan
- **Contextual**: Mempertimbangkan jabatan, unit kerja, dan kriteria

## 📈 Perhitungan Skor

### Formula Persentase Akhir

```
Base Score = (Sum of 9 assessment scores) / 9
Bonus SKP = 5 points (if SKP 2 tahun terakhir baik)
Bonus Improvement = 5 points (if SKP menunjukkan peningkatan)

Final Score = min(Base Score + Bonuses, 100)
```

### Kategori ASN Teladan

- **Sangat Baik**: ≥ 85%
- **Baik**: 70-84%
- **Cukup**: 55-69%
- **Kurang**: < 55%

## 🔧 Development

### Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: Shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: Deepseek API
- **State Management**: React Hooks + Context
- **Routing**: React Router v6

### Scripts

```bash
npm run dev       # Development server
npm run build     # Production build
npm run lint      # Lint check
npm run preview   # Preview production build
```

### Project Structure

```
src/
├── components/ui/    # Shadcn/ui components
├── hooks/           # Custom React hooks
├── integrations/    # Supabase client & types
├── lib/            # Utilities
├── pages/          # Page components
└── App.tsx         # Main app with routing
```

## 🛡️ Security & RLS

### Row Level Security (RLS)

- **Pegawai**: Users can only manage their own proposed employees
- **Penilaian**: Users can only create/edit their own evaluations
- **Profiles**: Users can only access their own profile
- **Unit Kerja**: Read access for all authenticated users

### Authentication

- Email/password authentication via Supabase Auth
- Session management with localStorage persistence
- Automatic profile creation on user registration

## 📄 Compliance

Aplikasi ini dibuat sesuai dengan:

- **UU No. 20 Tahun 2023** tentang Aparatur Sipil Negara
- **Kriteria Anugerah ASN Teladan 2025**
- **Standar Penilaian Kinerja Pegawai (SKP)**

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📞 Support

Untuk dukungan teknis atau pertanyaan:

- Buka issue di GitHub repository
- Email: [your-email@domain.com]

## 📜 License

Aplikasi ini dikembangkan untuk Kementerian Ketenagakerjaan RI.

---

**Aplikasi Penilaian ASN Teladan 2025** - Mendukung identifikasi dan pengembangan ASN berkualitas di Kementerian Ketenagakerjaan RI.
