'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Music2, Mail, Lock, Eye, EyeOff, Phone,
  User, ArrowRight, Loader2, AlertCircle, CheckCircle2,
} from 'lucide-react';

type Mode = 'login' | 'register';

// Map error codes to human-readable Spanish messages
const ERROR_MESSAGES: Record<string, string> = {
  EMAIL_EXISTS:    'Ya existe una cuenta con ese correo. Inicia sesión.',
  USER_NOT_FOUND:  'No encontramos una cuenta con ese correo.',
  USE_GOOGLE:      'Esta cuenta fue creada con Google. Usa el botón de Google.',
  WRONG_PASSWORD:  'Contraseña incorrecta. Inténtalo de nuevo.',
  SERVER_ERROR:    'Error del servidor. Inténtalo más tarde.',
  CredentialsSignin: 'Correo o contraseña incorrectos.',
  OAuthAccountNotLinked: 'Este correo ya está registrado. Usa correo y contraseña.',
  Default:         'Error al iniciar sesión. Inténtalo de nuevo.',
};

function getErrorMessage(code: string | null | undefined): string {
  if (!code) return '';
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.Default;
}

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
    if (error) setError('');
  };

  useEffect(() => {
    if (urlError) setError(getErrorMessage(urlError));
  }, [urlError]);

  const validate = (): string | null => {
    if (mode === 'register' && !form.name.trim()) return 'Ingresa tu nombre completo';
    if (!usePhone) {
      if (!form.email.trim()) return 'Ingresa tu correo electrónico';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'El correo no es válido';
    } else {
      if (!form.phone.trim()) return 'Ingresa tu número de teléfono';
    }
    if (!form.password) return 'Ingresa tu contraseña';
    if (form.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validErr = validate();
    if (validErr) { setError(validErr); return; }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const emailToUse = usePhone
        ? `phone_${form.phone.replace(/\D/g, '')}@phone.local`
        : form.email.toLowerCase().trim();

      const res = await signIn('credentials', {
        email:    emailToUse,
        password: form.password,
        name:     form.name,
        phone:    form.phone,
        mode,
        redirect: false,
      });

      if (!res) {
        setError('Sin respuesta del servidor. Inténtalo de nuevo.');
        return;
      }

      if (res.error) {
        // NextAuth v5 puts the error code in res.error or res.code
        const code = (res as any).code || res.error;
        setError(getErrorMessage(code));
        return;
      }

      if (res.ok) {
        setSuccess(mode === 'register' ? '¡Cuenta creada! Entrando...' : '¡Bienvenido!');
        setTimeout(() => {
          router.push(callbackUrl);
          router.refresh();
        }, 600);
      }
    } catch {
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
      setError('No se pudo conectar con Google.');
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
    <div className="min-h-[100dvh] bg-[#0a0a0a] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#1db954]/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-16 bg-[#1db954] rounded-2xl shadow-2xl shadow-[#1db954]/30 mb-4">
            <Music2 className="size-8 text-black" />
          </div>
          <h1 className="text-2xl font-black text-white">Reproductor de Música</h1>
          <p className="text-[#6b7280] text-sm mt-1">Tu biblioteca musical personal</p>
        </div>

        {/* Card */}
        <div className="bg-[#161616] border border-white/[0.07] rounded-2xl shadow-2xl overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-white/[0.06]">
            {(['login', 'register'] as Mode[]).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={cn(
                  'flex-1 py-3.5 text-sm font-semibold transition-all relative',
                  mode === m ? 'text-white' : 'text-[#6b7280] hover:text-[#b3b3b3]'
                )}
              >
                {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                {mode === m && (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#1db954] rounded-full" />
                )}
              </button>
            ))}
          </div>

          <div className="p-6 space-y-4">

            {/* Google button */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 active:scale-[0.98] text-[#111] font-semibold py-3 rounded-xl transition-all disabled:opacity-50"
            >
              {googleLoading ? (
                <Loader2 className="size-5 animate-spin text-gray-400" />
              ) : (
                <svg className="size-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continuar con Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/[0.07]" />
              <span className="text-[11px] text-[#6b7280] font-medium tracking-wide">O CONTINÚA CON</span>
              <div className="flex-1 h-px bg-white/[0.07]" />
            </div>

            {/* Email / Phone toggle */}
            <div className="flex gap-1 p-1 bg-white/[0.04] rounded-xl">
              {[
                { id: false, icon: Mail,  label: 'Correo'   },
                { id: true,  icon: Phone, label: 'Teléfono' },
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => { setUsePhone(id); setError(''); }}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all',
                    usePhone === id ? 'bg-white/10 text-white' : 'text-[#6b7280] hover:text-white'
                  )}
                >
                  <Icon className="size-3.5" /> {label}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3" noValidate>

              {/* Name — register only */}
              {mode === 'register' && (
                <label className="block relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#6b7280] group-focus-within:text-[#1db954] transition-colors pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Tu nombre completo"
                    value={form.name}
                    onChange={set('name')}
                    autoComplete="name"
                    className="w-full bg-white/[0.05] border border-white/[0.08] focus:border-[#1db954]/60 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:bg-white/[0.07] transition-all"
                  />
                </label>
              )}

              {/* Email or Phone */}
              {!usePhone ? (
                <label className="block relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#6b7280] group-focus-within:text-[#1db954] transition-colors pointer-events-none" />
                  <input
                    type="email"
                    placeholder="tu@correo.com"
                    value={form.email}
                    onChange={set('email')}
                    autoComplete="email"
                    inputMode="email"
                    className="w-full bg-white/[0.05] border border-white/[0.08] focus:border-[#1db954]/60 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:bg-white/[0.07] transition-all"
                  />
                </label>
              ) : (
                <label className="block relative group">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#6b7280] group-focus-within:text-[#1db954] transition-colors pointer-events-none" />
                  <input
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={form.phone}
                    onChange={set('phone')}
                    autoComplete="tel"
                    inputMode="tel"
                    className="w-full bg-white/[0.05] border border-white/[0.08] focus:border-[#1db954]/60 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:bg-white/[0.07] transition-all"
                  />
                </label>
              )}

              {/* Password */}
              <label className="block relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#6b7280] group-focus-within:text-[#1db954] transition-colors pointer-events-none" />
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
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-white transition-colors"
                >
                  {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </label>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-3" role="alert">
                  <AlertCircle className="size-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400 leading-relaxed">{error}</p>
                </div>
              )}

              {/* Success */}
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
                className="w-full bg-[#1db954] hover:bg-[#1ed760] active:scale-[0.98] text-black font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
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
            <p className="text-center">
              <button
                type="button"
                onClick={async () => {
                  // Sign in as guest using a special guest account
                  setLoading(true);
                  const res = await signIn('credentials', {
                    email: 'guest@music.local',
                    password: 'guest123',
                    name: 'Invitado',
                    mode: 'login',
                    redirect: false,
                  });
                  // If guest doesn't exist, create it
                  if (res?.error) {
                    await signIn('credentials', {
                      email: 'guest@music.local',
                      password: 'guest123',
                      name: 'Invitado',
                      mode: 'register',
                      redirect: false,
                    });
                  }
                  setLoading(false);
                  router.push('/');
                  router.refresh();
                }}
                className="text-xs text-[#6b7280] hover:text-[#b3b3b3] transition-colors underline-offset-2 hover:underline"
              >
                Continuar sin cuenta →
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] text-[#6b7280]/60 mt-5">
          Al continuar aceptas los términos de uso y la política de privacidad.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[100dvh] bg-[#0a0a0a] flex items-center justify-center">
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
