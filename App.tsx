
import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import { User, UserRole } from './types';
import { StorageService } from './services/storageService';
import { ApiService, SystemChecks } from './services/apiService';
import AdminDashboard from './components/Dashboards/AdminDashboard';
import ProfessorDashboard from './components/Dashboards/ProfessorDashboard';
import StudentDashboard from './components/Dashboards/StudentDashboard';
import ModeratorDashboard from './components/Dashboards/ModeratorDashboard';
import CoordinatorDashboard from './components/Dashboards/CoordinatorDashboard';
import AuthGuard from './components/Auth/AuthGuard';
import { GraduationCap, ArrowLeft, Languages, Building2, AlertTriangle, Loader2, CheckCircle, Lock, Database, ShieldCheck, Github, ExternalLink, Trash2, Server, Star, Brain, PenTool, Check, HardDrive, Cpu, Settings, Play } from 'lucide-react';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

// Background Component
const CalligraphyBackground = () => {
    const elements = useMemo(() => {
        const items = [];
        const chars = [
            'ا', 'ب', 'ح', 'د', 'ر', 'س', 'ص', 'ط', 'ع', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي',
            'أ', 'إ', 'آ', 'ة', 'ث', 'ج', 'خ', 'ذ', 'ز', 'ش', 'ض', 'ظ', 'غ', 'ف',
            'ⴰ', 'ⴱ', 'ⴳ', 'ⴷ', 'ⴹ', 'ⴻ', 'ⴼ', 'ⴽ', 'ⵀ', 'ⵃ', 'ⵄ', 'ⵅ', 'ⵇ', 'ⵉ', 'ⵊ', 'ⵍ', 'ⵎ', 'ⵏ', 'ⵓ', 'ⵔ', 'ⵕ', 'ⵖ', 'ⵙ', 'ⵚ', 'ⵛ', 'ⵜ', 'ⵟ', 'ⵡ', 'ⵢ', 'ⵣ', 'ⵥ',
            'تينمل', 'ⵜⵉⵏⵎⴻⵍ', 'ⵉⵇⵔⴰ', 'إقرأ', 'ⴰⵍⵎⵓⴷ', 'علم', 'ⵜⴰⵎⵓⵙⵏⵉ', 'Tinmel', 'Education', 'Savoir', 'المعرفة'
        ];

        for (let i = 0; i < 60; i++) {
            items.push({
                char: chars[Math.floor(Math.random() * chars.length)],
                top: Math.random() * 100,
                left: Math.random() * 100,
                size: Math.random() * 6 + 2, // 2rem to 8rem for depth
                duration: Math.random() * 20 + 20, // 20s to 40s slow movement
                delay: Math.random() * 20,
                initialRotate: Math.random() * 360,
                opacity: Math.random() * 0.05 + 0.02, // very subtle
                font: Math.random() > 0.5 ? 'Amiri' : 'sans-serif' 
            });
        }
        return items;
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none bg-[#0f172a]">
            <style>{`
                @keyframes swim {
                    0% { transform: translate(0, 0) rotate(0deg); }
                    33% { transform: translate(30px, -30px) rotate(5deg); }
                    66% { transform: translate(-20px, 20px) rotate(-5deg); }
                    100% { transform: translate(0, 0) rotate(0deg); }
                }
            `}</style>
            
            {elements.map((el, i) => (
                <div key={i} style={{
                    position: 'absolute',
                    top: `${el.top}%`,
                    left: `${el.left}%`,
                    fontSize: `${el.size}rem`,
                    fontFamily: el.font === 'Amiri' ? '"Amiri", serif' : 'sans-serif',
                    color: `rgba(255, 255, 255, ${el.opacity})`,
                    zIndex: 0,
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                    filter: 'blur(1px)',
                    animation: `swim ${el.duration}s ease-in-out infinite -${el.delay}s`
                }}>
                    <div style={{ transform: `rotate(${el.initialRotate}deg)` }}>
                        {el.char}
                    </div>
                </div>
            ))}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-[#0f172a]/60 to-[#0f172a] z-0"></div>
        </div>
    );
};

// --- INSTALLATION WIZARD COMPONENT ---
const InstallationWizard: React.FC<{ onInstalled: () => void }> = ({ onInstalled }) => {
    const { t, dir } = useLanguage();
    const [step, setStep] = useState(0); // 0: Welcome, 1: Checks, 2: DB/Env, 3: App Info, 4: Finish
    const [loading, setLoading] = useState(false);
    const [systemChecks, setSystemChecks] = useState<SystemChecks | null>(null);
    const [error, setError] = useState('');

    const [config, setConfig] = useState({
        envMode: 'production', // 'development' | 'production'
        dbType: 'sqlite', // 'sqlite' | 'mysql'
        schoolName: '',
        adminEmail: '',
        username: 'admin',
        password: '',
        name: 'Administrateur'
    });

    // Step 1: Perform System Checks
    useEffect(() => {
        if (step === 1) {
            setLoading(true);
            ApiService.getSystemChecks().then(checks => {
                setSystemChecks(checks);
                setTimeout(() => setLoading(false), 800); // Small artificial delay for UX
            });
        }
    }, [step]);

    const handleInstall = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        const success = await ApiService.installApp(config);
        
        if (success) {
            setStep(4); // Move to final success step
        } else {
            setError(t('installError'));
        }
        setLoading(false);
    };

    const renderStepContent = () => {
        switch(step) {
            case 0: // Welcome
                return (
                    <div className="text-center space-y-6">
                        <div className="w-24 h-24 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/50 mb-6">
                            <GraduationCap className="w-12 h-12 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-800 font-logo">Tinmel LMS</h1>
                            <p className="text-gray-500 text-sm mt-2 font-mono">Version 1.0.0 (Beta)</p>
                        </div>
                        <p className="text-gray-600">
                            Bienvenue dans l'assistant d'installation. Nous allons configurer votre plateforme éducative en quelques étapes simples.
                        </p>
                        <button onClick={() => setStep(1)} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold shadow-lg transition-transform hover:scale-[1.02] flex items-center justify-center gap-2">
                            Commencer l'installation <ArrowLeft className="w-5 h-5 rotate-180 rtl:rotate-0"/>
                        </button>
                    </div>
                );
            case 1: // System Checks
                return (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Server className="w-6 h-6 text-indigo-600"/> Vérification Système
                        </h2>
                        {loading ? (
                            <div className="py-12 flex flex-col items-center text-gray-500">
                                <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500"/>
                                <p>Analyse de l'environnement...</p>
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="flex items-center gap-2 text-sm font-medium text-gray-700"><CheckCircle className="w-4 h-4 text-green-500"/> Node.js</span>
                                    <span className="font-mono text-xs bg-white px-2 py-1 rounded border">{systemChecks?.nodeVersion}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="flex items-center gap-2 text-sm font-medium text-gray-700"><CheckCircle className="w-4 h-4 text-green-500"/> Permissions Écriture</span>
                                    <span className={`font-mono text-xs px-2 py-1 rounded border ${systemChecks?.writeAccess ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                        {systemChecks?.writeAccess ? 'OK' : 'FAIL'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="flex items-center gap-2 text-sm font-medium text-gray-700"><CheckCircle className="w-4 h-4 text-green-500"/> Base de Données</span>
                                    <span className="font-mono text-xs bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200">Prêt (SQLite)</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="flex items-center gap-2 text-sm font-medium text-gray-700"><HardDrive className="w-4 h-4 text-gray-500"/> Mémoire</span>
                                    <span className="font-mono text-xs bg-white px-2 py-1 rounded border">{systemChecks?.memory}</span>
                                </div>
                            </div>
                        )}
                        {!loading && (
                            <button onClick={() => setStep(2)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold shadow-md">
                                Continuer
                            </button>
                        )}
                    </div>
                );
            case 2: // DB & Env
                return (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Settings className="w-6 h-6 text-gray-600"/> Configuration
                        </h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Environnement</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => setConfig({...config, envMode: 'production'})}
                                        className={`p-3 rounded-lg border-2 text-center transition ${config.envMode === 'production' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <div className="font-bold text-sm">Production</div>
                                        <div className="text-[10px] opacity-70">Recommandé</div>
                                    </button>
                                    <button 
                                        onClick={() => setConfig({...config, envMode: 'development'})}
                                        className={`p-3 rounded-lg border-2 text-center transition ${config.envMode === 'development' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <div className="font-bold text-sm">Développement</div>
                                        <div className="text-[10px] opacity-70">Logs détaillés</div>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Base de Données</label>
                                <div className="space-y-2">
                                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${config.dbType === 'sqlite' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                                        <input type="radio" name="db" checked={config.dbType === 'sqlite'} onChange={() => setConfig({...config, dbType: 'sqlite'})} className="text-blue-600 focus:ring-blue-500" />
                                        <div>
                                            <div className="font-bold text-sm text-gray-800">SQLite (Embarqué)</div>
                                            <div className="text-xs text-gray-500">Aucune configuration requise. Idéal pour les petites écoles.</div>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed">
                                        <input type="radio" name="db" disabled />
                                        <div>
                                            <div className="font-bold text-sm text-gray-800">MySQL / PostgreSQL</div>
                                            <div className="text-xs text-gray-500">Bientôt disponible pour les grandes structures.</div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setStep(1)} className="px-4 py-3 text-gray-500 hover:bg-gray-100 rounded-lg font-bold">Retour</button>
                            <button onClick={() => setStep(3)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold shadow-md">Suivant</button>
                        </div>
                    </div>
                );
            case 3: // App Info
                return (
                    <form onSubmit={handleInstall} className="space-y-5">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Building2 className="w-6 h-6 text-blue-600"/> Informations
                        </h2>
                        
                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded border border-red-200 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4"/> {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">{t('siteName')}</label>
                            <input required type="text" className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={config.schoolName} onChange={e => setConfig({...config, schoolName: e.target.value})} placeholder="Ex: École Al Massira" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Email Admin (Optionnel)</label>
                            <input type="email" className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={config.adminEmail} onChange={e => setConfig({...config, adminEmail: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">{t('adminUsername')}</label>
                                <input required type="text" className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    value={config.username} onChange={e => setConfig({...config, username: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">{t('adminPassword')}</label>
                                <input required type="password" className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    value={config.password} onChange={e => setConfig({...config, password: e.target.value})} />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={() => setStep(2)} className="px-4 py-3 text-gray-500 hover:bg-gray-100 rounded-lg font-bold">Retour</button>
                            <button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold shadow-md flex justify-center items-center gap-2">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <>{t('installBtn')} <CheckCircle className="w-5 h-5"/></>}
                            </button>
                        </div>
                    </form>
                );
            case 4: // Success
                return (
                    <div className="text-center py-8">
                        <div className="w-20 h-20 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-6 animate-bounce">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Installation Terminée !</h2>
                        <p className="text-gray-600 mb-8">Tinmel LMS est prêt à être utilisé.</p>
                        <button onClick={onInstalled} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold shadow-lg transition-transform hover:scale-105">
                            Accéder à la plateforme
                        </button>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center relative overflow-hidden font-sans" dir={dir}>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="z-50 w-full max-w-lg px-4">
                {/* Progress Bar */}
                {step > 0 && step < 4 && (
                    <div className="flex gap-2 mb-6 justify-center">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`h-1.5 w-8 rounded-full transition-colors ${step >= i ? 'bg-white' : 'bg-white/20'}`}></div>
                        ))}
                    </div>
                )}

                <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/50 animate-fade-in">
                    <div className="p-8">
                        {renderStepContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- PAGES / ROUTES COMPONENTS ---

const LandingPage: React.FC = () => {
    const { t, language, setLanguage, dir } = useLanguage();
    const navigate = useNavigate();

    const toggleLanguage = () => {
        setLanguage(language === 'fr' ? 'ar' : 'fr');
    };

    return (
        <div className="min-h-screen bg-blue-900 flex items-center justify-center relative overflow-hidden" dir={dir}>
            <CalligraphyBackground />
            
            <button onClick={toggleLanguage} className="absolute top-6 right-6 z-50 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full backdrop-blur-md flex items-center gap-2 transition border border-white/20">
                <Languages className="w-5 h-5"/>
                <span className="font-bold uppercase">{language}</span>
            </button>

            <div className="z-10 w-full max-w-4xl px-4 animate-fade-in flex flex-col items-center justify-between min-h-[80vh]">
                 <div className="text-center relative mt-10">
                     <div className="absolute -inset-10 bg-blue-600/10 blur-3xl -z-10 rounded-full"></div>
                     <h1 className="text-6xl md:text-8xl font-black text-white font-logo tracking-tight mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                        {t('appName')}
                     </h1>
                     <p className="text-blue-100 text-2xl font-light drop-shadow-md bg-blue-900/30 px-6 py-2 rounded-full backdrop-blur-sm inline-block border border-blue-400/30">
                         {t('slogan')}
                     </p>
                     
                     <div className="flex flex-wrap gap-4 mt-6 justify-center">
                         <div className="flex items-center gap-2 bg-blue-800/40 px-3 py-1 rounded-full text-blue-200 text-sm backdrop-blur-sm border border-blue-500/30">
                             <CheckCircle className="w-3 h-3"/> <span>QCM & Images</span>
                         </div>
                         <div className="flex items-center gap-2 bg-blue-800/40 px-3 py-1 rounded-full text-blue-200 text-sm backdrop-blur-sm border border-blue-500/30">
                             <PenTool className="w-3 h-3"/> <span>Rédaction & Appariement</span>
                         </div>
                         <div className="flex items-center gap-2 bg-blue-800/40 px-3 py-1 rounded-full text-blue-200 text-sm backdrop-blur-sm border border-blue-500/30">
                             <Brain className="w-3 h-3"/> <span>Correction IA</span>
                         </div>
                     </div>
                 </div>

                 <div className="w-full max-w-md space-y-4 my-10">
                     <button 
                        onClick={() => navigate('/login/student')}
                        className="w-full bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20 p-8 rounded-2xl transition-all transform hover:-translate-y-2 group shadow-2xl hover:shadow-blue-500/20 flex flex-col items-center text-center"
                     >
                         <div className="bg-blue-500 rounded-full w-20 h-20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg group-hover:bg-blue-400 ring-4 ring-blue-500/30">
                             <GraduationCap className="w-10 h-10 text-white" />
                         </div>
                         <h2 className="text-2xl font-bold text-white mb-1 font-logo">{t('studentSpace')}</h2>
                         <p className="text-blue-200 text-sm font-light">{t('studentDesc')}</p>
                     </button>
                     
                     <div className="text-center">
                        <p className="text-blue-300 text-xs mb-2 uppercase tracking-widest opacity-70">Licence Libre & Protégée</p>
                        <a href="https://github.com/LahcenOub/tinmel-lms" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-white/50 text-xs hover:text-white transition-colors cursor-pointer">
                             <Github className="w-4 h-4" />
                             <span>Open Source Project (MIT License)</span>
                             <ExternalLink className="w-3 h-3 opacity-50" />
                        </a>
                     </div>
                 </div>

                 <div className="w-full border-t border-white/10 pt-6 flex flex-col items-center text-white/40 text-xs gap-4">
                     <button onClick={() => navigate('/login/staff')} className="hover:text-white transition-colors flex items-center gap-2">
                         <ShieldCheck className="w-3 h-3" />
                         Espace Professeur / Coordinateur
                     </button>
                     <p className="flex items-center gap-2">
                         © {new Date().getFullYear()} Tinmel. 
                         <span className="text-blue-300 font-bold">🇲🇦 La 1ère brique d'un LMS Open Source Marocain.</span>
                     </p>
                 </div>
            </div>
        </div>
    );
};

interface LoginProps {
    role: 'STUDENT' | 'STAFF' | 'ADMIN';
    onLoginSuccess: (user: User) => void;
}

const LoginPage: React.FC<LoginProps> = ({ role, onLoginSuccess }) => {
    const { t, dir } = useLanguage();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        const foundUser = await ApiService.login(username, password);
        const localUser = !foundUser ? StorageService.login(username, password) : null;
        const finalUser = foundUser || localUser;

        if (finalUser) {
            if (role === 'STUDENT' && finalUser.role !== UserRole.STUDENT) {
                setError(t('invalidCreds'));
                return;
            }
            if (role === 'STAFF' && finalUser.role === UserRole.STUDENT) {
                 setError(t('accessDenied'));
                 return;
            }
            if (role === 'ADMIN' && finalUser.role !== UserRole.ADMIN) {
                 setError("Accès réservé aux Administrateurs.");
                 return;
            }
            onLoginSuccess(finalUser);
        } else {
            setError(t('invalidCreds'));
        }
    };

    if (role === 'ADMIN') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="z-10 w-full max-w-md px-4 animate-fade-in">
                    <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
                        <div className="bg-slate-800 p-8 text-center border-b border-slate-700">
                            <Server className="w-12 h-12 text-blue-400 mx-auto mb-4"/>
                            <h1 className="text-2xl font-bold text-white mb-1">Administration Centrale</h1>
                            <p className="text-slate-400 text-sm">Accès sécurisé réservé</p>
                        </div>
                        <div className="p-8">
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">{t('username')}</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-slate-500 transition shadow-sm"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">{t('password')}</label>
                                <input
                                    type="password"
                                    className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-slate-500 transition shadow-sm"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded border border-red-200 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4"/> {error}
                                </div>
                            )}
                            <button type="submit" className="w-full py-3 px-4 bg-slate-800 text-white font-bold rounded hover:bg-slate-900 transition shadow-lg">
                                {t('login')}
                            </button>
                        </form>
                        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col gap-2">
                                <button onClick={() => navigate('/')} className="text-center text-xs text-blue-500 hover:underline mt-2">
                                    &larr; Retour au portail public
                                </button>
                        </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-blue-900 flex items-center justify-center relative overflow-hidden" dir={dir}>
            <CalligraphyBackground />
            <div className="z-10 w-full max-w-md px-4 animate-fade-in">
                <button onClick={() => navigate('/')} className="text-white/80 hover:text-white mb-6 flex items-center gap-2 transition hover:-translate-x-1">
                    <ArrowLeft className="w-5 h-5 rtl:flip"/> {t('back')}
                </button>

                <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/50">
                    <div className={`p-8 ${role === 'STUDENT' ? 'bg-gradient-to-r from-blue-600 to-blue-500' : 'bg-gradient-to-r from-gray-900 to-gray-800'} text-white text-center`}>
                         {role === 'STUDENT' ? <GraduationCap className="w-12 h-12 mx-auto mb-2 drop-shadow-md"/> : <Building2 className="w-12 h-12 mx-auto mb-2 drop-shadow-md"/>}
                         <h2 className="text-2xl font-bold mb-1">{role === 'STUDENT' ? t('loginStudent') : t('loginStaff')}</h2>
                         <p className="text-white/80 text-sm">{role === 'STUDENT' ? t('studentDesc') : t('staffDesc')}</p>
                    </div>
                    
                    <form onSubmit={handleLogin} className="p-8 space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">{t('username')}</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">{t('password')}</label>
                            <input
                                type="password"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                         {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded border border-red-200 flex items-center gap-2 animate-fade-in">
                                <AlertTriangle className="w-4 h-4"/> {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className={`w-full py-4 px-4 font-bold rounded-lg text-white transition transform hover:scale-[1.02] shadow-lg flex justify-center items-center gap-2 ${role === 'STUDENT' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-800 hover:bg-gray-900'}`}
                        >
                            {t('login')} {role === 'STUDENT' ? <ArrowLeft className="w-5 h-5 rotate-180 rtl:rotate-0"/> : <Lock className="w-4 h-4"/>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

// --- MAIN APP COMPONENT ---

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoLaunchQuizId, setAutoLaunchQuizId] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
      const init = async () => {
          setLoading(true);
          
          // 1. Check Install Status
          try {
              const installStatus = await ApiService.checkInstallStatus();
              setIsInstalled(installStatus);
              
              if (!installStatus) {
                  setLoading(false);
                  return; // Stop here if not installed, show Wizard
              }
          } catch (e) {
              console.warn("Could not check install status", e);
              setIsInstalled(false); // Default to not installed on error
              setLoading(false);
              return;
          }

          // 2. Check Session
          const apiUser = await ApiService.checkSession();
          if (apiUser) {
              setUser(apiUser);
          } else {
              const session = StorageService.getSession();
              if (session) setUser(session);
          }
          
          const params = new URLSearchParams(window.location.search);
          const qId = params.get('quizId');
          if (qId) setAutoLaunchQuizId(qId);
          
          setLoading(false);
      };
      init();
  }, []);

  const getDashboardPath = (role: UserRole) => {
      switch(role) {
          case UserRole.ADMIN: return '/admin';
          case UserRole.PROFESSOR: return '/professor';
          case UserRole.STUDENT: return '/student';
          case UserRole.COORDINATOR: return '/coordinator';
          case UserRole.MODERATOR: return '/moderator';
          default: return '/';
      }
  };

  const handleLoginSuccess = (loggedInUser: User) => {
      StorageService.saveSession(loggedInUser);
      setUser(loggedInUser);
      navigate(getDashboardPath(loggedInUser.role));
  };

  const handleLogout = async () => {
      await ApiService.logout();
      StorageService.clearSession();
      setUser(null);
      navigate('/');
  };

  if (loading) {
      return (
          <div className="min-h-screen bg-blue-900 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-12 h-12 text-white animate-spin" />
                  <p className="text-blue-200 text-sm font-medium">Initialisation du système...</p>
              </div>
          </div>
      );
  }

  // Si pas installé, afficher le Wizard
  if (isInstalled === false) {
      return <InstallationWizard onInstalled={() => { setIsInstalled(true); window.location.reload(); }} />;
  }

  return (
    <Routes>
        {/* Public Routes */}
        <Route path="/" element={!user ? <LandingPage /> : <Navigate to={getDashboardPath(user.role)} replace />} />
        
        <Route path="/login/student" element={
            !user ? <LoginPage role="STUDENT" onLoginSuccess={handleLoginSuccess} /> : <Navigate to={getDashboardPath(user.role)} replace />
        } />
        
        <Route path="/login/staff" element={
            !user ? <LoginPage role="STAFF" onLoginSuccess={handleLoginSuccess} /> : <Navigate to={getDashboardPath(user.role)} replace />
        } />

        {/* Admin Portal Route (Legacy/Direct) */}
        <Route path="/tinmelad/*" element={
            !user ? <LoginPage role="ADMIN" onLoginSuccess={handleLoginSuccess} /> : 
            (user.role === UserRole.ADMIN ? <Navigate to="/admin" replace /> : <Navigate to="/" replace />)
        } />

        {/* Protected Routes */}
        <Route path="/admin/*" element={<AuthGuard user={user} requiredRole={UserRole.ADMIN}><AdminDashboard onLogout={handleLogout} /></AuthGuard>} />
        <Route path="/professor/*" element={<AuthGuard user={user} requiredRole={UserRole.PROFESSOR}><ProfessorDashboard user={user!} onLogout={handleLogout} /></AuthGuard>} />
        <Route path="/student/*" element={<AuthGuard user={user} requiredRole={UserRole.STUDENT}><StudentDashboard user={user!} onLogout={handleLogout} autoLaunchQuizId={autoLaunchQuizId} /></AuthGuard>} />
        <Route path="/coordinator/*" element={<AuthGuard user={user} requiredRole={UserRole.COORDINATOR}><CoordinatorDashboard user={user!} onLogout={handleLogout} /></AuthGuard>} />
        <Route path="/moderator/*" element={<AuthGuard user={user} requiredRole={UserRole.MODERATOR}><ModeratorDashboard user={user!} onLogout={handleLogout} /></AuthGuard>} />

        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    </LanguageProvider>
  );
};

export default App;
