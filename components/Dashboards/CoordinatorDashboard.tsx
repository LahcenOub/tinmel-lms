
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { User, UserRole, Message, IoTDevice } from '../../types';
import { StorageService } from '../../services/storageService';
import { LogOut, Users, School, Settings, Upload, FileDown, CheckSquare, BarChart, UserPlus, Eye, EyeOff, X, MessageCircle, Send, AlertTriangle, Calendar, Activity, Thermometer, Wind, Bus, ScanBarcode, Plus, Wifi, WifiOff, MapPin, Radio } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import * as XLSX from 'xlsx';

interface Props {
  user: User;
  onLogout: () => void;
}

// --- SUB-COMPONENTS (VIEWS) ---

const StructureView: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLanguage();
    const [officialClasses, setOfficialClasses] = useState<string[]>([]);
    const [newClassName, setNewClassName] = useState('');

    useEffect(() => {
        if (user.school && user.city) {
            const struct = StorageService.getSchoolStructure(user.school, user.city);
            if (struct) setOfficialClasses(struct.classes);
        }
    }, [user]);

    const handleAddClass = () => {
        if (!newClassName.trim()) return;
        if (officialClasses.includes(newClassName.trim())) {
            alert(t('classExists'));
            return;
        }
        const updated = [...officialClasses, newClassName.trim()].sort();
        setOfficialClasses(updated);
        StorageService.saveSchoolStructure({
            id: `${user.school}-${user.city}`,
            school: user.school!,
            city: user.city!,
            classes: updated
        });
        setNewClassName('');
    };

    return (
        <div className="bg-white p-6 rounded shadow animate-fade-in">
            <h2 className="text-xl font-bold mb-4">{t('officialClasses')}</h2>
            <div className="flex gap-2 mb-6">
                <input className="border rounded p-2" placeholder="Ex: 1APIC-1" value={newClassName} onChange={e => setNewClassName(e.target.value)} />
                <button onClick={handleAddClass} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">{t('addClass')}</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {officialClasses.map(c => (
                    <div key={c} className="p-2 bg-gray-50 border rounded text-center font-mono">{c}</div>
                ))}
                {officialClasses.length === 0 && <p className="text-gray-400 italic col-span-full">{t('noClassesFound')}</p>}
            </div>
        </div>
    );
};

const StaffView: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLanguage();
    const [schoolProfs, setSchoolProfs] = useState<User[]>([]);
    const [newProfName, setNewProfName] = useState('');
    const [newProfSubject, setNewProfSubject] = useState('');
    const [showProfPasswords, setShowProfPasswords] = useState(false);
    const [assigningProf, setAssigningProf] = useState<User | null>(null);
    const [officialClasses, setOfficialClasses] = useState<string[]>([]);

    useEffect(() => {
        if (user.school && user.city) {
            refreshProfs();
            const struct = StorageService.getSchoolStructure(user.school, user.city);
            if (struct) setOfficialClasses(struct.classes);
        }
    }, [user]);

    const refreshProfs = () => {
        const allUsers = StorageService.getUsers();
        setSchoolProfs(allUsers.filter(u => u.role === UserRole.PROFESSOR && u.school === user.school && u.city === user.city));
    };

    const handleCreateProf = () => {
        if(!newProfName.trim()) return;
        const cleanName = newProfName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
        const username = `prof_${cleanName.substring(0, 8)}_${randomSuffix}`;
        const password = Math.floor(100000 + Math.random() * 900000).toString();

        const newProf: User = {
            id: `usr-${Date.now()}`,
            name: newProfName.trim(),
            username,
            password,
            role: UserRole.PROFESSOR,
            school: user.school,
            city: user.city,
            subject: newProfSubject,
            accountType: 'ESTABLISHMENT',
            assignedSections: []
        };
        StorageService.saveUser(newProf);
        refreshProfs();
        setNewProfName('');
        setNewProfSubject('');
        alert(`${t('profsAdded')}\nID: ${username}\nPW: ${password}`);
    };

    const handleToggleClassAssignment = (prof: User, cls: string) => {
        const current = prof.assignedSections || [];
        const updated = current.includes(cls) 
          ? current.filter(c => c !== cls)
          : [...current, cls];
        
        const updatedProf = { ...prof, assignedSections: updated };
        StorageService.saveUser(updatedProf);
        setAssigningProf(updatedProf); 
        refreshProfs();
    };

    const exportCredentials = () => {
        const data = schoolProfs.map(p => ({
            Name: p.name,
            Subject: p.subject || '',
            Username: p.username,
            Password: p.password
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Profs");
        XLSX.writeFile(wb, `Credentials_${user.school}.xlsx`);
    };

    return (
        <div className="bg-white p-6 rounded shadow animate-fade-in">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{t('manageStaff')}</h2>
                <button onClick={exportCredentials} className="text-blue-600 text-sm flex items-center gap-1 border p-2 rounded hover:bg-blue-50">
                    <FileDown className="w-4 h-4"/> {t('exportCredentials')}
                </button>
             </div>
             
             <div className="flex gap-2 mb-6 bg-gray-50 p-4 rounded">
                 <input className="border rounded p-2 text-sm flex-1" placeholder={t('profName')} value={newProfName} onChange={e => setNewProfName(e.target.value)} />
                 <input className="border rounded p-2 text-sm flex-1" placeholder={t('subject')} value={newProfSubject} onChange={e => setNewProfSubject(e.target.value)} />
                 <button onClick={handleCreateProf} className="bg-blue-600 text-white px-4 py-2 rounded text-sm flex items-center gap-2 hover:bg-blue-700 transition">
                     <UserPlus className="w-4 h-4"/> {t('addProf')}
                 </button>
             </div>

             <div className="overflow-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3">{t('profName')}</th>
                            <th className="p-3">{t('subject')}</th>
                            <th className="p-3">{t('username')}</th>
                            <th className="p-3">
                                <div className="flex items-center gap-2">
                                    {t('password')}
                                    <button onClick={() => setShowProfPasswords(!showProfPasswords)} className="text-gray-400 hover:text-gray-600">
                                        {showProfPasswords ? <EyeOff className="w-3 h-3"/> : <Eye className="w-3 h-3"/>}
                                    </button>
                                </div>
                            </th>
                            <th className="p-3">{t('assignedClassesToProf')}</th>
                            <th className="p-3">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {schoolProfs.map(p => (
                            <tr key={p.id} className="border-b hover:bg-gray-50">
                                <td className="p-3 font-medium">{p.name}</td>
                                <td className="p-3">{p.subject}</td>
                                <td className="p-3 font-mono">{p.username}</td>
                                <td className="p-3 font-mono text-gray-500">
                                    {showProfPasswords ? (p.password || 'N/A') : '••••••'}
                                </td>
                                <td className="p-3">
                                    {p.assignedSections?.length 
                                        ? <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">{p.assignedSections.length} classes</span> 
                                        : <span className="text-gray-400 italic text-xs">{t('noAssignedClasses')}</span>}
                                </td>
                                <td className="p-3">
                                    <button 
                                        onClick={() => setAssigningProf(p)}
                                        className="text-blue-600 hover:underline flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded transition"
                                    >
                                        <CheckSquare className="w-4 h-4"/> {t('assignClasses')}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>

             {/* Assignment Modal */}
            {assigningProf && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold mb-4">{t('selectClassesForProf')} <span className="text-blue-600">{assigningProf.name}</span></h3>
                        <div className="max-h-60 overflow-y-auto grid grid-cols-2 gap-2 mb-4">
                            {officialClasses.map(cls => (
                                <label key={cls} className={`flex items-center gap-2 p-2 border rounded cursor-pointer transition ${assigningProf.assignedSections?.includes(cls) ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'hover:bg-gray-50'}`}>
                                    <input 
                                        type="checkbox" 
                                        checked={assigningProf.assignedSections?.includes(cls) || false}
                                        onChange={() => handleToggleClassAssignment(assigningProf, cls)}
                                        className="rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    {cls}
                                </label>
                            ))}
                        </div>
                        <div className="flex justify-end">
                            <button onClick={() => setAssigningProf(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition">{t('close')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StudentsView: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLanguage();
    const [officialClasses, setOfficialClasses] = useState<string[]>([]);
    const [viewingClass, setViewingClass] = useState<string | null>(null);
    const [classStudents, setClassStudents] = useState<User[]>([]);
    const [showStudentPasswords, setShowStudentPasswords] = useState(false);

    useEffect(() => {
        if (user.school && user.city) {
            const struct = StorageService.getSchoolStructure(user.school, user.city);
            if (struct) setOfficialClasses(struct.classes);
        }
    }, [user]);

    useEffect(() => {
        if (viewingClass) {
            const allUsers = StorageService.getUsers();
            const students = allUsers.filter(u => 
                u.role === UserRole.STUDENT && 
                u.school === user.school && 
                u.city === user.city &&
                u.enrolledClasses?.includes(viewingClass)
            );
            setClassStudents(students);
        }
    }, [viewingClass, user]);

    const handleStudentUpload = (e: React.ChangeEvent<HTMLInputElement>, targetClass: string) => {
        const file = e.target.files?.[0];
        if (!file || !targetClass) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

            let added = 0;
            let merged = 0;
            const existingUsers = StorageService.getUsers();

            data.slice(1).forEach((row: any) => {
                if (row[0]) {
                    const name = String(row[0]).trim();
                    if (!name) return;

                    const existingStudent = existingUsers.find(u => 
                        u.role === UserRole.STUDENT &&
                        u.name.toLowerCase() === name.toLowerCase() &&
                        u.school === user.school &&
                        u.city === user.city
                    );

                    if (existingStudent) {
                        const enrolled = existingStudent.enrolledClasses || [];
                        if (!enrolled.includes(targetClass)) {
                            existingStudent.enrolledClasses = [...enrolled, targetClass];
                            StorageService.saveUser(existingStudent);
                            merged++;
                        }
                    } else {
                        const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
                        const username = `${cleanName.substring(0,8)}${Math.floor(Math.random()*9000)+1000}`;
                        const password = Math.floor(100000 + Math.random() * 900000).toString();

                        const newStudent: User = {
                            id: `stu-${Date.now()}-${Math.random()}`,
                            name,
                            username,
                            password,
                            role: UserRole.STUDENT,
                            class: targetClass,
                            enrolledClasses: [targetClass],
                            school: user.school,
                            city: user.city
                        };
                        StorageService.saveUser(newStudent);
                        added++;
                    }
                }
            });
            alert(`${added} ${t('studentsAdded')}, ${merged} ${t('studentsMerged')}`);
            e.target.value = '';
            if (viewingClass === targetClass) {
                // Refresh list if we are viewing this class
                const allUsers = StorageService.getUsers();
                const students = allUsers.filter(u => u.role === UserRole.STUDENT && u.school === user.school && u.city === user.city && u.enrolledClasses?.includes(targetClass));
                setClassStudents(students);
            }
        };
        reader.readAsBinaryString(file);
    };

    const exportStudentCredentials = () => {
        const users = StorageService.getUsers();
        const students = users.filter(u => u.role === UserRole.STUDENT && u.school === user.school && u.city === user.city);
        
        const data = students.map(s => ({
            Name: s.name,
            Classes: s.enrolledClasses?.join(', '),
            Username: s.username,
            Password: s.password 
        }));
        
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Students");
        XLSX.writeFile(wb, `Etudiants_${user.school}.xlsx`);
    };

    const exportClassCredentials = (className: string) => {
        const users = StorageService.getUsers();
        const students = users.filter(u => u.role === UserRole.STUDENT && u.school === user.school && u.city === user.city && u.enrolledClasses?.includes(className));
        
        const data = students.map(s => ({
            Name: s.name,
            Class: className,
            Username: s.username,
            Password: s.password 
        }));
        
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, className);
        XLSX.writeFile(wb, `${user.school}_${className}_Credentials.xlsx`);
    };

    return (
        <div className="bg-white p-6 rounded shadow animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{t('manageStudents')}</h2>
                <button onClick={exportStudentCredentials} className="text-green-600 text-sm flex items-center gap-1 border p-2 rounded hover:bg-green-50">
                    <FileDown className="w-4 h-4"/> {t('exportCredentials')} (All)
                </button>
            </div>
            
            <p className="text-sm text-gray-500 mb-6">{t('importStudentsForClass')}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {officialClasses.map(cls => (
                    <div key={cls} className={`border p-4 rounded bg-gray-50 flex flex-col justify-between hover:border-blue-300 relative group transition ${viewingClass === cls ? 'ring-2 ring-blue-500 border-transparent' : ''}`}>
                        <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg">{cls}</h3>
                                <button 
                                onClick={() => setViewingClass(viewingClass === cls ? null : cls)}
                                className="text-xs text-blue-600 hover:underline font-medium"
                                >
                                {viewingClass === cls ? t('close') : t('viewStudents')}
                                </button>
                        </div>
                        <div className="flex gap-2">
                            <label className="cursor-pointer bg-white border border-blue-300 text-blue-700 px-3 py-2 rounded flex-1 flex items-center justify-center gap-2 hover:bg-blue-50 text-xs transition">
                                <Upload className="w-3 h-3"/> {t('importExcel')}
                                <input type="file" accept=".xlsx" className="hidden" onChange={(e) => handleStudentUpload(e, cls)} />
                            </label>
                            <button 
                                onClick={() => exportClassCredentials(cls)}
                                className="bg-green-100 text-green-700 border border-green-200 px-3 py-2 rounded hover:bg-green-200 text-xs flex items-center justify-center transition"
                                title={t('exportClassCredentials')}
                            >
                                <FileDown className="w-3 h-3"/>
                            </button>
                        </div>
                    </div>
                ))}
                {officialClasses.length === 0 && <p className="text-gray-400">{t('noClassesFound')}</p>}
            </div>

            {/* Student Directory Table */}
            {viewingClass && (
                <div className="border rounded overflow-hidden animate-fade-in shadow-sm">
                    <div className="bg-blue-50 p-3 border-b flex justify-between items-center">
                        <h3 className="font-bold text-blue-800">{t('studentDirectory')}: {viewingClass}</h3>
                        <button onClick={() => setViewingClass(null)}><X className="w-4 h-4 text-blue-800"/></button>
                    </div>
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-3">{t('profName')}</th>
                                <th className="p-3">{t('username')}</th>
                                <th className="p-3">
                                    <div className="flex items-center gap-2">
                                        {t('password')}
                                        <button onClick={() => setShowStudentPasswords(!showStudentPasswords)} className="text-gray-400 hover:text-gray-600">
                                            {showStudentPasswords ? <EyeOff className="w-3 h-3"/> : <Eye className="w-3 h-3"/>}
                                        </button>
                                    </div>
                                </th>
                                <th className="p-3">Classes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {classStudents.map(s => (
                                <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="p-3 font-medium">{s.name}</td>
                                    <td className="p-3 font-mono text-gray-600">{s.username}</td>
                                    <td className="p-3 font-mono text-gray-500">
                                        {showStudentPasswords ? (s.password || 'N/A') : '••••••'}
                                    </td>
                                    <td className="p-3 text-xs text-gray-400">
                                        {s.enrolledClasses?.join(', ')}
                                    </td>
                                </tr>
                            ))}
                            {classStudents.length === 0 && (
                                <tr><td colSpan={4} className="p-4 text-center text-gray-500">{t('noResults')}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const StatsView: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLanguage();
    const stats = StorageService.getSchoolStats(user.school!, user.city!);

    const exportGradebook = () => {
        const data = StorageService.getSchoolGradebook(user.school!, user.city!);
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Carnet_Notes");
        XLSX.writeFile(wb, `Gradebook_${user.school}.xlsx`);
    };

    return (
        <div className="animate-fade-in">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded shadow text-center">
                    <p className="text-gray-500">{t('totalProfs')}</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.profCount}</p>
                </div>
                <div className="bg-white p-6 rounded shadow text-center">
                    <p className="text-gray-500">{t('totalQuizzes')}</p>
                    <p className="text-3xl font-bold text-green-600">{stats.quizCount}</p>
                </div>
                <div className="bg-white p-6 rounded shadow text-center">
                    <p className="text-gray-500">{t('totalLessons')}</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.lessonCount}</p>
                </div>
                <div className="bg-white p-6 rounded shadow text-center">
                    <p className="text-gray-500">{t('globalEngagement')}</p>
                    <p className="text-3xl font-bold text-orange-600">{stats.totalResults}</p>
                </div>
                
                {/* Gradebook Export */}
                <div className="col-span-full mt-4 flex justify-end">
                    <button onClick={exportGradebook} className="bg-indigo-600 text-white px-6 py-3 rounded shadow hover:bg-indigo-700 flex items-center gap-2 transition transform active:scale-95">
                        <FileDown className="w-5 h-5"/>
                        <div className="text-left">
                            <div className="font-bold text-sm">{t('exportGradebook')}</div>
                            <div className="text-[10px] opacity-80">{t('gradebookDesc')}</div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

const RiskView: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLanguage();
    const [studentsAtRisk, setStudentsAtRisk] = useState<any[]>([]);

    useEffect(() => {
        if (user.school && user.city) {
            setStudentsAtRisk(StorageService.getStudentsAtRisk(user.school, user.city));
        }
    }, [user]);

    return (
        <div className="bg-white p-6 rounded shadow animate-fade-in">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-orange-600">
                <AlertTriangle className="w-6 h-6"/> {t('riskTitle')}
            </h2>
            <p className="text-sm text-gray-500 mb-6">{t('riskDesc')}</p>
            
            <div className="overflow-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3">{t('profName')}</th>
                            <th className="p-3">Classes</th>
                            <th className="p-3 text-center">{t('lastLogin')}</th>
                            <th className="p-3 text-center">{t('avgPerformance')}</th>
                            <th className="p-3 text-center">Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        {studentsAtRisk.map(s => (
                            <tr key={s.id} className="border-b hover:bg-orange-50">
                                <td className="p-3 font-medium">{s.name}</td>
                                <td className="p-3 text-xs">{s.enrolledClasses?.join(', ')}</td>
                                <td className="p-3 text-center font-mono text-xs">
                                    {s.daysAbsent === 999 ? t('neverConnected') : `${s.daysAbsent} ${t('daysAgo')}`}
                                </td>
                                <td className="p-3 text-center font-bold">
                                    {s.avgScore}%
                                </td>
                                <td className="p-3 text-center">
                                    <span className={`px-2 py-1 rounded text-xs font-bold text-white ${s.riskLevel === 'HIGH' ? 'bg-red-600' : 'bg-orange-400'}`}>
                                        {s.riskLevel === 'HIGH' ? t('riskHigh') : t('riskMedium')}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {studentsAtRisk.length === 0 && (
                            <tr><td colSpan={5} className="p-8 text-center text-green-600 font-medium">Tout va bien ! Aucun élève à risque détecté.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const MessagesView: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLanguage();
    const [selectedProfId, setSelectedProfId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [schoolProfs, setSchoolProfs] = useState<User[]>([]);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        if (user.school && user.city) {
            const allUsers = StorageService.getUsers();
            setSchoolProfs(allUsers.filter(u => u.role === UserRole.PROFESSOR && u.school === user.school && u.city === user.city));
        }
    }, [user]);

    useEffect(() => {
        if (selectedProfId) {
            setMessages(StorageService.getMessages(user.id, selectedProfId));
        }
    }, [selectedProfId, user.id]);

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

    return (
        <div className="bg-white rounded-lg shadow h-[600px] flex overflow-hidden border animate-fade-in">
             <div className="w-1/3 border-e bg-gray-50 flex flex-col">
                <div className="p-4 border-b font-bold text-gray-700">{t('staffList')}</div>
                <div className="flex-1 overflow-y-auto">
                     {schoolProfs.length === 0 && <p className="p-4 text-sm text-gray-500 text-center">{t('noProfs')}</p>}
                     {schoolProfs.map(prof => (
                        <button 
                            key={prof.id}
                            onClick={() => setSelectedProfId(prof.id)}
                            className={`w-full p-4 text-start hover:bg-blue-50 transition border-b ${selectedProfId === prof.id ? 'bg-blue-100' : ''}`}
                        >
                            <div className="font-medium">{prof.name}</div>
                            <div className="text-xs text-gray-500">{prof.subject || 'Prof'}</div>
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
    );
};

const SmartSchoolView: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLanguage();
    const [devices, setDevices] = useState<IoTDevice[]>([]);

    useEffect(() => {
        if (user.school && user.city) {
            setDevices(StorageService.getIoTDevices(user.school, user.city));
            
            // Poll for live updates every 5 seconds
            const interval = setInterval(() => {
                setDevices(StorageService.getIoTDevices(user.school!, user.city!));
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const envSensors = devices.filter(d => d.type === 'ENV_SENSOR');
    const trackers = devices.filter(d => d.type === 'GPS_TRACKER');
    const gates = devices.filter(d => d.type === 'RFID_GATE');

    // Aggregate Environmental Data
    const avgTemp = envSensors.length > 0 ? (envSensors.reduce((acc, curr) => acc + (curr.data.temperature || 0), 0) / envSensors.length).toFixed(1) : 0;
    const avgCO2 = envSensors.length > 0 ? Math.round(envSensors.reduce((acc, curr) => acc + (curr.data.co2 || 0), 0) / envSensors.length) : 0;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header / Intro */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-800 rounded-xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2"><Activity className="w-6 h-6"/> {t('iotDashboard')}</h2>
                    <p className="text-blue-200 text-sm opacity-90">{t('iotDesc')}</p>
                </div>
                <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/40 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition">
                    <Plus className="w-4 h-4"/> {t('connectDevice')}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Environment Column */}
                <div className="space-y-4">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2"><Thermometer className="w-5 h-5 text-blue-600"/> {t('envSensors')}</h3>
                    
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100 text-center">
                            <div className="text-gray-500 text-xs uppercase font-bold mb-1">{t('temperature')}</div>
                            <div className="text-2xl font-bold text-gray-800">{avgTemp}°C</div>
                            <div className="text-xs text-green-600 mt-1 flex items-center justify-center gap-1"><CheckSquare className="w-3 h-3"/> {t('normal')}</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100 text-center">
                            <div className="text-gray-500 text-xs uppercase font-bold mb-1">{t('co2Level')}</div>
                            <div className={`text-2xl font-bold ${Number(avgCO2) > 1000 ? 'text-red-600' : 'text-gray-800'}`}>{avgCO2} ppm</div>
                            {Number(avgCO2) > 1000 ? (
                                <div className="text-xs text-red-600 mt-1 font-bold animate-pulse">{t('warning')}</div>
                            ) : (
                                <div className="text-xs text-green-600 mt-1">{t('airQuality')} OK</div>
                            )}
                        </div>
                    </div>

                    {/* Sensor List */}
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden border">
                        {envSensors.map(s => (
                            <div key={s.id} className="p-4 border-b last:border-0 flex justify-between items-center hover:bg-gray-50">
                                <div>
                                    <div className="font-bold text-sm text-gray-800">{s.name}</div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                        <Wifi className="w-3 h-3 text-green-500"/> {s.provider}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-mono font-bold">{s.data.temperature}°C</div>
                                    <div className="text-xs text-gray-400">{s.data.humidity}% Hum</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Transport Column */}
                <div className="space-y-4">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2"><Bus className="w-5 h-5 text-orange-600"/> {t('gpsTrackers')}</h3>
                    
                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden p-4 min-h-[150px] relative bg-gray-50 flex items-center justify-center">
                        {/* Mock Map Placeholder */}
                        <div className="absolute inset-0 opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/Map_of_Marrakech.png')] bg-cover bg-center grayscale"></div>
                        <div className="relative z-10 text-center">
                            <MapPin className="w-8 h-8 text-red-600 mx-auto animate-bounce"/>
                            <p className="text-xs font-bold text-gray-600 mt-1">Live Tracking</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm overflow-hidden border">
                        {trackers.map(t => (
                            <div key={t.id} className="p-4 border-b last:border-0 hover:bg-gray-50">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="font-bold text-sm">{t.name}</div>
                                    <div className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded font-bold">{t.status}</div>
                                </div>
                                <div className="flex justify-between items-center text-xs text-gray-600">
                                    <span className="flex items-center gap-1"><Activity className="w-3 h-3"/> {t.data.speed} km/h</span>
                                    <span className="font-mono text-[10px]">[{t.data.lat?.toFixed(4)}, {t.data.lng?.toFixed(4)}]</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Security/RFID Column */}
                <div className="space-y-4">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2"><ScanBarcode className="w-5 h-5 text-purple-600"/> {t('rfidGate')}</h3>
                    
                    {gates.map(g => (
                        <div key={g.id} className="bg-white rounded-lg shadow-sm p-4 border border-l-4 border-l-purple-500">
                            <div className="flex justify-between items-center mb-3">
                                <div className="font-bold text-gray-800">{g.name}</div>
                                <Radio className="w-4 h-4 text-purple-500 animate-pulse"/>
                            </div>
                            <div className="bg-gray-50 p-3 rounded border border-dashed border-gray-200">
                                <div className="text-xs text-gray-500 uppercase font-bold mb-1">{t('lastScan')}</div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-bold text-xs">
                                        {g.data.lastScan?.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-gray-800">{g.data.lastScan}</div>
                                        <div className="text-[10px] text-gray-400">{new Date(g.data.lastScanTime || '').toLocaleTimeString()}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-3 text-right">
                                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded">by {g.provider}</span>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

const CoordinatorDashboard: React.FC<Props> = ({ user, onLogout }) => {
  const { t, dir } = useLanguage();
  const location = useLocation();

  const isActive = (path: string) => location.pathname.includes(`/coordinator/${path}`);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col" dir={dir}>
        <header className="bg-white shadow px-8 py-4 flex justify-between items-center sticky top-0 z-20">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <School className="w-6 h-6 text-blue-600"/> {t('coordinatorSpace')}
                </h1>
                <p className="text-gray-500 text-sm">{user.school} ({user.city})</p>
            </div>
            <button onClick={onLogout} className="text-red-600 flex items-center gap-2 font-medium hover:bg-red-50 px-3 py-1 rounded transition">
                <LogOut className="w-5 h-5 rtl:flip"/> {t('logout')}
            </button>
        </header>

        <main className="flex-1 p-8 max-w-6xl mx-auto w-full">
            <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-300">
                {[
                    {id: 'structure', icon: Settings, label: t('manageStructure')},
                    {id: 'profs', icon: Users, label: t('manageStaff')},
                    {id: 'messages', icon: MessageCircle, label: t('messages')},
                    {id: 'students', icon: Upload, label: t('manageStudents')},
                    {id: 'stats', icon: BarChart, label: t('stats')},
                    {id: 'risk', icon: AlertTriangle, label: t('riskDetection')},
                    {id: 'smart-school', icon: Activity, label: t('smartSchool')}
                ].map(tab => (
                    <Link 
                        key={tab.id}
                        to={`/coordinator/${tab.id}`}
                        className={`pb-2 px-4 flex items-center gap-2 border-b-2 transition-colors relative ${isActive(tab.id) ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <tab.icon className="w-4 h-4"/> {tab.label}
                    </Link>
                ))}
            </div>

            <Routes>
                <Route path="structure" element={<StructureView user={user} />} />
                <Route path="profs" element={<StaffView user={user} />} />
                <Route path="students" element={<StudentsView user={user} />} />
                <Route path="stats" element={<StatsView user={user} />} />
                <Route path="risk" element={<RiskView user={user} />} />
                <Route path="messages" element={<MessagesView user={user} />} />
                <Route path="smart-school" element={<SmartSchoolView user={user} />} />
                
                <Route path="*" element={<Navigate to="structure" replace />} />
            </Routes>
        </main>
    </div>
  );
};

export default CoordinatorDashboard;
