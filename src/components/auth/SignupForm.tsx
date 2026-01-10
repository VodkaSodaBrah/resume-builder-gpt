import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';
import { useAnalyticsStore, AnalyticsEvents } from '@/stores/analyticsStore';

export const SignupForm: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { signup, isLoading } = useAuthStore();
  const { trackEvent } = useAnalyticsStore();
  const navigate = useNavigate();

  const validatePassword = (pass: string) => {
    const checks = {
      length: pass.length >= 8,
      uppercase: /[A-Z]/.test(pass),
      lowercase: /[a-z]/.test(pass),
      number: /[0-9]/.test(pass),
    };
    return checks;
  };

  const passwordChecks = validatePassword(password);
  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!isPasswordValid) {
      setError('Password does not meet requirements');
      return;
    }

    trackEvent(AnalyticsEvents.SIGNUP_START);

    try {
      await signup(email, password, fullName);
      trackEvent(AnalyticsEvents.SIGNUP_COMPLETE);
      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
      trackEvent(AnalyticsEvents.SIGNUP_ERROR, { error: message });
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="terminal-window">
          <div className="terminal-header">
            <div className="terminal-dot red" />
            <div className="terminal-dot yellow" />
            <div className="terminal-dot green" />
            <span className="terminal-title">verification.sh</span>
          </div>

          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Check Your Email</h2>
            <p className="text-[#a1a1aa] mb-6">
              We've sent a verification link to <span className="text-white">{email}</span>.
              Please click the link to activate your account.
            </p>
            <p className="text-sm text-[#71717a]">
              Didn't receive the email? Check your spam folder or{' '}
              <button className="text-blue-500 hover:text-blue-400">
                click here to resend
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="terminal-window">
        <div className="terminal-header">
          <div className="terminal-dot red" />
          <div className="terminal-dot yellow" />
          <div className="terminal-dot green" />
          <span className="terminal-title">signup.sh</span>
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-[#a1a1aa]">Start building your professional resume</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717a]" />
              <Input
                type="text"
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-11"
                required
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717a]" />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-11"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717a]" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-11 pr-11"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-white"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {password && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`flex items-center gap-1.5 ${passwordChecks.length ? 'text-green-500' : 'text-[#71717a]'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${passwordChecks.length ? 'bg-green-500' : 'bg-[#71717a]'}`} />
                  8+ characters
                </div>
                <div className={`flex items-center gap-1.5 ${passwordChecks.uppercase ? 'text-green-500' : 'text-[#71717a]'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${passwordChecks.uppercase ? 'bg-green-500' : 'bg-[#71717a]'}`} />
                  Uppercase
                </div>
                <div className={`flex items-center gap-1.5 ${passwordChecks.lowercase ? 'text-green-500' : 'text-[#71717a]'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${passwordChecks.lowercase ? 'bg-green-500' : 'bg-[#71717a]'}`} />
                  Lowercase
                </div>
                <div className={`flex items-center gap-1.5 ${passwordChecks.number ? 'text-green-500' : 'text-[#71717a]'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${passwordChecks.number ? 'bg-green-500' : 'bg-[#71717a]'}`} />
                  Number
                </div>
              </div>
            )}

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717a]" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-11"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
              disabled={!isPasswordValid || password !== confirmPassword}
            >
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[#a1a1aa]">
            Already have an account?{' '}
            <Link to="/login" className="text-green-500 hover:text-green-400 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
