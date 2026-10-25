'use client';

/**
 * Authentication screens: sign in, forgot password, set a new password, and the missing-configuration notice.
 *
 * There is NO public sign-up. Accounts are created by the administrator
 * (Supabase → Authentication → Users → Add user) and handed to the client.
 * Also switch off "Allow new users to sign up" in Supabase, otherwise the API still accepts sign-ups.
 *
 * "Lupa password": the client types their own email and Supabase mails the reset link to that address.
 * The administrator is not involved. Needs custom SMTP + Site URL in Supabase (see docs/CLIENT-ONBOARDING.md).
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

/** Where "request an account" emails go. Override with NEXT_PUBLIC_ADMIN_EMAIL. */
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'abdullohali7@gmail.com';
const REQUEST_ACCESS_HREF =
  `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent('Permintaan akun Mieflow POS')}` +
  `&body=${encodeURIComponent('Halo, saya ingin mendaftar akun Mieflow POS.\n\nNama toko:\nNama pemilik:\nEmail untuk login:\nNo. WhatsApp:\n')}`;

function friendlyAuthError(message: string) {
  const m = String(message || '').toLowerCase();
  if (m.includes('invalid login credentials')) return 'Email atau password salah.';
  if (m.includes('email not confirmed')) return 'Email belum dikonfirmasi. Hubungi admin.';
  if (m.includes('rate limit') || m.includes('security purposes')) return 'Terlalu sering meminta. Tunggu beberapa menit lalu coba lagi.';
  if (m.includes('not authorized')) return 'Pengiriman email belum diaktifkan oleh admin (SMTP). Hubungi admin.';
  return message;
}

export function ConfigError(){return <div className="auth-screen"><div className="login-card"><div className="brand-logo big">M</div><span className="eyebrow">MIEFLOW POS</span><h1>Konfigurasi belum lengkap</h1><p>Deployment Vercel berhasil dibuat, tetapi environment variable Supabase belum dipasang. Tambahkan <b>NEXT_PUBLIC_SUPABASE_URL</b> dan <b>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</b> di Vercel, lalu lakukan redeploy.</p><div className="error">Vercel → Project → Settings → Environment Variables</div></div></div>}

export function Login(){
 const [mode,setMode]=useState<'login'|'forgot'>('login');
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [showPassword,setShowPassword]=useState(false);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState('');
 const [success,setSuccess]=useState('');
 const submit=async(e:any)=>{
  e.preventDefault();setLoading(true);setError('');setSuccess('');
  if(mode==='forgot'){
   // The reset link is mailed to the address typed here, i.e. to the client, not to the administrator.
   const {error}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo:window.location.origin});
   if(error)setError(friendlyAuthError(error.message));
   else setSuccess('Jika email terdaftar, link untuk membuat password baru sudah dikirim. Periksa inbox dan folder Spam.');
  }else{
   const {data,error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
   if(error)setError(friendlyAuthError(error.message));
   else if(!data.session)setError('Login berhasil tetapi sesi belum tersedia. Coba masuk lagi.');
  }
  setLoading(false);
 };
 const switchMode=(next:'login'|'forgot')=>{setMode(next);setError('');setSuccess('');setPassword('')};
 return <div className="auth-screen auth-modern"><div className="auth-glow glow-one"/><div className="auth-glow glow-two"/><div className="auth-layout"><AuthBrand/><motion.form className="auth-panel" initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{duration:.35}} onSubmit={submit}>
   <div className="auth-panel-head"><div><span className="eyebrow">MIEFLOW POS</span><h1>{mode==='login'?'Selamat datang kembali':'Lupa password'}</h1><p>{mode==='login'?'Masuk untuk mengelola toko dan transaksi.':'Masukkan email akun Anda. Link untuk membuat password baru akan dikirim ke email tersebut.'}</p></div><div className="secure-badge"><ShieldCheck size={15}/> Secure</div></div>
   {error&&<div className="error auth-error"><span>{error}</span></div>}{success&&<div className="success-banner"><CheckCircle2 size={17}/><span>{success}</span></div>}
   <AuthField icon={Mail} label="Email" type="email" value={email} onChange={setEmail} placeholder="nama@contoh.com" required/>
   {mode==='login'&&<AuthField icon={LockKeyhole} label="Password" type={showPassword?'text':'password'} value={password} onChange={setPassword} placeholder="Masukkan password" required trailing={<button type="button" className="field-action" onClick={()=>setShowPassword(!showPassword)} aria-label={showPassword?'Sembunyikan password':'Tampilkan password'}>{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button>}/>}
   {mode==='login'&&<div className="auth-options"><span>Akun dibuat oleh admin</span><button type="button" onClick={()=>switchMode('forgot')}>Lupa password?</button></div>}
   <button className="auth-submit" disabled={loading}>{loading?<><span className="mini-spinner"/> Memproses…</>:mode==='login'?<>Masuk ke dashboard <ArrowRight size={17}/></>:<>Kirim link reset password <ArrowRight size={17}/></>}</button>
   {mode==='forgot'&&<div className="auth-options" style={{marginTop:14,marginBottom:0}}><button type="button" onClick={()=>switchMode('login')}>← Kembali ke halaman masuk</button></div>}
   <div className="auth-foot">{mode==='login'?<span>Belum punya akun? <a href={REQUEST_ACCESS_HREF} style={{color:'#ff5a36',fontWeight:700}}>Minta akses ke admin</a></span>:<span>🔒 Data autentikasi diamankan oleh Supabase</span>}</div>
 </motion.form></div></div>
}

/** Shown after the client opens the reset link from their email (Supabase event PASSWORD_RECOVERY). */
export function ResetPassword({onDone}:{onDone:()=>void}){
 const [password,setPassword]=useState('');
 const [confirm,setConfirm]=useState('');
 const [showPassword,setShowPassword]=useState(false);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState('');
 const passwordScore=[password.length>=8,/\d/.test(password),/[A-Z]/.test(password),/[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
 const submit=async(e:any)=>{
  e.preventDefault();setError('');
  if(password.length<8){setError('Password minimal 8 karakter.');return}
  if(password!==confirm){setError('Konfirmasi password belum sama.');return}
  setLoading(true);
  const {error}=await supabase.auth.updateUser({password});
  setLoading(false);
  if(error){setError(friendlyAuthError(error.message));return}
  onDone();
 };
 return <div className="auth-screen auth-modern"><div className="auth-glow glow-one"/><div className="auth-glow glow-two"/><div className="auth-layout"><AuthBrand/><motion.form className="auth-panel" initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{duration:.35}} onSubmit={submit}>
   <div className="auth-panel-head"><div><span className="eyebrow">MIEFLOW POS</span><h1>Buat password baru</h1><p>Masukkan password baru untuk akun Anda.</p></div><div className="secure-badge"><ShieldCheck size={15}/> Secure</div></div>
   {error&&<div className="error auth-error"><span>{error}</span></div>}
   <AuthField icon={LockKeyhole} label="Password baru" type={showPassword?'text':'password'} value={password} onChange={setPassword} placeholder="Minimal 8 karakter" required trailing={<button type="button" className="field-action" onClick={()=>setShowPassword(!showPassword)} aria-label={showPassword?'Sembunyikan password':'Tampilkan password'}>{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button>}/>
   <div className="password-meter"><div><span>Kekuatan password</span><b>{passwordScore<2?'Lemah':passwordScore<4?'Sedang':'Kuat'}</b></div><i><em style={{width:`${Math.max(8,passwordScore*25)}%`}}/></i><small>Gunakan 8+ karakter, angka, huruf besar, dan simbol.</small></div>
   <AuthField icon={LockKeyhole} label="Ulangi password" type={showPassword?'text':'password'} value={confirm} onChange={setConfirm} placeholder="Ketik ulang password" required/>
   <button className="auth-submit" disabled={loading}>{loading?<><span className="mini-spinner"/> Menyimpan…</>:<>Simpan password baru <ArrowRight size={17}/></>}</button>
 </motion.form></div></div>
}

export function AuthBrand(){return <div className="auth-brand"><div className="brand-logo auth-logo">M</div><span className="eyebrow light">BUSINESS POS</span><h2>Operasional toko,<br/><em>lebih rapi.</em></h2><p>Kelola penjualan, stok, pelanggan, dan transaksi dalam satu dashboard yang cepat dan modern.</p><div className="auth-points"><div><CheckCircle2 size={17}/><span>Kasir terpusat & real-time</span></div><div><CheckCircle2 size={17}/><span>Inventory lebih mudah dipantau</span></div><div><CheckCircle2 size={17}/><span>Akses aman berbasis akun</span></div></div><small className="auth-version">MIEFLOW • BUSINESS POS</small></div>}

export function AuthField({icon:Icon,label,value,onChange,type='text',placeholder='',required=false,trailing}:any){return <label className="auth-field"><span>{label}</span><div><Icon size={17}/><input required={required} type={type} value={value??''} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>{trailing}</div></label>}
