import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { User, Quiz, Lesson, QuizResult, UserRole, Message, SchoolEvent, QuestionType, LessonType } from '../../types';
import { StorageService } from '../../services/storageService';
import { ApiService } from '../../services/apiService';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
    LayoutDashboard, FileText, CheckCircle, Clock, Award, Star, Activity, ListTodo, Calendar, 
    Book, ChevronRight, LogOut, BookOpen, MessageCircle, Settings, Play, BarChart, X, Video, File as FileIcon, Eye, Send, GraduationCap, Gem, Key, Edit3, Save, ArrowLeft, HelpCircle
} from 'lucide-react';
import QuizTaker from '../Quiz/QuizTaker';

// --- HEADER BACKGROUND COMPONENT ---
const HeaderBackground = () => {
    const elements = useMemo(() => {
        const items = [];
        const chars = [
            'ا', 'ب', 'ح', 'د', 'ر', 'س', 'ص', 'ط', 'ع', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي',
            'أ', 'إ', 'آ', 'ة', 'ث', 'ج', 'خ', 'ذ', 'ز', 'ش', 'ض', 'ظ', 'غ', 'ف',
            'ⴰ', 'ⴱ', 'ⴳ', 'ⴷ', 'ⴹ', 'ⴻ', 'ⴼ', 'ⴽ', 'ⵀ', 'ⵃ', 'ⵄ', 'ⵅ', 'ⵇ', 'ⵉ', 'ⵊ', 'ⵍ', 'ⵎ', 'ⵏ', 'ⵓ', 'ⵔ', 'ⵕ', 'ⵖ', 'ⵙ', 'ⵚ', 'ⵛ', 'ⵜ', 'ⵟ', 'ⵡ', 'ⵢ', 'ⵣ', 'ⵥ',
            'Tinmel', 'Education', 'Savoir', 'المعرفة', 'A', 'B', 'C', '1', '2', '3', '∑', '∫', 'π'
        ];

        for (let i = 0; i < 35; i++) {
            items.push({
                char: chars[Math.floor(Math.random() * chars.length)],
                top: Math.random() * 100,
                left: Math.random() * 100,
                size: Math.random() * 2 + 1, // 1rem to 3rem
                duration: Math.random() * 30 + 20,
                delay: Math.random() * 20,
                initialRotate: Math.random() * 360,
                opacity: Math.random() * 0.15 + 0.05, // 5% to 20% opacity
                font: Math.random() > 0.5 ? 'Amiri' : 'sans-serif' 
            });
        }
        return items;
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
            <style>{`
                @keyframes swimHeader {
                    0% { transform: translate(0, 0) rotate(0deg); }
                    33% { transform: translate(25px, -15px) rotate(4deg); }
                    66% { transform: translate(-15px, 15px) rotate(-4deg); }
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
                    color: `rgba(37, 99, 235, ${el.opacity})`, // Blue-600
                    zIndex: 0,
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                    filter: 'blur(0.5px)',
                    animation: `swimHeader ${el.duration}s ease-in-out infinite -${el.delay}s`
                }}>
                    <div style={{ transform: `rotate(${el.initialRotate}deg)` }}>
                        {el.char}
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- SUB-VIEWS ---

const HomeView: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLanguage();
    const [subjectStats, setSubjectStats] = useState<any[]>([]);
    const [globalStats, setGlobalStats] = useState({ average: 0, totalBadges: 0, quizzesDone: 0 });
    const [todoItems, setTodoItems] = useState<Array<{ id: string, title: string, type: 'QUIZ' | 'LESSON', deadline?: string, info: string, ref: any }>>([]);
    
    // Unified deadlines (Quizzes + Events)
    const [deadlines, setDeadlines] = useState<Array<{
        id: string;
        title: string;
        date: string;
        type: string;
        source: 'QUIZ' | 'EVENT';
    }>>([]);

    useEffect(() => {
        const loadData = async () => {
            // 1. Get all necessary data
            const allUsers = await ApiService.getUsers();
            const profs = allUsers.filter(u => u.role === 'PROFESSOR');
            
            const quizzes = StorageService.getAvailableQuizzesForStudent(user);
            const lessons = StorageService.getLessonsForStudent(user);
            const results = StorageService.getResults().filter(r => r.studentId === user.id);
            const manualEvents = StorageService.getEventsForStudent(user);

            // 2. Identify subjects (Professors relevant to this student via Quiz OR Lesson)
            const myProfs = profs.filter(p => {
                const hasQuiz = quizzes.some(q => q.professorId === p.id);
                const hasLesson = lessons.some(l => l.professorId === p.id);
                return hasQuiz || hasLesson;
            });

            // 3. Build Subject Statistics
            const stats = myProfs.map(prof => {
                const profQuizzes = quizzes.filter(q => q.professorId === prof.id);
                const profLessons = lessons.filter(l => l.professorId === prof.id);
                const profResults = results.filter(r => profQuizzes.some(q => q.id === r.quizId));
                
                let totalScore = 0;
                let maxPossible = 0;
                profResults.forEach(r => {
                    totalScore += r.score;
                    maxPossible += r.maxScore;
                });
                
                // Avoid NaN if maxPossible is 0
                const average = maxPossible > 0 ? (totalScore / maxPossible) * 100 : null;
                
                const uniqueQuizzesTaken = new Set(profResults.map(r => r.quizId)).size;
                const progress = profQuizzes.length > 0 ? (uniqueQuizzesTaken / profQuizzes.length) * 100 : 0;

                return {
                    profName: prof.name,
                    subject: prof.subject || 'Général',
                    average: average !== null ? Math.round(average) : null,
                    progress: Math.round(progress),
                    quizzesTaken: uniqueQuizzesTaken,
                    totalQuizzes: profQuizzes.length,
                    totalLessons: profLessons.length,
                    lastActivity: profResults.length > 0 ? profResults[0].submittedAt : null
                };
            });

            setSubjectStats(stats);

            // 4. Global Stats
            const totalBadges = user.badges?.length || 0;
            const quizzesDone = results.length;
            let globalSum = 0;
            let globalMax = 0;
            results.forEach(r => {
                globalSum += r.score;
                globalMax += r.maxScore;
            });
            const globalAvg = globalMax > 0 ? (globalSum / globalMax) * 100 : 0;

            setGlobalStats({
                average: Math.round(globalAvg),
                totalBadges,
                quizzesDone
            });

            // 5. To-Do List logic (Quizzes + Lessons)
            const quizzesTakenIds = new Set(results.map(r => r.quizId));
            const pendingQuizzes = quizzes.filter(q => !quizzesTakenIds.has(q.id));
            
            const pendingLessons = lessons.filter(l => 
                !(l.completedBy && l.completedBy.includes(user.id))
            );

            const allTodos = [
                ...pendingQuizzes.map(q => ({
                    id: q.id,
                    title: q.title,
                    type: 'QUIZ' as const,
                    deadline: q.dueDate,
                    info: `${q.questions.length} questions`,
                    ref: q
                })),
                ...pendingLessons.map(l => ({
                    id: l.id,
                    title: l.title,
                    type: 'LESSON' as const,
                    deadline: l.availableUntil,
                    info: l.type === 'VIDEO' ? 'Vidéo' : l.type === 'INTERACTIVE' ? 'Interactif' : 'Document',
                    ref: l
                }))
            ].sort((a, b) => {
                if (a.deadline && b.deadline) return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
                if (a.deadline) return -1;
                return 1;
            });

            setTodoItems(allTodos);

            // Combine Quiz Deadlines + Manual Events
            const quizDeadlines = pendingQuizzes
                .filter(q => q.dueDate)
                .map(q => ({
                    id: q.id,
                    title: q.title,
                    date: q.dueDate!,
                    type: 'QUIZ',
                    source: 'QUIZ' as const
                }));

            const eventDeadlines = manualEvents.map(e => ({
                id: e.id,
                title: e.title,
                date: e.date,
                type: e.type, // EXAM, TEST, HOMEWORK
                source: 'EVENT' as const
            }));

            const allDeadlines = [...quizDeadlines, ...eventDeadlines]
                .filter(d => new Date(d.date).getTime() > Date.now()) // Only future events
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            setDeadlines(allDeadlines);
        };
        loadData();
    }, [user]);

    // Calculate level based on XP
    const xp = user.xp || 0;
    const level = Math.floor(xp / 1000) + 1;
    const progressXP = (xp % 1000) / 10;

    const getEventTypeLabel = (type: string) => {
        switch(type) {
            case 'EXAM': return 'EXAMEN FINAL';
            case 'TEST': return 'CONTRÔLE CONTINU';
            case 'HOMEWORK': return 'DEVOIR';
            case 'QUIZ': return 'QUIZ EN LIGNE';
            default: return 'AUTRE';
        }
    };

    const getEventTypeColor = (type: string) => {
        switch(type) {
            case 'EXAM': return 'bg-red-100 text-red-700 border-red-200';
            case 'TEST': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'HOMEWORK': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Global Stats Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Level Card */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Award className="w-32 h-32"/></div>
                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <div>
                            <p className="text-indigo-200 text-sm font-bold uppercase tracking-wider mb-1">{t('level')}</p>
                            <div className="flex items-end gap-2">
                                <h3 className="text-5xl font-black">{level}</h3>
                                <span className="text-lg text-indigo-200 mb-2 font-medium">{xp} XP</span>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="flex justify-between text-xs text-indigo-200 mb-1">
                                <span>Progression</span>
                                <span>{Math.round(progressXP)}%</span>
                            </div>
                            <div className="w-full bg-black/20 h-3 rounded-full overflow-hidden">
                                <div className="bg-yellow-400 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(250,204,21,0.5)]" style={{ width: `${progressXP}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Global Average Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                    <div className="bg-green-100 p-4 rounded-full text-green-600 mb-3">
                        <Activity className="w-8 h-8"/>
                    </div>
                    <h3 className="text-4xl font-bold text-gray-800 mb-1">{globalStats.average}%</h3>
                    <p className="text-sm text-gray-500 font-medium">Moyenne Générale</p>
                </div>

                {/* Badges Summary Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="bg-yellow-100 p-4 rounded-full text-yellow-600 mb-3 z-10">
                        <Star className="w-8 h-8 fill-current"/>
                    </div>
                    <h3 className="text-4xl font-bold text-gray-800 mb-1 z-10">{globalStats.totalBadges}</h3>
                    <p className="text-sm text-gray-500 font-medium z-10">Badges Débloqués</p>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                </div>
            </div>

            {/* To-Do & Dates Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* To-Do List (Online Quizzes) */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                        <ListTodo className="w-5 h-5 text-blue-600"/> Travail à faire (Assigné)
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{todoItems.length}</span>
                    </h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {todoItems.length > 0 ? todoItems.map(t => (
                            <Link 
                                to={t.type === 'QUIZ' ? "/student/quizzes" : "/student/lessons"} 
                                key={t.id} 
                                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${t.type === 'QUIZ' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
                                        {t.type === 'QUIZ' ? <FileText className="w-4 h-4"/> : <BookOpen className="w-4 h-4"/>}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-700 group-hover:text-blue-700">{t.title}</p>
                                        <p className="text-xs text-gray-500">
                                            {t.info} 
                                            {t.deadline && ` • Pour le ${new Date(t.deadline).toLocaleDateString()}`}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600"/>
                            </Link>
                        )) : (
                            <div className="text-center py-8 text-gray-400 flex flex-col items-center">
                                <CheckCircle className="w-8 h-8 mb-2 opacity-50"/>
                                <p className="text-sm">Tout est à jour !</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Important Dates (Mixed) */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                        <Calendar className="w-5 h-5 text-red-600"/> Dates Importantes
                    </h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {deadlines.length > 0 ? deadlines.map(d => (
                            <div key={d.id} className="flex gap-3 p-3 bg-white rounded-lg border hover:shadow-sm transition">
                                <div className={`p-2 rounded text-center min-w-[50px] border flex flex-col justify-center shadow-sm ${d.type === 'EXAM' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                                    <span className={`text-xs font-bold uppercase ${d.type === 'EXAM' ? 'text-red-500' : 'text-gray-500'}`}>{new Date(d.date).toLocaleString('fr', {month:'short'})}</span>
                                    <span className="text-xl font-black text-gray-800">{new Date(d.date).getDate()}</span>
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-gray-800">{d.title}</p>
                                    <p className="text-xs text-gray-600 font-medium mb-1">
                                        {new Date(d.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${getEventTypeColor(d.type)}`}>
                                        {getEventTypeLabel(d.type)}
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-8 text-gray-400 flex flex-col items-center">
                                <Calendar className="w-8 h-8 mb-2 opacity-50"/>
                                <p className="text-sm">Aucun événement à venir.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Subjects Table / Cards */}
            <div>
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Book className="w-6 h-6 text-indigo-600"/> Mes Matières & Progression
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {subjectStats.map((sub, idx) => (
                        <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                        {sub.subject}
                                    </h3>
                                    <p className="text-sm text-gray-500">{t('prof')} {sub.profName}</p>
                                </div>
                                <div className={`text-xl font-black ${sub.average === null ? 'text-gray-400' : sub.average >= 70 ? 'text-green-600' : sub.average >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                                    {sub.average !== null ? `${sub.average}%` : '--'}
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Resources Info */}
                                <div className="flex gap-2 text-xs text-gray-500">
                                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">{sub.totalQuizzes} Quiz</span>
                                    <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded">{sub.totalLessons} Cours</span>
                                </div>

                                {/* Progress Bar */}
                                <div>
                                    <div className="flex justify-between text-xs text-gray-600 mb-1 font-medium">
                                        <span>Avancement des évaluations</span>
                                        <span>{sub.quizzesTaken} / {sub.totalQuizzes}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${sub.progress === 100 ? 'bg-green-500' : 'bg-blue-600'}`} 
                                            style={{ width: `${sub.progress}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Quick Stats Row */}
                                <div className="flex gap-4 pt-2 border-t border-gray-100">
                                    <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
                                        <div className="text-xs text-gray-400 uppercase font-bold">Dernière activité</div>
                                        <div className="text-xs font-mono text-gray-700 mt-1">
                                            {sub.lastActivity ? new Date(sub.lastActivity).toLocaleDateString() : '-'}
                                        </div>
                                    </div>
                                    <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center cursor-pointer hover:bg-yellow-50 transition group">
                                        <div className="text-xs text-gray-400 uppercase font-bold group-hover:text-yellow-600">Statut</div>
                                        <div className="text-xs font-bold text-gray-700 mt-1 flex justify-center items-center gap-1 group-hover:text-yellow-700">
                                            {sub.progress === 100 ? <><Award className="w-3 h-3"/> Complet</> : 'En cours'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {subjectStats.length === 0 && (
                        <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
                            <p className="text-gray-500">Vous n'êtes inscrit à aucune matière pour le moment.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const QuizzesView: React.FC<{ user: User, onStartQuiz: (q: Quiz) => void }> = ({ user, onStartQuiz }) => {
    const { t } = useLanguage();
    const [available, setAvailable] = useState<Quiz[]>([]);
    const [history, setHistory] = useState<QuizResult[]>([]);

    useEffect(() => {
        setAvailable(StorageService.getAvailableQuizzesForStudent(user));
        // We need history to filter out taken quizzes
        const allResults = StorageService.getResults();
        setHistory(allResults.filter(r => r.studentId === user.id));
    }, [user]);

    const quizzesTakenIds = new Set(history.map(r => r.quizId));
    const todoQuizzes = available.filter(q => !quizzesTakenIds.has(q.id));

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Play className="w-5 h-5 text-green-600 fill-current"/> {t('myQuizzes')} ({todoQuizzes.length})
                </h2>
                <div className="space-y-3">
                    {todoQuizzes.map(q => (
                        <div key={q.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h3 className="font-bold text-gray-800">{q.title}</h3>
                                <p className="text-sm text-gray-500">{q.description}</p>
                                <div className="flex gap-4 mt-2 text-xs text-gray-400">
                                    <span>{q.questions.length} questions</span>
                                    {q.timeLimit && <span>• {q.timeLimit} min</span>}
                                </div>
                            </div>
                            <button 
                                onClick={() => onStartQuiz(q)}
                                className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition shadow-sm whitespace-nowrap"
                            >
                                {t('start')}
                            </button>
                        </div>
                    ))}
                    {todoQuizzes.length === 0 && (
                        <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                            <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
                            <p className="text-gray-500">Aucun quiz à faire pour le moment.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ResultsView: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLanguage();
    const [history, setHistory] = useState<QuizResult[]>([]);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);

    useEffect(() => {
        const allResults = StorageService.getResults();
        setHistory(allResults.filter(r => r.studentId === user.id).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
        setQuizzes(StorageService.getQuizzes());
    }, [user]);

    return (
        <div className="space-y-6 animate-fade-in">
             <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <BarChart className="w-6 h-6 text-indigo-600"/> {t('results')}
            </h2>
            <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">Quiz</th>
                            <th className="p-4">Date</th>
                            <th className="p-4 text-center">Note</th>
                            <th className="p-4 text-center">Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map(r => {
                            const quizTitle = quizzes.find(q => q.id === r.quizId)?.title || 'Quiz supprimé';
                            const pct = (r.score / r.maxScore) * 100;
                            return (
                                <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="p-4 font-medium">{quizTitle}</td>
                                    <td className="p-4 text-gray-500">{new Date(r.submittedAt).toLocaleDateString()}</td>
                                    <td className="p-4 text-center font-bold">
                                        <span className={pct >= 50 ? 'text-green-600' : 'text-red-600'}>
                                            {r.score}/{r.maxScore}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">Terminé</span>
                                    </td>
                                </tr>
                            );
                        })}
                        {history.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400">{t('noResults')}</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const LessonPlayer: React.FC<{ lesson: Lesson, onComplete: () => void }> = ({ lesson, onComplete }) => {
    const { t } = useLanguage();
    const [elapsedTime, setElapsedTime] = useState(0);
    const [notes, setNotes] = useState('');
    const [canComplete, setCanComplete] = useState(false);
    
    // Config
    const isInteractive = lesson.type === LessonType.INTERACTIVE;
    const isVideo = lesson.type === LessonType.VIDEO;
    const requiredTime = isInteractive ? (lesson.minTimeSeconds || 10) : 0;
    
    // Treasure Hunt State (Only for Interactive)
    const [treasureInput, setTreasureInput] = useState('');
    const [showTreasureInput, setShowTreasureInput] = useState(false);
    const [unlockedBadge, setUnlockedBadge] = useState<string | null>(null);

    // Validation Quiz State
    const [showValidationQuiz, setShowValidationQuiz] = useState(false);
    const user = StorageService.getSession();

    useEffect(() => {
        if (user) {
            // Send heartbeat immediately on load
            StorageService.updateLessonActivity(lesson.id, user.id);
            
            // Send heartbeat every 10 seconds
            const interval = setInterval(() => {
                StorageService.updateLessonActivity(lesson.id, user.id);
            }, 10000);
            
            return () => clearInterval(interval);
        }
    }, [lesson.id, user]);

    useEffect(() => {
        if (!isInteractive) {
            setCanComplete(true);
            return;
        }
        
        const timer = setInterval(() => {
            setElapsedTime(prev => {
                if (prev + 1 >= requiredTime) setCanComplete(true);
                return prev + 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [requiredTime, isInteractive]);

    const handleSaveNotes = () => {
        localStorage.setItem(`notes_${lesson.id}`, notes);
        alert("Notes enregistrées !");
    };

    const handleTreasureSubmit = () => {
        if (!lesson.treasureCodes) return;
        const input = treasureInput.trim().toUpperCase();
        
        const found = lesson.treasureCodes.find(tc => tc.code.toUpperCase() === input);
        
        if (found) {
            const user = StorageService.getSession();
            if (user) {
                const currentBadges = user.badges || [];
                if (!currentBadges.includes(found.badgeId)) {
                    const updatedUser = { ...user, badges: [...currentBadges, found.badgeId] };
                    StorageService.saveUser(updatedUser);
                    StorageService.saveSession(updatedUser);
                    setUnlockedBadge(found.badgeId);
                    setTreasureInput('');
                    setShowTreasureInput(false);
                } else {
                    alert(t('badgeAlreadyOwned'));
                }
            }
        } else {
            alert(t('codeIncorrect'));
        }
    };

    const handleCompleteClick = () => {
        if (!canComplete) return;
        
        // If the lesson has validation questions, trigger the quiz instead of closing
        if (lesson.questions && lesson.questions.length > 0) {
            setShowValidationQuiz(true);
        } else {
            // Mark as complete immediately
            if (user) StorageService.completeLesson(lesson.id, user.id);
            onComplete();
        }
    };

    const getYoutubeEmbed = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const progress = isInteractive ? Math.min((elapsedTime / requiredTime) * 100, 100) : 100;

    // Validation Quiz Overlay
    if (showValidationQuiz && lesson.questions && user) {
        // Construct a temporary Quiz object
        const tempQuiz: Quiz = {
            id: `val-quiz-${lesson.id}`,
            title: `Validation: ${lesson.title}`,
            description: "Quiz de validation des acquis pour ce cours.",
            professorId: lesson.professorId,
            questions: lesson.questions,
            createdAt: new Date().toISOString(),
            assignedClasses: [],
            status: 'PUBLISHED'
        };

        return (
            <div className="fixed inset-0 z-[60] bg-white overflow-auto animate-fade-in flex flex-col">
                <div className="p-4 border-b flex items-center gap-2">
                     <button onClick={() => setShowValidationQuiz(false)} className="text-gray-500 hover:text-gray-800 flex items-center gap-2 font-bold">
                         <ArrowLeft className="w-5 h-5 rtl:flip"/> {t('back')}
                     </button>
                     <span className="text-gray-300">|</span>
                     <span className="font-bold text-gray-700">Quiz de Validation</span>
                </div>
                <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
                    <QuizTaker 
                        quiz={tempQuiz} 
                        studentId={user.id} 
                        studentName={user.name} 
                        onComplete={() => {
                            // Mark lesson as complete after quiz
                            StorageService.completeLesson(lesson.id, user.id);
                            setShowValidationQuiz(false);
                            onComplete(); 
                        }} 
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col bg-gray-50 animate-fade-in">
            {/* Top Bar */}
            <div className="bg-white border-b p-4 flex justify-between items-center shadow-sm h-16 shrink-0 relative z-20">
                <div className="flex items-center gap-4">
                    <button onClick={onComplete} className="text-gray-500 hover:text-gray-800"><ChevronRight className="w-6 h-6 rotate-180"/></button>
                    <div>
                        <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                            {isVideo ? <Video className="w-5 h-5 text-red-600"/> : <BookOpen className="w-5 h-5 text-indigo-600"/>}
                            {lesson.title}
                        </h2>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    {/* Treasure Button - Only if enabled by Professor & Interactive */}
                    {isInteractive && lesson.hasTreasureHunt && lesson.treasureCodes && lesson.treasureCodes.length > 0 && (
                        <button 
                            onClick={() => setShowTreasureInput(!showTreasureInput)}
                            className="bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-full font-bold flex items-center gap-2 text-sm hover:bg-yellow-200 transition animate-bounce"
                        >
                            <Gem className="w-4 h-4"/> J'ai trouvé un trésor !
                        </button>
                    )}

                    {isInteractive && (
                        <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
                            <Clock className="w-4 h-4 text-indigo-600 animate-pulse"/>
                            <span className="font-mono font-bold text-indigo-700">
                                {Math.floor(elapsedTime / 60)}:{String(elapsedTime % 60).padStart(2, '0')}
                            </span>
                        </div>
                    )}
                    
                    <button 
                        onClick={handleCompleteClick}
                        disabled={!canComplete}
                        className={`px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${canComplete ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg scale-105' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                    >
                        {!canComplete && <Clock className="w-5 h-5"/>}
                        {canComplete ? (
                            (lesson.questions && lesson.questions.length > 0) ? <><HelpCircle className="w-5 h-5"/> Passer le test</> : <><CheckCircle className="w-5 h-5"/> Terminer</>
                        ) : "Lecture en cours..."}
                    </button>
                </div>
            </div>

            {/* Treasure Input Popover */}
            {showTreasureInput && (
                <div className="absolute top-20 right-20 bg-white p-4 rounded-xl shadow-2xl border border-yellow-200 z-50 w-64 animate-fade-in">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-yellow-800 flex items-center gap-2"><Key className="w-4 h-4"/> Code Secret</h3>
                        <button onClick={() => setShowTreasureInput(false)}><X className="w-4 h-4 text-gray-400"/></button>
                    </div>
                    <input 
                        className="w-full border rounded p-2 text-center uppercase tracking-widest font-mono mb-2 focus:ring-2 focus:ring-yellow-400 outline-none"
                        placeholder="CODE"
                        value={treasureInput}
                        onChange={e => setTreasureInput(e.target.value)}
                    />
                    <button onClick={handleTreasureSubmit} className="w-full bg-yellow-500 text-white font-bold py-2 rounded hover:bg-yellow-600">
                        Valider
                    </button>
                </div>
            )}

            {/* Badge Unlocked Overlay */}
            {unlockedBadge && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] animate-fade-in">
                    <div className="bg-white p-8 rounded-2xl text-center max-w-sm relative overflow-hidden">
                        <div className="absolute inset-0 bg-yellow-400/20 animate-pulse"></div>
                        <Award className="w-24 h-24 text-yellow-500 mx-auto mb-4 drop-shadow-lg relative z-10"/>
                        <h2 className="text-2xl font-black text-gray-800 mb-2 relative z-10">Félicitations !</h2>
                        <p className="text-gray-500 mb-2 relative z-10 text-sm">Vous avez gagné une étoile (Badge)</p>
                        <p className="text-gray-800 mb-6 relative z-10 font-bold text-lg">{t(unlockedBadge)}</p>
                        <button 
                            onClick={() => setUnlockedBadge(null)}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-indigo-700 hover:scale-105 transition transform relative z-10"
                        >
                            Génial !
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content Split View */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Content Viewer */}
                <div className="flex-1 bg-gray-200 relative p-4 flex flex-col">
                    <div className="bg-white rounded-lg shadow-lg flex-1 overflow-hidden relative flex items-center justify-center bg-black/5">
                        
                        {/* Render based on Type */}
                        {isVideo ? (
                            getYoutubeEmbed(lesson.contentUrl) ? (
                                <iframe
                                    className="w-full h-full"
                                    src={`https://www.youtube.com/embed/${getYoutubeEmbed(lesson.contentUrl)}`}
                                    title="YouTube video player"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            ) : (
                                <video controls className="max-w-full max-h-full" src={lesson.contentUrl}>
                                    Votre navigateur ne supporte pas la lecture vidéo.
                                </video>
                            )
                        ) : (
                            /* PDF / Document / Interactive */
                            <iframe 
                                src={`${lesson.contentUrl}#toolbar=0`} 
                                className="w-full h-full"
                                title="Course Content"
                            />
                        )}

                    </div>
                    {/* Progress Bar (Only Interactive) */}
                    {isInteractive && (
                        <>
                            <div className="mt-4 bg-white rounded-full h-2 w-full overflow-hidden shadow-inner">
                                <div 
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-1000 ease-linear"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            <p className="text-center text-xs text-gray-500 mt-1 font-medium">Progression de lecture obligatoire</p>
                        </>
                    )}
                </div>

                {/* Right: Notes & Tools */}
                <div className="w-80 bg-white border-l shadow-xl flex flex-col">
                    <div className="p-4 bg-gray-50 border-b font-bold text-gray-700 flex items-center gap-2">
                        <Edit3 className="w-4 h-4"/> Mes Notes
                    </div>
                    <div className="flex-1 p-4">
                        <textarea 
                            className="w-full h-full resize-none border-none focus:ring-0 text-sm text-gray-700 leading-relaxed bg-transparent"
                            placeholder="Prenez des notes ici pendant votre lecture..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>
                    <div className="p-4 border-t bg-gray-50">
                        <button onClick={handleSaveNotes} className="w-full bg-white border hover:bg-gray-50 text-indigo-600 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition">
                            <Save className="w-4 h-4"/> Sauvegarder les notes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LessonsView: React.FC<{ user: User, setFullScreen?: (fs: boolean) => void }> = ({ user, setFullScreen }) => {
    const { t } = useLanguage();
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
    // Lookup map for professors to show Subject name
    const [profsMap, setProfsMap] = useState<Map<string, User>>(new Map());

    useEffect(() => {
        const fetchData = async () => {
            setLessons(StorageService.getLessonsForStudent(user));
            
            const allUsers = await ApiService.getUsers();
            const pMap = new Map<string, User>();
            allUsers.forEach(u => {
                if (u.role === 'PROFESSOR') pMap.set(u.id, u);
            });
            setProfsMap(pMap);
        };
        fetchData();
    }, [user]);

    // Handle sidebar sliding
    useEffect(() => {
        if (setFullScreen) {
            setFullScreen(!!activeLesson);
        }
        return () => {
            if (setFullScreen) setFullScreen(false);
        };
    }, [activeLesson, setFullScreen]);

    if (activeLesson) {
        return <LessonPlayer lesson={activeLesson} onComplete={() => setActiveLesson(null)} />;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {lessons.map(l => {
                const prof = profsMap.get(l.professorId);
                const subject = prof?.subject || 'Général';
                const isCompleted = l.completedBy?.includes(user.id);

                return (
                    <div key={l.id} className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition group relative">
                        {isCompleted && (
                            <div className="absolute top-4 right-4 text-green-600 bg-green-50 p-1 rounded-full" title="Terminé">
                                <CheckCircle className="w-5 h-5"/>
                            </div>
                        )}
                        
                        <div className="flex justify-between items-start mb-3">
                             <span className={`px-2 py-1 rounded text-xs font-bold ${
                                 l.type === 'VIDEO' ? 'bg-red-100 text-red-700' : 
                                 l.type === 'INTERACTIVE' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                             }`}>
                                     {l.type === 'VIDEO' ? t('video') : l.type === 'INTERACTIVE' ? 'Interactif' : t('document')}
                             </span>
                             <span className="text-xs text-gray-400">{new Date(l.createdAt).toLocaleDateString()}</span>
                        </div>
                        
                        {/* Subject Badge */}
                        <div className="mb-2">
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-wide">
                                {subject}
                            </span>
                        </div>

                        <h3 className="font-bold text-lg text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">{l.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-3 mb-4">{l.description}</p>
                        
                        <button 
                            onClick={() => setActiveLesson(l)}
                            className={`block w-full text-center py-2 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
                                isCompleted ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' :
                                l.type === 'VIDEO' ? 'bg-red-600 text-white hover:bg-red-700' :
                                l.type === 'INTERACTIVE' ? 'bg-indigo-600 text-white hover:bg-indigo-700' :
                                'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                        >
                            {l.type === 'VIDEO' ? <Play className="w-4 h-4 fill-current"/> : <Eye className="w-4 h-4"/>}
                            {isCompleted ? 'Revoir' : t('viewContent')}
                        </button>
                    </div>
                );
            })}
            {lessons.length === 0 && (
                <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
                    <p className="text-gray-500">Aucun cours disponible.</p>
                </div>
            )}
        </div>
    );
};

const StudentMessagesView: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLanguage();
    const [contacts, setContacts] = useState<User[]>([]);
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        const loadContacts = async () => {
            // Get professors assigned to student's classes
            const profs = StorageService.getProfessorsForStudent(user);
            // Get coordinators
            const allUsers = await ApiService.getUsers();
            const coords = allUsers.filter(u => u.role === UserRole.COORDINATOR && u.school === user.school && u.city === user.city);
            
            setContacts([...profs, ...coords]);
        };
        loadContacts();
    }, [user]);

    useEffect(() => {
        if (selectedContactId) {
             setMessages(StorageService.getMessages(user.id, selectedContactId));
             const interval = setInterval(() => {
                setMessages(StorageService.getMessages(user.id, selectedContactId));
             }, 3000);
             return () => clearInterval(interval);
        }
    }, [selectedContactId, user.id]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedContactId) return;
        const msg: Message = { id: `msg-${Date.now()}`, senderId: user.id, senderName: user.name, receiverId: selectedContactId, content: newMessage, timestamp: new Date().toISOString(), read: false };
        StorageService.sendMessage(msg);
        setMessages(prev => [...prev, msg]);
        setNewMessage('');
    };

    return (
        <div className="bg-white rounded-lg shadow h-[600px] flex overflow-hidden border animate-fade-in">
             <div className="w-1/3 border-e bg-gray-50 flex flex-col">
                <div className="p-4 border-b font-bold text-gray-700 bg-gray-100">{t('contact')}</div>
                <div className="flex-1 overflow-y-auto">
                     {contacts.length === 0 && <p className="p-4 text-sm text-gray-500 text-center">{t('noMessages')}</p>}
                     {contacts.map(contact => (
                        <button 
                            key={contact.id} 
                            onClick={() => setSelectedContactId(contact.id)} 
                            className={`w-full p-4 text-start hover:bg-blue-50 transition border-b flex justify-between items-center group ${selectedContactId === contact.id ? 'bg-blue-100 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}
                        >
                            <div>
                                <div className="font-bold text-gray-800 text-sm group-hover:text-blue-700">{contact.name}</div>
                                <div className="text-xs text-gray-500">{t(contact.role.toLowerCase())} {contact.subject ? `• ${contact.subject}` : ''}</div>
                            </div>
                            <ChevronRight className={`w-4 h-4 text-gray-300 ${selectedContactId === contact.id ? 'text-blue-500' : ''}`}/>
                        </button>
                     ))}
                </div>
             </div>
             <div className="w-2/3 flex flex-col bg-white">
                  {selectedContactId ? (
                       <>
                            <div className="p-4 border-b font-bold bg-white flex items-center gap-3 shadow-sm z-10">
                                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                                <div>
                                    <div className="text-gray-800">{contacts.find(u => u.id === selectedContactId)?.name}</div>
                                    <div className="text-xs text-gray-400 font-normal">{t('online')}</div>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                                {messages.map(m => (
                                    <div key={m.id} className={`flex ${m.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] p-3 rounded-2xl text-sm shadow-sm ${m.senderId === user.id ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border text-gray-800 rounded-bl-none'}`}>
                                            {m.content}
                                            <div className={`text-[10px] mt-1 text-end ${m.senderId === user.id ? 'text-blue-200' : 'text-gray-400'}`}>
                                                {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <form onSubmit={handleSend} className="p-4 border-t bg-white flex gap-2">
                                <input 
                                    className="flex-1 border rounded-full px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50" 
                                    placeholder={t('typeMessage')} 
                                    value={newMessage} 
                                    onChange={(e) => setNewMessage(e.target.value)} 
                                />
                                <button type="submit" className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 shadow-md transition transform active:scale-95">
                                    <Send className="w-5 h-5 rtl:flip" />
                                </button>
                            </form>
                       </>
                   ) : (
                       <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30">
                           <MessageCircle className="w-16 h-16 text-gray-200 mb-4"/>
                           <p>{t('selectProf')}</p>
                       </div>
                   )}
             </div>
         </div>
    );
};

// New: ProfileView
const ProfileView: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLanguage();
    const [form, setForm] = useState({ email: user.email || '', phone: user.phone || '' });

    const handleSave = () => {
        const updatedUser: User = { ...user, email: form.email, phone: form.phone };
        StorageService.saveUser(updatedUser);
        alert(t('profileSaved'));
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border max-w-2xl mx-auto space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Settings className="w-6 h-6"/> {t('profile')}</h2>
            
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                 <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-2xl">
                     {user.name.charAt(0).toUpperCase()}
                 </div>
                 <div>
                     <h3 className="font-bold text-lg">{user.name}</h3>
                     <p className="text-sm text-gray-500">{user.username}</p>
                 </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">{t('school')}</label>
                    <div className="w-full border p-2.5 rounded-lg bg-gray-100 text-gray-600 font-medium">{user.school || '-'}</div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">{t('city')}</label>
                    <div className="w-full border p-2.5 rounded-lg bg-gray-100 text-gray-600 font-medium">{user.city || '-'}</div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">{t('email')}</label>
                    <input className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="email@exemple.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">{t('phone')}</label>
                    <input className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="06..." value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                 </div>
            </div>
            
            <div className="pt-4 border-t">
                <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium w-full md:w-auto shadow-sm">
                    {t('save')}
                </button>
            </div>
        </div>
    );
};

const StudentDashboard: React.FC<{ user: User, onLogout: () => void, autoLaunchQuizId?: string | null }> = ({ user, onLogout, autoLaunchQuizId }) => {
    const { t, dir } = useLanguage();
    const location = useLocation();
    const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Auto-launch quiz logic
    useEffect(() => {
        if (autoLaunchQuizId) {
            const allQuizzes = StorageService.getAvailableQuizzesForStudent(user);
            const found = allQuizzes.find(q => q.id === autoLaunchQuizId);
            if (found) {
                setActiveQuiz(found);
            }
        }
    }, [autoLaunchQuizId, user]);

    const isActive = (path: string) => location.pathname.includes(`/student/${path}`);

    return (
        <div className="min-h-screen bg-gray-50 flex" dir={dir}>
            {/* Sidebar with slide transition */}
            <aside className={`bg-white border-r hidden md:flex flex-col z-10 transition-all duration-500 ease-in-out overflow-hidden ${isFullScreen ? '-ml-64 w-64 opacity-0' : 'ml-0 w-64 opacity-100'}`}>
                <div className="p-6 border-b flex items-center gap-3 bg-blue-600 text-white shrink-0">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                        <GraduationCap className="w-6 h-6 text-white"/>
                    </div>
                    <div>
                        <h1 className="font-bold font-logo text-lg tracking-tight">Tinmel</h1>
                        <p className="text-xs text-blue-100">{t('studentSpace')}</p>
                    </div>
                </div>
                
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {[
                        { id: 'home', icon: LayoutDashboard, label: t('dashboard') },
                        { id: 'quizzes', icon: FileText, label: t('myQuizzes') },
                        { id: 'lessons', icon: Book, label: t('myCourses') },
                        { id: 'results', icon: BarChart, label: t('results') },
                        { id: 'messages', icon: MessageCircle, label: t('messages') },
                        { id: 'profile', icon: Settings, label: t('profile') },
                    ].map(item => (
                        <Link 
                            key={item.id}
                            to={`/student/${item.id}`}
                            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive(item.id) ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'}`}
                        >
                            <item.icon className="w-5 h-5"/> {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t shrink-0">
                     <button onClick={onLogout} className="flex items-center gap-2 text-red-600 hover:bg-red-50 w-full px-4 py-2 rounded-lg transition-colors text-sm font-medium">
                        <LogOut className="w-4 h-4 rtl:flip"/> {t('logout')}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative transition-all duration-300">
                 {!isFullScreen && (
                     <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0 relative z-0 animate-fade-in">
                         <HeaderBackground />
                         <div className="z-10 flex items-center gap-4">
                             <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-lg shadow-sm">
                                 {user.name.charAt(0).toUpperCase()}
                             </div>
                             <div>
                                 <h2 className="font-bold text-gray-800">{user.name}</h2>
                                 <p className="text-xs text-gray-500">
                                    {user.enrolledClasses && user.enrolledClasses.length > 0 ? user.enrolledClasses.join(', ') : t('student')}
                                 </p>
                             </div>
                         </div>
                    </header>
                 )}

                <div className={`flex-1 overflow-auto relative z-0 transition-all duration-300 ${isFullScreen ? 'p-0' : 'p-6'}`}>
                    <Routes>
                        <Route path="home" element={<HomeView user={user} />} />
                        <Route path="quizzes" element={<QuizzesView user={user} onStartQuiz={setActiveQuiz} />} />
                        <Route path="lessons" element={<LessonsView user={user} setFullScreen={setIsFullScreen} />} />
                        <Route path="results" element={<ResultsView user={user} />} />
                        <Route path="messages" element={<StudentMessagesView user={user} />} />
                        <Route path="profile" element={<ProfileView user={user} />} />
                        <Route path="*" element={<Navigate to="home" replace />} />
                    </Routes>
                </div>
            </main>

            {/* Quiz Overlay */}
            {activeQuiz && (
                <div className="fixed inset-0 z-50 bg-white overflow-auto animate-fade-in flex flex-col">
                    <div className="p-4 border-b flex items-center gap-2">
                         <button onClick={() => setActiveQuiz(null)} className="text-gray-500 hover:text-gray-800 flex items-center gap-2 font-bold">
                             <ArrowLeft className="w-5 h-5 rtl:flip"/> {t('back')}
                         </button>
                         <span className="text-gray-300">|</span>
                         <span className="font-bold text-gray-700">{activeQuiz.title}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
                        <QuizTaker 
                            quiz={activeQuiz} 
                            studentId={user.id} 
                            studentName={user.name} 
                            onComplete={() => setActiveQuiz(null)} 
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;