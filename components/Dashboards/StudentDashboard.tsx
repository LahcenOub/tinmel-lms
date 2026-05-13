import React, { useState, useEffect } from 'react';
import { User, Quiz, Lesson, WhiteboardSession, QuizResult } from '../../types';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { StorageService } from '../../services/storageService';
import { ApiService } from '../../services/apiService';
import { useLanguage } from '../../contexts/LanguageContext';
import { useUnreadCount } from '../../hooks/useUnreadCount';
import { useNetworkMode } from '../../contexts/NetworkModeContext';
import { HeaderBackground } from '../HeaderBackground';
import { LayoutDashboard, CheckCircle, BookOpen, PenTool, User as UserIcon, LogOut, Search, Clock, Award, PlayCircle, MessageCircle, FileText, Video, Radio, Leaf, Lock } from 'lucide-react';
import QuizTaker from '../Quiz/QuizTaker';
import WhiteboardRoom from '../Whiteboard/WhiteboardRoom';
import { MessagesView } from '../Messages/MessagesView';

interface Props {
  user: User;
  onLogout: () => void;
  autoLaunchQuizId: string | null;
}

const StudentDashboard: React.FC<Props> = ({ user, onLogout, autoLaunchQuizId }) => {
    const { t, dir } = useLanguage();
    const location = useLocation();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
    const [activeWhiteboardCode, setActiveWhiteboardCode] = useState<string | null>(null);
    const totalUnread = useUnreadCount(user.id);
    const { loraQueue, ecoPoints, mode } = useNetworkMode();

    const isActive = (path: string) => location.pathname.includes(`/student/${path}`);

    useEffect(() => {
        // Load assigned quizzes
        const allQuizzes = StorageService.getQuizzes();
        const myQuizzes = allQuizzes.filter(q => 
            q.status === 'PUBLISHED' && 
            user.enrolledClasses?.some(cls => q.assignedClasses.includes(cls))
        );
        setQuizzes(myQuizzes);

        // Load lessons
        const allLessons = StorageService.getLessons();
        const myLessons = allLessons.filter(l => 
            l.status === 'PUBLISHED' && 
            user.enrolledClasses?.some(cls => l.assignedClasses.includes(cls))
        );
        setLessons(myLessons);

        // Load upcoming events
        const allEvents = StorageService.getEvents();
        const myEvents = allEvents.filter(e => 
            user.enrolledClasses?.some(cls => e.assignedClasses?.includes(cls)) &&
            new Date(e.date).getTime() >= new Date().setHours(0,0,0,0) // Today or future
        ).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setEvents(myEvents);

        if (autoLaunchQuizId) {
            const quiz = myQuizzes.find(q => q.id === autoLaunchQuizId);
            if (quiz) setActiveQuiz(quiz);
        }
    }, [user, autoLaunchQuizId]);

    const handleJoinWhiteboard = (code: string) => {
        if (!code) return;
        setActiveWhiteboardCode(code.trim());
    };

    if (activeQuiz) {
        return <QuizTaker quiz={activeQuiz} studentId={user.id} studentName={user.name} onComplete={() => setActiveQuiz(null)} />;
    }

    if (activeWhiteboardCode) {
        return <WhiteboardRoom user={user} accessKey={activeWhiteboardCode} onExit={() => setActiveWhiteboardCode(null)} />;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex" dir={dir}>
             <aside className="w-64 bg-white border-r hidden md:flex flex-col z-10">
                <div className="p-6 border-b flex items-center gap-3 bg-blue-600 text-white">
                     <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                        <UserIcon className="w-6 h-6 text-white"/>
                    </div>
                    <div>
                        <h1 className="font-bold font-logo text-lg tracking-tight">Tinmel</h1>
                        <p className="text-xs text-blue-200">{t('studentSpace')}</p>
                    </div>
                </div>
                 <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                     {[
                        { id: 'overview', icon: LayoutDashboard, label: t('dashboard') },
                        { id: 'lessons', icon: BookOpen, label: t('myCourses') || 'Mes Cours' },
                        { id: 'quizzes', icon: CheckCircle, label: t('myQuizzes') },
                        { id: 'whiteboard', icon: PenTool, label: t('whiteboard') },
                        { id: 'messages', icon: MessageCircle, label: t('messages'), badge: totalUnread > 0 ? totalUnread : null },
                    ].map(item => (
                        <Link 
                            key={item.id}
                            to={`/student/${item.id}`}
                            className={`flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive(item.id) ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'}`}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className="w-5 h-5"/> {item.label}
                            </div>
                            {item.badge && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{item.badge}</span>}
                        </Link>
                    ))}
                </nav>
                 <div className="p-4 border-t">
                     <button onClick={onLogout} className="flex items-center gap-2 text-red-600 hover:bg-red-50 w-full px-4 py-2 rounded-lg transition-colors text-sm font-medium">
                        <LogOut className="w-4 h-4 rtl:flip"/> {t('logout')}
                    </button>
                </div>
            </aside>

             <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                 <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0 relative z-0">
                     <HeaderBackground color="37, 99, 235" />
                     <h2 className="font-bold text-gray-800 text-xl relative z-10">{t('welcome')}, {user.name}</h2>
                     <div className="relative z-10 flex items-center gap-4">
                        {ecoPoints > 0 && (
                            <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200">
                                <Leaf className="w-4 h-4" />
                                <span className="font-bold text-sm">{ecoPoints} Éco-Points</span>
                            </div>
                        )}
                        {mode === 'LORAWAN' && loraQueue.length > 0 && (
                            <div className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full border border-purple-200">
                                <Radio className="w-4 h-4 animate-pulse" />
                                <span className="text-sm font-medium">{loraQueue.filter(q => q.status === 'PENDING').length} en attente LoRa</span>
                            </div>
                        )}
                     </div>
                 </header>
                 <div className="flex-1 overflow-auto p-6 z-0">
                    <Routes>
                        <Route path="overview" element={
                            <div className="grid gap-6">
                                <div className="bg-blue-600 text-white p-6 rounded-xl shadow-lg">
                                    <h3 className="text-xl font-bold mb-2">Prêt à apprendre ?</h3>
                                    <p className="text-blue-100">Vous avez {quizzes.length} quiz disponibles.</p>
                                </div>
                                
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-orange-500" />
                                        <h3 className="font-bold text-gray-800">Rappels & Événements</h3>
                                    </div>
                                    <div className="p-0">
                                        {events.length === 0 ? (
                                            <div className="p-6 text-center text-gray-500 text-sm">Aucun événement prévu.</div>
                                        ) : (
                                            <div className="divide-y">
                                                {events.map(evt => (
                                                    <div key={evt.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                                                        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex flex-col items-center justify-center shrink-0">
                                                            <span className="text-xs font-bold uppercase">{new Date(evt.date).toLocaleString('fr-FR', { month: 'short' })}</span>
                                                            <span className="text-lg font-bold leading-none">{new Date(evt.date).getDate()}</span>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-800">{evt.title}</h4>
                                                            <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                                                <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">{evt.type}</span>
                                                                {(evt.type === 'EXAM' || evt.type === 'TEST') && (
                                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${evt.examMode === 'ONLINE' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                                                        {evt.examMode === 'ONLINE' ? 'En ligne' : 'En classe'}
                                                                    </span>
                                                                )}
                                                                <span>• {new Date(evt.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                                <span>• Prof. {evt.professorName}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        } />
                        <Route path="quizzes" element={
                            <div className="grid gap-4">
                                {quizzes.map(q => {
                                    const hasCompleted = StorageService.getResults().some(r => r.studentId === user.id && r.quizId === q.id);
                                    
                                    return (
                                    <div key={q.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center">
                                        <div>
                                            <h4 className="font-bold text-gray-800">{q.title} {q.accessCode ? <Lock className="inline w-3 h-3 text-gray-400" /> : null}</h4>
                                            <p className="text-sm text-gray-500">{q.questions.length} questions</p>
                                        </div>
                                        {hasCompleted ? (
                                            <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1">
                                                <CheckCircle className="w-4 h-4" /> {t('completed') || 'Terminé'}
                                            </span>
                                        ) : (
                                            <button 
                                                onClick={() => {
                                                    if (q.accessCode) {
                                                        const code = window.prompt("Entrez le code d'accès pour ce quiz :");
                                                        if (code === q.accessCode) {
                                                            setActiveQuiz(q);
                                                        } else if (code !== null) {
                                                            window.alert("Code d'accès incorrect.");
                                                        }
                                                    } else {
                                                        setActiveQuiz(q);
                                                    }
                                                }} 
                                                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700"
                                            >
                                                {t('start') || 'Démarrer'}
                                            </button>
                                        )}
                                    </div>
                                    );
                                })}
                                {quizzes.length === 0 && <p className="text-gray-500 text-center">{t('noData')}</p>}
                            </div>
                        } />
                        <Route path="lessons" element={
                            <div className="grid gap-4">
                                {lessons.map(l => (
                                    <div key={l.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                                                {l.type === 'VIDEO' ? <PlayCircle className="w-5 h-5"/> : l.type === 'DOCUMENT' ? <FileText className="w-5 h-5"/> : <BookOpen className="w-5 h-5"/>}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800">{l.title}</h4>
                                                <p className="text-sm text-gray-500 line-clamp-1">{l.description || 'Ouvrir pour voir les détails'}</p>
                                            </div>
                                        </div>
                                        <a href={l.contentUrl} target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 whitespace-nowrap ml-4">
                                            {t('open') || 'Ouvrir'}
                                        </a>
                                    </div>
                                ))}
                                {lessons.length === 0 && <p className="text-gray-500 text-center">{t('noCourses') || 'Aucun cours disponible.'}</p>}
                            </div>
                        } />
                        <Route path="whiteboard" element={
                            <div className="flex flex-col items-center justify-center h-full space-y-4">
                                <h2 className="text-2xl font-bold text-gray-800">{t('joinWhiteboard')}</h2>
                                <p className="text-gray-500">{t('enterWbKey')}</p>
                                <div className="flex gap-2">
                                    <input 
                                        className="border rounded-lg p-3 text-center tracking-widest font-mono text-xl uppercase"
                                        placeholder="CODE"
                                        maxLength={6}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleJoinWhiteboard((e.target as HTMLInputElement).value);
                                        }}
                                    />
                                </div>
                                <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700">
                                    {t('enter')}
                                </button>
                            </div>
                        } />
                        <Route path="messages" element={<MessagesView user={user} />} />
                        <Route path="*" element={<Navigate to="overview" replace />} />
                    </Routes>
                 </div>
             </main>
        </div>
    );
};

export default StudentDashboard;
