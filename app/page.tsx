'use client';

import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { ConfigError, Login, ResetPassword } from '@/components/auth/login';
import { Dashboard } from '@/components/dashboard/dashboard';

export default function Home(){
 const [session,setSession]=useState<any>(null),[authLoading,setAuthLoading]=useState(true);
 // true while the client is on the "set a new password" screen after opening the reset link from their email
 const [recovery,setRecovery]=useState(false);
 useEffect(()=>{
  if(!isSupabaseConfigured){setAuthLoading(false);return;}
  if(/type=recovery/.test(window.location.hash))setRecovery(true);
  supabase.auth.getSession().then(({data})=>{setSession(data.session);setAuthLoading(false)});
  const {data}=supabase.auth.onAuthStateChange((event,s)=>{
   // The reset link signs the user in; without this they would land in the dashboard without choosing a new password.
   if(event==='PASSWORD_RECOVERY')setRecovery(true);
   setSession(s);
  });
  return()=>data.subscription.unsubscribe();
 },[]);
 if(!isSupabaseConfigured)return <ConfigError/>;
 if(authLoading)return <div className="auth-screen"><div className="spinner"/> Memuat Mieflow…</div>;
 if(!session)return <Login/>;
 if(recovery)return <ResetPassword onDone={()=>setRecovery(false)}/>;
 return <Dashboard session={session}/>;
}
