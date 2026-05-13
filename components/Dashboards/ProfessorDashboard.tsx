import React, { useState, useEffect } from 'react';
import { User, UserRole, Quiz, Lesson, WhiteboardSession, Message, LessonType, QuizResult } from '../../types';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { StorageService } from '../../services/storageService';
import { ApiService } from '../../services/apiService';
import { useLanguage } from '../../contexts/LanguageContext';
import { useUnreadCount } from '../../hooks/useUnreadCount';
import { useNetworkMode } from '../../contexts/NetworkModeContext';
import { HeaderBackground } from '../HeaderBackground';
import { LayoutDashboard, BookOpen, PenTool, MessageCircle, User as UserIcon, LogOut, Plus, CalendarClock, MonitorPlay, Key, Users, Trash2, X, PlayCircle, Settings, ChevronRight, FileText, Video, File, CheckCircle, Radio, Leaf, Lock } from 'lucide-react';
import QuizBuilder from '../Quiz/QuizBuilder';
import WhiteboardRoom from '../Whiteboard/WhiteboardRoom';
import { MessagesView } from '../Messages/MessagesView';

interface Props {
  user: User;
  onLogout: () => void;
}

// Sub-components
const ProfessorOverview: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLanguage();
    const [stats, setStats] = useState({ activeStudents: 0, publishedQuizzes: 0, publishedLessons: 0 });
    const [events, setEvents] = useState<any[]>([]);
    const [isCreatingEvent, setIsCreatingEvent] = useState(false);
    
    // Event Form
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [type, setType] = useState<'EXAM' | 'TEST' | 'HOMEWORK' | 'OTHER'>('EXAM');
    const [examMode, setExamMode] = useState<'ONLINE' | 'PHYSICAL'>('ONLINE');
    const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
    
    const assignedSections = user.assignedSections || (user.class ? [user.class] : []);

    useEffect(() => {
        const loadStats = async () => {
            const allUsers = await ApiService.getUsers();
            const students = allUsers.filter(u => 
                u.role === UserRole.STUDENT && 
                u.school === user.school && 
                u.enrolledClasses?.some(c => assignedSections.includes(c))
            );
            
            const quizzes = StorageService.getQuizzes().filter(q => q.professorId === user.id && q.status === 'PUBLISHED');
            const lessons = StorageService.getLessons().filter(l => l.professorId === user.id && l.status === 'PUBLISHED');
            
            setStats({
                activeStudents: students.length,
                publishedQuizzes: quizzes.length,
                publishedLessons: lessons.length
            });
        };
        loadStats();
        
        setEvents(StorageService.getEvents().filter(e => e.professorId === user.id));
    }, [user.id, user.school, assignedSections]);

    const handleSaveEvent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !date || selectedClasses.length === 0) return alert("Veuillez remplir tous les champs obligatoires.");
        
        const newEvent = {
            id: `evt-${Date.now()}`,
            professorId: user.id,
            professorName: user.name,
            title,
            date,
            type,
            examMode: type === 'EXAM' || type === 'TEST' ? examMode : undefined,
            assignedClasses: selectedClasses,
            createdAt: new Date().toISOString()
        };
        
        StorageService.saveEvent(newEvent as any);
        setEvents(prev => [...prev, newEvent]);
        setIsCreatingEvent(false);
        setTitle('');
        setDate('');
        setSelectedClasses([]);
    };

    const handleDeleteEvent = (id: string) => {
        if(confirm("Supprimer cet événement ?")) {
            StorageService.deleteEvent(id);
            setEvents(prev => prev.filter(e => e.id !== id));
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800">Vue Globale</h2>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-800">{stats.activeStudents}</div>
                        <div className="text-sm text-gray-500">Apprenants actifs</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-800">{stats.publishedQuizzes}</div>
                        <div className="text-sm text-gray-500">Quiz publiés</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-800">{stats.publishedLessons}</div>
                        <div className="text-sm text-gray-500">Cours publiés</div>
                    </div>
                </div>
            </div>

            {/* Planner */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        <CalendarClock className="w-5 h-5 text-indigo-600" />
                        Planificateur (Quiz & Examens)
                    </h3>
                    <button onClick={() => setIsCreatingEvent(!isCreatingEvent)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2">
                        {isCreatingEvent ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {isCreatingEvent ? 'Annuler' : 'Planifier'}
                    </button>
                </div>
                
                {isCreatingEvent && (
                    <form onSubmit={handleSaveEvent} className="p-6 border-b bg-indigo-50/30 grid gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Titre de l'événement</label>
                                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded-lg p-2" placeholder="Ex: Contrôle Continu Math" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date et Heure</label>
                                <input required type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="w-full border rounded-lg p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select value={type} onChange={e => setType(e.target.value as any)} className="w-full border rounded-lg p-2">
                                    <option value="EXAM">Examen</option>
                                    <option value="TEST">Test / Quiz</option>
                                    <option value="HOMEWORK">Devoir</option>
                                    <option value="OTHER">Autre</option>
                                </select>
                            </div>
                            {(type === 'EXAM' || type === 'TEST') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mode de passation</label>
                                    <select value={examMode} onChange={e => setExamMode(e.target.value as any)} className="w-full border rounded-lg p-2">
                                        <option value="ONLINE">En ligne (Sur la plateforme)</option>
                                        <option value="PHYSICAL">Physique (En classe)</option>
                                    </select>
                                </div>
                            )}
                            <div className="col-span-full">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Classes concernées</label>
                                <div className="flex flex-wrap gap-2">
                                    {assignedSections.map(cls => (
                                        <label key={cls} className="flex items-center gap-2 bg-white border px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedClasses.includes(cls)}
                                                onChange={(e) => {
                                                    if(e.target.checked) setSelectedClasses([...selectedClasses, cls]);
                                                    else setSelectedClasses(selectedClasses.filter(c => c !== cls));
                                                }}
                                            />
                                            <span className="text-sm">{cls}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end mt-2">
                            <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700">Enregistrer</button>
                        </div>
                    </form>
                )}

                <div className="p-0">
                    {events.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">Aucun événement planifié.</div>
                    ) : (
                        <div className="divide-y">
                            {events.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(evt => (
                                <div key={evt.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg flex flex-col items-center justify-center">
                                            <span className="text-xs font-bold uppercase">{new Date(evt.date).toLocaleString('fr-FR', { month: 'short' })}</span>
                                            <span className="text-lg font-bold leading-none">{new Date(evt.date).getDate()}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800">{evt.title}</h4>
                                            <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                                <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">{evt.type}</span>
                                                {(evt.type === 'EXAM' || evt.type === 'TEST') && (
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${evt.examMode === 'ONLINE' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        {evt.examMode === 'ONLINE' ? 'En ligne' : 'En classe'}
                                                    </span>
                                                )}
                                                <span>• {new Date(evt.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                <span>• Classes: {evt.assignedClasses.join(', ')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteEvent(evt.id)} className="text-gray-400 hover:text-red-500 p-2">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const LessonsView: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLanguage();
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    
    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<LessonType>(LessonType.DOCUMENT);
    const [contentUrl, setContentUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    
    // Scheduling
    const [publishMode, setPublishMode] = useState<'INSTANT' | 'SCHEDULED'>('INSTANT');
    const [availableFrom, setAvailableFrom] = useState('');
    
    // Audience
    const [inviteType, setInviteType] = useState<'CLASS' | 'STUDENT'>('CLASS');
    const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [availableStudents, setAvailableStudents] = useState<User[]>([]);

    // Gamification (Treasure Hunt)
    const [hiddenWordsInput, setHiddenWordsInput] = useState('');
    
    const assignedSections = user.assignedSections || (user.class ? [user.class] : []);

    useEffect(() => {
        setLessons(StorageService.getLessons().filter(l => l.professorId === user.id));
        
        const loadStudents = async () => {
            const all = await ApiService.getUsers();
            if (all && Array.isArray(all)) {
                const filtered = all.filter(u => u.role === UserRole.STUDENT && u.school === user.school && u.city === user.city);
                setAvailableStudents(filtered);
            }
        };
        loadStudents();
    }, [user.id, user.school, user.city]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const url = await ApiService.uploadFile(file);
            setContentUrl(url);
        } catch (err) {
            alert("Erreur lors de l'upload du fichier.");
        }
        setUploading(false);
    };

    const handleSave = () => {
        if (!title.trim() || !contentUrl.trim()) {
            return alert("Veuillez remplir le titre et fournir un contenu (URL ou Fichier).");
        }
        if (inviteType === 'CLASS' && selectedClasses.length === 0) return alert("Sélectionnez au moins une classe.");
        if (inviteType === 'STUDENT' && selectedStudents.length === 0) return alert("Sélectionnez au moins un étudiant.");
        if (publishMode === 'SCHEDULED' && !availableFrom) return alert("Veuillez définir la date de lancement.");

        const hiddenWords = hiddenWordsInput.split(',').map(w => w.trim()).filter(w => w.length > 0);

        const newLesson: Lesson = {
            id: `lesson-${Date.now()}`,
            professorId: user.id,
            title,
            description,
            assignedClasses: inviteType === 'CLASS' ? selectedClasses : [],
            invitedStudentIds: inviteType === 'STUDENT' ? selectedStudents : [],
            type,
            contentUrl,
            createdAt: new Date().toISOString(),
            status: publishMode === 'INSTANT' ? 'PUBLISHED' : 'DRAFT',
            availableFrom: publishMode === 'SCHEDULED' ? availableFrom : undefined,
            hasTreasureHunt: hiddenWords.length > 0,
            hiddenWords: hiddenWords.length > 0 ? hiddenWords : undefined
        };

        StorageService.saveLesson(newLesson);
        setLessons(prev => [...prev, newLesson]);
        setIsCreating(false);
        
        // Reset form
        setTitle(''); setDescription(''); setContentUrl(''); setSelectedClasses([]); setSelectedStudents([]);
        setHiddenWordsInput(''); setPublishMode('INSTANT'); setAvailableFrom('');
    };

    const handleDelete = (id: string) => {
        if (confirm(t('delete') + '?')) {
            StorageService.deleteLesson(id);
            setLessons(prev => prev.filter(l => l.id !== id));
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-indigo-600"/> Mes Cours
                </h2>
                <button onClick={() => setIsCreating(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-sm">
                    <Plus className="w-5 h-5"/> Créer un cours
                </button>
            </div>

            {isCreating ? (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                    <div className="flex justify-between items-center border-b pb-4">
                        <h3 className="text-xl font-bold text-gray-800">Nouveau Cours</h3>
                        <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6"/></button>
                    </div>

                    {/* Informations générales */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Titre du cours</label>
                            <input className="w-full border rounded p-2 focus:ring-2 focus:ring-indigo-500 outline-none" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Les bases de l'algorithmique" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optionnelle)</label>
                            <textarea className="w-full border rounded p-2 focus:ring-2 focus:ring-indigo-500 outline-none" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
                        </div>
                    </div>

                    {/* Contenu */}
                    <div className="bg-gray-50 p-4 rounded-lg border space-y-4">
                        <h4 className="font-bold text-gray-700 flex items-center gap-2"><FileText className="w-4 h-4"/> Contenu Pédagogique</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type de contenu</label>
                                <select className="w-full border rounded p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white" value={type} onChange={e => setType(e.target.value as LessonType)}>
                                    <option value={LessonType.DOCUMENT}>Document (PDF, Word, Lien)</option>
                                    <option value={LessonType.VIDEO}>Vidéo</option>
                                    <option value={LessonType.INTERACTIVE}>Interactif</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Source du contenu</label>
                                <div className="flex gap-2">
                                    <input className="flex-1 border rounded p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white" value={contentUrl} onChange={e => setContentUrl(e.target.value)} placeholder="URL (https://...) ou uploadez un fichier" />
                                    <label className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded cursor-pointer hover:bg-gray-50 flex items-center justify-center whitespace-nowrap">
                                        {uploading ? '...' : 'Upload'}
                                        <input type="file" className="hidden" accept=".pdf,.doc,.docx,.mp4" onChange={handleFileUpload} disabled={uploading} />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {type === LessonType.DOCUMENT && (
                            <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                                <h5 className="font-bold text-indigo-800 text-sm mb-2 flex items-center gap-2">💎 Chasse au Trésor (Gamification)</h5>
                                <p className="text-xs text-indigo-600 mb-2">Cachez des mots-clés dans votre document. Les élèves devront les trouver et les saisir pour gagner des points d'XP et des badges !</p>
                                <input 
                                    className="w-full border border-indigo-200 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                                    value={hiddenWordsInput} 
                                    onChange={e => setHiddenWordsInput(e.target.value)} 
                                    placeholder="Ex: algorithme, variable, boucle (séparés par des virgules)" 
                                />
                            </div>
                        )}
                    </div>

                    {/* Lancement et Audience */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Lancement */}
                        <div>
                            <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><CalendarClock className="w-4 h-4"/> Lancement</h4>
                            <div className="flex gap-4 mb-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" checked={publishMode === 'INSTANT'} onChange={() => setPublishMode('INSTANT')} className="text-indigo-600" />
                                    <span className="text-sm">Immédiat</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" checked={publishMode === 'SCHEDULED'} onChange={() => setPublishMode('SCHEDULED')} className="text-indigo-600" />
                                    <span className="text-sm">Programmé</span>
                                </label>
                            </div>
                            {publishMode === 'SCHEDULED' && (
                                <input type="datetime-local" className="w-full border rounded p-2 text-sm" value={availableFrom} onChange={e => setAvailableFrom(e.target.value)} />
                            )}
                        </div>

                        {/* Audience */}
                        <div>
                            <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><Users className="w-4 h-4"/> Audience</h4>
                            <div className="flex gap-4 mb-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" checked={inviteType === 'CLASS'} onChange={() => setInviteType('CLASS')} className="text-indigo-600" />
                                    <span className="text-sm">Classes</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" checked={inviteType === 'STUDENT'} onChange={() => setInviteType('STUDENT')} className="text-indigo-600" />
                                    <span className="text-sm">Élèves spécifiques</span>
                                </label>
                            </div>

                            {inviteType === 'CLASS' ? (
                                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2 rounded border max-h-32 overflow-y-auto">
                                    {assignedSections.map(cls => (
                                        <label key={cls} className="flex items-center gap-2 text-sm p-1 hover:bg-white rounded cursor-pointer">
                                            <input type="checkbox" checked={selectedClasses.includes(cls)} onChange={() => setSelectedClasses(prev => prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls])} className="rounded text-indigo-600" />
                                            {cls}
                                        </label>
                                    ))}
                                    {assignedSections.length === 0 && <p className="text-xs text-gray-400 italic col-span-2">Aucune classe assignée.</p>}
                                </div>
                            ) : (
                                <div className="bg-gray-50 p-2 rounded border max-h-32 overflow-y-auto">
                                    <div className="space-y-1">
                                        {availableStudents.map(s => (
                                            <label key={s.id} className="flex items-center gap-2 text-sm p-1 hover:bg-white rounded cursor-pointer">
                                                <input type="checkbox" checked={selectedStudents.includes(s.id)} onChange={() => setSelectedStudents(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])} className="rounded text-indigo-600" />
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
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button onClick={() => setIsCreating(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-medium">Annuler</button>
                        <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-bold shadow-md">
                            {publishMode === 'INSTANT' ? 'Publier le cours' : 'Programmer'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4">
                    {lessons.length === 0 && <p className="text-gray-500 text-center py-10 bg-gray-50 rounded-lg border border-dashed">Aucun cours créé pour le moment.</p>}
                    {lessons.map(l => (
                        <div key={l.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    {l.type === LessonType.VIDEO ? <Video className="w-5 h-5"/> : <File className="w-5 h-5"/>}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                        {l.title}
                                        {l.status === 'DRAFT' && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full uppercase">Programmé</span>}
                                        {l.hasTreasureHunt && <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full uppercase">💎 Chasse au trésor</span>}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {l.assignedClasses.length > 0 ? l.assignedClasses.join(', ') : `${l.invitedStudentIds?.length} élève(s)`} • 
                                        {l.availableFrom ? ` Prévu le ${new Date(l.availableFrom).toLocaleString()}` : ` Créé le ${new Date(l.createdAt).toLocaleDateString()}`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <a href={l.contentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline font-medium">Ouvrir le lien</a>
                                <button onClick={() => handleDelete(l.id)} className="text-gray-400 hover:text-red-500 p-2"><Trash2 className="w-5 h-5"/></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ClassesView: React.FC<{ user: User }> = ({ user }) => {
    const [students, setStudents] = useState<User[]>([]);
    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    
    const assignedSections = user.assignedSections || (user.class ? [user.class] : []);

    useEffect(() => {
        const loadStudents = async () => {
            const allUsers = await ApiService.getUsers();
            if (allUsers && Array.isArray(allUsers)) {
                // Filter students from the same school
                const schoolStudents = allUsers.filter(u => u.role === UserRole.STUDENT && u.school === user.school && u.city === user.city);
                setStudents(schoolStudents);
            }
        };
        loadStudents();
    }, [user.school, user.city]);

    // Set first class as default if none selected
    useEffect(() => {
        if (!selectedClass && assignedSections.length > 0) {
            setSelectedClass(assignedSections[0]);
        }
    }, [assignedSections, selectedClass]);

    const filteredStudents = students.filter(s => selectedClass && s.enrolledClasses?.includes(selectedClass));

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Users className="w-6 h-6 text-indigo-600"/> Mes Classes
                </h2>
            </div>

            {assignedSections.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
                    <p className="text-gray-500">Aucune classe ne vous a été assignée.</p>
                </div>
            ) : (
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Class Selector */}
                    <div className="w-full md:w-64 shrink-0 space-y-2">
                        <h3 className="font-bold text-gray-700 mb-3 uppercase text-xs tracking-wider">Classes Assignées</h3>
                        {assignedSections.map(cls => (
                            <button 
                                key={cls}
                                onClick={() => setSelectedClass(cls)}
                                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors flex justify-between items-center ${selectedClass === cls ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-100'}`}
                            >
                                {cls}
                                <ChevronRight className={`w-4 h-4 ${selectedClass === cls ? 'text-indigo-200' : 'text-gray-400'}`}/>
                            </button>
                        ))}
                    </div>

                    {/* Student List */}
                    <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">Étudiants - {selectedClass}</h3>
                            <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded-full">{filteredStudents.length} élèves</span>
                        </div>
                        <div className="divide-y">
                            {filteredStudents.length === 0 ? (
                                <p className="p-6 text-center text-gray-500">Aucun étudiant inscrit dans cette classe.</p>
                            ) : (
                                filteredStudents.map(student => (
                                    <div key={student.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                            {student.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-800">{student.name}</h4>
                                            <p className="text-xs text-gray-500">@{student.username}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                Niveau {student.level || 1}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const QuizzesView: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLanguage();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [results, setResults] = useState<QuizResult[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);
    
    // Get assigned classes from Coordinator (or legacy fallback)
    const availableClasses = user.assignedSections && user.assignedSections.length > 0 
        ? user.assignedSections 
        : (user.class ? [user.class] : []);

    useEffect(() => {
        setQuizzes(StorageService.getQuizzes().filter(q => q.professorId === user.id));
        setResults(StorageService.getResults());
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
            setExpandedQuizId(null);
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
                 {quizzes.map(q => {
                     const quizResults = results.filter(r => r.quizId === q.id);
                     const isExpanded = expandedQuizId === q.id;

                     return (
                     <div key={q.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                         <button type="button" className="w-full text-left p-4 flex justify-between items-center group cursor-pointer" onClick={() => setExpandedQuizId(isExpanded ? null : q.id)}>
                             <div>
                                 <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                     {q.title} 
                                     {q.accessCode && <Lock className="w-4 h-4 text-gray-400" />}
                                 </h3>
                                 <p className="text-sm text-gray-500">{q.questions.length} {t('questionsCount')} • {q.assignedClasses.join(', ')}</p>
                             </div>
                             <div className="flex items-center gap-4">
                                 <div className="text-right">
                                     <span className="text-sm font-medium text-gray-600 block">{quizResults.length} {t('responses') || 'Réponses'}</span>
                                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${q.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                         {t(q.status.toLowerCase())}
                                     </span>
                                 </div>
                                 <button onClick={(e) => { e.stopPropagation(); handleDeleteQuiz(q.id); }} className="text-gray-400 hover:text-red-500 p-2 border-l pl-4"><Trash2 className="w-5 h-5"/></button>
                             </div>
                         </button>
                         
                         {isExpanded && (
                             <div className="border-t border-gray-100 bg-gray-50 p-4">
                                 <h4 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wider">{t('responses') || 'Réponses reçues'}</h4>
                                 {quizResults.length === 0 ? (
                                     <p className="text-sm text-gray-500 italic">Aucune réponse pour le moment.</p>
                                 ) : (
                                     <div className="space-y-2">
                                         {quizResults.map(r => (
                                             <div key={r.id} className="bg-white p-3 rounded border border-gray-200 flex justify-between items-center text-sm">
                                                 <div className="flex items-center gap-3">
                                                     <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex justify-center items-center font-bold">
                                                        {r.studentName.charAt(0).toUpperCase()}
                                                     </div>
                                                     <div>
                                                         <span className="font-semibold block">{r.studentName}</span>
                                                         <span className="text-xs text-gray-500">{new Date(r.submittedAt).toLocaleString()}</span>
                                                     </div>
                                                 </div>
                                                 <div className="text-right">
                                                    <span className={`font-bold text-lg ${r.score / r.maxScore >= 0.5 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {r.score} / {r.maxScore}
                                                    </span>
                                                    <span className="block text-xs text-gray-500 font-medium">Score</span>
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                 )}
                             </div>
                         )}
                     </div>
                 )})}
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
    const totalUnread = useUnreadCount(user.id);
    const { loraQueue, ecoPoints, mode } = useNetworkMode();

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
                        { id: 'lessons', icon: FileText, label: 'Mes Cours' },
                        { id: 'classes', icon: Users, label: 'Mes Classes' },
                        { id: 'quizzes', icon: BookOpen, label: t('myQuizzes') },
                        { id: 'whiteboard', icon: PenTool, label: t('whiteboard') },
                        { id: 'messages', icon: MessageCircle, label: t('messages'), badge: totalUnread > 0 ? totalUnread : null },
                    ].map(item => (
                        <Link 
                            key={item.id}
                            to={`/professor/${item.id}`}
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
                     <HeaderBackground color="29, 78, 216" />
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
                        <Route path="overview" element={<ProfessorOverview user={user} />} />
                        <Route path="lessons" element={<LessonsView user={user} />} />
                        <Route path="classes" element={<ClassesView user={user} />} />
                        <Route path="quizzes" element={<QuizzesView user={user} />} />
                        <Route path="whiteboard" element={<WhiteboardManagerView user={user} onStartSession={setActiveWhiteboard} />} />
                        <Route path="messages" element={<MessagesView user={user} />} />
                        <Route path="*" element={<Navigate to="lessons" replace />} />
                    </Routes>
                 </div>
            </main>
        </div>
    );
};

export default ProfessorDashboard;