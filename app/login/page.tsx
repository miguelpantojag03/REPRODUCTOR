'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Music2, Mail, Lock, Eye, EyeOff, Phone,
  User, ArrowRight, Loader2, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { Suspense } from 'react';

type Mode = 'login' | 'register';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const urlError = searchParams.get('error');

  const [mode, setMode] = useState<Mode>('login');
  const [usePhone, setUsePhone] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setError(''); // clear error on type
  };

  // Show URL error (e.g. from OAuth failure)
  useEffect(() => {
    if (urlError === 'OAuthAccountNotLinked') {
      setError('Este correo ya está registrado con otro método. Usa correo y contraseña.');
    } else if (urlError) {
      setError('Error al iniciar sesión. Inténtalo de nuevo.');
    }
  }, [urlError]);

  const validate = () => {
    if (mode === 'register' && !form.name.trim()) return 'Ingresa tu nombre';
    if (!usePhone && !form.email.trim()) return 'Ingresa tu correo';
    if (!usePhone && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Correo inválido';
    if (usePhone && !form.phone.trim()) return 'Ingresa tu número de teléfono';
    if (!form.password) return 'Ingresa tu contraseña';
    if (form.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        email: usePhone ? `phone_${form.phone.replace(/\D/g, '')}@phone.local` : form.email,
        password: form.password,
        name: form.name,
        phone: form.phone,
        mode,
        redirect: false,
      });

      if (res?.error) {
        // NextAuth v5 puts the custom error message in res.code
        const msg = res.code || res.error;
        if (msg === 'CredentialsSignin') {
          setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
        } else {
          setError(msg);
        }
      } else if (res?.ok) {
        if (mode === 'register') {
          setSuccess('¡Cuenta creada! Entrando...');
        }
        setTimeout(() => {
          router.push(callbackUrl);
          router.refresh();
        }, 500);
      }
    } catch (err: any) {
      setError('Error inesperado. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await signIn('google', { callbackUrl });
    } catch {
      setError('Error al conectar con Google.');
      setGoogleLoading(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError('');
    setSuccess('');
    setForm({ name: '', email: '', phone: '', password: '' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-[#1db954]/15 rounded-full blur-[80px]" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-600/15 rounded-full blur-[80px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-900/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-[400px] animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-[60px] bg-[#1db954] rounded-[18px] shadow-2xl shadow-[#1db954]/40 mb-5">
            <Music2 className="size-7 text-black" />
          </div>
          <h1 className="text-[26px] font-black text-white tracking-tight">Reproductor de Música</h1>
          <p className="text-[#6b7280] text-sm mt-1.5">Tu biblioteca musical personal</p>
        </div>

        {/* Card */}
        <div className="bg-[#161616] border border-white/[0.07] rounded-2xl shadow-2xl overflow-hidden">
          {/* Mode tabs */}
          <div className="flex border-b border-white/[0.06]">
            {(['login', 'register'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={cn(
                  'flex-1 py-3.5 text-sm font-semibold transition-all duration-200 relative',
                  mode === m ? 'text-white' : 'text-[#6b7280] hover:text-[#b3b3b3]'
                )}
              >
                {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                {mode === m && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1db954] rounded-full" />
                )}
              </button>
            ))}
          </div>

          <div className="p-6 space-y-4">
            {/* Google */}
            <button
              onClick={handleGoogle}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 active:bg-gray-100 text-[#1a1a1a] font-semibold py-3 px-4 rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <Loader2 className="size-5 animate-spin text-gray-500" />
              ) : (
                <svg className="size-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span>Continuar con Google</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/[0.07]" />
              <span className="text-[11px] text-[#6b7280] font-medium">O CONTINÚA CON</span>
              <div className="flex-1 h-px bg-white/[0.07]" />
            </div>

            {/* Input method toggle */}
            <div className="flex gap-1.5 p-1 bg-white/[0.04] rounded-xl">
              <button
                type="button"
                onClick={() => { setUsePhone(false); setError(''); }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all',
                  !usePhone ? 'bg-white/10 text-white' : 'text-[#6b7280] hover:text-white'
                )}
              >
                <Mail className="size-3.5" /> Correo
              </button>
              <button
                type="button"
                onClick={() => { setUsePhone(true); setError(''); }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all',
                  usePhone ? 'bg-white/10 text-white' : 'text-[#6b7280] hover:text-white'
                )}
              >
                <Phone className="size-3.5" /> Teléfono
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              {/* Name (register only) */}
              {mode === 'register' && (
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#6b7280] group-focus-within:text-[#1db954] transition-colors" />
                  <input
                    type="text"
                    placeholder="Tu nombre completo"
                    value={form.name}
                    onChange={set('name')}
                    autoComplete="name"
                    className="w-full bg-white/[0.05] border border-white/[0.08] focus:border-[#1db954]/60 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:bg-white/[0.07] transition-all"
                  />
                </div>
              )}

              {/* Email or Phone */}
              {!usePhone ? (
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#6b7280] group-focus-within:text-[#1db954] transition-colors" />
                  <input
                    type="email"
                    placeholder="tu@correo.com"
                    value={form.email}
                    onChange={set('email')}
                    autoComplete="email"
                    inputMode="email"
                    className="w-full bg-white/[0.05] border border-white/[0.08] focus:border-[#1db954]/60 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:bg-white/[0.07] transition-all"
                  />
                </div>
              ) : (
                <div className="relative group">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#6b7280] group-focus-within:text-[#1db954] transition-colors" />
                  <input
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={form.phone}
                    onChange={set('phone')}
                    autoComplete="tel"
                    inputMode="tel"
                    className="w-full bg-white/[0.05] border border-white/[0.08] focus:border-[#1db954]/60 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:bg-white/[0.07] transition-all"
                  />
                </div>
              )}

              {/* Password */}
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#6b7280] group-focus-within:text-[#1db954] transition-colors" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : 'Tu contraseña'}
                  value={form.password}
                  onChange={set('password')}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  className="w-full bg-white/[0.05] border border-white/[0.08] focus:border-[#1db954]/60 rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:bg-white/[0.07] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-white transition-colors p-0.5"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-3">
                  <AlertCircle className="size-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400 leading-relaxed">{error}</p>
                </div>
              )}

              {/* Success message */}
              {success && (
                <div className="flex items-center gap-2.5 bg-[#1db954]/10 border border-[#1db954]/20 rounded-xl px-3.5 py-3">
                  <CheckCircle2 className="size-4 text-[#1db954] flex-shrink-0" />
                  <p className="text-xs text-[#1db954]">{success}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full bg-[#1db954] hover:bg-[#1ed760] active:bg-[#18a349] text-black font-bold py-3.5 rounded-xl transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>

            {/* Skip */}
            <div className="text-center pt-1">
              <button
                onClick={() => { router.push('/'); router.refresh(); }}
                className="text-xs text-[#6b7280] hover:text-[#b3b3b3] transition-colors"
              >
                Continuar sin cuenta
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-[#6b7280]/70 mt-5 px-4">
          Al continuar, aceptas los términos de uso y la política de privacidad.
        </p>
      </div>
    </div>
  );
}

// Wrap in Suspense because useSearchParams needs it
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex items-end gap-1 h-8">
          <div className="w-1 bg-[#1db954] rounded-full wave-bar-1" />
          <div className="w-1 bg-[#1db954] rounded-full wave-bar-2" />
          <div className="w-1 bg-[#1db954] rounded-full wave-bar-3" />
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
