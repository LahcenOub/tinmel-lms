
import React, { useState, useEffect } from 'react';
import { User, Quiz, UserRole, Message, Lesson, LessonType } from '../../types';
import { StorageService } from '../../services/storageService';
import QuizTaker from '../Quiz/QuizTaker';
import { LogOut, CheckCircle, Play, Lock, Clock, Calendar, MessageCircle, Send, BookOpen, Video, File, ExternalLink, User as UserIcon, Award, Star, Zap } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface Props {
  user: User;
  onLogout: () => void;
  autoLaunchQuizId?: string | null;
}

const StudentDashboard: React.FC<Props> = ({ user: initialUser, onLogout, autoLaunchQuizId }) => {
  const { t, dir } = useLanguage();
  // Keep user state in sync for Gamification updates
  const [user, setUser] = useState<User>(initialUser);
  const [activeTab, setActiveTab] = useState<'quizzes' | 'lessons' | 'messages'>('quizzes');
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [selectedQuizForAuth, setSelectedQuizForAuth] = useState<Quiz | null>(null);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Messaging
  const [professors, setProfessors] = useState<User[]>([]);
  const [selectedProfId, setSelectedProfId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // Refresh user data (XP/Badges) periodically & Update Last Login
  useEffect(() => {
    // 1. Update Last Login
    StorageService.updateLastLogin(user.id);

    // 2. Poll for updates
    const interval = setInterval(() => {
        const freshUsers = StorageService.getUsers();
        const me = freshUsers.find(u => u.id === user.id);
        if (me) setUser(me);
    }, 5000);
    return () => clearInterval(interval);
  }, [user.id]);

  // Pass the full user object to enable school filtering
  const quizzes = StorageService.getAvailableQuizzesForStudent(user);
  const lessons = StorageService.getLessonsForStudent(user);
  const myResults = StorageService.getResults().filter(r => r.studentId === user.id);

  const getQuizResult = (quizId: string) => myResults.find(r => r.quizId === quizId);

  useEffect(() => {
      // Load professors linked to the student
      setProfessors(StorageService.getProfessorsForStudent(user));
  }, [user]);

  useEffect(() => {
      if (selectedProfId) {
          setMessages(StorageService.getMessages(user.id, selectedProfId));
      }
  }, [selectedProfId]);

  useEffect(() => {
      if (autoLaunchQuizId) {
          const found = quizzes.find(q => q.id === autoLaunchQuizId);
          if (found && !getQuizResult(found.id)) {
              handleStartClick(found);
          }
      }
  }, [autoLaunchQuizId]); 

  const handleStartClick = (quiz: Quiz) => {
      // Check dates
      const now = new Date();
      if (quiz.startDate && new Date(quiz.startDate) > now) return;
      if (quiz.dueDate && new Date(quiz.dueDate) < now) return;

      if (quiz.accessCode) {
          setSelectedQuizForAuth(quiz);
          setAccessCodeInput('');
          setErrorMsg('');
      } else {
          setActiveQuiz(quiz);
      }
  };

  const verifyAccessCode = () => {
      if (selectedQuizForAuth && accessCodeInput === selectedQuizForAuth.accessCode) {
          setActiveQuiz(selectedQuizForAuth);
          setSelectedQuizForAuth(null);
      } else {
          setErrorMsg(t('codeIncorrect'));
      }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedProfId) return;
    
    const msg: Message = {
        id: `msg-${Date.now()}`,
        senderId: user.id,
        senderName: user.name,
        receiverId: selectedProfId,
        content: newMessage,
        timestamp: new Date().toISOString(),
        read: false
    };
    
    StorageService.sendMessage(msg);
    setMessages([...messages, msg]);
    setNewMessage('');
  };

  // Quiz Availability Helpers
  const getAvailabilityStatus = (quiz: Quiz) => {
      const now = new Date();
      if (quiz.startDate && new Date(quiz.startDate) > now) {
          return { status: 'FUTURE', date: new Date(quiz.startDate) };
      }
      if (quiz.dueDate && new Date(quiz.dueDate) < now) {
          return { status: 'EXPIRED', date: new Date(quiz.dueDate) };
      }
      return { status: 'OPEN' };
  };

  const getYoutubeId = (url: string) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
  };

  const getProfName = (profId: string) => {
      const prof = StorageService.getUsers().find(u => u.id === profId);
      return prof ? prof.name : 'Unknown';
  };

  // Gamification Helper
  const getBadgeIcon = (id: string) => {
      switch(id) {
          case 'badge_first_quiz': return <CheckCircle className="w-5 h-5 text-green-500" />;
          case 'badge_perfect_score': return <Star className="w-5 h-5 text-yellow-500" />;
          case 'badge_speedster': return <Zap className="w-5 h-5 text-purple-500" />;
          default: return <Award className="w-5 h-5 text-blue-500" />;
      }
  };

  if (activeQuiz) {
      return (
          <div className="min-h-screen bg-gray-100 p-8" dir={dir}>
              <button 
                onClick={() => { setActiveQuiz(null); }} // Refresh happens via useEffect
                className="mb-4 text-blue-600 hover:underline"
              >
                  &larr; {t('toDashboard')}
              </button>
              <QuizTaker 
                quiz={activeQuiz} 
                studentId={user.id} 
                studentName={user.name} 
                onComplete={() => setActiveQuiz(null)} 
              />
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-gray-50 relative" dir={dir}>
      <header className="bg-white shadow px-6 py-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-4">
            <span className="text-2xl font-black text-blue-700 font-logo tracking-tight">
                {t('appName')}
            </span>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>
                <h1 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{t('studentSpace')}</h1>
                <p className="text-gray-500 text-xs">{user.name}</p>
                {user.school && <p className="text-blue-600 text-[10px] font-bold">{user.school}</p>}
            </div>
        </div>
        <button onClick={onLogout} className="text-gray-600 hover:text-red-600">
            <LogOut className="w-5 h-5 rtl:flip"/>
        </button>
      </header>

      {/* Gamification Banner */}
      <div className="bg-indigo-600 text-white p-6 shadow-md">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold border-4 border-white/30">
                      {user.level || 1}
                  </div>
                  <div>
                      <h2 className="text-xl font-bold">{t('level')} {user.level || 1}</h2>
                      <p className="text-indigo-200 text-sm">{user.xp || 0} {t('xp')}</p>
                      <div className="w-48 h-2 bg-indigo-900/50 rounded-full mt-2 overflow-hidden">
                          <div 
                            className="h-full bg-yellow-400 transition-all duration-1000" 
                            style={{ width: `${((user.xp || 0) % 1000) / 10}%` }}
                          ></div>
                      </div>
                      <p className="text-xs mt-1 text-indigo-300">{(1000 - ((user.xp || 0) % 1000))} XP &rarr; {t('nextLevel')}</p>
                  </div>
              </div>
              
              <div className="flex gap-2 bg-white/10 p-4 rounded-lg">
                  <span className="text-sm font-bold opacity-70 mb-2 block w-full border-b border-white/10 pb-1">{t('badges')}</span>
                  {(user.badges || []).map(b => (
                      <div key={b} className="bg-white p-2 rounded-full shadow-lg transform hover:scale-110 transition cursor-help" title={t(b)}>
                          {getBadgeIcon(b)}
                      </div>
                  ))}
                  {(user.badges || []).length === 0 && <span className="text-sm italic opacity-50">Aucun badge... pour l'instant !</span>}
              </div>
          </div>
      </div>
      
      {/* Student Tabs */}
      <div className="bg-white border-b px-6 flex gap-6 justify-center">
           <button 
               onClick={() => setActiveTab('quizzes')}
               className={`py-3 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'quizzes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
           >
               <CheckCircle className="w-4 h-4"/> {t('myQuizzes')}
           </button>
           <button 
               onClick={() => setActiveTab('lessons')}
               className={`py-3 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'lessons' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
           >
               <BookOpen className="w-4 h-4"/> {t('myCourses')}
           </button>
           <button 
               onClick={() => setActiveTab('messages')}
               className={`py-3 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'messages' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
           >
               <MessageCircle className="w-4 h-4"/> {t('messages')}
           </button>
      </div>

      <main className="p-6 max-w-4xl mx-auto">
          {activeTab === 'quizzes' && (
             <div className="grid gap-4">
              {quizzes.map(q => {
                  const result = getQuizResult(q.id);
                  const availability = getAvailabilityStatus(q);
                  
                  return (
                      <div key={q.id} className="bg-white p-6 rounded-lg shadow-sm border flex justify-between items-center hover:shadow-md transition">
                          <div>
                              <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-bold text-lg text-gray-800">{q.title}</h3>
                                  {q.accessCode && <Lock className="w-4 h-4 text-gray-400" />}
                              </div>
                              <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
                                   <UserIcon className="w-3 h-3"/>
                                   <span>{t('prof')}: {getProfName(q.professorId)}</span>
                                   <span className="mx-1">•</span>
                                   <span>{q.questions.length} {t('questionsCount')}</span>
                              </div>
                              
                              {/* Dates Display */}
                              {availability.status === 'FUTURE' && (
                                  <span className="text-xs text-orange-600 flex items-center gap-1 bg-orange-50 px-2 py-1 rounded w-fit mb-2">
                                      <Clock className="w-3 h-3"/> {t('opensIn')} {availability.date?.toLocaleString()}
                                  </span>
                              )}
                              {availability.status === 'EXPIRED' && !result && (
                                   <span className="text-xs text-red-600 flex items-center gap-1 bg-red-50 px-2 py-1 rounded w-fit mb-2">
                                      <Calendar className="w-3 h-3"/> {t('expired')} {availability.date?.toLocaleDateString()}
                                  </span>
                              )}

                              {result ? (
                                  <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded text-sm font-medium">
                                      <CheckCircle className="w-4 h-4" /> {t('score')}: {result.score}/{result.maxScore}
                                  </span>
                              ) : availability.status === 'OPEN' ? (
                                  <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded text-sm font-medium">{t('start')}</span>
                              ) : null}
                          </div>
                          <div>
                              {!result ? (
                                  <button 
                                    onClick={() => handleStartClick(q)}
                                    disabled={availability.status !== 'OPEN'}
                                    className={`px-6 py-2 rounded-full flex items-center gap-2 transition-transform transform ${availability.status === 'OPEN' ? 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                                  >
                                      {t('start')} <Play className="w-4 h-4 fill-current rtl:flip"/>
                                  </button>
                              ) : (
                                  <button disabled className="bg-gray-200 text-gray-500 px-6 py-2 rounded-full cursor-not-allowed">
                                      {t('completed')}
                                  </button>
                              )}
                          </div>
                      </div>
                  );
              })}
              {quizzes.length === 0 && <p className="text-center text-gray-500 py-10">Aucun quiz disponible.</p>}
          </div>
          )}

          {activeTab === 'lessons' && (
              <div className="space-y-6">
                  {lessons.map(l => (
                      <div key={l.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                          <div className="p-4 border-b flex items-start gap-4">
                                <div className={`p-3 rounded-lg ${l.type === LessonType.VIDEO ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                    {l.type === LessonType.VIDEO ? <Video className="w-6 h-6"/> : <File className="w-6 h-6"/>}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800">{l.title}</h3>
                                    <p className="text-gray-600 text-sm mb-1">{l.description}</p>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <UserIcon className="w-3 h-3"/>
                                        <span>{t('prof')}: {getProfName(l.professorId)}</span>
                                    </div>
                                </div>
                          </div>
                          <div className="p-4 bg-gray-50">
                              {l.type === LessonType.VIDEO && getYoutubeId(l.contentUrl) ? (
                                  <div className="aspect-video rounded-lg overflow-hidden shadow">
                                      <iframe 
                                        width="100%" 
                                        height="100%" 
                                        src={`https://www.youtube.com/embed/${getYoutubeId(l.contentUrl)}`} 
                                        title={l.title}
                                        frameBorder="0" 
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                        allowFullScreen
                                      ></iframe>
                                  </div>
                              ) : (
                                  <div className="flex items-center justify-between bg-white p-4 rounded border">
                                      <span className="text-sm font-medium text-gray-700 truncate max-w-[80%]">{l.contentUrl}</span>
                                      <a href={l.contentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 text-sm">
                                          {t('viewContent')} <ExternalLink className="w-3 h-3"/>
                                      </a>
                                  </div>
                              )}
                          </div>
                      </div>
                  ))}
                  {lessons.length === 0 && <p className="text-center text-gray-500 py-10">{t('noCourses')}</p>}
              </div>
          )}

          {activeTab === 'messages' && (
             <div className="bg-white rounded-lg shadow h-[600px] flex overflow-hidden border">
                 <div className="w-1/3 border-e bg-gray-50 flex flex-col">
                    <div className="p-4 border-b font-bold text-gray-700">{t('startConversation')}</div>
                    <div className="flex-1 overflow-y-auto">
                         {professors.length === 0 && <p className="p-4 text-sm text-gray-500 text-center">{t('noMessages')}</p>}
                         {professors.map(prof => (
                            <button 
                                key={prof.id}
                                onClick={() => setSelectedProfId(prof.id)}
                                className={`w-full p-4 text-start hover:bg-blue-50 transition border-b ${selectedProfId === prof.id ? 'bg-blue-100' : ''}`}
                            >
                                <div className="font-medium">{prof.name}</div>
                                <div className="text-xs text-gray-500">{t('professor')}</div>
                            </button>
                         ))}
                    </div>
                 </div>
                 <div className="w-2/3 flex flex-col bg-white">
                      {selectedProfId ? (
                           <>
                                <div className="p-4 border-b font-bold bg-gray-50 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    {StorageService.getUsers().find(u => u.id === selectedProfId)?.name}
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {messages.length === 0 && <p className="text-center text-gray-400 text-sm mt-10">{t('noMessages')}</p>}
                                    {messages.map(m => (
                                        <div key={m.id} className={`flex ${m.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] p-3 rounded-lg text-sm shadow-sm ${m.senderId === user.id ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                                                {m.content}
                                                <div className={`text-[10px] mt-1 opacity-70 ${m.senderId === user.id ? 'text-blue-100' : 'text-gray-500'}`}>
                                                    {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
                               <p>{t('selectProf')}</p>
                           </div>
                       )}
                 </div>
             </div>
          )}
      </main>

      {/* Password Modal */}
      {selectedQuizForAuth && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
                  <h3 className="text-lg font-bold mb-4">{t('quizProtected')}</h3>
                  <p className="text-sm text-gray-600 mb-4">Code requis.</p>
                  
                  <input 
                      type="password"
                      className="w-full border rounded p-2 mb-2"
                      placeholder={t('enterCode')}
                      value={accessCodeInput}
                      onChange={(e) => setAccessCodeInput(e.target.value)}
                  />
                  {errorMsg && <p className="text-red-500 text-sm mb-2">{errorMsg}</p>}
                  
                  <div className="flex justify-end gap-2 mt-4">
                      <button 
                        onClick={() => setSelectedQuizForAuth(null)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                      >
                          {t('cancel')}
                      </button>
                      <button 
                        onClick={verifyAccessCode}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                          {t('validate')}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default StudentDashboard;
