'use client';

import { useState, useTransition } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Music2, Mail, Lock, Eye, EyeOff, Phone,
  User, ArrowRight, Loader2, AlertCircle,
} from 'lucide-react';

type Mode = 'login' | 'register';
type Method = 'email' | 'phone';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [method, setMethod] = useState<Method>('email');
  const [showPass, setShowPass] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    startTransition(async () => {
      const res = await signIn('credentials', {
        email: form.email,
        password: form.password,
        name: form.name,
        phone: form.phone,
        mode,
        redirect: false,
      });
      if (res?.error) {
        setError(res.error === 'CredentialsSignin' ? 'Credenciales incorrectas' : res.error);
      } else {
        router.push('/');
        router.refresh();
      }
    });
  };

  const handleGoogle = () => {
    startTransition(async () => {
      await signIn('google', { callbackUrl: '/' });
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#1db954]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-16 bg-[#1db954] rounded-2xl shadow-2xl shadow-[#1db954]/30 mb-4">
            <Music2 className="size-8 text-black" />
          </div>
          <h1 className="text-2xl font-black text-white">Reproductor de Música</h1>
          <p className="text-[#6b7280] text-sm mt-1">Tu biblioteca musical personal</p>
        </div>

        {/* Card */}
        <div className="bg-[#181818] border border-white/[0.08] rounded-2xl p-6 shadow-2xl">
          {/* Mode toggle */}
          <div className="flex bg-white/[0.05] rounded-xl p-1 mb-6">
            {(['login', 'register'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200',
                  mode === m ? 'bg-white text-black shadow-sm' : 'text-[#6b7280] hover:text-white'
                )}
              >
                {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </button>
            ))}
          </div>

          {/* Social login */}
          <div className="space-y-3 mb-6">
            <button
              onClick={handleGoogle}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-black font-semibold py-3 px-4 rounded-xl transition-all duration-150 active:scale-[0.98] disabled:opacity-60"
            >
              {isPending ? <Loader2 className="size-5 animate-spin" /> : (
                <svg className="size-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continuar con Google
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-xs text-[#6b7280]">o con</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          {/* Method toggle */}
          <div className="flex gap-2 mb-4">
            {(['email', 'phone'] as Method[]).map(m => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  method === m ? 'bg-white/10 text-white' : 'text-[#6b7280] hover:text-white hover:bg-white/[0.05]'
                )}
              >
                {m === 'email' ? <Mail className="size-3.5" /> : <Phone className="size-3.5" />}
                {m === 'email' ? 'Correo' : 'Teléfono'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleCredentials} className="space-y-3">
            {mode === 'register' && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#6b7280]" />
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={form.name}
                  onChange={set('name')}
                  required
                  className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-[#1db954]/50 focus:bg-white/[0.08] transition-all"
                />
              </div>
            )}

            {method === 'email' ? (
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#6b7280]" />
                <input
                  type="email"
                  placeholder="tu@correo.com"
                  value={form.email}
                  onChange={set('email')}
                  required
                  className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-[#1db954]/50 focus:bg-white/[0.08] transition-all"
                />
              </div>
            ) : (
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#6b7280]" />
                <input
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={form.phone}
                  onChange={set('phone')}
                  required
                  className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-[#1db954]/50 focus:bg-white/[0.08] transition-all"
                />
              </div>
            )}

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#6b7280]" />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder={mode === 'register' ? 'Crea una contraseña' : 'Tu contraseña'}
                value={form.password}
                onChange={set('password')}
                required
                minLength={6}
                className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-[#1db954]/50 focus:bg-white/[0.08] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-white transition-colors"
              >
                {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                <AlertCircle className="size-4 text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-[#1db954] hover:bg-[#1ed760] text-black font-bold py-3 rounded-xl transition-all duration-150 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {isPending ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          {/* Skip auth */}
          <div className="mt-4 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-xs text-[#6b7280] hover:text-white transition-colors"
            >
              Continuar sin cuenta →
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#6b7280] mt-6">
          Al continuar, aceptas nuestros términos de uso y política de privacidad.
        </p>
      </div>
    </div>
  );
}
