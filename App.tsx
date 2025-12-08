import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole } from './types';
import { StorageService } from './services/storageService';
import { ApiService } from './services/apiService';
import AdminDashboard from './components/Dashboards/AdminDashboard';
import ProfessorDashboard from './components/Dashboards/ProfessorDashboard';
import StudentDashboard from './components/Dashboards/StudentDashboard';
import ModeratorDashboard from './components/Dashboards/ModeratorDashboard';
import CoordinatorDashboard from './components/Dashboards/CoordinatorDashboard';
import { GraduationCap, ArrowLeft, Languages, Building2, AlertTriangle, Loader2, CheckCircle, Lock, Database, ShieldCheck } from 'lucide-react';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

type ViewState = 'LANDING' | 'LOGIN_STUDENT' | 'LOGIN_STAFF' | 'DASHBOARD' | 'INSTALL';

// Background Component
const CalligraphyBackground = () => {
    const elements = useMemo(() => {
        const items = [];
        const chars = [
            'ا', 'ب', 'ح', 'د', 'ر', 'س', 'ص', 'ط', 'ع', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي',
            'أ', 'إ', 'آ', 'ة', 'ث', 'ج', 'خ', 'ذ', 'ز', 'ش', 'ض', 'ظ', 'غ', 'ف',
            'ⴰ', 'ⴱ', 'ⴳ', 'ⴷ', 'ⴹ', 'ⴻ', 'ⴼ', 'ⴽ', 'ⵀ', 'ⵃ', 'ⵄ', 'ⵅ', 'ⵇ', 'ⵉ', 'ⵊ', 'ⵍ', 'ⵎ', 'ⵏ', 'ⵓ', 'ⵔ', 'ⵕ', 'ⵖ', 'ⵙ', 'ⵚ', 'ⵛ', 'ⵜ', 'ⵟ', 'ⵡ', 'ⵢ', 'ⵣ', 'ⵥ',
            'تينمل', 'ⵜⵉⵏⵎⴻⵍ', 'ⵉⵇⵔⴰ', 'إقرأ', 'ⴰⵍⵎⵓⴷ', 'علم', 'ⵜⴰⵎⵓⵙⵏⵉ'
        ];

        for (let i = 0; i < 45; i++) {
            items.push({
                char: chars[Math.floor(Math.random() * chars.length)],
                top: Math.random() * 100,
                left: Math.random() * 100,
                rotate: (Math.random() * 60) - 30, 
                size: Math.random() * 12 + 6, 
                font: Math.random() > 0.5 ? 'Amiri' : 'sans-serif' 
            });
        }
        return items;
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none bg-blue-900">
            {elements.map((el, i) => (
                <div key={i} style={{
                    position: 'absolute',
                    top: `${el.top}%`,
                    left: `${el.left}%`,
                    transform: `translate(-50%, -50%) rotate(${el.rotate}deg)`,
                    fontSize: `${el.size}rem`,
                    fontFamily: el.font === 'Amiri' ? '"Amiri", serif' : 'sans-serif',
                    color: 'rgba(255, 255, 255, 0.05)',
                    zIndex: 0,
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                    filter: 'blur(1px)'
                }}>
                    {el.char}
                </div>
            ))}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/40 via-blue-900/60 to-blue-900/90 z-0"></div>
        </div>
    );
};

// --- INSTALLATION WIZARD COMPONENT ---
const InstallationWizard: React.FC<{ onInstalled: () => void }> = ({ onInstalled }) => {
    const { t, dir } = useLanguage();
    const [formData, setFormData] = useState({
        schoolName: '',
        name: 'Administrateur',
        username: 'admin',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        const success = await ApiService.installApp(formData);
        
        setLoading(false);
        if (success) {
            onInstalled();
        } else {
            setError(t('installError'));
        }
    };

    return (
        <div className="z-50 w-full max-w-lg px-4" dir={dir}>
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/50 animate-fade-in">
                <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-8 text-white text-center">
                    <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <Database className="w-8 h-8 text-white"/>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">{t('installTitle')}</h2>
                    <p className="text-blue-100 text-sm">{t('installDesc')}</p>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded border border-red-200 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4"/> {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">{t('siteName')}</label>
                            <input
                                required
                                type="text"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.schoolName}
                                onChange={e => setFormData({...formData, schoolName: e.target.value})}
                                placeholder="Ex: École Al Massira"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">{t('adminUsername')}</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.username}
                                    onChange={e => setFormData({...formData, username: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">{t('adminPassword')}</label>
                                <input
                                    required
                                    type="password"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.password}
                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition transform hover:scale-[1.02] shadow-lg flex justify-center items-center gap-2"
                    >
                        {loading ? t('loading') : <>{t('installBtn')} <CheckCircle className="w-5 h-5 rtl:flip"/></>}
                    </button>
                </form>
            </div>
        </div>
    );
};

const AppContent: React.FC = () => {
  const { t, language, setLanguage, dir } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('LANDING');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [autoLaunchQuizId, setAutoLaunchQuizId] = useState<string | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Check Installation Status
  useEffect(() => {
      const check = async () => {
          setIsLoading(true);
          const installed = await ApiService.checkInstallStatus();
          setIsInstalled(installed);
          if (!installed) {
              setView('INSTALL');
          } else {
              // If installed and not already on a specific view, go to landing
              setView(v => v === 'INSTALL' ? 'LANDING' : v);
          }
          setIsLoading(false);
      };
      check();
  }, []);

  // 2. Auto-Restore Session
  useEffect(() => {
      const sessionUser = StorageService.getSession();
      if (sessionUser) {
          setUser(sessionUser);
          setView('DASHBOARD');
      }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qId = params.get('quizId');
    if (qId) {
      setAutoLaunchQuizId(qId);
      const currentUser = StorageService.getSession();
      if (!currentUser && isInstalled) setView('LOGIN_STUDENT'); 
    }
  }, [isInstalled]);

  const handleLogin = async (e: React.FormEvent, targetRole: 'STUDENT' | 'STAFF') => {
    e.preventDefault();
    setError('');
    
    // TRY API LOGIN (Backend)
    const foundUser = await ApiService.login(username, password);
    
    // Fallback to local storage if API fails (pure local mode or legacy)
    const localUser = !foundUser ? StorageService.login(username, password) : null;
    
    const finalUser = foundUser || localUser;

    if (finalUser) {
        if (targetRole === 'STUDENT' && finalUser.role !== UserRole.STUDENT) {
            setError(t('invalidCreds'));
            return;
        }
        if (targetRole === 'STAFF' && finalUser.role === UserRole.STUDENT) {
             setError(t('accessDenied'));
             return;
        }

      // Sync API user to local session for persistence
      StorageService.saveSession(finalUser);
      // Also cache user in localStorage for offline capabilities in dashboards
      StorageService.saveUser(finalUser); 

      setUser(finalUser);
      setView('DASHBOARD');
    } else {
      setError(t('invalidCreds'));
    }
  };

  const handleLogout = () => {
    StorageService.clearSession();
    setUser(null);
    setUsername('');
    setPassword('');
    setView('LANDING');
    setError('');
  };

  const toggleLanguage = () => {
      setLanguage(language === 'fr' ? 'ar' : 'fr');
  };

  const renderDashboard = () => {
    if (!user) return null;
    switch (user.role) {
        case UserRole.ADMIN:
          return <AdminDashboard onLogout={handleLogout} />;
        case UserRole.MODERATOR:
          return <ModeratorDashboard user={user} onLogout={handleLogout} />;
        case UserRole.COORDINATOR:
          return <CoordinatorDashboard user={user} onLogout={handleLogout} />;
        case UserRole.PROFESSOR:
          return <ProfessorDashboard user={user} onLogout={handleLogout} />;
        case UserRole.STUDENT:
          return <StudentDashboard user={user} onLogout={handleLogout} autoLaunchQuizId={autoLaunchQuizId} />;
        default:
          return <div>Role inconnu</div>;
    }
  };

  if (view === 'DASHBOARD' && user) {
      return renderDashboard();
  }

  // Show loading spinner while checking install status
  if (isLoading) {
      return (
          <div className="min-h-screen bg-blue-900 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center relative overflow-hidden" dir={dir}>
        
        <CalligraphyBackground />
        
        {/* Language Toggle */}
        <button 
            onClick={toggleLanguage}
            className="absolute top-6 right-6 z-50 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full backdrop-blur-md flex items-center gap-2 transition border border-white/20"
        >
            <Languages className="w-5 h-5"/>
            <span className="font-bold uppercase">{language}</span>
        </button>

        {/* INSTALL WIZARD */}
        {view === 'INSTALL' && (
            <InstallationWizard onInstalled={() => { setIsInstalled(true); setView('LANDING'); }} />
        )}

        {/* LANDING PAGE - STUDENT FOCUSED */}
        {view === 'LANDING' && (
            <div className="z-10 w-full max-w-4xl px-4 animate-fade-in flex flex-col items-center">
                 <div className="mb-12 text-center relative">
                     <div className="absolute -inset-10 bg-blue-600/30 blur-3xl -z-10 rounded-full"></div>
                     <h1 className="text-6xl md:text-8xl font-black text-white font-logo tracking-tight mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                        {t('appName')}
                     </h1>
                     <p className="text-blue-100 text-2xl font-light drop-shadow-md bg-blue-900/30 px-4 py-1 rounded-full backdrop-blur-sm inline-block border border-blue-400/30">
                         {t('slogan')}
                     </p>
                 </div>

                 {/* MAIN ACTION: STUDENT LOGIN */}
                 <button 
                    onClick={() => { setView('LOGIN_STUDENT'); setError(''); }}
                    className="bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20 p-8 rounded-2xl transition-all transform hover:-translate-y-2 group shadow-2xl hover:shadow-blue-500/20 flex flex-col items-center text-center w-full max-w-md"
                 >
                     <div className="bg-blue-500 rounded-full w-24 h-24 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg group-hover:bg-blue-400 ring-4 ring-blue-500/30">
                         <GraduationCap className="w-12 h-12 text-white" />
                     </div>
                     <h2 className="text-3xl font-bold text-white mb-2 font-logo">{t('studentSpace')}</h2>
                     <p className="text-blue-100 text-sm font-light leading-relaxed">{t('studentDesc')}</p>
                 </button>

                 {/* DISCREET ADMIN LINK - FIXED AT BOTTOM */}
                 <div className="fixed bottom-6 left-0 right-0 text-center">
                     <button 
                        onClick={() => { setView('LOGIN_STAFF'); setError(''); }}
                        className="text-white/40 hover:text-white/90 transition-colors text-sm flex items-center gap-2 mx-auto px-4 py-2 rounded hover:bg-white/5"
                     >
                         <ShieldCheck className="w-4 h-4" />
                         <span className="font-medium tracking-wide">
                             Administration & Enseignants
                         </span>
                     </button>
                 </div>
            </div>
        )}

        {/* LOGIN FORMS */}
        {(view === 'LOGIN_STUDENT' || view === 'LOGIN_STAFF') && (
            <div className="z-10 w-full max-w-md px-4 animate-fade-in">
                <button 
                    onClick={() => { setView('LANDING'); setUsername(''); setPassword(''); }} 
                    className="text-white/80 hover:text-white mb-6 flex items-center gap-2 transition hover:-translate-x-1"
                >
                    <ArrowLeft className="w-5 h-5 rtl:flip"/> {t('back')}
                </button>

                <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/50">
                    <div className={`p-8 ${view === 'LOGIN_STUDENT' ? 'bg-gradient-to-r from-blue-600 to-blue-500' : 'bg-gradient-to-r from-gray-900 to-gray-800'} text-white text-center`}>
                         {view === 'LOGIN_STUDENT' ? <GraduationCap className="w-12 h-12 mx-auto mb-2 drop-shadow-md"/> : <Building2 className="w-12 h-12 mx-auto mb-2 drop-shadow-md"/>}
                         <h2 className="text-2xl font-bold font-logo tracking-wide">
                             {view === 'LOGIN_STUDENT' ? t('loginStudent') : t('loginStaff')}
                         </h2>
                    </div>

                    <div className="p-8">
                        <form onSubmit={(e) => handleLogin(e, view === 'LOGIN_STUDENT' ? 'STUDENT' : 'STAFF')} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">{t('username')}</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">{t('password')}</label>
                                <input
                                    type="password"
                                    className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            
                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded border border-red-200 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4"/> {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className={`w-full py-3 px-4 text-white font-bold rounded-lg transition transform hover:scale-[1.02] shadow-lg ${view === 'LOGIN_STUDENT' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-800 hover:bg-gray-900'}`}
                            >
                                {t('login')}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

const App: React.FC = () => (
    <LanguageProvider>
        <AppContent />
    </LanguageProvider>
);

export default App;