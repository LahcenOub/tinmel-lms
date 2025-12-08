
import React, { useState, useEffect } from 'react';
import { User, UserRole, Quiz, QuizResult, Message, Lesson, LessonType, Announcement } from '../../types';
import { StorageService } from '../../services/storageService';
import QuizBuilder from '../Quiz/QuizBuilder';
import { LogOut, Users, FileText, BarChart, Download, Link as LinkIcon, Lock, Globe, EyeOff, Clock, MessageCircle, Send, BookOpen, Video, File, Trash, UserCircle, Save, Bell, X, Megaphone, Filter, PlusCircle, AlertTriangle, Coffee, Table } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useLanguage } from '../../contexts/LanguageContext';

interface Props {
  user: User;
  onLogout: () => void;
}

const ProfessorDashboard: React.FC<Props> = ({ user: initialUser, onLogout }) => {
  const { t, dir } = useLanguage();
  const [currentUser, setCurrentUser] = useState<User>(initialUser);
  const [activeTab, setActiveTab] = useState<'students' | 'quizzes' | 'lessons' | 'results' | 'messages' | 'profile' | 'staffRoom'>('quizzes');
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [students, setStudents] = useState<User[]>(StorageService.getUsers().filter(u => u.role === UserRole.STUDENT)); 
  const [quizzes, setQuizzes] = useState<Quiz[]>(StorageService.getQuizzesByProf(currentUser.id));
  const [results, setResults] = useState<QuizResult[]>(StorageService.getResults());
  
  // Announcements
  const [latestAnnouncement, setLatestAnnouncement] = useState<Announcement | null>(null);
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  // Filter & Class Management
  const [classFilter, setClassFilter] = useState('');
  const [selectedResultClass, setSelectedResultClass] = useState<string>('');
  
  // ASSIGNED CLASSES (Read Only)
  const assignedClasses = currentUser.assignedSections || [];

  // Lessons
  const [lessons, setLessons] = useState<Lesson[]>(StorageService.getLessonsByProf(currentUser.id));
  const [isCreatingLesson, setIsCreatingLesson] = useState(false);
  const [lessonForm, setLessonForm] = useState<{title: string, desc: string, classes: string[], type: LessonType, content: string, status: 'DRAFT' | 'PUBLISHED'}>({
      title: '', desc: '', classes: [], type: LessonType.VIDEO, content: '', status: 'DRAFT'
  });

  // Messaging
  const [conversations, setConversations] = useState<string[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // NOTIFICATIONS
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [unreadStaffCount, setUnreadStaffCount] = useState(0);

  // Staff Room
  const staffChatId = `chat_${currentUser.school}_${currentUser.city}`;
  const [staffMessages, setStaffMessages] = useState<Message[]>([]);
  const [newStaffMessage, setNewStaffMessage] = useState('');

  // Profile Form (Restricted)
  const [profileForm, setProfileForm] = useState({
      email: currentUser.email || '',
      phone: currentUser.phone || '',
  });

  useEffect(() => {
      // Check for announcements on mount
      const announcements = StorageService.getAnnouncements();
      if (announcements.length > 0) {
          const latest = announcements[0];
          const lastSeen = localStorage.getItem('lastSeenAnnouncement');
          if (latest.id !== lastSeen) {
              setLatestAnnouncement(latest);
              setShowAnnouncement(true);
          }
      }
      // Initial notification check
      refreshNotifications();
      const interval = setInterval(refreshNotifications, 15000); // Check every 15s
      return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
      if (assignedClasses.length > 0 && !selectedResultClass) {
          setSelectedResultClass(assignedClasses[0]);
      }
  }, [assignedClasses]);

  const refreshNotifications = () => {
      setUnreadMsgCount(StorageService.getUnreadCount(currentUser.id));
      const lastStaffRead = localStorage.getItem(`lastStaffRead_${currentUser.id}`) || '0';
      setUnreadStaffCount(StorageService.getNewStaffMessagesCount(staffChatId, new Date(parseInt(lastStaffRead)).toISOString(), currentUser.id));
  };

  const closeAnnouncement = () => {
      if(latestAnnouncement) {
          localStorage.setItem('lastSeenAnnouncement', latestAnnouncement.id);
      }
      setShowAnnouncement(false);
  }

  // Handle Tab Changes for Notifications
  useEffect(() => {
      if (activeTab === 'messages') {
          setConversations(StorageService.getConversationsForUser(currentUser.id));
      }
      if (activeTab === 'staffRoom') {
          setStaffMessages(StorageService.getGroupMessages(staffChatId));
          // Mark Staff Room as Read
          localStorage.setItem(`lastStaffRead_${currentUser.id}`, Date.now().toString());
          setUnreadStaffCount(0);
      }
  }, [activeTab]);

  useEffect(() => {
      if (selectedStudentId) {
          const msgs = StorageService.getMessages(currentUser.id, selectedStudentId);
          setMessages(msgs);
          
          // Mark messages from this student as read
          const unreadIds = msgs.filter(m => m.senderId === selectedStudentId && !m.read).map(m => m.id);
          if (unreadIds.length > 0) {
              StorageService.markAsRead(unreadIds);
              refreshNotifications();
          }
      }
  }, [selectedStudentId]);

  const handleSendMessage = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || !selectedStudentId) return;
      const msg: Message = { id: `msg-${Date.now()}`, senderId: currentUser.id, senderName: currentUser.name, receiverId: selectedStudentId, content: newMessage, timestamp: new Date().toISOString(), read: false };
      StorageService.sendMessage(msg);
      setMessages([...messages, msg]);
      setNewMessage('');
  };

  const handleSendStaffMessage = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newStaffMessage.trim()) return;
      const msg: Message = { id: `smsg-${Date.now()}`, senderId: currentUser.id, senderName: currentUser.name, receiverId: staffChatId, content: newStaffMessage, timestamp: new Date().toISOString(), read: false };
      StorageService.sendMessage(msg);
      setStaffMessages([...staffMessages, msg]);
      setNewStaffMessage('');
  };

  const handleSaveQuiz = (quiz: Quiz) => {
      StorageService.saveQuiz(quiz);
      setQuizzes(StorageService.getQuizzesByProf(currentUser.id));
      setIsCreatingQuiz(false);
  };

  const handleSaveLesson = () => {
      if (!lessonForm.title || !lessonForm.content) return;
      const newLesson: Lesson = { id: `les-${Date.now()}`, professorId: currentUser.id, title: lessonForm.title, description: lessonForm.desc, assignedClasses: lessonForm.classes, type: lessonForm.type, contentUrl: lessonForm.content, createdAt: new Date().toISOString(), status: lessonForm.status };
      StorageService.saveLesson(newLesson);
      setLessons(StorageService.getLessonsByProf(currentUser.id));
      setIsCreatingLesson(false);
      setLessonForm({title: '', desc: '', classes: [], type: LessonType.VIDEO, content: '', status: 'DRAFT'});
  };

  const deleteLesson = (id: string) => {
      if(confirm(t('delete') + '?')) {
          StorageService.deleteLesson(id);
          setLessons(StorageService.getLessonsByProf(currentUser.id));
      }
  };

  const toggleQuizStatus = (quiz: Quiz) => {
      const updatedQuiz = { ...quiz, status: quiz.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' as 'DRAFT' | 'PUBLISHED' };
      StorageService.saveQuiz(updatedQuiz);
      setQuizzes(StorageService.getQuizzesByProf(currentUser.id));
  };

  const toggleLessonStatus = (lesson: Lesson) => {
      const updatedLesson = { ...lesson, status: lesson.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' as 'DRAFT' | 'PUBLISHED' };
      StorageService.saveLesson(updatedLesson);
      setLessons(StorageService.getLessonsByProf(currentUser.id));
  };

  const copyQuizLink = (quizId: string) => {
      const url = `${window.location.origin}${window.location.pathname}?quizId=${quizId}`;
      navigator.clipboard.writeText(url);
      alert(t('linkCopied'));
  };

  const exportResults = () => {
      const data = results.map(r => {
          const quiz = quizzes.find(q => q.id === r.quizId);
          return { [t('student')]: r.studentName, "Quiz": quiz?.title || "Unknown", [t('score')]: r.score, "Total": r.maxScore, "Date": r.startedAt ? new Date(r.startedAt).toLocaleString() : 'N/A' };
      });
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Résultats");
      XLSX.writeFile(wb, "Resultats_Quiz.xlsx");
  };

  const exportClassResultsMatrix = () => {
      if (!selectedResultClass) return;

      const classStudents = students.filter(s => 
          s.school === currentUser.school && 
          s.city === currentUser.city && 
          s.enrolledClasses?.includes(selectedResultClass)
       );
      
      // Get quizzes relevant to this class
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

  const handleSaveProfile = () => {
      const updatedUser: User = { ...currentUser, email: profileForm.email, phone: profileForm.phone };
      StorageService.saveUser(updatedUser);
      setCurrentUser(updatedUser);
      alert(t('profileSaved'));
  };

  const toggleLessonClass = (cls: string) => {
      setLessonForm(prev => ({ ...prev, classes: prev.classes.includes(cls) ? prev.classes.filter(c => c !== cls) : [...prev.classes, cls] }));
  };

  const filteredStudents = students.filter(s => {
      // Must be in same school/city
      if (s.school !== currentUser.school || s.city !== currentUser.city) return false;
      // Must belong to one of the professor's assigned classes
      const sClasses = s.enrolledClasses || [];
      const isInProfClasses = sClasses.some(c => assignedClasses.includes(c));
      
      if (!isInProfClasses) return false;
      
      if (classFilter) {
          return sClasses.includes(classFilter);
      }
      return true;
  });

  const schoolStats = StorageService.getSchoolStats(currentUser.school!, currentUser.city!);

  // Helper for Stats
  const calculateQuizStats = (quiz: Quiz) => {
      const quizResults = results.filter(r => r.quizId === quiz.id);
      if (quizResults.length === 0) return null;
      
      const totalScore = quizResults.reduce((acc, r) => acc + (r.score / r.maxScore) * 100, 0); // Normalized to %
      const avgScore = totalScore / quizResults.length;
      const maxScore = Math.max(...quizResults.map(r => r.score));

      return {
          participants: quizResults.length,
          avg: Math.round(avgScore),
          best: maxScore
      };
  };

  // Helper to determine role label for messaging
  const getRoleLabel = (role: UserRole) => {
      switch(role) {
          case UserRole.COORDINATOR: return t('coordinator');
          case UserRole.MODERATOR: return t('moderator');
          case UserRole.PROFESSOR: return t('professor');
          case UserRole.STUDENT: return t('student');
          default: return '-';
      }
  };

  if (isCreatingQuiz) {
      return <QuizBuilder profId={currentUser.id} onSave={handleSaveQuiz} onCancel={() => setIsCreatingQuiz(false)} availableClasses={assignedClasses} />;
  }

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
                   { id: 'staffRoom', icon: Coffee, label: t('staffRoom'), badge: unreadStaffCount },
                   { id: 'profile', icon: UserCircle, label: t('profile') }
               ].map(tab => (
                   <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`pb-2 px-4 flex items-center gap-2 border-b-2 transition-colors relative ${activeTab === tab.id ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                       <tab.icon className="w-4 h-4"/> {tab.label}
                       {tab.badge ? <span className="absolute top-0 right-1 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse ring-2 ring-white"></span> : null}
                   </button>
               ))}
           </div>

           {activeTab === 'quizzes' && (
               <div>
                   <div className="flex justify-between items-center mb-4">
                       <div className="text-sm text-gray-500 italic">{t('unifiedClassWarning')}</div>
                       <button onClick={() => setIsCreatingQuiz(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                           + {t('createQuiz')}
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
                                   </div>
                               </div>
                               <div className="flex gap-2 border-t pt-4">
                                   <button onClick={() => toggleQuizStatus(q)} className="flex-1 text-xs py-2 rounded bg-gray-100 hover:bg-gray-200">{q.status === 'PUBLISHED' ? t('unpublish') : t('publish')}</button>
                                   <button onClick={() => copyQuizLink(q.id)} className="flex-1 bg-blue-50 text-blue-700 text-xs py-2 rounded"><LinkIcon className="w-3 h-3 inline"/> {t('copyLink')}</button>
                               </div>
                           </div>
                       ))}
                   </div>
               </div>
           )}

           {activeTab === 'lessons' && (
               <div>
                   {isCreatingLesson ? (
                       <div className="bg-white p-6 rounded-lg shadow max-w-2xl mx-auto">
                           <h2 className="text-xl font-bold mb-4">{t('createLesson')}</h2>
                           {/* Simplified Form */}
                           <input className="w-full border rounded p-2 mb-4" placeholder={t('lessonTitle')} value={lessonForm.title} onChange={e => setLessonForm({...lessonForm, title: e.target.value})} />
                           <div className="mb-4">
                               <label className="block text-sm font-medium mb-1">{t('assignedClasses')}</label>
                               <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border p-2 rounded">
                                   {assignedClasses.map(cls => (
                                       <label key={cls} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={lessonForm.classes.includes(cls)} onChange={() => toggleLessonClass(cls)} /> {cls}</label>
                                   ))}
                               </div>
                           </div>
                           <input className="w-full border rounded p-2 mb-4" placeholder={t('videoUrl')} value={lessonForm.content} onChange={e => setLessonForm({...lessonForm, content: e.target.value})} />
                           <div className="flex justify-end gap-2">
                               <button onClick={() => setIsCreatingLesson(false)} className="px-4 py-2 text-gray-600">{t('cancel')}</button>
                               <button onClick={handleSaveLesson} className="px-4 py-2 bg-blue-600 text-white rounded">{t('save')}</button>
                           </div>
                       </div>
                   ) : (
                       <>
                           <div className="flex justify-end mb-4"><button onClick={() => setIsCreatingLesson(true)} className="bg-blue-600 text-white px-4 py-2 rounded">+ {t('createLesson')}</button></div>
                           <div className="space-y-4">{lessons.map(l => (
                               <div key={l.id} className="bg-white p-4 rounded-lg shadow border flex justify-between items-center">
                                   <div><h3 className="font-bold">{l.title}</h3><p className="text-sm text-gray-500">{l.assignedClasses.join(', ')}</p></div>
                                   <div className="flex gap-2"><button onClick={() => toggleLessonStatus(l)} className="text-xs px-3 py-2 border rounded">{l.status === 'PUBLISHED' ? t('unpublish') : t('publish')}</button><button onClick={() => deleteLesson(l.id)} className="text-red-500 p-2"><Trash className="w-4 h-4"/></button></div>
                               </div>
                           ))}</div>
                       </>
                   )}
               </div>
           )}

           {activeTab === 'students' && (
               <div className="bg-white p-6 rounded-lg shadow">
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
                            </tbody>
                        </table>
                   </div>
               </div>
           )}

           {activeTab === 'results' && (
               <div className="space-y-6">
                   {/* Header and Export */}
                   <div className="bg-white p-6 rounded-lg shadow flex justify-between items-center">
                       <h2 className="text-lg font-bold flex items-center gap-2"><BarChart className="w-5 h-5 text-indigo-600"/> {t('results')}</h2>
                       <button onClick={exportResults} className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 text-sm hover:bg-green-700">
                           <Download className="w-4 h-4"/> {t('exportExcel')} (Global)
                       </button>
                   </div>

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
                                   {quizzes.every(q => !calculateQuizStats(q)) && (
                                       <tr><td colSpan={4} className="p-6 text-center text-gray-400">{t('noData')}</td></tr>
                                   )}
                               </tbody>
                           </table>
                       </div>
                   </div>

                   {/* NEW: Class-by-Class Results Matrix */}
                   <div className="bg-white p-6 rounded-lg shadow border-t-4 border-purple-500">
                       <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                           <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                               <Table className="w-5 h-5"/> {t('resultsByClass')}
                           </h3>
                           <div className="flex gap-2 w-full md:w-auto">
                               <select 
                                 className="border rounded p-2 text-sm bg-white flex-1 md:flex-none"
                                 value={selectedResultClass}
                                 onChange={(e) => setSelectedResultClass(e.target.value)}
                               >
                                   <option value="" disabled>{t('selectClassResults')}</option>
                                   {assignedClasses.map(c => <option key={c} value={c}>{c}</option>)}
                               </select>
                               <button 
                                onClick={exportClassResultsMatrix}
                                disabled={!selectedResultClass}
                                className="bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                               >
                                   <Download className="w-4 h-4"/> {t('exportExcel')}
                               </button>
                           </div>
                       </div>
                       
                       {selectedResultClass ? (
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
                                       {students.filter(s => 
                                          s.school === currentUser.school && 
                                          s.city === currentUser.city && 
                                          s.enrolledClasses?.includes(selectedResultClass)
                                       ).map(s => (
                                           <tr key={s.id} className="hover:bg-gray-50">
                                               <td className="p-3 border font-medium sticky left-0 bg-white">{s.name}</td>
                                               {quizzes.filter(q => q.assignedClasses.includes(selectedResultClass) || q.assignedClasses.length === 0).map(q => {
                                                   const res = results.find(r => r.quizId === q.id && r.studentId === s.id);
                                                   return (
                                                       <td key={q.id} className="p-3 border text-center">
                                                           {res ? (
                                                               <span className={`font-bold ${res.score >= (res.maxScore/2) ? 'text-green-600' : 'text-red-600'}`}>
                                                                   {res.score}/{res.maxScore}
                                                               </span>
                                                           ) : <span className="text-gray-300">-</span>}
                                                       </td>
                                                   );
                                               })}
                                           </tr>
                                       ))}
                                       {students.filter(s => s.enrolledClasses?.includes(selectedResultClass)).length === 0 && (
                                            <tr><td colSpan={10} className="p-4 text-center text-gray-400">{t('noData')}</td></tr>
                                       )}
                                   </tbody>
                               </table>
                           </div>
                       ) : (
                           <p className="text-gray-500 text-center py-4">{t('selectClassResults')}</p>
                       )}
                   </div>

                   {/* Lesson Tracking Block */}
                   <div className="bg-white p-6 rounded-lg shadow border-t-4 border-blue-500">
                       <h3 className="font-bold text-gray-800 mb-4 text-lg">{t('lessonTracking')}</h3>
                       <div className="overflow-x-auto">
                           <table className="w-full text-sm text-start">
                               <thead className="bg-gray-50">
                                   <tr>
                                       <th className="p-3 text-start">{t('lessonTitle')}</th>
                                       <th className="p-3 text-start">{t('lessonType')}</th>
                                       <th className="p-3 text-start">Statut</th>
                                       <th className="p-3 text-start">{t('assignedClasses')}</th>
                                   </tr>
                               </thead>
                               <tbody>
                                   {lessons.map(l => (
                                       <tr key={l.id} className="border-b last:border-0 hover:bg-gray-50">
                                           <td className="p-3 font-medium text-gray-800">{l.title}</td>
                                           <td className="p-3">
                                               {l.type === LessonType.VIDEO 
                                                    ? <span className="flex items-center gap-1 text-red-600"><Video className="w-3 h-3"/> {t('video')}</span>
                                                    : <span className="flex items-center gap-1 text-blue-600"><File className="w-3 h-3"/> {t('document')}</span>
                                               }
                                           </td>
                                           <td className="p-3">
                                               {l.status === 'PUBLISHED' 
                                                    ? <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">{t('published')}</span>
                                                    : <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded text-xs">{t('draft')}</span>
                                               }
                                           </td>
                                           <td className="p-3 text-gray-500 text-xs">
                                               {l.assignedClasses.join(', ')}
                                           </td>
                                       </tr>
                                   ))}
                                    {lessons.length === 0 && (
                                       <tr><td colSpan={4} className="p-6 text-center text-gray-400">{t('noData')}</td></tr>
                                   )}
                               </tbody>
                           </table>
                       </div>
                   </div>
               </div>
           )}

           {activeTab === 'staffRoom' && (
               <div className="bg-white rounded-lg shadow h-[600px] flex flex-col">
                   <div className="p-4 border-b bg-indigo-50 font-bold text-indigo-800 flex items-center gap-2">
                       <Coffee className="w-5 h-5"/> {t('staffRoom')} - {currentUser.school}
                   </div>
                   <div className="flex-1 overflow-y-auto p-4 space-y-4">
                       {staffMessages.map(m => (
                           <div key={m.id} className={`flex ${m.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                               <div className={`max-w-[70%] p-3 rounded-lg text-sm shadow-sm ${m.senderId === currentUser.id ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>
                                   <div className="text-xs opacity-75 mb-1 font-bold">{m.senderName}</div>
                                   {m.content}
                               </div>
                           </div>
                       ))}
                   </div>
                   <form onSubmit={handleSendStaffMessage} className="p-4 border-t flex gap-2">
                       <input className="flex-1 border rounded-full px-4 py-2" placeholder={t('typeMessage')} value={newStaffMessage} onChange={(e) => setNewStaffMessage(e.target.value)} />
                       <button type="submit" className="bg-indigo-600 text-white p-2 rounded-full"><Send className="w-5 h-5 rtl:flip"/></button>
                   </form>
               </div>
           )}

           {activeTab === 'profile' && (
               <div className="bg-white p-6 rounded-lg shadow max-w-2xl mx-auto space-y-4">
                   <h2 className="text-2xl font-bold">{t('profile')}</h2>
                   {/* School Info Read Only */}
                   <div className="p-4 bg-gray-50 rounded border">
                       <p className="text-sm text-gray-500">{t('school')}</p>
                       <p className="font-bold">{currentUser.school} ({currentUser.city})</p>
                       <p className="text-xs text-blue-600 mt-2">{t('schoolStats')}: {schoolStats.profCount} Profs, {schoolStats.totalResults} Engagements.</p>
                   </div>
                   <input className="w-full border p-2 rounded" placeholder={t('email')} value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} />
                   <input className="w-full border p-2 rounded" placeholder={t('phone')} value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} />
                   <button onClick={handleSaveProfile} className="bg-blue-600 text-white px-6 py-2 rounded">{t('save')}</button>
               </div>
           )}
           
           {activeTab === 'messages' && (
             <div className="bg-white rounded-lg shadow h-[600px] flex overflow-hidden border">
                 <div className="w-1/3 border-e bg-gray-50 flex flex-col">
                    <div className="p-4 border-b font-bold text-gray-700">{t('startConversation')}</div>
                    <div className="flex-1 overflow-y-auto">
                         {conversations.length === 0 && <p className="p-4 text-sm text-gray-500 text-center">{t('noMessages')}</p>}
                         {conversations.map(userId => {
                            const userObj = StorageService.getUsers().find(u => u.id === userId);
                            if (!userObj) return null;
                            // Check for unread from this specific user
                            const hasUnread = StorageService.getMessages(currentUser.id, userId).some(m => m.senderId === userId && !m.read);
                            return (
                                <button 
                                    key={userId}
                                    onClick={() => setSelectedStudentId(userId)}
                                    className={`w-full p-4 text-start hover:bg-blue-50 transition border-b flex justify-between items-center ${selectedStudentId === userId ? 'bg-blue-100' : ''}`}
                                >
                                    <div>
                                        <div className="font-medium">{userObj.name}</div>
                                        <div className="text-xs text-gray-500">{getRoleLabel(userObj.role)}</div>
                                    </div>
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
                                        <div key={m.id} className={`flex ${m.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] p-3 rounded-lg text-sm shadow-sm ${m.senderId === currentUser.id ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                                                {m.content}
                                                <div className={`text-[10px] mt-1 opacity-70 ${m.senderId === currentUser.id ? 'text-blue-100' : 'text-gray-500'}`}>
                                                    {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    {m.read && m.senderId === currentUser.id && <span className="mx-1">✓</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
                                    <input 
                                        className="flex-1 border rounded-full px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        placeholder={t('typeMessage')}
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                    />
                                    <button type="submit" className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700">
                                        <Send className="w-5 h-5 rtl:flip" />
                                    </button>
                                </form>
                           </>
                       ) : (
                           <div className="flex-1 flex items-center justify-center text-gray-400">
                               <p>{t('selectStudent')}</p>
                           </div>
                       )}
                 </div>
             </div>
          )}
       </main>

       {/* Announcement Chat Box */}
       {showAnnouncement && latestAnnouncement && (
           <div className="fixed bottom-0 z-50 mx-4 mb-0 animate-bounce-in" style={{ [dir === 'rtl' ? 'left' : 'right']: '20px' }}>
               <div className="bg-white rounded-t-xl shadow w-80 border overflow-hidden flex flex-col">
                   <div className="bg-blue-600 p-3 flex items-center justify-between text-white">
                       <span className="font-bold text-sm">Administration</span>
                       <button onClick={closeAnnouncement}><X className="w-4 h-4" /></button>
                   </div>
                   <div className="p-4 bg-gray-50 max-h-80 overflow-y-auto">
                       <p className="font-bold text-blue-800 mb-1">{latestAnnouncement.title}</p>
                       <p className="whitespace-pre-wrap text-sm">{latestAnnouncement.content}</p>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};

export default ProfessorDashboard;
