import React, { useState, useEffect } from 'react';
import { User, Quiz, Lesson, WhiteboardSession, QuizResult } from '../../types';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { StorageService } from '../../services/storageService';
import { ApiService } from '../../services/apiService';
import { useLanguage } from '../../contexts/LanguageContext';
import { LayoutDashboard, CheckCircle, BookOpen, PenTool, User as UserIcon, LogOut, Search, Clock, Award, PlayCircle } from 'lucide-react';
import QuizTaker from '../Quiz/QuizTaker';
import WhiteboardRoom from '../Whiteboard/WhiteboardRoom';

interface Props {
  user: User;
  onLogout: () => void;
  autoLaunchQuizId: string | null;
}

const StudentDashboard: React.FC<Props> = ({ user, onLogout, autoLaunchQuizId }) => {
    const { t, dir } = useLanguage();
    const location = useLocation();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
    const [activeWhiteboardCode, setActiveWhiteboardCode] = useState<string | null>(null);

    const isActive = (path: string) => location.pathname.includes(`/student/${path}`);

    useEffect(() => {
        // Load assigned quizzes
        const allQuizzes = StorageService.getQuizzes();
        const myQuizzes = allQuizzes.filter(q => 
            q.status === 'PUBLISHED' && 
            user.enrolledClasses?.some(cls => q.assignedClasses.includes(cls))
        );
        setQuizzes(myQuizzes);

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
                        { id: 'quizzes', icon: CheckCircle, label: t('myQuizzes') },
                        { id: 'whiteboard', icon: PenTool, label: t('whiteboard') },
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
                        <Route path="overview" element={
                            <div className="grid gap-6">
                                <div className="bg-blue-600 text-white p-6 rounded-xl shadow-lg">
                                    <h3 className="text-xl font-bold mb-2">Prêt à apprendre ?</h3>
                                    <p className="text-blue-100">Vous avez {quizzes.length} quiz disponibles.</p>
                                </div>
                            </div>
                        } />
                        <Route path="quizzes" element={
                            <div className="grid gap-4">
                                {quizzes.map(q => (
                                    <div key={q.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center">
                                        <div>
                                            <h4 className="font-bold text-gray-800">{q.title}</h4>
                                            <p className="text-sm text-gray-500">{q.questions.length} questions</p>
                                        </div>
                                        <button onClick={() => setActiveQuiz(q)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">
                                            {t('start')}
                                        </button>
                                    </div>
                                ))}
                                {quizzes.length === 0 && <p className="text-gray-500 text-center">{t('noData')}</p>}
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
                        <Route path="*" element={<Navigate to="overview" replace />} />
                    </Routes>
                 </div>
             </main>
        </div>
    );
};

export default StudentDashboard;