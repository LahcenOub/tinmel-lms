
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { User, UserRole, Quiz, QuizResult, Message, Lesson, LessonType, Announcement, WhiteboardSession } from '../../types';
import { StorageService } from '../../services/storageService';
import QuizBuilder from '../Quiz/QuizBuilder';
import WhiteboardRoom from '../Whiteboard/WhiteboardRoom';
import { LogOut, Users, FileText, BarChart, Download, Link as LinkIcon, Lock, Globe, EyeOff, Clock, MessageCircle, Send, BookOpen, Video, File, Trash, UserCircle, Save, Bell, X, Megaphone, Filter, PlusCircle, AlertTriangle, Coffee, Table, PenTool, ExternalLink } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useLanguage } from '../../contexts/LanguageContext';

interface Props {
  user: User;
  onLogout: () => void;
}

// --- SUB-COMPONENTS (VIEWS) ---

const QuizzesView: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLanguage();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        setQuizzes(StorageService.getQuizzesByProf(user.id));
    }, [user.id]);

    const toggleQuizStatus = (quiz: Quiz) => {
        const updatedQuiz = { ...quiz, status: quiz.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' as 'DRAFT' | 'PUBLISHED' };
        StorageService.saveQuiz(updatedQuiz);
        setQuizzes(StorageService.getQuizzesByProf(user.id));
    };

    const copyQuizLink = (quizId: string) => {
        const url = `${window.location.origin}${window.location.pathname}?quizId=${quizId}`; // Note: This might need adjustment based on route
        // Better to use a clean base URL
        const cleanUrl = `${window.location.origin}/?quizId=${quizId}`;
        navigator.clipboard.writeText(cleanUrl);
        alert(t('linkCopied'));
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">{t('myQuizzes')}</h2>
                    <div className="text-sm text-gray-500 italic mt-1">{t('unifiedClassWarning')}</div>
                </div>
                <button onClick={() => navigate('new')} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 shadow-sm flex items-center gap-2">
                    <PlusCircle className="w-4 h-4"/> {t('createQuiz')}
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quizzes.map(q => (
                    <div key={q.id} className="bg-white p-5 rounded-lg shadow border hover:shadow-md transition flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg">{q.title}</h3>
                                {q.status === 'PUBLISHED' ? <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">{t('published')}</span> : <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">{t('draft')}</span>}
                            </div>
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">{q.questions.length} Q.</span>
                                {q.assignedClasses.length > 0 && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">{q.assignedClasses.length} Classes</span>}
                            </div>
                        </div>
                        <div className="flex gap-2 border-t pt-4">
                            <button onClick={() => toggleQuizStatus(q)} className="flex-1 text-xs py-2 rounded bg-gray-100 hover:bg-gray-200 transition">{q.status === 'PUBLISHED' ? t('unpublish') : t('publish')}</button>
                            <button onClick={() => copyQuizLink(q.id)} className="flex-1 bg-blue-50 text-blue-700 text-xs py-2 rounded hover:bg-blue-100 transition"><LinkIcon className="w-3 h-3 inline"/> {t('copyLink')}</button>
                        </div>
                    </div>
                ))}
                {quizzes.length === 0 && <p className="col-span-full text-center text-gray-400 py-10">{t('noData')}</p>}
            </div>
        </div>
    );
};

const LessonsView: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLanguage();
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        setLessons(StorageService.getLessonsByProf(user.id));
    }, [user.id]);

    const toggleLessonStatus = (lesson: Lesson) => {
        const updatedLesson = { ...lesson, status: lesson.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' as 'DRAFT' | 'PUBLISHED' };
        StorageService.saveLesson(updatedLesson);
        setLessons(StorageService.getLessonsByProf(user.id));
    };

    const deleteLesson = (id: string) => {
        if(confirm(t('delete') + '?')) {
            StorageService.deleteLesson(id);
            setLessons(StorageService.getLessonsByProf(user.id));
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-end mb-6">
                <button onClick={() => navigate('new')} className="bg-blue-600 text-white px-4 py-2 rounded shadow flex items-center gap-2 hover:bg-blue-700">
                    <PlusCircle className="w-4 h-4"/> {t('createLesson')}
                </button>
            </div>
            <div className="space-y-4">
                {lessons.map(l => (
                    <div key={l.id} className="bg-white p-4 rounded-lg shadow border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                {l.type === LessonType.VIDEO ? <Video className="w-4 h-4 text-red-500"/> : <File className="w-4 h-4 text-blue-500"/>}
                                {l.title}
                            </h3>
                            <p className="text-sm text-gray-500">{l.assignedClasses.join(', ')}</p>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <button onClick={() => toggleLessonStatus(l)} className={`text-xs px-3 py-2 border rounded flex-1 md:flex-none transition ${l.status === 'PUBLISHED' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50'}`}>
                                {l.status === 'PUBLISHED' ? t('published') : t('draft')}
                            </button>
                            <button onClick={() => deleteLesson(l.id)} className="text-red-500 p-2 hover:bg-red-50 rounded"><Trash className="w-4 h-4"/></button>
                        </div>
                    </div>
                ))}
                 {lessons.length === 0 && <p className="text-center text-gray-400 py-10">{t('noCourses')}</p>}
            </div>
        </div>
    );
};

const StudentsView: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLanguage();
    const [classFilter, setClassFilter] = useState('');
    const [students, setStudents] = useState<User[]>([]);
    const assignedClasses = user.assignedSections || [];

    useEffect(() => {
        // Fetch students only once or when needed
        setStudents(StorageService.getUsers().filter(u => u.role === UserRole.STUDENT));
    }, []);

    const filteredStudents = students.filter(s => {
        if (s.school !== user.school || s.city !== user.city) return false;
        const sClasses = s.enrolledClasses || [];
        const isInProfClasses = sClasses.some(c => assignedClasses.includes(c));
        if (!isInProfClasses) return false;
        if (classFilter) return sClasses.includes(classFilter);
        return true;
    });

    return (
        <div className="bg-white p-6 rounded-lg shadow animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold">{t('studentsList')}</h2>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500"/>
                    <select className="border rounded-md p-1.5 text-sm" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
                        <option value="">{t('allClasses')}</option>
                        {assignedClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                    </select>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-start text-sm">
                    <thead className="bg-gray-50"><tr><th className="p-3 text-start">{t('student')}</th><th className="p-3 text-start">Class</th><th className="p-3 text-start">{t('username')}</th></tr></thead>
                    <tbody>
                        {filteredStudents.map(s => (
                            <tr key={s.id} className="border-b">
                                <td className="p-3 font-medium">{s.name}</td>
                                <td className="p-3">{s.enrolledClasses?.filter(c => assignedClasses.includes(c)).join(', ')}</td>
                                <td className="p-3 text-gray-600">{s.username}</td>
                            </tr>
                        ))}
                        {filteredStudents.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-gray-400">{t('noData')}</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ResultsView: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLanguage();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [results, setResults] = useState<QuizResult[]>([]);
    const [students, setStudents] = useState<User[]>([]);
    const [selectedResultClass, setSelectedResultClass] = useState<string>('');
    const assignedClasses = user.assignedSections || [];

    useEffect(() => {
        setQuizzes(StorageService.getQuizzesByProf(user.id));
        setResults(StorageService.getResults());
        setStudents(StorageService.getUsers().filter(u => u.role === UserRole.STUDENT));
        if (assignedClasses.length > 0) setSelectedResultClass(assignedClasses[0]);
    }, [user.id]);

    const calculateQuizStats = (quiz: Quiz) => {
        const quizResults = results.filter(r => r.quizId === quiz.id);
        if (quizResults.length === 0) return null;
        const totalScore = quizResults.reduce((acc, r) => acc + (r.score / r.maxScore) * 100, 0);
        const avgScore = totalScore / quizResults.length;
        const maxScore = Math.max(...quizResults.map(r => r.score));
        return { participants: quizResults.length, avg: Math.round(avgScore), best: maxScore };
    };

    const exportClassResultsMatrix = () => {
        if (!selectedResultClass) return;
        const classStudents = students.filter(s => s.school === user.school && s.city === user.city && s.enrolledClasses?.includes(selectedResultClass));
        const classQuizzes = quizzes.filter(q => q.assignedClasses.includes(selectedResultClass) || q.assignedClasses.length === 0);
        const data = classStudents.map(s => {
            const row: any = { [t('student')]: s.name };
            classQuizzes.forEach(q => {
                 const res = results.find(r => r.quizId === q.id && r.studentId === s.id);
                 row[q.title] = res ? `${res.score}/${res.maxScore}` : '-';
            });
            return row;
        });
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, selectedResultClass);
        XLSX.writeFile(wb, `Resultats_${selectedResultClass}.xlsx`);
    };

    return (
        <div className="space-y-6 animate-fade-in">
             {/* Quiz Performance Block */}
             <div className="bg-white p-6 rounded-lg shadow border-t-4 border-indigo-500">
                <h3 className="font-bold text-gray-800 mb-4 text-lg">{t('quizPerformance')}</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-3 text-start">{t('quizTitle')}</th>
                                <th className="p-3 text-center">{t('participants')}</th>
                                <th className="p-3 text-center">{t('avgScore')}</th>
                                <th className="p-3 text-center">{t('bestScore')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quizzes.map(q => {
                                const stats = calculateQuizStats(q);
                                if (!stats) return null;
                                return (
                                    <tr key={q.id} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="p-3 font-medium text-gray-800">{q.title}</td>
                                        <td className="p-3 text-center">{stats.participants}</td>
                                        <td className="p-3 text-center font-bold text-blue-600">{stats.avg}%</td>
                                        <td className="p-3 text-center text-green-600">{stats.best} pts</td>
                                    </tr>
                                );
                            })}
                            {quizzes.every(q => !calculateQuizStats(q)) && <tr><td colSpan={4} className="p-6 text-center text-gray-400">{t('noData')}</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Class Matrix */}
            <div className="bg-white p-6 rounded-lg shadow border-t-4 border-purple-500">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><Table className="w-5 h-5"/> {t('resultsByClass')}</h3>
                    <div className="flex gap-2 w-full md:w-auto">
                        <select className="border rounded p-2 text-sm bg-white flex-1 md:flex-none" value={selectedResultClass} onChange={(e) => setSelectedResultClass(e.target.value)}>
                            <option value="" disabled>{t('selectClassResults')}</option>
                            {assignedClasses.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <button onClick={exportClassResultsMatrix} disabled={!selectedResultClass} className="bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1">
                            <Download className="w-4 h-4"/> {t('exportExcel')}
                        </button>
                    </div>
                </div>
                {selectedResultClass && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-purple-50">
                                <tr>
                                    <th className="p-3 border sticky left-0 bg-purple-50 min-w-[150px]">{t('student')}</th>
                                    {quizzes.filter(q => q.assignedClasses.includes(selectedResultClass) || q.assignedClasses.length === 0).map(q => (
                                        <th key={q.id} className="p-3 border text-center whitespace-nowrap min-w-[100px]">{q.title}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {students.filter(s => s.school === user.school && s.city === user.city && s.enrolledClasses?.includes(selectedResultClass)).map(s => (
                                    <tr key={s.id} className="hover:bg-gray-50">
                                        <td className="p-3 border font-medium sticky left-0 bg-white">{s.name}</td>
                                        {quizzes.filter(q => q.assignedClasses.includes(selectedResultClass) || q.assignedClasses.length === 0).map(q => {
                                            const res = results.find(r => r.quizId === q.id && r.studentId === s.id);
                                            return <td key={q.id} className="p-3 border text-center">{res ? <span className={`font-bold ${res.score >= (res.maxScore/2) ? 'text-green-600' : 'text-red-600'}`}>{res.score}/{res.maxScore}</span> : <span className="text-gray-300">-</span>}</td>;
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

const StaffRoomView: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLanguage();
    const staffChatId = `chat_${user.school}_${user.city}`;
    const [staffMessages, setStaffMessages] = useState<Message[]>([]);
    const [newStaffMessage, setNewStaffMessage] = useState('');

    useEffect(() => {
        setStaffMessages(StorageService.getGroupMessages(staffChatId));
        // Mark as read
        localStorage.setItem(`lastStaffRead_${user.id}`, Date.now().toString());
    }, [user.id, staffChatId]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStaffMessage.trim()) return;
        const msg: Message = { id: `smsg-${Date.now()}`, senderId: user.id, senderName: user.name, receiverId: staffChatId, content: newStaffMessage, timestamp: new Date().toISOString(), read: false };
        StorageService.sendMessage(msg);
        setStaffMessages([...staffMessages, msg]);
        setNewStaffMessage('');
    };

    return (
        <div className="bg-white rounded-lg shadow h-[600px] flex flex-col animate-fade-in">
            <div className="p-4 border-b bg-indigo-50 font-bold text-indigo-800 flex items-center gap-2">
                <Coffee className="w-5 h-5"/> {t('staffRoom')} - {user.school}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {staffMessages.map(m => (
                    <div key={m.id} className={`flex ${m.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] p-3 rounded-lg text-sm shadow-sm ${m.senderId === user.id ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>
                            <div className="text-xs opacity-75 mb-1 font-bold">{m.senderName}</div>
                            {m.content}
                        </div>
                    </div>
                ))}
            </div>
            <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
                <input className="flex-1 border rounded-full px-4 py-2" placeholder={t('typeMessage')} value={newStaffMessage} onChange={(e) => setNewStaffMessage(e.target.value)} />
                <button type="submit" className="bg-indigo-600 text-white p-2 rounded-full"><Send className="w-5 h-5 rtl:flip"/></button>
            </form>
        </div>
    );
};

const ProfileView: React.FC<{ user: User, onUpdate: (u: User) => void }> = ({ user, onUpdate }) => {
    const { t } = useLanguage();
    const [form, setForm] = useState({ email: user.email || '', phone: user.phone || '' });
    const stats = StorageService.getSchoolStats(user.school!, user.city!);

    const handleSave = () => {
        const updatedUser: User = { ...user, email: form.email, phone: form.phone };
        StorageService.saveUser(updatedUser);
        onUpdate(updatedUser);
        alert(t('profileSaved'));
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow max-w-2xl mx-auto space-y-4 animate-fade-in">
            <h2 className="text-2xl font-bold">{t('profile')}</h2>
            <div className="p-4 bg-gray-50 rounded border">
                <p className="text-sm text-gray-500">{t('school')}</p>
                <p className="font-bold">{user.school} ({user.city})</p>
                <p className="text-xs text-blue-600 mt-2">{t('schoolStats')}: {stats.profCount} Profs, {stats.totalResults} Engagements.</p>
            </div>
            <input className="w-full border p-2 rounded" placeholder={t('email')} value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            <input className="w-full border p-2 rounded" placeholder={t('phone')} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded">{t('save')}</button>
        </div>
    );
};

const MessagesView: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLanguage();
    const [conversations, setConversations] = useState<string[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        setConversations(StorageService.getConversationsForUser(user.id));
    }, [user.id]);

    useEffect(() => {
        if (selectedStudentId) {
            const msgs = StorageService.getMessages(user.id, selectedStudentId);
            setMessages(msgs);
            const unreadIds = msgs.filter(m => m.senderId === selectedStudentId && !m.read).map(m => m.id);
            if (unreadIds.length > 0) StorageService.markAsRead(unreadIds);
        }
    }, [selectedStudentId, user.id]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedStudentId) return;
        const msg: Message = { id: `msg-${Date.now()}`, senderId: user.id, senderName: user.name, receiverId: selectedStudentId, content: newMessage, timestamp: new Date().toISOString(), read: false };
        StorageService.sendMessage(msg);
        setMessages([...messages, msg]);
        setNewMessage('');
    };

    return (
        <div className="bg-white rounded-lg shadow h-[600px] flex overflow-hidden border animate-fade-in">
             <div className="w-1/3 border-e bg-gray-50 flex flex-col">
                <div className="p-4 border-b font-bold text-gray-700">{t('startConversation')}</div>
                <div className="flex-1 overflow-y-auto">
                     {conversations.length === 0 && <p className="p-4 text-sm text-gray-500 text-center">{t('noMessages')}</p>}
                     {conversations.map(userId => {
                        const userObj = StorageService.getUsers().find(u => u.id === userId);
                        if (!userObj) return null;
                        const hasUnread = StorageService.getMessages(user.id, userId).some(m => m.senderId === userId && !m.read);
                        return (
                            <button key={userId} onClick={() => setSelectedStudentId(userId)} className={`w-full p-4 text-start hover:bg-blue-50 transition border-b flex justify-between items-center ${selectedStudentId === userId ? 'bg-blue-100' : ''}`}>
                                <div><div className="font-medium">{userObj.name}</div><div className="text-xs text-gray-500">{t(userObj.role.toLowerCase())}</div></div>
                                {hasUnread && <span className="w-2 h-2 bg-green-500 rounded-full"></span>}
                            </button>
                        );
                     })}
                </div>
             </div>
             <div className="w-2/3 flex flex-col bg-white">
                  {selectedStudentId ? (
                       <>
                            <div className="p-4 border-b font-bold bg-gray-50 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                {StorageService.getUsers().find(u => u.id === selectedStudentId)?.name}
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.map(m => (
                                    <div key={m.id} className={`flex ${m.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] p-3 rounded-lg text-sm shadow-sm ${m.senderId === user.id ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                                            {m.content}
                                            <div className={`text-[10px] mt-1 opacity-70 ${m.senderId === user.id ? 'text-blue-100' : 'text-gray-500'}`}>{new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
                                <input className="flex-1 border rounded-full px-4 py-2" placeholder={t('typeMessage')} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                                <button type="submit" className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700"><Send className="w-5 h-5 rtl:flip" /></button>
                            </form>
                       </>
                   ) : (
                       <div className="flex-1 flex items-center justify-center text-gray-400"><p>{t('selectStudent')}</p></div>
                   )}
             </div>
         </div>
    );
};

// --- WHITEBOARD VIEW ---

const WhiteboardView: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLanguage();
    const [sessions, setSessions] = useState<WhiteboardSession[]>([]);
    const [newTitle, setNewTitle] = useState('');
    const [activeSession, setActiveSession] = useState<string | null>(null);

    useEffect(() => {
        // Filter my whiteboards
        const all = StorageService.getWhiteboards();
        setSessions(all.filter(w => w.hostId === user.id));
    }, [user.id]);

    const handleCreateSession = () => {
        if (!newTitle.trim()) return;
        
        // Simple random key 6 chars
        const key = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const newSession: WhiteboardSession = {
            id: `wb-${Date.now()}`,
            hostId: user.id,
            hostName: user.name,
            title: newTitle,
            accessKey: key,
            isActive: true,
            createdAt: new Date().toISOString(),
            strokes: []
        };
        
        StorageService.saveWhiteboard(newSession);
        setActiveSession(newSession.id);
        setNewTitle('');
    };

    if (activeSession) {
        return <WhiteboardRoom user={user} sessionId={activeSession} onExit={() => { setActiveSession(null); setSessions(StorageService.getWhiteboards().filter(w => w.hostId === user.id)); }} />;
    }

    return (
        <div className="animate-fade-in">
             <div className="bg-white p-6 rounded-lg shadow mb-6">
                 <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><PenTool className="w-6 h-6"/> {t('createRoom')}</h2>
                 <div className="flex gap-4">
                     <input 
                        className="flex-1 border rounded p-2" 
                        placeholder={t('roomTitle')}
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                     />
                     <button onClick={handleCreateSession} className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 font-bold">
                         {t('start')}
                     </button>
                 </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {sessions.map(s => (
                     <div key={s.id} className="bg-white p-4 rounded-lg shadow border hover:shadow-md transition">
                         <div className="flex justify-between items-start mb-2">
                             <h3 className="font-bold text-lg">{s.title}</h3>
                             {s.isActive ? <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded animate-pulse">LIVE</span> : <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded">Closed</span>}
                         </div>
                         <div className="bg-gray-50 p-2 rounded mb-4 font-mono text-center text-lg tracking-widest border border-dashed border-gray-300 select-all">
                             {s.accessKey}
                         </div>
                         <div className="flex gap-2">
                             <button onClick={() => setActiveSession(s.id)} className="flex-1 bg-blue-50 text-blue-600 py-2 rounded hover:bg-blue-100 font-medium">{t('enter')}</button>
                             <button onClick={() => { StorageService.saveWhiteboard({...s, isActive: !s.isActive}); setSessions(prev => prev.map(p => p.id === s.id ? {...s, isActive: !s.isActive} : p)); }} className="text-xs text-gray-500 px-2 underline">
                                 {s.isActive ? t('close') : t('reopen')}
                             </button>
                         </div>
                     </div>
                 ))}
             </div>
        </div>
    );
};

// --- BUILDER WRAPPERS ---

const QuizBuilderWrapper: React.FC<{ user: User }> = ({ user }) => {
    const navigate = useNavigate();
    const assignedClasses = user.assignedSections || [];
    
    return (
        <QuizBuilder 
            profId={user.id} 
            onSave={(quiz) => {
                StorageService.saveQuiz(quiz);
                navigate('/professor/quizzes');
            }} 
            onCancel={() => navigate('/professor/quizzes')} 
            availableClasses={assignedClasses} 
        />
    );
};

const LessonBuilderWrapper: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const assignedClasses = user.assignedSections || [];
    const [form, setForm] = useState({ title: '', desc: '', classes: [] as string[], type: LessonType.VIDEO, content: '', status: 'DRAFT' as 'DRAFT' | 'PUBLISHED' });

    const handleSave = () => {
        if (!form.title || !form.content) return;
        const newLesson: Lesson = { id: `les-${Date.now()}`, professorId: user.id, title: form.title, description: form.desc, assignedClasses: form.classes, type: form.type, contentUrl: form.content, createdAt: new Date().toISOString(), status: form.status };
        StorageService.saveLesson(newLesson);
        navigate('/professor/lessons');
    };

    const toggleClass = (cls: string) => {
        setForm(prev => ({ ...prev, classes: prev.classes.includes(cls) ? prev.classes.filter(c => c !== cls) : [...prev.classes, cls] }));
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-3xl mx-auto animate-fade-in">
           <h2 className="text-2xl font-bold mb-6">{t('createLesson')}</h2>
           <div className="space-y-4">
               <div>
                   <label className="block text-sm font-medium mb-1">{t('lessonTitle')}</label>
                   <input className="w-full border rounded p-2" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
               </div>
               <div>
                   <label className="block text-sm font-medium mb-1">{t('lessonDesc')}</label>
                   <textarea className="w-full border rounded p-2" value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                    <div>
                         <label className="block text-sm font-medium mb-1">{t('lessonType')}</label>
                         <div className="flex gap-2">
                             <button onClick={() => setForm({...form, type: LessonType.VIDEO})} className={`flex-1 py-2 border rounded ${form.type === LessonType.VIDEO ? 'bg-red-50 border-red-500 text-red-600' : ''}`}>Vidéo</button>
                             <button onClick={() => setForm({...form, type: LessonType.DOCUMENT})} className={`flex-1 py-2 border rounded ${form.type === LessonType.DOCUMENT ? 'bg-blue-50 border-blue-500 text-blue-600' : ''}`}>Doc</button>
                         </div>
                    </div>
                    <div>
                         <label className="block text-sm font-medium mb-1">{form.type === LessonType.VIDEO ? t('videoUrl') : t('fileUpload')}</label>
                         <input className="w-full border rounded p-2" value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder={form.type === LessonType.VIDEO ? "https://youtube.com/..." : "URL..."} />
                    </div>
               </div>
               <div>
                   <label className="block text-sm font-medium mb-1">{t('assignedClasses')}</label>
                   <div className="grid grid-cols-3 gap-2 border p-3 rounded max-h-32 overflow-y-auto">
                       {assignedClasses.map(cls => (
                           <label key={cls} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                               <input type="checkbox" checked={form.classes.includes(cls)} onChange={() => toggleClass(cls)} /> {cls}
                           </label>
                       ))}
                       {assignedClasses.length === 0 && <span className="text-gray-400 text-xs col-span-3">{t('noClassesFound')}</span>}
                   </div>
               </div>
           </div>
           <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
               <button onClick={() => navigate('/professor/lessons')} className="px-4 py-2 text-gray-600 hover:text-gray-800">{t('cancel')}</button>
               <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 flex items-center gap-2">
                   <Save className="h-4 w-4 rtl:flip" /> {t('save')}
               </button>
           </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

const ProfessorDashboard: React.FC<Props> = ({ user: initialUser, onLogout }) => {
  const { t, dir } = useLanguage();
  const [currentUser, setCurrentUser] = useState<User>(initialUser);
  const location = useLocation();

  // Notifications logic
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [unreadStaffCount, setUnreadStaffCount] = useState(0);
  
  const refreshNotifications = () => {
      setUnreadMsgCount(StorageService.getUnreadCount(currentUser.id));
      const staffChatId = `chat_${currentUser.school}_${currentUser.city}`;
      const lastStaffRead = localStorage.getItem(`lastStaffRead_${currentUser.id}`) || '0';
      setUnreadStaffCount(StorageService.getNewStaffMessagesCount(staffChatId, new Date(parseInt(lastStaffRead)).toISOString(), currentUser.id));
  };

  useEffect(() => {
      refreshNotifications();
      const interval = setInterval(refreshNotifications, 15000);
      return () => clearInterval(interval);
  }, [currentUser]);

  // Check active route for styling - Updated to check /professor/ path
  const isActive = (path: string) => location.pathname.includes(`/professor/${path}`);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col" dir={dir}>
       <header className="bg-white shadow px-8 py-4 flex justify-between items-center sticky top-0 z-20">
           <div className="flex items-center gap-4">
               <span className="text-3xl font-black text-blue-700 font-logo tracking-tight">{t('appName')}</span>
               <div className="h-6 w-px bg-gray-300"></div>
               <div>
                   <h1 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{t('staffSpace')}</h1>
                   <p className="text-gray-500 text-xs">{currentUser.name}</p>
                   {currentUser.school && <p className="text-blue-600 text-[10px] font-bold">{currentUser.school} ({currentUser.city})</p>}
               </div>
           </div>
           <button onClick={onLogout} className="text-red-600 hover:text-red-800 flex items-center gap-2 text-sm font-medium">
               <LogOut className="w-4 h-4 rtl:flip"/> {t('logout')}
           </button>
       </header>

       <main className="flex-1 p-8 max-w-6xl mx-auto w-full">
           <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-300">
               {[
                   { id: 'quizzes', icon: FileText, label: t('myQuizzes') },
                   { id: 'lessons', icon: BookOpen, label: t('myCourses') },
                   { id: 'students', icon: Users, label: t('myStudents') },
                   { id: 'results', icon: BarChart, label: t('results') },
                   { id: 'messages', icon: MessageCircle, label: t('messages'), badge: unreadMsgCount },
                   { id: 'whiteboard', icon: PenTool, label: t('whiteboard') },
                   { id: 'staff-room', icon: Coffee, label: t('staffRoom'), badge: unreadStaffCount },
                   { id: 'profile', icon: UserCircle, label: t('profile') }
               ].map(tab => (
                   <Link 
                       key={tab.id} 
                       to={`/professor/${tab.id}`} 
                       className={`pb-2 px-4 flex items-center gap-2 border-b-2 transition-colors relative ${isActive(tab.id) ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                   >
                       <tab.icon className="w-4 h-4"/> {tab.label}
                       {tab.badge ? <span className="absolute top-0 right-1 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse ring-2 ring-white"></span> : null}
                   </Link>
               ))}
           </div>

           <Routes>
               <Route path="quizzes" element={<QuizzesView user={currentUser} />} />
               <Route path="quizzes/new" element={<QuizBuilderWrapper user={currentUser} />} />
               
               <Route path="lessons" element={<LessonsView user={currentUser} />} />
               <Route path="lessons/new" element={<LessonBuilderWrapper user={currentUser} />} />
               
               <Route path="students" element={<StudentsView user={currentUser} />} />
               <Route path="results" element={<ResultsView user={currentUser} />} />
               
               <Route path="messages" element={<MessagesView user={currentUser} />} />
               <Route path="whiteboard" element={<WhiteboardView user={currentUser} />} />
               <Route path="staff-room" element={<StaffRoomView user={currentUser} />} />
               
               <Route path="profile" element={<ProfileView user={currentUser} onUpdate={setCurrentUser} />} />
               
               <Route path="*" element={<Navigate to="quizzes" replace />} />
           </Routes>
       </main>
    </div>
  );
};

export default ProfessorDashboard;