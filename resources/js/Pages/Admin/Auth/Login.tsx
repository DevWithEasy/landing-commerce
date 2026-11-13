import { Head, useForm } from '@inertiajs/react';
import { AlertCircle, Lock, Mail, Shield, Store } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/Shared/Button';

export default function Login() {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post('/login', {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0B3B2E] via-[#092E24] to-[#061F18] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <Head title="Sign In - Landing Commerce" />

            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#F96D16] text-white shadow-lg shadow-[#F96D16]/30 mb-4">
                    <Store className="w-7 h-7" />
                </div>
                <h1 className="font-serif text-3xl font-bold tracking-tight text-white">Landing Commerce</h1>
                <p className="mt-1.5 text-sm text-emerald-100/80">
                    Sign in to your merchant administrative dashboard
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
                <div className="bg-white/95 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
                    {errors.email && (
                        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2.5">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
                            <span className="leading-relaxed font-medium">{errors.email}</span>
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={submit}>
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5"
                            >
                                Email Address
                            </label>
                            <div className="relative rounded-lg shadow-2xs">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="block w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-gray-900 placeholder-gray-400"
                                    placeholder="admin@example.com"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5"
                            >
                                Password
                            </label>
                            <div className="relative rounded-lg shadow-2xs">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="block w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                                />
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-xs text-red-600 font-medium">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember"
                                    name="remember"
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <label
                                    htmlFor="remember"
                                    className="ml-2 block text-xs text-gray-600 select-none"
                                >
                                    Remember my session
                                </label>
                            </div>
                        </div>

                        <div>
                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                className="w-full justify-center bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-md shadow-primary-600/20"
                                disabled={processing}
                            >
                                <Shield className="w-4 h-4 mr-2" />
                                {processing ? 'Authenticating...' : 'Sign in to Dashboard'}
                            </Button>
                        </div>
                    </form>
                </div>

                <div className="mt-6 text-center text-xs text-slate-500">
                    Enterprise Single-Tenant Commerce Platform &bull; Protected by rate-limited RBAC
                </div>
            </div>
        </div>
    );
}
