# Panduan simpel: jual Mieflow ke client (akun dibuat admin)

- Client **tidak daftar sendiri**. Admin membuat akun lalu mengirim email + password ke client.
- Client yang lupa password **membuat password baru sendiri** lewat link yang dikirim ke emailnya. Admin tidak terlibat.

## Setup sekali per project Supabase

1. Jalankan `supabase/schema.sql` di **SQL Editor**.
2. Matikan pendaftaran publik: Authentication → Sign In / Providers → matikan **Allow new users to sign up**.
3. Aktifkan pengiriman email (wajib agar "Lupa password" sampai ke client):
   Authentication → Emails → SMTP Settings → **Enable custom SMTP**.
   Tanpa ini Supabase hanya mengirim ke anggota tim project dan dibatasi 2 email per jam.
   Cara termudah memakai Gmail Anda:
   - Host `smtp.gmail.com`, port `465`
   - Username: alamat Gmail Anda
   - Password: **App Password** (akun Google → Keamanan → Verifikasi 2 langkah aktif → Sandi aplikasi). Bukan password Gmail biasa.
   - Sender email: Gmail yang sama, sender name: nama aplikasi Anda
4. Authentication → URL Configuration → **Site URL** = alamat deploy client, mis. `https://toko-budi.vercel.app`.

Di Vercel isi environment variable: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_STORE_NAME`.

## Setiap ada client baru

1. Client menekan **Minta akses ke admin** di halaman login (email siap kirim ke admin).
2. Admin: Supabase → Authentication → Users → **Add user → Create new user**.
   Isi email client + password sementara, centang **Auto Confirm User**.
3. Admin mengirim alamat aplikasi, email, dan password itu ke client.

## Client lupa password

1. Client menekan **Lupa password?**, mengisi emailnya, lalu **Kirim link reset password**.
2. Link masuk ke email client, dibuka, lalu client mengisi password baru. Selesai.

Cek: bila email tidak datang, lihat folder Spam, lalu pastikan SMTP tersimpan dan App Password benar.

## Satu Supabase untuk beberapa client (menghemat langkah 3)

Pengaturan SMTP dan matikan sign-up berlaku **per project Supabase**. Bila setiap client punya project sendiri, langkah 2-4 diulang tiap client.
Bila beberapa client memakai satu project Supabase (satu Vercel deploy per client dengan `NEXT_PUBLIC_STORE_NAME` masing-masing, URL dan key Supabase sama):
- langkah 1-3 cukup sekali,
- tambahkan alamat deploy tiap client di Authentication → URL Configuration → **Redirect URLs** (tanpa ini link reset mengarah ke Site URL).

Data client tetap terpisah lewat `owner_id` + RLS. Satu akun = satu toko. Beberapa kasir dalam satu toko memakai satu login bersama.
Project Supabase free dapat di-pause bila lama tidak aktif; untuk client berbayar sebaiknya pakai plan berbayar.
