import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AlertCircle, FileText } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../context/AuthContext';

const ERROR_TIMEOUT_MS = 3000;

function LoginPage() {
  const { login } = useAuth();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const showError = () => {
    setError(true);
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      setError(false);
    }, ERROR_TIMEOUT_MS);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const ok = await login(loginId.trim(), password);
      if (!ok) {
        showError();
      }
    } catch (error) {
      showError();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-md border-slate-800 bg-slate-950 text-slate-100 shadow-2xl">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-slate-100">
            <FileText className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl tracking-tight">DocGen Pro</CardTitle>
          <CardDescription className="text-slate-400">Accès privé</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-id" className="text-slate-200">
                Identifiant
              </Label>
              <Input
                id="login-id"
                type="text"
                autoComplete="username"
                value={loginId}
                onChange={(event) => setLoginId(event.target.value)}
                className="border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password" className="text-slate-200">
                Mot de passe
              </Label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500"
              />
            </div>
            <Button type="submit" className="w-full">
              Se connecter
            </Button>
          </form>
          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              <AlertCircle className="h-4 w-4" />
              <span>Identifiants incorrects</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginPage;
