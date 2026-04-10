import React, { useState, useEffect } from 'react';
import { User, UserRole, Quiz, Lesson, WhiteboardSession, Message } from '../../types';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { StorageService } from '../../services/storageService';
import { ApiService } from '../../services/apiService';
import { useLanguage } from '../../contexts/LanguageContext';
import { LayoutDashboard, BookOpen, PenTool, MessageCircle, User as UserIcon, LogOut, Plus, CalendarClock, MonitorPlay, Key, Users, Trash2, X, PlayCircle, Settings, ChevronRight } from 'lucide-react';
import QuizBuilder from '../Quiz/QuizBuilder';
import WhiteboardRoom from '../Whiteboard/WhiteboardRoom';

interface Props {
  user: User;
  onLogout: () => void;
}

// Sub-components
const QuizzesView: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLanguage();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    
    // Get assigned classes from Coordinator (or legacy fallback)
    const availableClasses = user.assignedSections && user.assignedSections.length > 0 
        ? user.assignedSections 
        : (user.class ? [user.class] : []);

    useEffect(() => {
        setQuizzes(StorageService.getQuizzes().filter(q => q.professorId === user.id));
    }, [user.id]);

    const handleSaveQuiz = (quiz: Quiz) => {
        StorageService.saveQuiz(quiz);
        setQuizzes(prev => [...prev.filter(q => q.id !== quiz.id), quiz]);
        setIsCreating(false);
    };

    const handleDeleteQuiz = (id: string) => {
        if(confirm(t('delete') + '?')) {
            StorageService.deleteQuiz(id);
            setQuizzes(prev => prev.filter(q => q.id !== id));
        }
    };

    if (isCreating) {
        return <QuizBuilder profId={user.id} availableClasses={availableClasses} onSave={handleSaveQuiz} onCancel={() => setIsCreating(false)} />;
    }

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-bold text-gray-800">{t('myQuizzes')}</h2>
                 <button onClick={() => setIsCreating(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-sm">
                     <Plus className="w-5 h-5"/> {t('createQuiz')}
                 </button>
             </div>
             <div className="grid gap-4">
                 {quizzes.length === 0 && <p className="text-gray-500 text-center py-10 bg-gray-50 rounded-lg">{t('noData')}</p>}
                 {quizzes.map(q => (
                     <div key={q.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center group">
                         <div>
                             <h3 className="font-bold text-lg text-gray-800">{q.title}</h3>
                             <p className="text-sm text-gray-500">{q.questions.length} {t('questionsCount')} • {q.assignedClasses.join(', ')}</p>
                         </div>
                         <div className="flex items-center gap-3">
                             <span className={`px-2 py-1 rounded text-xs font-bold ${q.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                 {t(q.status.toLowerCase())}
                             </span>
                             <button onClick={() => handleDeleteQuiz(q.id)} className="text-gray-400 hover:text-red-500 p-2"><Trash2 className="w-5 h-5"/></button>
                         </div>
                     </div>
                 ))}
             </div>
        </div>
    );
};

const WhiteboardManagerView: React.FC<{ user: User, onStartSession: (session: WhiteboardSession) => void }> = ({ user, onStartSession }) => {
    const { t } = useLanguage();
    const [sessions, setSessions] = useState<WhiteboardSession[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    
    // Create Form State
    const [title, setTitle] = useState('');
    const [mode, setMode] = useState<'INSTANT' | 'SCHEDULED'>('INSTANT');
    const [scheduledAt, setScheduledAt] = useState('');
    const [inviteType, setInviteType] = useState<'CLASS' | 'STUDENT'>('CLASS');
    const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [availableStudents, setAvailableStudents] = useState<User[]>([]);
    const [sendInvite, setSendInvite] = useState(true); // Option pour envoyer invitation

    useEffect(() => {
        setSessions(StorageService.getWhiteboardsByProf(user.id));
        setTitle(`Cours de ${user.name}`);
        
        // Load students for manual selection safely
        const loadStudents = async () => {
            const all = await ApiService.getUsers();
            if (all && Array.isArray(all)) {
                // Filter students in the same school
                const filtered = all.filter(u => u.role === UserRole.STUDENT && u.school === user.school && u.city === user.city);
                setAvailableStudents(filtered);
            }
        };
        loadStudents();
    }, [user.id, user.name, user.school, user.city]);

    const handleCreate = () => {
        if (!title.trim()) return alert("Titre requis");
        if (inviteType === 'CLASS' && selectedClasses.length === 0) return alert("Sélectionnez au moins une classe");
        if (inviteType === 'STUDENT' && selectedStudents.length === 0) return alert("Sélectionnez au moins un étudiant");
        if (mode === 'SCHEDULED' && !scheduledAt) return alert("Date requise");

        const key = Math.random().toString(36).substring(2, 8).toUpperCase();
        const newSession: WhiteboardSession = {
            id: `wb-${Date.now()}`,
            hostId: user.id,
            hostName: user.name,
            title,
            accessKey: key,
            status: mode === 'INSTANT' ? 'LIVE' : 'SCHEDULED',
            scheduledAt: mode === 'SCHEDULED' ? scheduledAt : undefined,
            isActive: mode === 'INSTANT',
            createdAt: new Date().toISOString(),
            assignedClasses: inviteType === 'CLASS' ? selectedClasses : [],
            invitedStudentIds: inviteType === 'STUDENT' ? selectedStudents : undefined,
            strokes: [],
            messages: []
        };

        StorageService.saveWhiteboard(newSession);
        
        // --- LOGIQUE D'ENVOI D'INVITATIONS ---
        if (sendInvite) {
            let recipients: string[] = [];

            if (inviteType === 'STUDENT') {
                recipients = selectedStudents;
            } else {
                // Pour les classes, on trouve tous les étudiants qui sont dans les classes sélectionnées
                recipients = availableStudents
                    .filter(s => s.enrolledClasses?.some(c => selectedClasses.includes(c)))
                    .map(s => s.id);
            }

            // Dédoublonnage au cas où
            recipients = [...new Set(recipients)];

            const inviteMessage = `🎓 **INVITATION COURS**\n\nLe professeur ${user.name} vous invite à rejoindre le tableau blanc : "${title}".\n\n🔑 **CODE D'ACCÈS :** ${key}\n\n${mode === 'SCHEDULED' ? `📅 Prévu pour le : ${new Date(scheduledAt).toLocaleString()}` : '🔴 En direct maintenant !'}`;

            recipients.forEach(studentId => {
                const msg: Message = {
                    id: `inv-${Date.now()}-${Math.random()}`,
                    senderId: user.id,
                    senderName: user.name,
                    receiverId: studentId,
                    content: inviteMessage,
                    timestamp: new Date().toISOString(),
                    read: false
                };
                StorageService.sendMessage(msg);
            });

            if (recipients.length > 0) {
                alert(`Invitation envoyée à ${recipients.length} étudiant(s).`);
            }
        }
        // -------------------------------------

        setSessions(prev => [...prev, newSession]);
        setIsCreating(false);
        
        if (mode === 'INSTANT') {
            onStartSession(newSession);
        }
    };

    const handleDelete = (id: string) => {
        if (confirm(t('delete') + '?')) {
            StorageService.endWhiteboardSession(id); // Effectively archives it
            const updated = sessions.filter(s => s.id !== id);
            setSessions(updated);
        }
    };

    const handleStart = (session: WhiteboardSession) => {
        const updated = { ...session, status: 'LIVE' as const, isActive: true };
        StorageService.saveWhiteboard(updated);
        onStartSession(updated);
    };

    const assignedSections = user.assignedSections || [];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <PenTool className="w-6 h-6 text-indigo-600"/> {t('whiteboard')}
                </h2>
                <button 
                    onClick={() => setIsCreating(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-sm"
                >
                    <Plus className="w-5 h-5"/> {t('createRoom')}
                </button>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.filter(s => s.status !== 'ENDED').map(session => (
                    <div key={session.id} className={`bg-white rounded-xl shadow-sm border p-5 relative overflow-hidden group ${session.status === 'LIVE' ? 'border-red-200 ring-1 ring-red-100' : 'border-gray-100'}`}>
                        {session.status === 'LIVE' && (
                            <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg animate-pulse">
                                EN DIRECT
                            </div>
                        )}
                        
                        <h3 className="font-bold text-lg text-gray-800 mb-2 truncate pr-16">{session.title}</h3>
                        
                        <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Key className="w-4 h-4"/> Code: <span className="font-mono font-bold text-gray-700 select-all">{session.accessKey}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Users className="w-4 h-4"/> 
                                {session.assignedClasses.length > 0 
                                    ? `${session.assignedClasses.length} Classes` 
                                    : `${session.invitedStudentIds?.length || 0} Étudiants`
                                }
                            </div>
                            {session.scheduledAt && (
                                <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                                    <CalendarClock className="w-4 h-4"/> {new Date(session.scheduledAt).toLocaleString()}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            {session.status === 'LIVE' ? (
                                <button onClick={() => onStartSession(session)} className="flex-1 bg-red-600 text-white py-2 rounded font-bold hover:bg-red-700 flex items-center justify-center gap-2">
                                    <MonitorPlay className="w-4 h-4"/> Rejoindre
                                </button>
                            ) : (
                                <button onClick={() => handleStart(session)} className="flex-1 bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700 flex items-center justify-center gap-2">
                                    <PlayCircle className="w-4 h-4"/> Lancer
                                </button>
                            )}
                            <button onClick={() => handleDelete(session.id)} className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded transition">
                                <Trash2 className="w-5 h-5"/>
                            </button>
                        </div>
                    </div>
                ))}
                {sessions.filter(s => s.status !== 'ENDED').length === 0 && (
                    <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <PenTool className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
                        <p className="text-gray-500">Aucune session active ou programmée.</p>
                        <button onClick={() => setIsCreating(true)} className="text-indigo-600 font-bold mt-2 hover:underline">Créer une session</button>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {isCreating && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-indigo-600 p-4 flex justify-between items-center text-white shrink-0">
                            <h3 className="font-bold flex items-center gap-2 text-lg">
                                <PenTool className="w-5 h-5"/> Configurer la séance
                            </h3>
                            <button onClick={() => setIsCreating(false)}><X className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Titre du cours</label>
                                <input 
                                    className="w-full border rounded p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                />
                            </div>

                            {/* Mode Toggle */}
                            <div className="flex gap-4">
                                <label className={`flex-1 p-3 rounded border cursor-pointer flex flex-col items-center gap-2 transition ${mode === 'INSTANT' ? 'bg-green-50 border-green-500 text-green-700' : 'hover:bg-gray-50'}`}>
                                    <input type="radio" name="wbMode" className="hidden" checked={mode === 'INSTANT'} onChange={() => setMode('INSTANT')} />
                                    <MonitorPlay className="w-6 h-6"/>
                                    <span className="font-bold text-sm">Immédiat</span>
                                </label>
                                <label className={`flex-1 p-3 rounded border cursor-pointer flex flex-col items-center gap-2 transition ${mode === 'SCHEDULED' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}>
                                    <input type="radio" name="wbMode" className="hidden" checked={mode === 'SCHEDULED'} onChange={() => setMode('SCHEDULED')} />
                                    <CalendarClock className="w-6 h-6"/>
                                    <span className="font-bold text-sm">Planifier</span>
                                </label>
                            </div>

                            {mode === 'SCHEDULED' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date et Heure</label>
                                    <input 
                                        type="datetime-local" 
                                        className="w-full border rounded p-2.5"
                                        value={scheduledAt}
                                        onChange={e => setScheduledAt(e.target.value)}
                                    />
                                </div>
                            )}

                            {/* Audience Toggle */}
                            <div className="border-t pt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Qui inviter ?</label>
                                <div className="flex gap-4 mb-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" checked={inviteType === 'CLASS'} onChange={() => setInviteType('CLASS')} className="text-indigo-600 focus:ring-indigo-500"/>
                                        <span className="text-sm">Classes Entières</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" checked={inviteType === 'STUDENT'} onChange={() => setInviteType('STUDENT')} className="text-indigo-600 focus:ring-indigo-500"/>
                                        <span className="text-sm">Étudiants Spécifiques</span>
                                    </label>
                                </div>

                                {inviteType === 'CLASS' ? (
                                    <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2 rounded border max-h-32 overflow-y-auto">
                                        {assignedSections.map(cls => (
                                            <label key={cls} className="flex items-center gap-2 text-sm p-1 hover:bg-white rounded cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedClasses.includes(cls)}
                                                    onChange={() => setSelectedClasses(prev => prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls])}
                                                    className="rounded text-indigo-600"
                                                />
                                                {cls}
                                            </label>
                                        ))}
                                        {assignedSections.length === 0 && <p className="text-xs text-gray-400 italic col-span-2">Aucune classe assignée. Contactez votre coordinateur.</p>}
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 p-2 rounded border max-h-40 overflow-y-auto">
                                        <input 
                                            className="w-full mb-2 p-1.5 text-xs border rounded" 
                                            placeholder="Rechercher un élève..." 
                                        />
                                        <div className="space-y-1">
                                            {availableStudents.map(s => (
                                                <label key={s.id} className="flex items-center gap-2 text-sm p-1 hover:bg-white rounded cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedStudents.includes(s.id)}
                                                        onChange={() => setSelectedStudents(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])}
                                                        className="rounded text-indigo-600"
                                                    />
                                                    <div>
                                                        <div className="font-medium">{s.name}</div>
                                                        <div className="text-[10px] text-gray-500">{s.enrolledClasses?.join(', ')}</div>
                                                    </div>
                                                </label>
                                            ))}
                                            {availableStudents.length === 0 && <p className="text-xs text-gray-400 italic">Aucun élève trouvé.</p>}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Invitation Toggle */}
                            <div className="bg-indigo-50 p-3 rounded-lg flex items-center gap-3">
                                <input 
                                    type="checkbox" 
                                    id="sendInvite" 
                                    checked={sendInvite} 
                                    onChange={e => setSendInvite(e.target.checked)}
                                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                                />
                                <label htmlFor="sendInvite" className="text-sm font-medium text-indigo-900 cursor-pointer">
                                    Envoyer le code d'invitation par message
                                </label>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 border-t flex justify-end gap-3 shrink-0">
                            <button onClick={() => setIsCreating(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-medium">{t('cancel')}</button>
                            <button onClick={handleCreate} className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-bold shadow-md">
                                {mode === 'INSTANT' ? 'Lancer' : 'Programmer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ProfessorDashboard: React.FC<Props> = ({ user, onLogout }) => {
    const { t, dir } = useLanguage();
    const location = useLocation();
    const [activeWhiteboard, setActiveWhiteboard] = useState<WhiteboardSession | null>(null);

    const isActive = (path: string) => location.pathname.includes(`/professor/${path}`);

    if (activeWhiteboard) {
        return (
            <WhiteboardRoom 
                user={user} 
                sessionId={activeWhiteboard.id} 
                onExit={() => setActiveWhiteboard(null)}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex" dir={dir}>
            <aside className="w-64 bg-white border-r hidden md:flex flex-col z-10">
                <div className="p-6 border-b flex items-center gap-3 bg-blue-700 text-white">
                     <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                        <BookOpen className="w-6 h-6 text-white"/>
                    </div>
                    <div>
                        <h1 className="font-bold font-logo text-lg tracking-tight">Tinmel</h1>
                        <p className="text-xs text-blue-200">{t('staffSpace')}</p>
                    </div>
                </div>
                 <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {[
                        { id: 'overview', icon: LayoutDashboard, label: t('schoolStatsView') },
                        { id: 'quizzes', icon: BookOpen, label: t('myQuizzes') },
                        { id: 'whiteboard', icon: PenTool, label: t('whiteboard') },
                        { id: 'messages', icon: MessageCircle, label: t('messages') },
                    ].map(item => (
                        <Link 
                            key={item.id}
                            to={`/professor/${item.id}`}
                            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive(item.id) ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'}`}
                        >
                            <item.icon className="w-5 h-5"/> {item.label}
                        </Link>
                    ))}
                </nav>
                 <div className="p-4 border-t">
                     <button onClick={onLogout} className="flex items-center gap-2 text-red-600 hover:bg-red-50 w-full px-4 py-2 rounded-lg transition-colors text-sm font-medium">
                        <LogOut className="w-4 h-4 rtl:flip"/> {t('logout')}
                    </button>
                </div>
            </aside>
            
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                 <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0 z-0">
                     <h2 className="font-bold text-gray-800 text-xl">{t('welcome')}, {user.name}</h2>
                 </header>
                 <div className="flex-1 overflow-auto p-6 z-0">
                    <Routes>
                        <Route path="overview" element={<div>Overview Placeholder</div>} />
                        <Route path="quizzes" element={<QuizzesView user={user} />} />
                        <Route path="whiteboard" element={<WhiteboardManagerView user={user} onStartSession={setActiveWhiteboard} />} />
                        <Route path="messages" element={<div>Messages Placeholder</div>} />
                        <Route path="*" element={<Navigate to="quizzes" replace />} />
                    </Routes>
                 </div>
            </main>
        </div>
    );
};

export default ProfessorDashboard;