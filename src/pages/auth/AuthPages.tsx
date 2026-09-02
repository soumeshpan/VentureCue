import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import './AuthPages.css';

export const SignupPage: React.FC = () => {
  const { signup } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.includes('@')) e.email = 'Enter a valid email address';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600)); // mock network
    signup(form.email, form.name);
    navigate('/onboarding');
  };

  return (
    <div className="auth-page">
      <div className="auth-page__heading">
        <h1>Create your account</h1>
        <p>Start preparing for the conversations that matter.</p>
      </div>

      <form className="auth-page__form" onSubmit={handleSubmit} noValidate>
        <Input
          id="signup-name"
          label="Full name"
          type="text"
          placeholder="Alex Johnson"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          error={errors.name}
          leftIcon={<User size={16} />}
          autoComplete="name"
          autoFocus
        />
        <Input
          id="signup-email"
          label="Email"
          type="email"
          placeholder="you@startup.com"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          error={errors.email}
          leftIcon={<Mail size={16} />}
          autoComplete="email"
        />
        <Input
          id="signup-password"
          label="Password"
          type="password"
          placeholder="At least 6 characters"
          value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          error={errors.password}
          leftIcon={<Lock size={16} />}
          autoComplete="new-password"
        />
        <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} glow>
          Create account
        </Button>
      </form>

      <p className="auth-page__switch">
        Already have an account?{' '}
        <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
};

export const LoginPage: React.FC = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.email.includes('@')) e.email = 'Enter a valid email address';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    login(form.email, form.email.split('@')[0]);
    navigate('/dashboard');
  };

  return (
    <div className="auth-page">
      <div className="auth-page__heading">
        <h1>Welcome back</h1>
        <p>Sign in to continue preparing.</p>
      </div>

      <form className="auth-page__form" onSubmit={handleSubmit} noValidate>
        <Input
          id="login-email"
          label="Email"
          type="email"
          placeholder="you@startup.com"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          error={errors.email}
          leftIcon={<Mail size={16} />}
          autoComplete="email"
          autoFocus
        />
        <Input
          id="login-password"
          label="Password"
          type="password"
          placeholder="Your password"
          value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          error={errors.password}
          leftIcon={<Lock size={16} />}
          autoComplete="current-password"
        />
        <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} glow>
          Sign in
        </Button>
      </form>

      <p className="auth-page__switch">
        Don't have an account?{' '}
        <Link to="/signup">Create one</Link>
      </p>
    </div>
  );
};
