import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { User, UserRole, SchoolStructure, IoTDevice, Message } from '../../types';
import { StorageService } from '../../services/storageService';
import { ApiService } from '../../services/apiService';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
    LayoutDashboard, Users, GraduationCap, Building, Activity, LogOut, 
    Plus, Save, Trash2, Search, Upload, Download, Smartphone, Wifi, 
    MapPin, Thermometer, Wind, AlertTriangle, FileSpreadsheet, ChevronRight, X, UserPlus, Eye, EyeOff, Settings, BookOpen, MessageCircle, Send, FileText
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
                    color: `rgba(79, 70, 229, ${el.opacity})`, // Indigo-600 for Coordinator
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

const StatsView: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLanguage();
    const [stats, setStats] = useState({
        profs: 0,
        students: 0,
        classes: 0,
        quizzes: 0,
        activeDevices: 0
    });

    useEffect(() => {
        const loadStats = async () => {
            const allUsers = await ApiService.getUsers();
            const schoolProfs = allUsers.filter(u => u.role === UserRole.PROFESSOR && u.school === user.school && u.city === user.city);
            const schoolStudents = allUsers.filter(u => u.role === UserRole.STUDENT && u.school === user.school && u.city === user.city);
            
            const structure = StorageService.getSchoolStructure(user.school!, user.city!);
            const devices = StorageService.getIoTDevices(user.school!, user.city!);
            
            // Count quizzes created by professors of this school
            const allQuizzes = StorageService.getQuizzes();
            const profIds = new Set(schoolProfs.map(p => p.id));
            const schoolQuizzes = allQuizzes.filter(q => profIds.has(q.professorId));

            setStats({
                profs: schoolProfs.length,
                students: schoolStudents.length,
                classes: structure?.classes.length || 0,
                quizzes: schoolQuizzes.length,
                activeDevices: devices.filter(d => d.status === 'ONLINE').length
            });
        };
        loadStats();
    }, [user]);

    return (
        <div className="space-y-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Activity className="w-6 h-6 text-indigo-600"/> {t('schoolStats')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition">
                    <div className="bg-blue-100 p-4 rounded-full text-blue-600">
                        <Users className="w-8 h-8"/>
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium">{t('totalProfs')}</p>
                        <h3 className="text-3xl font-bold text-gray-800">{stats.profs}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition">
                    <div className="bg-green-100 p-4 rounded-full text-green-600">
                        <GraduationCap className="w-8 h-8"/>
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium">{t('totalStudents')}</p>
                        <h3 className="text-3xl font-bold text-gray-800">{stats.students}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition">
                    <div className="bg-purple-100 p-4 rounded-full text-purple-600">
                        <Building className="w-8 h-8"/>
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium">{t('activeClasses')}</p>
                        <h3 className="text-3xl font-bold text-gray-800">{stats.classes}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition">
                    <div className="bg-orange-100 p-4 rounded-full text-orange-600">
                        <FileText className="w-8 h-8"/>
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium">{t('totalQuizzes')}</p>
                        <h3 className="text-3xl font-bold text-gray-800">{stats.quizzes}</h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <Wifi className="w-5 h-5 text-indigo-500"/> État du Smart Campus
                    </h3>
                    <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                        <span className="text-indigo-800 font-medium">Appareils Connectés</span>
                        <span className="bg-white text-indigo-600 px-3 py-1 rounded-full font-bold shadow-sm">{stats.activeDevices}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-4 text-center">
                        Données en temps réel fournies par les capteurs IoT installés dans l'établissement.
                    </p>
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-xl text-white shadow-lg flex flex-col justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="font-bold text-xl mb-1">{user.school}</h3>
                        <p className="text-indigo-200 text-sm mb-6">{user.city}</p>
                        <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg inline-flex items-center gap-2">
                            <Activity className="w-4 h-4 text-green-300 animate-pulse"/>
                            <span className="text-sm font-medium">Système Opérationnel</span>
                        </div>
                    </div>
                    <div className="absolute -right-6 -bottom-6 opacity-10">
                        <Building className="w-40 h-40"/>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StructureView: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLanguage();
    const [structure, setStructure] = useState<SchoolStructure>({
        id: '', school: user.school || '', city: user.city || '', classes: []
    });
    const [newClass, setNewClass] = useState('');

    useEffect(() => {
        if (user.school && user.city) {
            const existing = StorageService.getSchoolStructure(user.school, user.city);
            if (existing) setStructure(existing);
        }
    }, [user]);

    const addClass = () => {
        if (!newClass.trim()) return;
        if (structure.classes.includes(newClass.trim())) {
            alert(t('classExists'));
            return;
        }
        const updated = { ...structure, classes: [...structure.classes, newClass.trim()] };
        setStructure(updated);
        StorageService.saveSchoolStructure(updated);
        setNewClass('');
    };

    const removeClass = (cls: string) => {
        if(confirm(t('delete') + '?')) {
            const updated = { ...structure, classes: structure.classes.filter(c => c !== cls) };
            setStructure(updated);
            StorageService.saveSchoolStructure(updated);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Building className="w-6 h-6 text-indigo-600"/> {t('manageStructure')}
            </h2>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-lg mb-4 text-gray-700">{t('addClassToStructure')}</h3>
                <div className="flex flex-col md:flex-row gap-2 mb-6">
                    <input 
                        className="flex-1 border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                        placeholder="Ex: 2ème Année Bac - A"
                        value={newClass}
                        onChange={e => setNewClass(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addClass()}
                    />
                    <button onClick={addClass} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center gap-2 justify-center">
                        <Plus className="w-5 h-5"/> {t('addClass')}
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {structure.classes.map(cls => (
                        <div key={cls} className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex justify-between items-center group hover:bg-white hover:shadow-md transition-all">
                            <span className="font-bold text-gray-800">{cls}</span>
                            <button onClick={() => removeClass(cls)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1">
                                <Trash2 className="w-4 h-4"/>
                            </button>
                        </div>
                    ))}
                    {structure.classes.length === 0 && (
                        <div className="col-span-full text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                            <Building className="w-12 h-12 text-gray-300 mx-auto mb-2"/>
                            <p className="text-gray-400 italic">Aucune classe configurée.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StaffManagementView: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLanguage();
    const [profs, setProfs] = useState<User[]>([]);
    const [structure, setStructure] = useState<SchoolStructure | undefined>(undefined);
    const [selectedProf, setSelectedProf] = useState<User | null>(null);
    
    // Add Prof State
    const [isAdding, setIsAdding] = useState(false);
    const [newProfName, setNewProfName] = useState('');
    const [newProfSubject, setNewProfSubject] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);

    useEffect(() => {
        if (user.school && user.city) {
            setStructure(StorageService.getSchoolStructure(user.school, user.city));
            loadProfs();
        }
    }, [user]);

    const loadProfs = async () => {
        // Use ApiService instead of StorageService to get the latest data from backend
        // We filter by school AND city to ensure correct isolation
        const allUsers = await ApiService.getUsers();
        setProfs(allUsers.filter(u => u.role === UserRole.PROFESSOR && u.school === user.school && u.city === user.city));
    };

    const handleCreateProf = async () => {
        if (!newProfName.trim()) return;
        
        const cleanName = newProfName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
        const username = `prof_${cleanName.substring(0, 8)}_${randomSuffix}`;
        const password = Math.floor(100000 + Math.random() * 900000).toString();

        const newUser: User = {
            id: `usr-${Date.now()}`,
            name: newProfName.trim(),
            username,
            password, // Saved hashed in backend
            readablePassword: password,
            role: UserRole.PROFESSOR,
            school: user.school,
            city: user.city,
            subject: newProfSubject.trim() || 'Général',
            accountType: 'ESTABLISHMENT'
        };

        await ApiService.createUser(newUser);
        alert(`Professeur ajouté !\nID: ${username}\nMDP: ${password}\nMatière: ${newUser.subject}`);
        setNewProfName('');
        setNewProfSubject('');
        setIsAdding(false);
        loadProfs(); // Reload list from backend
    };

    const handleDelete = async (id: string) => {
        if(confirm(t('delete') + '?')) {
            await ApiService.deleteUser(id);
            loadProfs();
        }
    };

    const handleAssign = (profId: string, sections: string[]) => {
        const prof = profs.find(p => p.id === profId);
        if (prof) {
            const updated = { ...prof, assignedSections: sections };
            StorageService.saveUser(updated); // Sync local
            ApiService.updateUser(profId, { assignedSections: sections }); // Sync API
            setProfs(profs.map(p => p.id === profId ? updated : p));
        }
    };

    const handleExportProfs = () => {
        const data = profs.map(p => ({
            "Nom Complet": p.name,
            "Matière": p.subject || '-',
            "Identifiant": p.username,
            "Mot de passe": p.readablePassword || p.password || '******',
            "Classes assignées": p.assignedSections?.join(', ') || ''
        }));
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "Professeurs");
        XLSX.writeFile(wb, `Professeurs_${user.school}.xlsx`);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Users className="w-6 h-6 text-indigo-600"/> {t('manageStaff')}
                </h2>
                <div className="flex gap-2">
                    <button onClick={handleExportProfs} className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-indigo-100 transition shadow-sm font-medium">
                        <Download className="w-4 h-4"/> {t('exportExcel')}
                    </button>
                    <button onClick={() => setIsAdding(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-indigo-700 shadow-sm font-medium">
                        <UserPlus className="w-4 h-4"/> {t('addProf')}
                    </button>
                </div>
            </div>

            {isAdding && (
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex flex-col md:flex-row gap-2 animate-fade-in items-end md:items-center">
                    <div className="flex-1 w-full space-y-1">
                        <label className="text-xs font-bold text-indigo-800 ml-1">Nom Complet</label>
                        <input 
                            className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Ex: Ahmed Alami"
                            value={newProfName}
                            onChange={e => setNewProfName(e.target.value)}
                        />
                    </div>
                    <div className="flex-1 w-full space-y-1">
                        <label className="text-xs font-bold text-indigo-800 ml-1">Matière</label>
                        <input 
                            className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Ex: Mathématiques, Arabe..."
                            value={newProfSubject}
                            onChange={e => setNewProfSubject(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 mt-2 md:mt-0">
                        <button onClick={handleCreateProf} className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 font-medium h-[38px]">{t('save')}</button>
                        <button onClick={() => setIsAdding(false)} className="text-gray-500 px-4 py-2 text-sm hover:underline h-[38px]">{t('cancel')}</button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 text-gray-600 font-semibold">{t('profName')}</th>
                            <th className="p-4 text-gray-600 font-semibold">{t('subject')}</th>
                            <th className="p-4 text-gray-600 font-semibold">{t('username')}</th>
                            <th className="p-4 text-gray-600 font-semibold">
                                <button onClick={() => setShowPasswords(!showPasswords)} className="flex items-center gap-1 hover:text-indigo-600">
                                    {t('password')} {showPasswords ? <EyeOff className="w-3 h-3"/> : <Eye className="w-3 h-3"/>}
                                </button>
                            </th>
                            <th className="p-4 text-gray-600 font-semibold">{t('assignedClassesToProf')}</th>
                            <th className="p-4 text-end text-gray-600 font-semibold">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {profs.map(p => (
                            <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-medium text-gray-800">{p.name}</td>
                                <td className="p-4">
                                    <span className="flex items-center gap-1 text-gray-600">
                                        <BookOpen className="w-3 h-3 text-indigo-400"/> {p.subject || '-'}
                                    </span>
                                </td>
                                <td className="p-4 font-mono text-gray-500">{p.username}</td>
                                <td className="p-4 font-mono text-gray-500">{showPasswords ? (p.readablePassword || p.password) : '••••••'}</td>
                                <td className="p-4">
                                    {(p.assignedSections && p.assignedSections.length > 0) ? (
                                        <div className="flex flex-wrap gap-1">
                                            {p.assignedSections.map(s => <span key={s} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium border border-blue-100">{s}</span>)}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 italic text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {t('noAssignedClasses')}</span>
                                    )}
                                </td>
                                <td className="p-4 text-end flex justify-end gap-2">
                                    <button 
                                        onClick={() => setSelectedProf(p)} 
                                        className="text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-xs font-bold transition border border-transparent hover:border-indigo-100"
                                    >
                                        {t('assignClasses')}
                                    </button>
                                    <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded transition">
                                        <Trash2 className="w-4 h-4"/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {profs.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-400">Aucun professeur enregistré dans cet établissement.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedProf && structure && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800">{t('assignClasses')}</h3>
                                <p className="text-sm text-gray-500">{selectedProf.name} - <span className="font-medium text-indigo-600">{selectedProf.subject}</span></p>
                            </div>
                            <button onClick={() => setSelectedProf(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto mb-6 p-1">
                            {structure.classes.map(cls => {
                                const isAssigned = selectedProf.assignedSections?.includes(cls);
                                return (
                                    <label key={cls} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isAssigned ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'hover:bg-gray-50 border-gray-200'}`}>
                                        <input 
                                            type="checkbox" 
                                            checked={isAssigned || false}
                                            onChange={() => {
                                                const current = selectedProf.assignedSections || [];
                                                const newSections = isAssigned ? current.filter(c => c !== cls) : [...current, cls];
                                                handleAssign(selectedProf.id, newSections);
                                                // Local update for modal
                                                setSelectedProf({ ...selectedProf, assignedSections: newSections });
                                            }}
                                            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                        />
                                        <span className={`text-sm font-medium ${isAssigned ? 'text-indigo-900' : 'text-gray-700'}`}>{cls}</span>
                                    </label>
                                );
                            })}
                            {structure.classes.length === 0 && <p className="text-gray-400 italic col-span-2 text-center">{t('noClassesFound')}</p>}
                        </div>
                        
                        <div className="flex justify-end">
                            <button onClick={() => setSelectedProf(null)} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-bold text-gray-700 transition">{t('close')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StudentsManagementView: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLanguage();
    const [students, setStudents] = useState<User[]>([]);
    const [structure, setStructure] = useState<SchoolStructure | undefined>(undefined);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [showPasswords, setShowPasswords] = useState(false);

    useEffect(() => {
        if (user.school && user.city) {
            setStructure(StorageService.getSchoolStructure(user.school, user.city));
            loadStudents();
        }
    }, [user]);

    const loadStudents = async () => {
        const all = await ApiService.getUsers();
        setStudents(all.filter(u => u.role === UserRole.STUDENT && u.school === user.school && u.city === user.city));
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedClass) return;
        
        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
            
            let count = 0;
            // Skip the first row (header) to avoid creating a user named "Nom"
            // We use slice(1) to skip index 0
            for (const row of data.slice(1)) {
                // @ts-ignore
                const name = String(row[0] || '').trim();
                if (name && name.length > 2) {
                    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
                    const username = `${cleanName.substring(0, 6)}_${randomSuffix}`;
                    const password = Math.floor(100000 + Math.random() * 900000).toString();
                    
                    await ApiService.createUser({
                        id: `stu-${Date.now()}-${Math.random()}`,
                        name, username, 
                        password, readablePassword: password,
                        role: UserRole.STUDENT,
                        school: user.school, city: user.city,
                        enrolledClasses: [selectedClass],
                        accountType: 'ESTABLISHMENT'
                    });
                    count++;
                }
            }
            alert(`${count} ${t('studentsAdded')} ${selectedClass}`);
            loadStudents();
        };
        reader.readAsBinaryString(file);
        e.target.value = ''; // Reset input
    };

    const handleExportClass = () => {
        if (!selectedClass) return;
        const classStudents = students.filter(s => s.enrolledClasses?.includes(selectedClass));
        const data = classStudents.map(s => ({
            Nom: s.name,
            Identifiant: s.username,
            MotDePasse: s.readablePassword || s.password,
            Classe: selectedClass
        }));
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, selectedClass);
        XLSX.writeFile(wb, `Liste_${selectedClass}_${user.school}.xlsx`);
    };

    const handleDeleteStudent = async (id: string) => {
        if (confirm(t('delete') + '?')) {
            await ApiService.deleteUser(id);
            loadStudents();
        }
    };

    const filteredStudents = selectedClass 
        ? students.filter(s => s.enrolledClasses?.includes(selectedClass))
        : students;

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-indigo-600"/> {t('manageStudents')}
            </h2>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('selectClassToView')}</label>
                    <select 
                        className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={selectedClass}
                        onChange={e => setSelectedClass(e.target.value)}
                    >
                        <option value="">{t('allClasses')}</option>
                        {structure?.classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                {selectedClass && (
                    <div className="flex gap-2 w-full md:w-auto">
                        <label className="bg-green-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-green-700 transition shadow-sm w-full md:w-auto justify-center">
                            <Upload className="w-4 h-4"/> {t('importExcel')}
                            <input type="file" className="hidden" accept=".xlsx" onChange={handleImport} />
                        </label>
                        <button 
                            onClick={handleExportClass}
                            className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-indigo-100 transition w-full md:w-auto justify-center"
                        >
                            <Download className="w-4 h-4"/> {t('exportClassCredentials')}
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 text-gray-600 font-semibold">{t('student')}</th>
                            <th className="p-4 text-gray-600 font-semibold">{t('className')}</th>
                            <th className="p-4 text-gray-600 font-semibold">{t('username')}</th>
                            <th className="p-4 text-gray-600 font-semibold">
                                <button onClick={() => setShowPasswords(!showPasswords)} className="flex items-center gap-1 hover:text-indigo-600">
                                    {t('password')} {showPasswords ? <EyeOff className="w-3 h-3"/> : <Eye className="w-3 h-3"/>}
                                </button>
                            </th>
                            <th className="p-4 text-end text-gray-600 font-semibold">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.map(s => (
                            <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-medium text-gray-800">{s.name}</td>
                                <td className="p-4">
                                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                        {s.enrolledClasses?.join(', ')}
                                    </span>
                                </td>
                                <td className="p-4 font-mono text-gray-500">{s.username}</td>
                                <td className="p-4 font-mono text-gray-500">{showPasswords ? (s.readablePassword || s.password) : '••••••'}</td>
                                <td className="p-4 text-end">
                                    <button onClick={() => handleDeleteStudent(s.id)} className="text-red-400 hover:text-red-600 p-1 rounded transition">
                                        <Trash2 className="w-4 h-4"/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredStudents.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-12 text-center text-gray-400 flex flex-col items-center">
                                    <FileSpreadsheet className="w-12 h-12 mb-2 text-gray-200"/>
                                    {selectedClass ? "Aucun élève dans cette classe. Importez une liste Excel." : "Sélectionnez une classe pour commencer."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const IoTView: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLanguage();
    const [devices, setDevices] = useState<IoTDevice[]>([]);

    useEffect(() => {
        if (user.school && user.city) {
            setDevices(StorageService.getIoTDevices(user.school, user.city));
            const interval = setInterval(() => {
                setDevices(StorageService.getIoTDevices(user.school!, user.city!));
            }, 3000); // 3s polling for real-time effect
            return () => clearInterval(interval);
        }
    }, [user]);

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'ONLINE': return 'text-green-500 bg-green-50 border-green-200';
            case 'OFFLINE': return 'text-gray-400 bg-gray-50 border-gray-200';
            case 'ALERT': return 'text-red-500 bg-red-50 border-red-200 animate-pulse';
            default: return 'text-gray-500';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Wifi className="w-6 h-6 text-indigo-600"/> {t('smartSchool')}
                </h2>
                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                    <Activity className="w-3 h-3"/> {t('online')}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {devices.map(d => (
                    <div key={d.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 relative overflow-hidden group hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${d.type === 'ENV_SENSOR' ? 'bg-blue-100 text-blue-600' : d.type === 'GPS_TRACKER' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'}`}>
                                    {d.type === 'ENV_SENSOR' && <Thermometer className="w-5 h-5"/>}
                                    {d.type === 'GPS_TRACKER' && <MapPin className="w-5 h-5"/>}
                                    {d.type === 'RFID_GATE' && <Smartphone className="w-5 h-5"/>}
                                </div>
                                <span className="font-bold text-gray-800 text-sm">{d.name}</span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded border ${getStatusColor(d.status)}`}>
                                {d.status}
                            </span>
                        </div>

                        <div className="space-y-3 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                            {d.type === 'ENV_SENSOR' && (
                                <>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 text-xs uppercase font-bold">{t('temperature')}</span>
                                        <span className="font-mono font-bold text-gray-800">{d.data.temperature}°C</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 text-xs uppercase font-bold">{t('humidity')}</span>
                                        <span className="font-mono font-bold text-gray-800">{d.data.humidity}%</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 text-xs uppercase font-bold">{t('co2Level')}</span>
                                        <span className={`font-mono font-bold ${d.data.co2! > 1000 ? 'text-red-500' : 'text-green-600'}`}>{d.data.co2} ppm</span>
                                    </div>
                                </>
                            )}
                            {d.type === 'GPS_TRACKER' && (
                                <>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 text-xs uppercase font-bold">{t('speed')}</span>
                                        <span className="font-mono font-bold text-gray-800">{d.data.speed} km/h</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 text-xs uppercase font-bold">Position</span>
                                        <span className="font-mono text-xs text-gray-600">{d.data.lat?.toFixed(4)}, {d.data.lng?.toFixed(4)}</span>
                                    </div>
                                </>
                            )}
                            {d.type === 'RFID_GATE' && (
                                <>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 text-xs uppercase font-bold">{t('lastScan')}</span>
                                        <span className="font-bold text-gray-800">{d.data.lastScan}</span>
                                    </div>
                                    <div className="text-xs text-gray-400 text-end mt-1">
                                        {new Date(d.data.lastScanTime!).toLocaleTimeString()}
                                    </div>
                                </>
                            )}
                        </div>
                        
                        <div className="mt-4 pt-3 border-t border-gray-100 text-[10px] text-gray-400 flex justify-between items-center">
                            <span className="font-medium">{d.provider}</span>
                            <span>MAJ: {new Date(d.lastUpdate).toLocaleTimeString()}</span>
                        </div>
                    </div>
                ))}
                {devices.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                        <Wifi className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
                        <p className="text-gray-500">Aucun appareil connecté.</p>
                    </div>
                )}
            </div>
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
            // Coordinators see all Professors and Students in their school
            const relevantUsers = allUsers.filter(u => 
                (u.role === UserRole.PROFESSOR || u.role === UserRole.STUDENT) && 
                u.school === user.school && 
                u.city === user.city
            );
            setContacts(relevantUsers);
        };
        loadData();
    }, [user]);

    useEffect(() => {
        if (selectedContactId) {
            // Initial load
            setMessages(StorageService.getMessages(user.id, selectedContactId));
            
            // Poll for messages
            const interval = setInterval(() => {
                const msgs = StorageService.getMessages(user.id, selectedContactId);
                setMessages(msgs);
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [selectedContactId, user.id]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedContactId) return;
        
        const msg: Message = { 
            id: `msg-${Date.now()}`, 
            senderId: user.id, 
            senderName: user.name, 
            receiverId: selectedContactId, 
            content: newMessage, 
            timestamp: new Date().toISOString(), 
            read: false 
        };
        
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
                            className={`w-full p-4 text-start hover:bg-indigo-50 transition border-b flex justify-between items-center group ${selectedContactId === contact.id ? 'bg-indigo-100 border-l-4 border-l-indigo-600' : 'border-l-4 border-l-transparent'}`}
                        >
                            <div>
                                <div className="font-bold text-gray-800 text-sm group-hover:text-indigo-700">{contact.name}</div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                    {contact.role === UserRole.PROFESSOR ? <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold text-[10px]">PROF</span> : <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold text-[10px]">ÉTUDIANT</span>}
                                    {contact.subject && <span className="text-gray-400">• {contact.subject}</span>}
                                </div>
                            </div>
                            <ChevronRight className={`w-4 h-4 text-gray-300 ${selectedContactId === contact.id ? 'text-indigo-500' : ''}`}/>
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
                                        <div className={`max-w-[70%] p-3 rounded-2xl text-sm shadow-sm ${m.senderId === user.id ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border text-gray-800 rounded-bl-none'}`}>
                                            {m.content}
                                            <div className={`text-[10px] mt-1 text-end ${m.senderId === user.id ? 'text-indigo-200' : 'text-gray-400'}`}>
                                                {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {messages.length === 0 && <div className="text-center text-gray-400 text-sm mt-10">Démarrez une conversation.</div>}
                            </div>
                            <form onSubmit={handleSend} className="p-4 border-t bg-white flex gap-2">
                                <input 
                                    className="flex-1 border rounded-full px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-gray-50" 
                                    placeholder={t('typeMessage')} 
                                    value={newMessage} 
                                    onChange={(e) => setNewMessage(e.target.value)} 
                                />
                                <button type="submit" className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 shadow-md transition transform active:scale-95">
                                    <Send className="w-5 h-5 rtl:flip" />
                                </button>
                            </form>
                       </>
                   ) : (
                       <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30">
                           <MessageCircle className="w-16 h-16 text-gray-200 mb-4"/>
                           <p>Sélectionnez un contact pour discuter.</p>
                       </div>
                   )}
             </div>
         </div>
    );
};

// --- MAIN COMPONENT ---

const CoordinatorDashboard: React.FC<{ user: User, onLogout: () => void }> = ({ user, onLogout }) => {
    const { t, dir } = useLanguage();
    const location = useLocation();

    const isActive = (path: string) => location.pathname.includes(`/coordinator/${path}`);

    return (
        <div className="min-h-screen bg-gray-50 flex" dir={dir}>
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r hidden md:flex flex-col z-10">
                <div className="p-6 border-b flex items-center gap-3 bg-indigo-700 text-white">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                        <Building className="w-6 h-6 text-white"/>
                    </div>
                    <div>
                        <h1 className="font-bold font-logo text-lg tracking-tight">Tinmel</h1>
                        <p className="text-xs text-indigo-200">{t('coordinatorSpace')}</p>
                    </div>
                </div>
                
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {[
                        { id: 'overview', icon: LayoutDashboard, label: t('schoolStatsView') },
                        { id: 'structure', icon: Building, label: t('manageStructure') },
                        { id: 'staff', icon: Users, label: t('manageStaff') },
                        { id: 'students', icon: GraduationCap, label: t('manageStudents') },
                        { id: 'messages', icon: MessageCircle, label: t('messages') }, 
                        { id: 'iot', icon: Wifi, label: t('smartSchool') },
                    ].map(item => (
                        <Link 
                            key={item.id}
                            to={`/coordinator/${item.id}`}
                            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive(item.id) ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'}`}
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

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0 relative z-0">
                     <HeaderBackground />
                     <div className="z-10 flex items-center gap-4">
                         <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-lg shadow-sm">
                             {user.name.charAt(0).toUpperCase()}
                         </div>
                         <div>
                             <h2 className="font-bold text-gray-800">{user.name}</h2>
                             <p className="text-xs text-gray-500">{user.school}</p>
                         </div>
                     </div>
                </header>

                <div className="flex-1 overflow-auto p-6 relative z-0">
                    <Routes>
                        <Route path="overview" element={<StatsView user={user} />} />
                        <Route path="structure" element={<StructureView user={user} />} />
                        <Route path="staff" element={<StaffManagementView user={user} />} />
                        <Route path="students" element={<StudentsManagementView user={user} />} />
                        <Route path="messages" element={<MessagesView user={user} />} />
                        <Route path="iot" element={<IoTView user={user} />} />
                        <Route path="*" element={<Navigate to="overview" replace />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
};

export default CoordinatorDashboard;