import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { User, Quiz, Lesson, LessonType, QuestionType, UserRole, Message, QuizResult, TreasureCode, SchoolEvent, Question } from '../../types';
import { StorageService } from '../../services/storageService';
import { ApiService } from '../../services/apiService';
import QuizBuilder from '../Quiz/QuizBuilder';
import WhiteboardRoom from '../Whiteboard/WhiteboardRoom';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
    LayoutDashboard, FileText, Users, BookOpen, MessageCircle, Settings, LogOut, 
    Plus, Search, PenTool, Video, Trash2, BarChart, ExternalLink, Copy, CheckCircle, 
    Play, X, ChevronRight, MonitorPlay, AlignLeft, UserPlus, Coffee, Send, Eye, EyeOff, Upload, Clock, Eye as ViewIcon, Gem, Key, Calendar, HelpCircle, Edit
} from 'lucide-react';
import * as XLSX from 'xlsx';

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

const Overview: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLanguage();
    const [stats, setStats] = useState({ quizzes: 0, lessons: 0, students: 0, results: 0 });

    useEffect(() => {
        const quizzes = StorageService.getQuizzesByProf(user.id);
        const lessons = StorageService.getLessonsByProf(user.id);
        // Estimate students based on results interaction
        const results = StorageService.getResults().filter(r => quizzes.some(q => q.id === r.quizId));
        const uniqueStudents = new Set(results.map(r => r.studentId)).size;

        setStats({
            quizzes: quizzes.length,
            lessons: lessons.length,
            students: uniqueStudents,
            results: results.length
        });
    }, [user.id]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="bg-blue-100 p-4 rounded-full text-blue-600"><FileText className="w-8 h-8"/></div>
                <div><p className="text-gray-500 text-sm font-medium">{t('myQuizzes')}</p><h3 className="text-3xl font-bold text-gray-800">{stats.quizzes}</h3></div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="bg-orange-100 p-4 rounded-full text-orange-600"><BookOpen className="w-8 h-8"/></div>
                <div><p className="text-gray-500 text-sm font-medium">{t('myCourses')}</p><h3 className="text-3xl font-bold text-gray-800">{stats.lessons}</h3></div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="bg-green-100 p-4 rounded-full text-green-600"><Users className="w-8 h-8"/></div>
                <div><p className="text-gray-500 text-sm font-medium">{t('participants')}</p><h3 className="text-3xl font-bold text-gray-800">{stats.students}</h3></div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="bg-purple-100 p-4 rounded-full text-purple-600"><BarChart className="w-8 h-8"/></div>
                <div><p className="text-gray-500 text-sm font-medium">{t('results')}</p><h3 className="text-3xl font-bold text-gray-800">{stats.results}</h3></div>
            </div>
        </div>
    );
};

const QuizzesView: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLanguage();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        setQuizzes(StorageService.getQuizzesByProf(user.id));
    }, [user.id, isCreating]);

    const handleDelete = (id: string) => {
        if (confirm(t('delete') + '?')) {
            const updated = quizzes.filter(q => q.id !== id);
             const allQuizzes = StorageService.getQuizzes();
             const newAll = allQuizzes.filter(q => q.id !== id);
             localStorage.setItem('quizmaster_quizzes', JSON.stringify(newAll));
            setQuizzes(updated);
        }
    };

    const togglePublish = (quiz: Quiz) => {
        const updated = { ...quiz, status: quiz.status === 'DRAFT' ? 'PUBLISHED' : 'DRAFT' } as Quiz;
        StorageService.saveQuiz(updated);
        setQuizzes(quizzes.map(q => q.id === quiz.id ? updated : q));
    };

    const copyLink = (id: string) => {
        const url = `${window.location.origin}/student?quizId=${id}`;
        navigator.clipboard.writeText(url);
        alert(t('linkCopied'));
    };

    if (isCreating) {
        return (
            <QuizBuilder 
                profId={user.id}
                onSave={(quiz) => {
                    StorageService.saveQuiz(quiz);
                    setIsCreating(false);
                }}
                onCancel={() => setIsCreating(false)}
                availableClasses={user.assignedSections || (user.class ? [user.class] : [])}
            />
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">{t('myQuizzes')}</h2>
                <button 
                    onClick={() => setIsCreating(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm"
                >
                    <Plus className="w-5 h-5"/> {t('createQuiz')}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quizzes.map(quiz => (
                    <div key={quiz.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition group">
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-2">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${quiz.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {t(quiz.status.toLowerCase())}
                                </span>
                                <div className="text-gray-400 text-xs">
                                    {new Date(quiz.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                            <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-1">{quiz.title}</h3>
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{quiz.description || 'Aucune description'}</p>
                            
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                                <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded">{quiz.questions.length} {t('questionsCount')}</span>
                                {quiz.timeLimit && <span className="bg-orange-50 text-orange-600 px-2 py-1 rounded">{quiz.timeLimit} {t('timeLimitLabel')}</span>}
                            </div>
                            
                            <div className="text-xs text-gray-400 mb-4">
                                <strong>{t('assignedClasses')}:</strong> {quiz.assignedClasses.length > 0 ? quiz.assignedClasses.join(', ') : 'Aucune'}
                            </div>
                        </div>
                        <div className="bg-gray-50 p-3 flex justify-between items-center border-t">
                             <div className="flex gap-2">
                                 <button onClick={() => togglePublish(quiz)} className="p-2 hover:bg-white rounded-full text-gray-500 transition" title={quiz.status === 'DRAFT' ? t('publish') : t('unpublish')}>
                                     {quiz.status === 'DRAFT' ? <CheckCircle className="w-4 h-4"/> : <X className="w-4 h-4"/>}
                                 </button>
                                 <button onClick={() => copyLink(quiz.id)} className="p-2 hover:bg-white rounded-full text-gray-500 transition" title={t('copyLink')}>
                                     <Copy className="w-4 h-4"/>
                                 </button>
                             </div>
                             <button onClick={() => handleDelete(quiz.id)} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full text-gray-400 transition">
                                 <Trash2 className="w-4 h-4"/>
                             </button>
                        </div>
                    </div>
                ))}
                {quizzes.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
                        <p className="text-gray-500">{t('noData')}</p>
                        <button onClick={() => setIsCreating(true)} className="text-blue-600 font-medium mt-2 hover:underline">{t('createQuiz')}</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const LessonsView: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLanguage();
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState<string | null>(null); // Lesson ID being edited
    
    // Form State
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [type, setType] = useState<LessonType>(LessonType.VIDEO);
    const [contentUrl, setContentUrl] = useState('');
    
    // Time & Treasure Hunt
    const [minTimeMinutes, setMinTimeMinutes] = useState(1); 
    const [enableTreasure, setEnableTreasure] = useState(false);
    
    // Availability
    const [availableFrom, setAvailableFrom] = useState('');
    const [availableUntil, setAvailableUntil] = useState('');

    const [assignedClasses, setAssignedClasses] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    // Treasure Hunt State
    const [treasureCodes, setTreasureCodes] = useState<TreasureCode[]>([]);
    const [newCode, setNewCode] = useState('');
    const [newCodeBadge, setNewCodeBadge] = useState('badge_scholar');

    // Validation Questions State
    const [validationQuestions, setValidationQuestions] = useState<Question[]>([]);
    const [newQuestionText, setNewQuestionText] = useState('');
    const [newQuestionType, setNewQuestionType] = useState<QuestionType>(QuestionType.MCQ);
    const [newOptions, setNewOptions] = useState(['', '', '']);
    const [correctOption, setCorrectOption] = useState(0);

    // Live Students Simulation State
    const [liveStudentsMap, setLiveStudentsMap] = useState<Record<string, number>>({});

    useEffect(() => {
        setLessons(StorageService.getLessonsByProf(user.id));
        
        // --- REAL TIME HEARTBEAT POLLING ---
        const interval = setInterval(() => {
            setLiveStudentsMap(prev => {
                const next = { ...prev };
                lessons.forEach(l => {
                    // Only for interactive or document lessons (video is harder to track without custom player)
                    if (l.type === LessonType.INTERACTIVE || l.type === LessonType.DOCUMENT) {
                        next[l.id] = StorageService.getActiveStudentCount(l.id);
                    }
                });
                return next;
            });
        }, 5000); // Check every 5 seconds

        return () => clearInterval(interval);
    }, [user.id, isCreating, isEditing]); // Removed 'lessons' from dependency to avoid infinite loop if lessons update, but we need it initially.
    
    // Effect to update lessons list when creating/editing changes
    useEffect(() => {
         setLessons(StorageService.getLessonsByProf(user.id));
    }, [isCreating, isEditing]);


    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploading(true);
            try {
                const url = await ApiService.uploadFile(file);
                setContentUrl(url);
            } catch (err) {
                alert("Erreur upload");
            } finally {
                setUploading(false);
            }
        }
    };

    const addTreasureCode = () => {
        if (!newCode.trim()) return;
        setTreasureCodes([...treasureCodes, { code: newCode.trim().toUpperCase(), badgeId: newCodeBadge }]);
        setNewCode('');
    };

    const removeTreasureCode = (code: string) => {
        setTreasureCodes(treasureCodes.filter(tc => tc.code !== code));
    };

    const addValidationQuestion = () => {
        if (!newQuestionText.trim()) return;
        
        let q: Question = {
            id: `vq-${Date.now()}`,
            text: newQuestionText,
            type: newQuestionType,
            points: 1
        };

        if (newQuestionType === QuestionType.MCQ) {
            const validOptions = newOptions.filter(o => o.trim() !== '');
            if (validOptions.length < 2) return alert("Il faut au moins 2 options.");
            q.options = validOptions;
            q.correctAnswer = validOptions[correctOption];
        } else if (newQuestionType === QuestionType.BOOLEAN) {
            q.correctAnswer = correctOption === 0; // 0 = Vrai
        }

        setValidationQuestions([...validationQuestions, q]);
        setNewQuestionText('');
        setNewOptions(['', '', '']);
    };

    const removeValidationQuestion = (id: string) => {
        setValidationQuestions(validationQuestions.filter(q => q.id !== id));
    };

    const handleEdit = (lesson: Lesson) => {
        setIsEditing(lesson.id);
        setIsCreating(true);
        setTitle(lesson.title);
        setDesc(lesson.description);
        setType(lesson.type);
        setContentUrl(lesson.contentUrl);
        setAssignedClasses(lesson.assignedClasses);
        setAvailableFrom(lesson.availableFrom || '');
        setAvailableUntil(lesson.availableUntil || '');
        
        if (lesson.type === LessonType.INTERACTIVE) {
            setMinTimeMinutes((lesson.minTimeSeconds || 60) / 60);
            setEnableTreasure(lesson.hasTreasureHunt || false);
            setTreasureCodes(lesson.treasureCodes || []);
            setValidationQuestions(lesson.questions || []);
        }
    };

    const handleSave = () => {
        if (!title || !contentUrl) return;
        
        const lessonData: Lesson = {
            id: isEditing || `less-${Date.now()}`,
            professorId: user.id,
            title,
            description: desc,
            type,
            contentUrl,
            assignedClasses,
            createdAt: isEditing ? lessons.find(l => l.id === isEditing)?.createdAt || new Date().toISOString() : new Date().toISOString(),
            status: 'PUBLISHED',
            minTimeSeconds: type === LessonType.INTERACTIVE ? (minTimeMinutes * 60) : undefined,
            hasTreasureHunt: type === LessonType.INTERACTIVE ? enableTreasure : false,
            treasureCodes: (type === LessonType.INTERACTIVE && enableTreasure) ? treasureCodes : undefined,
            questions: (type === LessonType.INTERACTIVE && validationQuestions.length > 0) ? validationQuestions : undefined,
            availableFrom: availableFrom || undefined,
            availableUntil: availableUntil || undefined
        };

        StorageService.saveLesson(lessonData);
        
        resetForm();
    };

    const resetForm = () => {
        setIsCreating(false);
        setIsEditing(null);
        setTitle(''); setDesc(''); setContentUrl(''); setAssignedClasses([]); setTreasureCodes([]); 
        setEnableTreasure(false); setMinTimeMinutes(1); setValidationQuestions([]);
        setAvailableFrom(''); setAvailableUntil('');
    };

    const handleDelete = (id: string) => {
        if(confirm(t('delete') + '?')) {
            StorageService.deleteLesson(id);
            setLessons(StorageService.getLessonsByProf(user.id));
        }
    };

    if (isCreating) {
        return (
             <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl mx-auto animate-fade-in">
                 <h2 className="text-2xl font-bold mb-6">{isEditing ? 'Modifier le cours' : t('createLesson')}</h2>
                 <div className="space-y-4">
                     <input className="w-full border p-3 rounded" placeholder={t('lessonTitle')} value={title} onChange={e => setTitle(e.target.value)} />
                     <textarea className="w-full border p-3 rounded" placeholder={t('lessonDesc')} value={desc} onChange={e => setDesc(e.target.value)} />
                     
                     <div className="flex gap-4">
                         <button onClick={() => setType(LessonType.VIDEO)} className={`flex-1 p-3 rounded border text-center font-bold flex flex-col items-center justify-center gap-2 transition ${type === LessonType.VIDEO ? 'bg-blue-50 border-blue-500 text-blue-600' : 'hover:bg-gray-50'}`}>
                             <Video className="w-5 h-5"/> {t('video')}
                         </button>
                         <button onClick={() => setType(LessonType.DOCUMENT)} className={`flex-1 p-3 rounded border text-center font-bold flex flex-col items-center justify-center gap-2 transition ${type === LessonType.DOCUMENT ? 'bg-blue-50 border-blue-500 text-blue-600' : 'hover:bg-gray-50'}`}>
                             <FileText className="w-5 h-5"/> {t('document')}
                         </button>
                         <button onClick={() => setType(LessonType.INTERACTIVE)} className={`flex-1 p-3 rounded border text-center font-bold flex flex-col items-center justify-center gap-2 transition ${type === LessonType.INTERACTIVE ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'hover:bg-gray-50'}`}>
                             <ViewIcon className="w-5 h-5"/> Lecture Interactive
                         </button>
                     </div>

                     {type === LessonType.VIDEO ? (
                         <input className="w-full border p-3 rounded" placeholder={t('videoUrl')} value={contentUrl} onChange={e => setContentUrl(e.target.value)} />
                     ) : (
                         <div className="border-2 border-dashed p-6 rounded text-center">
                             <input type="file" className="hidden" id="less-upload" onChange={handleFileUpload} accept={type === LessonType.INTERACTIVE ? 'application/pdf' : '*/*'} />
                             <label htmlFor="less-upload" className="cursor-pointer text-blue-600 font-bold hover:underline">
                                 {uploading ? t('loading') : (contentUrl ? 'Fichier chargé !' : (type === LessonType.INTERACTIVE ? 'Uploader PDF' : t('fileUpload')))}
                             </label>
                         </div>
                     )}

                     {/* Scheduling (Optional) */}
                     <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                         <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-3">
                             <Calendar className="w-5 h-5"/> Disponibilité (Optionnel)
                         </h3>
                         <div className="grid grid-cols-2 gap-4">
                             <div>
                                 <label className="block text-xs font-bold text-gray-500 mb-1">Disponible à partir de</label>
                                 <input 
                                     type="datetime-local" 
                                     className="w-full border p-2 rounded text-sm"
                                     value={availableFrom}
                                     onChange={e => setAvailableFrom(e.target.value)}
                                 />
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-gray-500 mb-1">Jusqu'au</label>
                                 <input 
                                     type="datetime-local" 
                                     className="w-full border p-2 rounded text-sm"
                                     value={availableUntil}
                                     onChange={e => setAvailableUntil(e.target.value)}
                                 />
                             </div>
                         </div>
                     </div>

                     {type === LessonType.INTERACTIVE && (
                         <div className="space-y-4">
                            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                                <label className="block text-sm font-bold text-indigo-800 mb-2 flex items-center gap-2">
                                    <Clock className="w-4 h-4"/> Temps de lecture minimum requis (Minutes)
                                </label>
                                <input 
                                    type="number" 
                                    min="1" 
                                    className="w-full border p-2 rounded" 
                                    value={minTimeMinutes} 
                                    onChange={e => setMinTimeMinutes(parseInt(e.target.value))} 
                                />
                                <p className="text-xs text-indigo-600 mt-2">L'étudiant devra rester sur la page ce laps de temps avant de pouvoir valider le cours.</p>
                            </div>

                            {/* Validation Questions */}
                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                <h3 className="font-bold text-green-800 flex items-center gap-2 mb-3">
                                    <HelpCircle className="w-5 h-5"/> Questions de validation (Optionnel)
                                </h3>
                                <p className="text-xs text-green-700 mb-3">Ces questions apparaîtront après la fin du minuteur pour valider la compréhension.</p>
                                
                                <div className="space-y-2 mb-4">
                                    {validationQuestions.map((q, idx) => (
                                        <div key={q.id} className="flex justify-between items-center bg-white p-2 rounded border border-green-100">
                                            <div className="flex items-center gap-2">
                                                <span className="bg-green-200 text-green-800 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                                                <span className="font-medium text-sm">{q.text}</span>
                                                <span className="text-[10px] text-gray-500 bg-gray-100 px-1 rounded">{q.type}</span>
                                            </div>
                                            <button onClick={() => removeValidationQuestion(q.id)} className="text-red-400 hover:text-red-600">
                                                <Trash2 className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-white p-3 rounded border border-green-100">
                                    <div className="flex gap-2 mb-2">
                                        <select 
                                            className="border p-2 rounded text-sm w-32"
                                            value={newQuestionType}
                                            onChange={e => setNewQuestionType(e.target.value as QuestionType)}
                                        >
                                            <option value={QuestionType.MCQ}>QCM</option>
                                            <option value={QuestionType.BOOLEAN}>Vrai/Faux</option>
                                        </select>
                                        <input 
                                            className="flex-1 border p-2 rounded text-sm" 
                                            placeholder="Question..." 
                                            value={newQuestionText}
                                            onChange={e => setNewQuestionText(e.target.value)}
                                        />
                                    </div>
                                    
                                    {newQuestionType === QuestionType.MCQ && (
                                        <div className="space-y-1 mb-2">
                                            {newOptions.map((opt, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <input 
                                                        type="radio" 
                                                        name="correctOpt" 
                                                        checked={correctOption === i} 
                                                        onChange={() => setCorrectOption(i)}
                                                    />
                                                    <input 
                                                        className="flex-1 border p-1 rounded text-xs" 
                                                        placeholder={`Option ${i + 1}`}
                                                        value={opt}
                                                        onChange={e => {
                                                            const n = [...newOptions];
                                                            n[i] = e.target.value;
                                                            setNewOptions(n);
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {newQuestionType === QuestionType.BOOLEAN && (
                                        <div className="flex gap-4 mb-2 ml-1">
                                            <label className="flex items-center gap-2 text-sm">
                                                <input type="radio" name="boolCorrect" checked={correctOption === 0} onChange={() => setCorrectOption(0)} /> Vrai
                                            </label>
                                            <label className="flex items-center gap-2 text-sm">
                                                <input type="radio" name="boolCorrect" checked={correctOption === 1} onChange={() => setCorrectOption(1)} /> Faux
                                            </label>
                                        </div>
                                    )}

                                    <button onClick={addValidationQuestion} className="w-full bg-green-600 text-white py-1 rounded text-sm font-bold hover:bg-green-700">
                                        Ajouter la question
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input 
                                    type="checkbox" 
                                    id="treasureToggle" 
                                    checked={enableTreasure}
                                    onChange={e => setEnableTreasure(e.target.checked)}
                                    className="w-5 h-5 text-yellow-600 rounded focus:ring-yellow-500 cursor-pointer"
                                />
                                <label htmlFor="treasureToggle" className="font-bold text-gray-700 cursor-pointer">Activer la chasse au trésor</label>
                            </div>

                            {/* Treasure Hunt Config - Only if enabled */}
                            {enableTreasure && (
                                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-2">
                                    <h3 className="font-bold text-yellow-800 flex items-center gap-2 mb-3">
                                        <Gem className="w-5 h-5"/> {t('treasureHuntTitle')}
                                    </h3>
                                    <p className="text-xs text-yellow-700 mb-3">{t('treasureHuntDesc')}</p>
                                    
                                    <div className="flex gap-2 mb-3">
                                        <input 
                                            className="flex-1 border p-2 rounded text-sm uppercase" 
                                            placeholder="CODE (ex: EINSTEIN)" 
                                            value={newCode}
                                            onChange={e => setNewCode(e.target.value)}
                                        />
                                        <select 
                                            className="border p-2 rounded text-sm"
                                            value={newCodeBadge}
                                            onChange={e => setNewCodeBadge(e.target.value)}
                                        >
                                            <option value="badge_scholar">Savant</option>
                                            <option value="badge_detective">Détective</option>
                                            <option value="badge_explorer">Explorateur</option>
                                            <option value="badge_genius">Génie</option>
                                        </select>
                                        <button onClick={addTreasureCode} className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 font-bold">
                                            <Plus className="w-4 h-4"/>
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {treasureCodes.map((tc, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-yellow-100">
                                                <div className="flex items-center gap-2">
                                                    <Key className="w-4 h-4 text-yellow-500"/>
                                                    <span className="font-mono font-bold">{tc.code}</span>
                                                    <span className="text-xs text-gray-500">➜ {t(tc.badgeId)}</span>
                                                </div>
                                                <button onClick={() => removeTreasureCode(tc.code)} className="text-red-400 hover:text-red-600">
                                                    <Trash2 className="w-4 h-4"/>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                         </div>
                     )}

                     <div>
                        <label className="block text-sm font-medium mb-2">{t('assignedClasses')}</label>
                        <div className="flex flex-wrap gap-2">
                            {(user.assignedSections || []).map(cls => (
                                <button 
                                    key={cls}
                                    onClick={() => setAssignedClasses(prev => prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls])}
                                    className={`px-3 py-1 rounded text-sm border ${assignedClasses.includes(cls) ? 'bg-blue-600 text-white' : 'bg-gray-50 hover:bg-gray-100'}`}
                                >
                                    {cls}
                                </button>
                            ))}
                        </div>
                     </div>

                     <div className="flex justify-end gap-3 pt-4 border-t">
                         <button onClick={resetForm} className="px-4 py-2 text-gray-600">{t('cancel')}</button>
                         <button onClick={handleSave} disabled={!title || !contentUrl} className="px-6 py-2 bg-green-600 text-white rounded disabled:opacity-50">{t('save')}</button>
                     </div>
                 </div>
             </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">{t('myCourses')}</h2>
                <button onClick={() => setIsCreating(true)} className="bg-orange-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-600 shadow-sm">
                    <Plus className="w-5 h-5"/> {t('createLesson')}
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lessons.map(l => (
                    <div key={l.id} className="bg-white rounded-xl shadow-sm border p-5 group relative">
                        {/* Live Students Badge (Real-Time) */}
                        {l.type === LessonType.INTERACTIVE && (liveStudentsMap[l.id] || 0) > 0 && (
                            <div className="absolute top-4 right-14 bg-red-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 animate-pulse shadow-sm z-10">
                                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                Direct: {liveStudentsMap[l.id]}
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-2">
                             <span className={`px-2 py-1 rounded text-xs font-bold ${
                                 l.type === 'VIDEO' ? 'bg-red-100 text-red-700' : 
                                 l.type === 'INTERACTIVE' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                             }`}>
                                 {l.type === 'VIDEO' ? t('video') : l.type === 'INTERACTIVE' ? 'Interactif' : t('document')}
                             </span>
                             <div className="flex gap-2">
                                <button onClick={() => handleEdit(l)} className="text-gray-400 hover:text-blue-500"><Edit className="w-4 h-4"/></button>
                                <button onClick={() => handleDelete(l.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                             </div>
                        </div>
                        <h3 className="font-bold text-lg mb-2">{l.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-4">{l.description}</p>
                        <div className="flex justify-between items-center text-xs text-gray-400">
                             <span>{l.assignedClasses.join(', ')}</span>
                             <a href={l.contentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                                 {t('viewContent')} <ExternalLink className="w-3 h-3"/>
                             </a>
                        </div>
                        {l.availableFrom && (
                            <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3"/> Dispo: {new Date(l.availableFrom).toLocaleDateString()}
                            </div>
                        )}
                        {l.treasureCodes && l.treasureCodes.length > 0 && l.hasTreasureHunt && (
                            <div className="mt-3 pt-3 border-t flex items-center gap-1 text-xs text-yellow-600 font-bold">
                                <Gem className="w-3 h-3"/> {l.treasureCodes.length} trésors cachés
                            </div>
                        )}
                        {l.questions && l.questions.length > 0 && (
                            <div className="mt-2 pt-2 border-t flex items-center gap-1 text-xs text-green-600 font-bold">
                                <HelpCircle className="w-3 h-3"/> {l.questions.length} questions
                            </div>
                        )}
                    </div>
                ))}
                 {lessons.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
                        <p className="text-gray-500">{t('noCourses')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const PlanningView: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLanguage();
    const [events, setEvents] = useState<SchoolEvent[]>([]);
    
    // Form
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [type, setType] = useState<'EXAM' | 'TEST' | 'HOMEWORK' | 'OTHER'>('EXAM');
    const [assignedClasses, setAssignedClasses] = useState<string[]>([]);

    useEffect(() => {
        setEvents(StorageService.getEventsByProf(user.id));
    }, [user.id]);

    const handleCreate = () => {
        if (!title || !date || assignedClasses.length === 0) {
            alert("Veuillez remplir tous les champs");
            return;
        }

        const newEvent: SchoolEvent = {
            id: `evt-${Date.now()}`,
            professorId: user.id,
            professorName: user.name,
            title,
            date,
            type,
            assignedClasses,
            createdAt: new Date().toISOString()
        };

        StorageService.saveEvent(newEvent);
        setEvents(prev => [...prev, newEvent]);
        
        // Reset
        setTitle('');
        setDate('');
        setAssignedClasses([]);
    };

    const handleDelete = (id: string) => {
        if(confirm("Supprimer cet événement ?")) {
            StorageService.deleteEvent(id);
            setEvents(prev => prev.filter(e => e.id !== id));
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            {/* Create Form */}
            <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border h-fit">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-600"/> Planifier un événement
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Titre</label>
                        <input className="w-full border rounded p-2" placeholder="Ex: Examen Final" value={title} onChange={e => setTitle(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Type</label>
                        <select className="w-full border rounded p-2" value={type} onChange={e => setType(e.target.value as any)}>
                            <option value="EXAM">Examen Final</option>
                            <option value="TEST">Contrôle Continu</option>
                            <option value="HOMEWORK">Devoir Maison</option>
                            <option value="OTHER">Autre</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Date et Heure</label>
                        <input type="datetime-local" className="w-full border rounded p-2" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Classes concernées</label>
                        <div className="flex flex-wrap gap-2">
                            {(user.assignedSections || []).map(cls => (
                                <button 
                                    key={cls}
                                    onClick={() => setAssignedClasses(prev => prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls])}
                                    className={`px-3 py-1 rounded text-xs border ${assignedClasses.includes(cls) ? 'bg-blue-600 text-white' : 'bg-gray-50 hover:bg-gray-100'}`}
                                >
                                    {cls}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button onClick={handleCreate} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-bold">Enregistrer</button>
                </div>
            </div>

            {/* List */}
            <div className="lg:col-span-2 space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600"/> Agenda ({events.length})
                </h3>
                {events.length === 0 && <p className="text-gray-500 italic">Aucun événement planifié.</p>}
                
                <div className="space-y-3">
                    {events.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(evt => (
                        <div key={evt.id} className="bg-white p-4 rounded-lg border shadow-sm flex justify-between items-center group">
                            <div className="flex gap-4 items-center">
                                <div className={`w-16 text-center p-2 rounded border ${
                                    evt.type === 'EXAM' ? 'bg-red-50 border-red-200 text-red-700' : 
                                    evt.type === 'TEST' ? 'bg-orange-50 border-orange-200 text-orange-700' : 
                                    'bg-blue-50 border-blue-200 text-blue-700'
                                }`}>
                                    <div className="text-xs font-bold uppercase">{new Date(evt.date).toLocaleString('fr', {month:'short'})}</div>
                                    <div className="text-xl font-black">{new Date(evt.date).getDate()}</div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800">{evt.title}</h4>
                                    <div className="text-xs text-gray-500 flex gap-2 mt-1">
                                        <span>{new Date(evt.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        <span>•</span>
                                        <span className="font-medium bg-gray-100 px-1 rounded">{evt.assignedClasses.join(', ')}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => handleDelete(evt.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                <Trash2 className="w-5 h-5"/>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const StudentsView: React.FC<{ user: User, onUpdate: (u: User) => void }> = ({ user, onUpdate }) => {
    const { t } = useLanguage();
    const [students, setStudents] = useState<User[]>([]);
    const [filterClass, setFilterClass] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    const [newClass, setNewClass] = useState('');
    const [isIndividual] = useState(user.accountType === 'INDIVIDUAL');

    useEffect(() => {
        const loadStudents = async () => {
            const allUsers = await ApiService.getUsers();
            setStudents(allUsers.filter(u => u.role === UserRole.STUDENT));
        };
        loadStudents();
    }, []);

    const filteredStudents = students.filter(s => {
        if (s.school !== user.school || s.city !== user.city) return false;
        
        const myClasses = user.assignedSections || [];
        const studentClasses = s.enrolledClasses || [];
        const isMyStudent = studentClasses.some(c => myClasses.includes(c));
        
        if (!isMyStudent) return false;
        if (filterClass) return studentClasses.includes(filterClass);
        return true;
    });

    const handleAddClass = async () => {
        if (!newClass.trim()) return;
        const current = user.assignedSections || [];
        if (current.includes(newClass.trim())) return;
        
        const updated = [...current, newClass.trim()];
        await ApiService.updateUser(user.id, { assignedSections: updated });
        onUpdate({ ...user, assignedSections: updated });
        setNewClass('');
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>, targetClass: string) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
            
            let count = 0;
            for (const row of data.slice(1)) {
                // @ts-ignore
                const name = String(row[0] || '').trim();
                if (name) {
                    const username = name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8) + Math.floor(Math.random()*1000);
                    const password = Math.floor(100000 + Math.random() * 900000).toString();
                    await ApiService.createUser({
                        id: `stu-${Date.now()}-${Math.random()}`,
                        name, username, password, readablePassword: password,
                        role: UserRole.STUDENT,
                        school: user.school, city: user.city,
                        enrolledClasses: [targetClass],
                        accountType: 'INDIVIDUAL'
                    });
                    count++;
                }
            }
            alert(`${count} ${t('studentsAdded')}`);
            const allUsers = await ApiService.getUsers();
            setStudents(allUsers.filter(u => u.role === UserRole.STUDENT));
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">{t('myStudents')}</h2>
                <div className="flex gap-2">
                    <select className="border rounded p-2 text-sm" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
                        <option value="">{t('allClasses')}</option>
                        {(user.assignedSections || []).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {isIndividual && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                    <h3 className="font-bold text-blue-800 mb-2 text-sm flex items-center gap-2"><Settings className="w-4 h-4"/> Gestion Classes (Indépendant)</h3>
                    <div className="flex gap-2 mb-4">
                        <input className="border rounded p-2 text-sm" placeholder="Nom de classe..." value={newClass} onChange={e => setNewClass(e.target.value)} />
                        <button onClick={handleAddClass} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">{t('addClass')}</button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {(user.assignedSections || []).map(cls => (
                            <label key={cls} className="bg-white p-2 rounded border flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition">
                                <span className="font-bold text-gray-700 mb-1">{cls}</span>
                                <span className="text-[10px] text-blue-500 flex items-center gap-1"><Upload className="w-3 h-3"/> Import Excel</span>
                                <input type="file" className="hidden" accept=".xlsx" onChange={(e) => handleImport(e, cls)} />
                            </label>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">{t('student')}</th>
                            <th className="p-4">{t('className')}</th>
                            <th className="p-4">{t('username')}</th>
                            <th className="p-4">
                                <button onClick={() => setShowPasswords(!showPasswords)} className="flex items-center gap-1 text-gray-500 hover:text-blue-600">
                                    {t('password')} {showPasswords ? <EyeOff className="w-3 h-3"/> : <Eye className="w-3 h-3"/>}
                                </button>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.map(s => (
                            <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="p-4 font-medium">{s.name}</td>
                                <td className="p-4">{s.enrolledClasses?.join(', ')}</td>
                                <td className="p-4 font-mono text-gray-600">{s.username}</td>
                                <td className="p-4 font-mono text-gray-500">{showPasswords ? (s.readablePassword || s.password) : '••••••'}</td>
                            </tr>
                        ))}
                        {filteredStudents.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400">{t('noResults')}</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ResultsView: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLanguage();
    const [results, setResults] = useState<QuizResult[]>([]);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);

    useEffect(() => {
        setResults(StorageService.getResults());
        setQuizzes(StorageService.getQuizzesByProf(user.id));
    }, [user.id]);

    const myResults = results.filter(r => quizzes.some(q => q.id === r.quizId));

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800">{t('results')}</h2>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">{t('student')}</th>
                            <th className="p-4">Quiz</th>
                            <th className="p-4 text-center">Score</th>
                            <th className="p-4 text-center">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {myResults.map(r => (
                            <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="p-4 font-medium">{r.studentName}</td>
                                <td className="p-4">{quizzes.find(q => q.id === r.quizId)?.title || 'Quiz Inconnu'}</td>
                                <td className="p-4 text-center">
                                    <span className={`font-bold ${r.score >= (r.maxScore / 2) ? 'text-green-600' : 'text-red-600'}`}>
                                        {r.score} / {r.maxScore}
                                    </span>
                                </td>
                                <td className="p-4 text-center text-gray-500">
                                    {new Date(r.submittedAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        {myResults.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400">{t('noData')}</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const StaffRoomView: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLanguage();
    const staffChatId = `chat_${user.school || 'default'}_${user.city || 'default'}`;
    const [staffMessages, setStaffMessages] = useState<Message[]>([]);
    const [newStaffMessage, setNewStaffMessage] = useState('');

    useEffect(() => {
        setStaffMessages(StorageService.getGroupMessages(staffChatId));
        const interval = setInterval(() => {
            setStaffMessages(StorageService.getGroupMessages(staffChatId));
        }, 3000);
        return () => clearInterval(interval);
    }, [user.id, staffChatId]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStaffMessage.trim()) return;
        const msg: Message = { id: `smsg-${Date.now()}`, senderId: user.id, senderName: user.name, receiverId: staffChatId, content: newStaffMessage, timestamp: new Date().toISOString(), read: false };
        StorageService.sendMessage(msg);
        setStaffMessages(prev => [...prev, msg]);
        setNewStaffMessage('');
    };

    return (
        <div className="bg-white rounded-lg shadow h-[600px] flex flex-col animate-fade-in border">
            <div className="p-4 border-b bg-indigo-50 font-bold text-indigo-800 flex items-center gap-2">
                <Coffee className="w-5 h-5"/> {t('staffRoom')} - {user.school}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {staffMessages.map(m => (
                    <div key={m.id} className={`flex ${m.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] p-3 rounded-lg text-sm shadow-sm ${m.senderId === user.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
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

const MessagesView: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLanguage();
    const [contacts, setContacts] = useState<User[]>([]);
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        const loadData = async () => {
            const allUsers = await ApiService.getUsers();
            
            // Get Coordinators (Always visible)
            const coords = allUsers.filter(u => 
                u.role === UserRole.COORDINATOR && 
                u.school === user.school && 
                u.city === user.city
            );
            
            // Get conversations
            const conversationIds = StorageService.getConversationsForUser(user.id);
            const otherUsers = conversationIds
                .filter(id => !coords.some(c => c.id === id))
                .map(id => allUsers.find(u => u.id === id) || { id, name: 'Utilisateur Inconnu', role: UserRole.STUDENT } as User);

            setContacts([...coords, ...otherUsers]);
        };
        loadData();
    }, [user.id]);

    useEffect(() => {
        if (selectedContactId) {
            setMessages(StorageService.getMessages(user.id, selectedContactId));
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
                <div className="p-4 border-b font-bold text-gray-700">{t('messages')}</div>
                <div className="flex-1 overflow-y-auto">
                     {contacts.length === 0 && <p className="p-4 text-sm text-gray-500 text-center">{t('noMessages')}</p>}
                     {contacts.map(contact => (
                        <button 
                            key={contact.id} 
                            onClick={() => setSelectedContactId(contact.id)} 
                            className={`w-full p-4 text-start hover:bg-blue-50 transition border-b flex justify-between items-center ${selectedContactId === contact.id ? 'bg-blue-100' : ''}`}
                        >
                            <div>
                                <div className="font-medium">{contact.name}</div>
                                <div className="text-xs text-gray-500">{t(contact.role.toLowerCase())}</div>
                            </div>
                        </button>
                     ))}
                </div>
             </div>
             <div className="w-2/3 flex flex-col bg-white">
                  {selectedContactId ? (
                       <>
                            <div className="p-4 border-b font-bold bg-gray-50 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                {contacts.find(u => u.id === selectedContactId)?.name}
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
                                <input className="flex-1 border rounded-full px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder={t('typeMessage')} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                                <button type="submit" className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700"><Send className="w-5 h-5 rtl:flip" /></button>
                            </form>
                       </>
                   ) : (
                       <div className="flex-1 flex items-center justify-center text-gray-400"><p>{t('selectProf')}</p></div>
                   )}
             </div>
         </div>
    );
};

const ProfileView: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLanguage();
    const [form, setForm] = useState({ email: user.email || '', phone: user.phone || '' });

    const handleSave = () => {
        // Mock update in storage
        const updatedUser: User = { ...user, email: form.email, phone: form.phone };
        StorageService.saveUser(updatedUser);
        alert(t('profileSaved'));
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow max-w-2xl mx-auto space-y-4 animate-fade-in">
            <h2 className="text-2xl font-bold">{t('profile')}</h2>
            <div className="p-4 bg-gray-50 rounded border">
                <p className="text-sm text-gray-500">{t('school')}</p>
                <p className="font-bold">{user.school} ({user.city})</p>
                <p className="text-xs text-blue-600 mt-2">{user.role}</p>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">{t('email')}</label>
                <input className="w-full border p-2 rounded" placeholder="email@exemple.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">{t('phone')}</label>
                <input className="w-full border p-2 rounded" placeholder="06..." value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            </div>
            <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded">{t('save')}</button>
        </div>
    );
};

// Main Dashboard Component
const ProfessorDashboard: React.FC<{ user: User, onLogout: () => void }> = ({ user, onLogout }) => {
    const { t, dir } = useLanguage();
    const location = useLocation();
    const [currentUser, setCurrentUser] = useState<User>(user);
    
    // Whiteboard Config State
    const [showWhiteboardConfig, setShowWhiteboardConfig] = useState(false);
    const [wbTitle, setWbTitle] = useState(`Cours de ${user.name}`);
    const [wbClasses, setWbClasses] = useState<string[]>([]);
    const [wbSessionId, setWbSessionId] = useState<string | null>(null);

    const isActive = (path: string) => location.pathname.includes(`/professor/${path}`);

    const handleCreateWhiteboardClick = () => {
        setShowWhiteboardConfig(true);
        setWbClasses([]);
    };

    const startWhiteboardSession = () => {
        const key = Math.random().toString(36).substring(2, 8).toUpperCase();
        const session = {
            id: `wb-${Date.now()}`,
            hostId: currentUser.id,
            hostName: currentUser.name,
            title: wbTitle,
            accessKey: key,
            isActive: true,
            createdAt: new Date().toISOString(),
            strokes: [],
            messages: []
        };
        StorageService.saveWhiteboard(session);
        setWbSessionId(session.id);
        setShowWhiteboardConfig(false);
    };

    if (wbSessionId) {
        return <WhiteboardRoom user={currentUser} sessionId={wbSessionId} onExit={() => setWbSessionId(null)} />;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex" dir={dir}>
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r hidden md:flex flex-col z-10">
                <div className="p-6 border-b flex items-center gap-3 bg-blue-600 text-white">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                        <FileText className="w-6 h-6 text-white"/>
                    </div>
                    <div>
                        <h1 className="font-bold font-logo text-lg tracking-tight">Tinmel</h1>
                        <p className="text-xs text-blue-100">{t('staffSpace')}</p>
                    </div>
                </div>
                
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {[
                        { id: 'stats', icon: LayoutDashboard, label: t('schoolStatsView') },
                        { id: 'quizzes', icon: FileText, label: t('myQuizzes') },
                        { id: 'lessons', icon: BookOpen, label: t('myCourses') },
                        { id: 'planning', icon: Calendar, label: "Agenda" },
                        { id: 'students', icon: UserPlus, label: t('myStudents') }, 
                        { id: 'whiteboard', icon: PenTool, label: t('whiteboard'), onClick: handleCreateWhiteboardClick },
                        { id: 'results', icon: BarChart, label: t('results') },
                        { id: 'messages', icon: MessageCircle, label: t('messages') },
                        { id: 'staff-room', icon: Coffee, label: t('staffRoom') }, 
                        { id: 'profile', icon: Settings, label: t('profile') },
                    ].map(item => (
                        item.onClick ? (
                            <button 
                                key={item.id}
                                onClick={item.onClick}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-colors text-start"
                            >
                                <item.icon className="w-5 h-5"/> {item.label}
                            </button>
                        ) : (
                            <Link 
                                key={item.id}
                                to={`/professor/${item.id}`}
                                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive(item.id) ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'}`}
                            >
                                <item.icon className="w-5 h-5"/> {item.label}
                            </Link>
                        )
                    ))}
                </nav>

                <div className="p-4 border-t">
                     <button onClick={onLogout} className="flex items-center gap-2 text-red-600 hover:bg-red-50 w-full px-4 py-2 rounded-lg transition-colors text-sm font-medium">
                        <LogOut className="w-4 h-4 rtl:flip"/> {t('logout')}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Topbar */}
                <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0 relative z-0">
                     <HeaderBackground />
                     <div className="z-10 flex items-center gap-4">
                         <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-lg">
                             {currentUser.name.charAt(0).toUpperCase()}
                         </div>
                         <div>
                             <h2 className="font-bold text-gray-800">{currentUser.name}</h2>
                             <p className="text-xs text-gray-500">{currentUser.school || 'Enseignant'}</p>
                         </div>
                     </div>
                </header>

                <div className="flex-1 overflow-auto p-6 relative z-0">
                    <Routes>
                        <Route path="stats" element={<Overview user={currentUser} />} />
                        <Route path="quizzes" element={<QuizzesView user={currentUser} />} />
                        <Route path="lessons" element={<LessonsView user={currentUser} />} />
                        <Route path="planning" element={<PlanningView user={currentUser} />} />
                        <Route path="students" element={<StudentsView user={currentUser} onUpdate={setCurrentUser} />} />
                        <Route path="results" element={<ResultsView user={currentUser} />} />
                        <Route path="messages" element={<MessagesView user={currentUser} />} />
                        <Route path="staff-room" element={<StaffRoomView user={currentUser} />} />
                        <Route path="profile" element={<ProfileView user={currentUser} />} />
                        <Route path="*" element={<Navigate to="stats" replace />} />
                    </Routes>
                </div>

                {/* Whiteboard Configuration Modal */}
                {showWhiteboardConfig && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                            <div className="flex justify-between items-center mb-4 border-b pb-2">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <PenTool className="w-5 h-5 text-blue-600"/> {t('createRoom')}
                                </h3>
                                <button onClick={() => setShowWhiteboardConfig(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5"/>
                                </button>
                            </div>
                            
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('roomTitle')}</label>
                                    <input 
                                        className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={wbTitle}
                                        onChange={e => setWbTitle(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('assignedClasses')}</label>
                                    <div className="border rounded p-2 max-h-40 overflow-y-auto grid grid-cols-2 gap-2 bg-gray-50">
                                        {(currentUser.assignedSections || []).length > 0 ? (
                                            currentUser.assignedSections?.map(cls => (
                                                <label key={cls} className="flex items-center gap-2 text-sm cursor-pointer p-1 rounded hover:bg-white transition">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={wbClasses.includes(cls)}
                                                        onChange={() => setWbClasses(prev => prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls])}
                                                        className="text-blue-600 rounded"
                                                    />
                                                    {cls}
                                                </label>
                                            ))
                                        ) : (
                                            <p className="text-xs text-gray-400 italic col-span-2">{t('noClassesFound')}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <button onClick={() => setShowWhiteboardConfig(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">{t('cancel')}</button>
                                <button onClick={startWhiteboardSession} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
                                    {t('start')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ProfessorDashboard;