
import React, { useState, useEffect } from 'react';
import { User, UserRole, Announcement, PartnerRequest } from '../../types';
import { StorageService } from '../../services/storageService';
import { LogOut, UserPlus, Users, Search, ChevronLeft, ChevronRight, Filter, Building, BarChart, Shield, Megaphone, Send, Eye, EyeOff, MapPin, X, GraduationCap, FileText, BookOpen, Trash2, RefreshCcw, FileDown, AlertTriangle, Printer, Check, Inbox, CreditCard, Settings, Lock, Database, Info } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import * as XLSX from 'xlsx';

interface Props {
  onLogout: () => void;
}

const ITEMS_PER_PAGE = 10;

type AdminView = 'STATS' | 'INDIVIDUALS' | 'ESTABLISHMENTS' | 'MODERATORS' | 'COMMUNICATION' | 'GLOBAL_SEARCH' | 'REQUESTS' | 'BILLING' | 'SETTINGS';

const AdminDashboard: React.FC<Props> = ({ onLogout }) => {
  const { t, dir } = useLanguage();
  const [activeView, setActiveView] = useState<AdminView>('STATS');
  
  // Creation States
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSchool, setNewSchool] = useState('');
  const [newCity, setNewCity] = useState('');
  
  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Communication
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');

  // Modals / Details
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<{name: string, city: string} | null>(null);
  const [schoolDetailTab, setSchoolDetailTab] = useState<'STAFF' | 'STUDENTS'>('STAFF');

  // Requests
  const [partnerRequests, setPartnerRequests] = useState<PartnerRequest[]>([]);

  // Billing
  const [billingSchool, setBillingSchool] = useState<{name: string, city: string} | null>(null);
  const [invoiceAmount, setInvoiceAmount] = useState('');
  
  // Settings
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminNewPass, setAdminNewPass] = useState('');
  const [adminConfirmPass, setAdminConfirmPass] = useState('');
  
  // Password Visibility
  const [showPasswords, setShowPasswords] = useState(false);

  // Data Loading
  const [users, setUsers] = useState<User[]>(StorageService.getUsers());
  
  useEffect(() => {
      if (activeView === 'REQUESTS') {
          setPartnerRequests(StorageService.getPartnerRequests());
      }
      if (activeView === 'SETTINGS') {
          // Find current admin user (Assuming the first admin or currently logged in)
          // In this prototype, we'll search for the one with role ADMIN
          const adminUser = users.find(u => u.role === UserRole.ADMIN);
          if (adminUser) {
              setAdminUsername(adminUser.username);
          }
      }
  }, [activeView, users]);

  const refreshUsers = () => {
      setUsers(StorageService.getUsers());
  };

  const cleanInput = (str: string) => str.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  const handleCreateUser = (role: UserRole) => {
      if(!newName.trim()) return;
      
      const prefix = role === UserRole.MODERATOR ? 'mod' : (role === UserRole.COORDINATOR ? 'coord' : 'prof');
      const cleanName = cleanInput(newName);
      const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
      const username = `${prefix}_${cleanName.substring(0, 10)}_${randomSuffix}`;
      const password = Math.floor(100000 + Math.random() * 900000).toString();
      
      const newUser: User = {
          id: `usr-${Date.now()}`,
          name: newName.trim(),
          username,
          password,
          role,
          school: newSchool.trim() || undefined,
          city: newCity.trim() || undefined,
          accountType: 'INDIVIDUAL' // Default, adjusted if Coordinator
      };
      
      if (role === UserRole.COORDINATOR) newUser.accountType = 'ESTABLISHMENT';

      StorageService.saveUser(newUser);
      setIsCreating(false);
      setNewName(''); setNewSchool(''); setNewCity('');
      alert(`${t(role === UserRole.MODERATOR ? 'moderator' : (role === UserRole.COORDINATOR ? 'coordinator' : 'professor'))} ${t('completed')}!\nID: ${username}\nPass: ${password}`);
      refreshUsers();
  };

  const handleDeleteUser = (id: string) => {
      if (confirm(t('delete') + '?')) {
          StorageService.deleteUser(id);
          refreshUsers();
          if (selectedUser?.id === id) setSelectedUser(null);
      }
  };

  const handleResetPassword = (id: string) => {
      const newPass = Math.floor(100000 + Math.random() * 900000).toString();
      StorageService.resetUserPassword(id, newPass);
      refreshUsers();
      alert(`${t('passResetSuccess')} ${newPass}`);
  };
  
  const handleUpdateAdminProfile = () => {
      if (!adminUsername.trim()) return;
      if (adminNewPass && adminNewPass !== adminConfirmPass) {
          alert(t('passwordMismatch'));
          return;
      }
      
      const adminUser = users.find(u => u.role === UserRole.ADMIN);
      if (adminUser) {
          const updated: User = { 
              ...adminUser, 
              username: adminUsername,
              ...(adminNewPass ? { password: adminNewPass } : {})
          };
          StorageService.saveUser(updated);
          refreshUsers();
          alert(t('adminUpdateSuccess'));
          setAdminNewPass('');
          setAdminConfirmPass('');
      }
  };

  const handleBackupDB = () => {
      const json = StorageService.exportFullDB();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tinmel_backup_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      alert(t('backupSuccess'));
  };

  const handleDeleteSchool = (schoolName: string, schoolCity: string) => {
      const confirmMsg = t('deleteSchoolConfirm');
      if (window.confirm(confirmMsg)) {
          // Use the deep delete service
          StorageService.deleteSchoolFull(schoolName, schoolCity);
          // FORCE RELOAD to ensure UI state is perfectly clean
          window.location.reload(); 
      }
  };

  const handleBroadcast = () => {
      if(!announcementTitle || !announcementContent) return;
      const ann: Announcement = { id: `ann-${Date.now()}`, title: announcementTitle, content: announcementContent, date: new Date().toISOString(), author: 'Admin' };
      StorageService.saveAnnouncement(ann);
      setAnnouncementTitle(''); setAnnouncementContent('');
      alert(t('announceSent'));
  };

  const handleRequestAction = (id: string) => {
      StorageService.updatePartnerRequestStatus(id, 'CONTACTED');
      setPartnerRequests(StorageService.getPartnerRequests());
  };

  const exportIndividuals = () => {
      const individuals = users.filter(u => u.role === UserRole.PROFESSOR && u.accountType !== 'ESTABLISHMENT');
      const data = individuals.map(u => ({
          Name: u.name,
          City: u.city || '',
          Username: u.username,
          Password: u.password
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Free_Clients");
      XLSX.writeFile(wb, "Clients_Libres_Identifiants.xlsx");
  };

  const exportSchoolFullData = (schoolName: string, schoolCity: string) => {
      // Refresh data first just in case
      const currentUsers = StorageService.getUsers();
      const schoolUsers = currentUsers.filter(u => u.school === schoolName && u.city === schoolCity);
      
      // Sheet 1: Staff (Profs & Coordinators)
      const staff = schoolUsers.filter(u => u.role === UserRole.PROFESSOR || u.role === UserRole.COORDINATOR);
      const staffData = staff.map(u => ({
          Role: u.role === UserRole.COORDINATOR ? 'Coordinator' : 'Professor',
          Name: u.name,
          Subject: u.subject || '-',
          Username: u.username,
          Password: u.password
      }));

      // Sheet 2: Students
      const students = schoolUsers.filter(u => u.role === UserRole.STUDENT);
      const studentData = students.map(u => ({
          Name: u.name,
          Classes: u.enrolledClasses?.join(', ') || '-',
          Username: u.username,
          Password: u.password
      }));

      const wb = XLSX.utils.book_new();
      
      const staffWS = XLSX.utils.json_to_sheet(staffData);
      XLSX.utils.book_append_sheet(wb, staffWS, "Personnel");
      
      const studentWS = XLSX.utils.json_to_sheet(studentData);
      XLSX.utils.book_append_sheet(wb, studentWS, "Etudiants");

      const safeName = schoolName.replace(/[^a-z0-9]/gi, '_');
      XLSX.writeFile(wb, `${safeName}_Full_Data.xlsx`);
  };
  
  const printInvoice = () => {
      window.print();
  };

  // --- VIEWS ---

  const renderStats = () => {
      const profs = users.filter(u => u.role === UserRole.PROFESSOR);
      const students = users.filter(u => u.role === UserRole.STUDENT);
      const quizzes = StorageService.getQuizzes();
      const lessons = StorageService.getLessons();
      const results = StorageService.getResults();

      // Aggregate Stats by School
      const schoolStats = new Map<string, { name: string, city: string, profs: number, students: number, quizzes: number, lessons: number }>();
      const profSchoolMap = new Map<string, string>(); // profId -> schoolKey

      users.forEach(u => {
          if (u.school && u.city) {
              const key = `${u.school}|${u.city}`;
              if (!schoolStats.has(key)) {
                  schoolStats.set(key, { name: u.school, city: u.city, profs: 0, students: 0, quizzes: 0, lessons: 0 });
              }
              const stat = schoolStats.get(key)!;
              if (u.role === UserRole.PROFESSOR || u.role === UserRole.COORDINATOR) {
                  stat.profs++;
                  profSchoolMap.set(u.id, key);
              } else if (u.role === UserRole.STUDENT) {
                  stat.students++;
              }
          }
      });

      quizzes.forEach(q => {
          const key = profSchoolMap.get(q.professorId);
          if (key && schoolStats.has(key)) {
              schoolStats.get(key)!.quizzes++;
          }
      });

      lessons.forEach(l => {
          const key = profSchoolMap.get(l.professorId);
          if (key && schoolStats.has(key)) {
              schoolStats.get(key)!.lessons++;
          }
      });

      const schoolStatsArray = Array.from(schoolStats.values());

      return (
          <div className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                      <div className="bg-blue-100 p-4 rounded-full text-blue-600"><Users className="w-8 h-8"/></div>
                      <div><p className="text-gray-500 text-sm font-medium">{t('totalProfs')}</p><h3 className="text-3xl font-bold text-gray-800">{profs.length}</h3></div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                      <div className="bg-green-100 p-4 rounded-full text-green-600"><GraduationCap className="w-8 h-8"/></div>
                      <div><p className="text-gray-500 text-sm font-medium">{t('totalStudents')}</p><h3 className="text-3xl font-bold text-gray-800">{students.length}</h3></div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                      <div className="bg-purple-100 p-4 rounded-full text-purple-600"><FileText className="w-8 h-8"/></div>
                      <div><p className="text-gray-500 text-sm font-medium">{t('totalQuizzes')}</p><h3 className="text-3xl font-bold text-gray-800">{quizzes.length}</h3></div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                      <div className="bg-orange-100 p-4 rounded-full text-orange-600"><BookOpen className="w-8 h-8"/></div>
                      <div><p className="text-gray-500 text-sm font-medium">{t('totalLessons')}</p><h3 className="text-3xl font-bold text-gray-800">{lessons.length}</h3></div>
                  </div>
                   <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 md:col-span-2 lg:col-span-4">
                      <div className="bg-indigo-100 p-4 rounded-full text-indigo-600"><BarChart className="w-8 h-8"/></div>
                      <div><p className="text-gray-500 text-sm font-medium">{t('globalEngagement')}</p><h3 className="text-3xl font-bold text-gray-800">{results.length} participations</h3></div>
                  </div>
              </div>

              {/* School Breakdown Table */}
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <div className="p-4 border-b bg-gray-50 font-bold text-lg text-gray-700">
                      {t('schoolBreakdown')}
                  </div>
                  <table className="w-full text-sm text-start">
                      <thead className="bg-gray-50 border-b">
                          <tr>
                              <th className="p-4 text-start">{t('school')}</th>
                              <th className="p-4 text-start">{t('city')}</th>
                              <th className="p-4 text-center">{t('totalProfs')}</th>
                              <th className="p-4 text-center">{t('totalStudents')}</th>
                              <th className="p-4 text-center">{t('totalQuizzes')}</th>
                              <th className="p-4 text-center">{t('totalLessons')}</th>
                          </tr>
                      </thead>
                      <tbody>
                          {schoolStatsArray.map((s, idx) => (
                              <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                                  <td className="p-4 font-bold text-gray-800">{s.name}</td>
                                  <td className="p-4 text-gray-600">{s.city}</td>
                                  <td className="p-4 text-center">
                                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">{s.profs}</span>
                                  </td>
                                  <td className="p-4 text-center">
                                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">{s.students}</span>
                                  </td>
                                  <td className="p-4 text-center font-mono">{s.quizzes}</td>
                                  <td className="p-4 text-center font-mono">{s.lessons}</td>
                              </tr>
                          ))}
                          {schoolStatsArray.length === 0 && (
                              <tr><td colSpan={6} className="p-8 text-center text-gray-500">{t('noResults')}</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      );
  };

  const renderRequests = () => {
      const pending = partnerRequests.filter(r => r.status === 'PENDING');
      const contacted = partnerRequests.filter(r => r.status === 'CONTACTED');

      return (
          <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-700">{t('pendingRequests')} ({pending.length})</h2>
              <div className="bg-white rounded-lg shadow border overflow-hidden">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 border-b">
                          <tr>
                              <th className="p-3">{t('orgName')}</th>
                              <th className="p-3">{t('contactName')}</th>
                              <th className="p-3">{t('email')}</th>
                              <th className="p-3">{t('phone')}</th>
                              <th className="p-3">{t('date')}</th>
                              <th className="p-3 text-end">{t('actions')}</th>
                          </tr>
                      </thead>
                      <tbody>
                          {pending.map(req => (
                              <tr key={req.id} className="border-b">
                                  <td className="p-3 font-bold">{req.orgName}</td>
                                  <td className="p-3">{req.contactName}</td>
                                  <td className="p-3 text-blue-600">{req.email}</td>
                                  <td className="p-3">{req.phone}</td>
                                  <td className="p-3 text-xs text-gray-500">{new Date(req.date).toLocaleDateString()}</td>
                                  <td className="p-3 text-end">
                                      <button 
                                        onClick={() => handleRequestAction(req.id)}
                                        className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs hover:bg-green-200 flex items-center gap-1 ml-auto"
                                      >
                                          <Check className="w-3 h-3"/> {t('markContacted')}
                                      </button>
                                  </td>
                              </tr>
                          ))}
                          {pending.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-gray-400">{t('noResults')}</td></tr>}
                      </tbody>
                  </table>
              </div>

              {contacted.length > 0 && (
                  <>
                    <h2 className="text-xl font-bold text-gray-700 mt-8 opacity-60">Historique</h2>
                    <div className="bg-gray-50 rounded-lg border overflow-hidden opacity-60">
                         <table className="w-full text-sm text-left">
                              <tbody>
                                  {contacted.map(req => (
                                      <tr key={req.id} className="border-b">
                                          <td className="p-3">{req.orgName}</td>
                                          <td className="p-3">{req.contactName}</td>
                                          <td className="p-3">{req.email}</td>
                                          <td className="p-3 text-green-700 font-bold text-xs text-end">{t('markContacted')}</td>
                                      </tr>
                                  ))}
                              </tbody>
                         </table>
                    </div>
                  </>
              )}
          </div>
      );
  };

  const renderBilling = () => {
      // List Schools for billing
      const allStaff = users.filter(u => u.school && u.city && u.accountType === 'ESTABLISHMENT');
      const schoolMap = new Map<string, {name: string, city: string, count: number}>();
      allStaff.forEach(u => {
          const key = `${u.school}|${u.city}`;
          if (!schoolMap.has(key)) {
              schoolMap.set(key, { name: u.school!, city: u.city!, count: 0 });
          }
          schoolMap.get(key)!.count++;
      });
      const schools = Array.from(schoolMap.values());

      return (
          <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-700">{t('billing')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {schools.map((s, idx) => (
                       <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                           <div className="flex items-start justify-between mb-4">
                               <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600">
                                   <CreditCard className="w-6 h-6"/>
                               </div>
                               <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded">{s.count} users</span>
                           </div>
                           <h3 className="font-bold text-gray-800 text-lg mb-1">{s.name}</h3>
                           <p className="text-gray-500 text-sm mb-4">{s.city}</p>
                           <button 
                                onClick={() => setBillingSchool(s)}
                                className="w-full py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm font-medium"
                           >
                               {t('generateInvoice')}
                           </button>
                       </div>
                   ))}
              </div>
          </div>
      );
  };

  const renderGlobalSearch = () => {
      const filtered = users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.school && u.school.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
      const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

      return (
          <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-700">
                      <Search className="w-6 h-6"/> {t('globalSearch')}
                  </h2>
                  <div className="relative">
                      <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400 rtl:right-3 rtl:left-auto"/>
                      <input 
                        className="w-full pl-10 pr-4 py-3 border rounded-lg text-lg focus:ring-2 focus:ring-indigo-500 rtl:pr-10 rtl:pl-4"
                        placeholder={t('globalSearchPlaceholder')}
                        value={searchTerm}
                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                      />
                  </div>
              </div>

              {searchTerm && (
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden border">
                      <table className="w-full text-sm text-start">
                          <thead className="bg-gray-50 border-b">
                              <tr>
                                  <th className="p-3 text-start">{t('profName')}</th>
                                  <th className="p-3 text-start">Role</th>
                                  <th className="p-3 text-start">{t('school')}</th>
                                  <th className="p-3 text-start">{t('username')}</th>
                                  <th className="p-3 text-start">{t('password')}</th>
                                  <th className="p-3 text-end">{t('actions')}</th>
                              </tr>
                          </thead>
                          <tbody>
                              {paginated.map(u => (
                                  <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                                      <td className="p-3 font-medium">{u.name}</td>
                                      <td className="p-3">
                                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                              u.role === UserRole.ADMIN ? 'bg-red-100 text-red-700' :
                                              u.role === UserRole.STUDENT ? 'bg-green-100 text-green-700' :
                                              u.role === UserRole.COORDINATOR ? 'bg-purple-100 text-purple-700' :
                                              'bg-blue-100 text-blue-700'
                                          }`}>{t(u.role.toLowerCase())}</span>
                                      </td>
                                      <td className="p-3 text-gray-600">{u.school || '-'}</td>
                                      <td className="p-3 font-mono text-xs">{u.username}</td>
                                      <td className="p-3 font-mono text-xs text-gray-500">{u.password || '******'}</td>
                                      <td className="p-3 text-end flex justify-end gap-2">
                                          <button onClick={() => handleResetPassword(u.id)} className="text-orange-500 hover:bg-orange-50 p-2 rounded" title={t('resetPass')}>
                                              <RefreshCcw className="w-4 h-4"/>
                                          </button>
                                          <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:bg-red-50 p-2 rounded" title={t('delete')}>
                                              <Trash2 className="w-4 h-4"/>
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                              {paginated.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-500">{t('noResults')}</td></tr>}
                          </tbody>
                      </table>
                      {totalPages > 1 && (
                          <div className="p-4 flex justify-center gap-2 border-t">
                              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 border rounded bg-white disabled:opacity-50"><ChevronLeft/></button>
                              <span className="py-2">{currentPage} / {totalPages}</span>
                              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 border rounded bg-white disabled:opacity-50"><ChevronRight/></button>
                          </div>
                      )}
                  </div>
              )}
          </div>
      );
  };

  const renderIndividuals = () => {
      const individuals = users.filter(u => u.role === UserRole.PROFESSOR && u.accountType !== 'ESTABLISHMENT');
      const cities = Array.from(new Set(individuals.map(u => u.city).filter(Boolean))) as string[];
      
      const filtered = individuals.filter(u => {
          const matchSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.username.toLowerCase().includes(searchTerm.toLowerCase());
          const matchCity = cityFilter ? u.city === cityFilter : true;
          return matchSearch && matchCity;
      });

      const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
      const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

      return (
          <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm items-center">
                  <div className="flex-1 relative w-full">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 rtl:right-3 rtl:left-auto"/>
                      <input className="w-full pl-9 pr-3 py-2 border rounded text-sm rtl:pr-9 rtl:pl-3" placeholder={t('search')} value={searchTerm} onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1)}} />
                  </div>
                  <select className="border rounded p-2 text-sm md:w-48 w-full" value={cityFilter} onChange={e => {setCityFilter(e.target.value); setCurrentPage(1)}}>
                      <option value="">{t('allCities')}</option>
                      {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="flex gap-2 w-full md:w-auto">
                      <button onClick={exportIndividuals} className="bg-gray-100 text-gray-700 border px-4 py-2 rounded text-sm flex items-center gap-2 hover:bg-gray-200">
                          <FileDown className="w-4 h-4"/> {t('exportExcel')}
                      </button>
                      <button onClick={() => setIsCreating(true)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm flex items-center gap-2 hover:bg-blue-700">
                          <UserPlus className="w-4 h-4"/> {t('addProf')}
                      </button>
                  </div>
              </div>

              {isCreating && (
                   <div className="bg-blue-50 p-4 rounded-lg flex flex-col md:flex-row gap-2 border border-blue-100 animate-fade-in">
                        <input className="flex-1 border rounded p-2 text-sm" placeholder={t('profName')} value={newName} onChange={e => setNewName(e.target.value)} />
                        <input className="flex-1 border rounded p-2 text-sm" placeholder={t('city')} value={newCity} onChange={e => setNewCity(e.target.value)} />
                        <div className="flex gap-2">
                             <button onClick={() => handleCreateUser(UserRole.PROFESSOR)} className="bg-green-600 text-white px-4 py-2 rounded text-sm">{t('save')}</button>
                             <button onClick={() => setIsCreating(false)} className="text-gray-500 px-4 py-2 text-sm hover:underline">{t('cancel')}</button>
                        </div>
                   </div>
              )}

              <div className="bg-white rounded-lg shadow-sm overflow-hidden border">
                  <table className="w-full text-sm text-start">
                      <thead className="bg-gray-50 border-b">
                          <tr>
                              <th className="p-3 text-start">{t('profName')}</th>
                              <th className="p-3 text-start">{t('city')}</th>
                              <th className="p-3 text-start">{t('username')}</th>
                              <th className="p-3 text-end">{t('actions')}</th>
                          </tr>
                      </thead>
                      <tbody>
                          {paginated.map(u => (
                              <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                                  <td className="p-3 font-medium text-blue-700 cursor-pointer hover:underline" onClick={() => setSelectedUser(u)}>{u.name}</td>
                                  <td className="p-3 text-gray-500">{u.city || '-'}</td>
                                  <td className="p-3 font-mono text-xs">{u.username}</td>
                                  <td className="p-3 text-end flex justify-end gap-2">
                                      <button onClick={() => setSelectedUser(u)} className="text-blue-600 text-xs border border-blue-200 px-2 py-1 rounded hover:bg-blue-50">{t('profDetails')}</button>
                                      <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 p-1 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
                                  </td>
                              </tr>
                          ))}
                          {paginated.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-500">{t('noProfs')}</td></tr>}
                      </tbody>
                  </table>
                  {totalPages > 1 && (
                      <div className="p-4 flex justify-between items-center border-t bg-gray-50">
                          <span className="text-xs text-gray-500">{t('page')} {currentPage} / {totalPages}</span>
                          <div className="flex gap-2">
                              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-1 rounded border bg-white disabled:opacity-50"><ChevronLeft className="w-4 h-4 rtl:flip"/></button>
                              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-1 rounded border bg-white disabled:opacity-50"><ChevronRight className="w-4 h-4 rtl:flip"/></button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      );
  };

  const renderEstablishments = () => {
      // Filter for actual establishments (users marked as establishment or coordinators)
      // We group by school+city.
      const allStaff = users.filter(u => u.school && u.city && (u.role === UserRole.COORDINATOR || u.accountType === 'ESTABLISHMENT'));
      
      const schoolMap = new Map<string, {name: string, city: string, count: number}>();
      allStaff.forEach(u => {
          const key = `${u.school}|${u.city}`;
          if (!schoolMap.has(key)) {
              schoolMap.set(key, { name: u.school!, city: u.city!, count: 0 });
          }
          schoolMap.get(key)!.count++;
      });
      const schools = Array.from(schoolMap.values());

      const filtered = schools.filter(s => 
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.city.toLowerCase().includes(searchTerm.toLowerCase())
      );

      const paginated = filtered.slice((currentPage - 1) * 9, currentPage * 9); // Grid 3x3
      const totalPages = Math.ceil(filtered.length / 9);

      return (
          <div className="space-y-6">
               <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 rtl:right-3 rtl:left-auto"/>
                      <input className="w-full pl-9 pr-3 py-2 border rounded text-sm rtl:pr-9 rtl:pl-3" placeholder={t('searchSchool')} value={searchTerm} onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1)}} />
                  </div>
                  <button onClick={() => setIsCreating(true)} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm flex items-center gap-2 hover:bg-indigo-700">
                      <Building className="w-4 h-4"/> {t('addCoordinator')}
                  </button>
               </div>

               {isCreating && (
                   <div className="bg-indigo-50 p-4 rounded-lg flex flex-col md:flex-row gap-2 border border-indigo-100 animate-fade-in">
                        <input className="flex-1 border rounded p-2 text-sm" placeholder={t('contactName')} value={newName} onChange={e => setNewName(e.target.value)} />
                        <input className="flex-1 border rounded p-2 text-sm" placeholder={t('profSchool')} value={newSchool} onChange={e => setNewSchool(e.target.value)} />
                        <input className="flex-1 border rounded p-2 text-sm" placeholder={t('city')} value={newCity} onChange={e => setNewCity(e.target.value)} />
                        <div className="flex gap-2">
                             <button onClick={() => handleCreateUser(UserRole.COORDINATOR)} className="bg-green-600 text-white px-4 py-2 rounded text-sm">{t('save')}</button>
                             <button onClick={() => setIsCreating(false)} className="text-gray-500 px-4 py-2 text-sm hover:underline">{t('cancel')}</button>
                        </div>
                   </div>
              )}

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {paginated.map((s, idx) => (
                       <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition relative group">
                           <div className="cursor-pointer" onClick={() => { setSelectedSchool(s); setSchoolDetailTab('STAFF'); }}>
                               <div className="flex items-start justify-between mb-4">
                                   <div className="bg-blue-50 p-3 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                       <Building className="w-6 h-6"/>
                                   </div>
                                   <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded">{s.count} staff</span>
                               </div>
                               <h3 className="font-bold text-gray-800 text-lg mb-1">{s.name}</h3>
                               <div className="flex items-center gap-1 text-gray-500 text-sm">
                                   <MapPin className="w-3 h-3"/> {s.city}
                               </div>
                           </div>
                           <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteSchool(s.name, s.city); }}
                                className="absolute top-4 right-4 text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition z-10"
                                title={t('deleteSchool')}
                           >
                               <Trash2 className="w-5 h-5"/>
                           </button>
                       </div>
                   ))}
                   {paginated.length === 0 && <p className="col-span-full text-center py-10 text-gray-500">{t('noSchools')}</p>}
               </div>
               
               {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                      <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 border rounded bg-white disabled:opacity-50"><ChevronLeft/></button>
                      <span className="py-2 px-4 text-sm text-gray-600">{currentPage} / {totalPages}</span>
                      <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 border rounded bg-white disabled:opacity-50"><ChevronRight/></button>
                  </div>
               )}
          </div>
      );
  };

  const renderModerators = () => {
      const moderators = users.filter(u => u.role === UserRole.MODERATOR);
      return (
          <div className="space-y-4">
               <div className="flex justify-end">
                   <button onClick={() => setIsCreating(true)} className="bg-purple-600 text-white px-4 py-2 rounded text-sm flex items-center gap-2 hover:bg-purple-700">
                      <Shield className="w-4 h-4"/> {t('addModerator')}
                   </button>
               </div>
               {isCreating && (
                   <div className="bg-purple-50 p-4 rounded-lg flex gap-2 border border-purple-100 animate-fade-in">
                        <input className="flex-1 border rounded p-2 text-sm" placeholder={t('profName')} value={newName} onChange={e => setNewName(e.target.value)} />
                        <button onClick={() => handleCreateUser(UserRole.MODERATOR)} className="bg-green-600 text-white px-4 py-2 rounded text-sm">{t('save')}</button>
                        <button onClick={() => setIsCreating(false)} className="text-gray-500 px-4 py-2 text-sm">{t('cancel')}</button>
                   </div>
               )}
               <div className="bg-white rounded-lg shadow-sm overflow-hidden border">
                   <table className="w-full text-sm text-start">
                      <thead className="bg-gray-50 border-b">
                          <tr>
                              <th className="p-3 text-start">{t('profName')}</th>
                              <th className="p-3 text-start">{t('username')}</th>
                              <th className="p-3 text-start">{t('password')}</th>
                              <th className="p-3 text-end">{t('actions')}</th>
                          </tr>
                      </thead>
                      <tbody>
                          {moderators.map(u => (
                              <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                                  <td className="p-3 font-medium">{u.name} (Assistant(e))</td>
                                  <td className="p-3 font-mono text-xs">{u.username}</td>
                                  <td className="p-3 font-mono text-xs">{u.password || '******'}</td>
                                  <td className="p-3 text-end">
                                      <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 p-2 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                   </table>
               </div>
          </div>
      );
  };

  const renderCommunication = () => (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-blue-700">
              <Megaphone className="w-6 h-6"/> {t('broadcastNews')}
          </h2>
          <div className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('announceTitle')}</label>
                  <input className="w-full border rounded p-2" value={announcementTitle} onChange={e => setAnnouncementTitle(e.target.value)} />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('announceContent')}</label>
                  <textarea className="w-full border rounded p-2 h-32" value={announcementContent} onChange={e => setAnnouncementContent(e.target.value)} />
              </div>
              <button onClick={handleBroadcast} className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 flex items-center justify-center gap-2 font-medium">
                  <Send className="w-4 h-4 rtl:flip"/> {t('publish')}
              </button>
          </div>
      </div>
  );
  
  const renderSettings = () => (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border space-y-8">
          
          {/* Profile Section */}
          <div className="space-y-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-700">
                  <Settings className="w-6 h-6"/> {t('adminProfile')}
              </h2>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('username')}</label>
                  <input 
                      className="w-full border rounded p-3 bg-gray-50" 
                      value={adminUsername} 
                      onChange={e => setAdminUsername(e.target.value)} 
                  />
              </div>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800 mb-4">
                  <Lock className="w-4 h-4 inline mr-2"/>
                  {t('changePassword')}
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('newPassword')}</label>
                  <input 
                      type="password"
                      className="w-full border rounded p-3" 
                      value={adminNewPass} 
                      onChange={e => setAdminNewPass(e.target.value)}
                      placeholder="••••••"
                  />
              </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('confirmPassword')}</label>
                  <input 
                      type="password"
                      className="w-full border rounded p-3" 
                      value={adminConfirmPass} 
                      onChange={e => setAdminConfirmPass(e.target.value)}
                      placeholder="••••••"
                  />
              </div>
              <button 
                  onClick={handleUpdateAdminProfile} 
                  className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 flex items-center justify-center gap-2 font-medium"
              >
                  <Check className="w-4 h-4 rtl:flip"/> {t('save')}
              </button>
          </div>

          {/* Backup Section */}
          <div className="pt-8 border-t space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-700">
                  <Database className="w-6 h-6"/> {t('backupDB')}
              </h2>
              <p className="text-sm text-gray-600">{t('backupDesc')}</p>
              
              {/* SYSTEM INFO & SYNC GUIDE */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-sm space-y-2">
                  <h3 className="font-bold text-blue-800 flex items-center gap-2">
                      <Info className="w-4 h-4"/> {t('dataSyncInfo')}
                  </h3>
                  <p className="text-blue-900">{t('dataSyncDesc')}</p>
                  <ul className="list-disc list-inside text-blue-800 space-y-1 ml-2">
                      <li>{t('dataSyncStep1')}</li>
                      <li>{t('dataSyncStep2')}</li>
                      <li>{t('dataSyncStep3')}</li>
                  </ul>
                  <p className="text-blue-800 font-bold mt-2 pt-2 border-t border-blue-200">
                      {t('browserWarning')}
                  </p>
              </div>

              <button 
                  onClick={handleBackupDB} 
                  className="w-full bg-indigo-50 text-indigo-700 border border-indigo-200 py-3 rounded hover:bg-indigo-100 flex items-center justify-center gap-2 font-medium transition"
              >
                  <FileDown className="w-5 h-5"/> {t('backupDB')}
              </button>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-900" dir={dir}>
       <div className="max-w-7xl mx-auto">
           {/* Header */}
           <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
               <div className="flex items-center gap-4">
                   <span className="text-4xl font-black text-blue-800 font-logo tracking-tighter">{t('appName')}</span>
                   <div className="h-8 w-px bg-gray-300 hidden md:block"></div>
                   <h1 className="text-gray-500 font-medium">{t('adminPanel')}</h1>
               </div>
               <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setActiveView('SETTINGS')} 
                        className={`p-2 rounded-full transition-colors ${activeView === 'SETTINGS' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}
                        title={t('settings')}
                    >
                        <Settings className="w-5 h-5"/>
                    </button>
                   <button onClick={onLogout} className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-4 py-2 rounded-full transition-colors font-medium text-sm">
                       <LogOut className="w-4 h-4 rtl:flip"/> {t('logout')}
                   </button>
               </div>
           </header>

           {/* Navigation Tabs */}
           <div className="flex flex-wrap gap-2 mb-8 bg-white p-2 rounded-lg shadow-sm border w-fit">
               {[
                   { id: 'STATS', icon: BarChart, label: t('dashboard') },
                   { id: 'GLOBAL_SEARCH', icon: Search, label: t('globalSearch') },
                   { id: 'INDIVIDUALS', icon: Users, label: t('freeClients') },
                   { id: 'ESTABLISHMENTS', icon: Building, label: t('establishments') },
                   { id: 'REQUESTS', icon: Inbox, label: t('requests') },
                   { id: 'BILLING', icon: CreditCard, label: t('billing') },
                   { id: 'MODERATORS', icon: Shield, label: t('adminTeam') },
                   { id: 'COMMUNICATION', icon: Megaphone, label: t('communication') }
               ].map(tab => (
                   <button 
                       key={tab.id}
                       onClick={() => { setActiveView(tab.id as AdminView); setIsCreating(false); setCurrentPage(1); setSearchTerm(''); }}
                       className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${activeView === tab.id ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}
                   >
                       <tab.icon className="w-4 h-4"/> {tab.label}
                   </button>
               ))}
           </div>

           {/* Content Area */}
           <main>
               {activeView === 'STATS' && renderStats()}
               {activeView === 'GLOBAL_SEARCH' && renderGlobalSearch()}
               {activeView === 'INDIVIDUALS' && renderIndividuals()}
               {activeView === 'ESTABLISHMENTS' && renderEstablishments()}
               {activeView === 'REQUESTS' && renderRequests()}
               {activeView === 'BILLING' && renderBilling()}
               {activeView === 'MODERATORS' && renderModerators()}
               {activeView === 'COMMUNICATION' && renderCommunication()}
               {activeView === 'SETTINGS' && renderSettings()}
           </main>
       </div>

       {/* Billing Modal (Invoice Generation) */}
       {billingSchool && (
           <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in print:hidden">
               <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-8">
                   <h2 className="text-2xl font-bold mb-6 text-center">{t('generateInvoice')}</h2>
                   
                   <div className="mb-6 p-4 bg-gray-50 rounded border">
                       <p className="text-sm text-gray-500 mb-1">{t('invoiceFor')}:</p>
                       <p className="font-bold text-lg">{billingSchool.name}</p>
                       <p>{billingSchool.city}</p>
                   </div>
                   
                   <div className="mb-6">
                       <label className="block text-sm font-medium text-gray-700 mb-2">{t('amount')}</label>
                       <input 
                            type="number" 
                            className="w-full border rounded p-3 text-lg" 
                            value={invoiceAmount}
                            onChange={(e) => setInvoiceAmount(e.target.value)}
                            placeholder="0.00"
                       />
                   </div>

                   <div className="flex gap-3">
                       <button onClick={printInvoice} className="flex-1 bg-emerald-600 text-white py-3 rounded hover:bg-emerald-700 font-bold flex items-center justify-center gap-2">
                            <Printer className="w-5 h-5"/> {t('printInvoice')}
                       </button>
                       <button onClick={() => setBillingSchool(null)} className="px-6 py-3 border rounded text-gray-600 hover:bg-gray-50">
                            {t('close')}
                       </button>
                   </div>
               </div>
           </div>
       )}
       
       {/* Printable Invoice Template (Hidden by default, visible on print) */}
       {billingSchool && (
           <div className="hidden print:block fixed inset-0 bg-white z-[100] p-12">
               <div className="text-center mb-12">
                   <h1 className="text-4xl font-bold mb-2">{t('appName')}</h1>
                   <p className="text-gray-500">{t('slogan')}</p>
               </div>
               
               <div className="border-b-2 border-black pb-4 mb-8 flex justify-between items-end">
                   <div>
                       <p className="text-sm font-bold text-gray-500 uppercase">Facturé à</p>
                       <h2 className="text-2xl font-bold">{billingSchool.name}</h2>
                       <p>{billingSchool.city}</p>
                   </div>
                   <div className="text-right">
                       <p className="text-sm font-bold text-gray-500 uppercase">Date</p>
                       <p>{new Date().toLocaleDateString()}</p>
                   </div>
               </div>

               <table className="w-full mb-12">
                   <thead>
                       <tr className="border-b">
                           <th className="text-left py-2">Description</th>
                           <th className="text-right py-2">Montant</th>
                       </tr>
                   </thead>
                   <tbody>
                       <tr>
                           <td className="py-4">Abonnement Annuel - Plateforme {t('appName')}</td>
                           <td className="py-4 text-right font-mono text-xl">{invoiceAmount} DH</td>
                       </tr>
                   </tbody>
               </table>

               <div className="text-right border-t-2 border-black pt-4">
                   <p className="text-3xl font-bold">Total: {invoiceAmount} DH</p>
               </div>

               <div className="mt-20 text-center text-sm text-gray-400">
                   <p>Merci de votre confiance.</p>
               </div>
           </div>
       )}

       {/* User Details Modal (Individual) */}
       {selectedUser && (
           <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in print:hidden">
               <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                   <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
                       <h3 className="font-bold flex items-center gap-2"><Users className="w-5 h-5"/> {t('profDetails')}</h3>
                       <button onClick={() => setSelectedUser(null)}><X className="w-5 h-5"/></button>
                   </div>
                   <div className="p-6 space-y-4">
                        <div className="text-center mb-6">
                            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
                                {selectedUser.name.charAt(0).toUpperCase()}
                            </div>
                            <h2 className="text-xl font-bold text-gray-800">{selectedUser.name}</h2>
                            <p className="text-gray-500">{selectedUser.city}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-gray-50 p-3 rounded">
                                <p className="text-gray-500 text-xs uppercase font-bold">{t('username')}</p>
                                <p className="font-mono">{selectedUser.username}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded">
                                <p className="text-gray-500 text-xs uppercase font-bold">{t('password')}</p>
                                <p className="font-mono">{selectedUser.password || '******'}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded col-span-2">
                                <p className="text-gray-500 text-xs uppercase font-bold">{t('school')}</p>
                                <p>{selectedUser.school || t('individualAccess')}</p>
                            </div>
                        </div>
                   </div>
                   <div className="p-4 bg-gray-50 border-t text-center">
                       <button onClick={() => setSelectedUser(null)} className="text-gray-500 hover:text-gray-800 text-sm font-medium">{t('close')}</button>
                   </div>
               </div>
           </div>
       )}

       {/* School Details Modal (Staff List + Students List + Actions) */}
       {selectedSchool && (
           <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in print:hidden">
               <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
                   <div className="bg-indigo-600 p-4 flex justify-between items-center text-white shrink-0">
                       <h3 className="font-bold flex items-center gap-2 text-lg">
                           <Building className="w-5 h-5"/> {selectedSchool.name} <span className="text-indigo-200 text-sm font-normal">({selectedSchool.city})</span>
                       </h3>
                       <div className="flex gap-2">
                            <button 
                                onClick={() => exportSchoolFullData(selectedSchool.name, selectedSchool.city)}
                                className="bg-indigo-500 hover:bg-indigo-400 text-white px-3 py-1 rounded text-xs flex items-center gap-1 transition"
                            >
                                <FileDown className="w-3 h-3"/> {t('exportFullData')}
                            </button>
                            <button 
                                onClick={() => handleDeleteSchool(selectedSchool.name, selectedSchool.city)}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1 transition"
                                title={t('deleteSchoolConfirm')}
                            >
                                <AlertTriangle className="w-3 h-3"/> {t('deleteSchool')}
                            </button>
                            <button onClick={() => setSelectedSchool(null)} className="hover:bg-white/10 p-1 rounded"><X className="w-5 h-5"/></button>
                       </div>
                   </div>
                   
                   {/* Tabs inside modal */}
                   <div className="flex gap-4 p-4 border-b bg-gray-50">
                       <button 
                         onClick={() => setSchoolDetailTab('STAFF')}
                         className={`px-4 py-2 rounded text-sm font-bold transition ${schoolDetailTab === 'STAFF' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border'}`}
                       >
                           {t('staffList')}
                       </button>
                       <button 
                         onClick={() => setSchoolDetailTab('STUDENTS')}
                         className={`px-4 py-2 rounded text-sm font-bold transition ${schoolDetailTab === 'STUDENTS' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border'}`}
                       >
                           {t('viewStudents')}
                       </button>
                   </div>

                   <div className="flex-1 overflow-auto p-0">
                       {schoolDetailTab === 'STAFF' && (
                           <table className="w-full text-sm text-start">
                               <thead className="bg-gray-50 sticky top-0 border-b shadow-sm z-10">
                                   <tr>
                                       <th className="p-4 text-start">{t('profName')}</th>
                                       <th className="p-4 text-start">Role</th>
                                       <th className="p-4 text-start">{t('username')}</th>
                                       <th className="p-4 text-start">
                                            <div className="flex items-center gap-2">
                                                {t('password')}
                                                <button onClick={() => setShowPasswords(!showPasswords)} className="text-gray-400 hover:text-gray-600" title={showPasswords ? t('showPass') : t('hidePass')}>
                                                    {showPasswords ? <EyeOff className="w-3 h-3"/> : <Eye className="w-3 h-3"/>}
                                                </button>
                                            </div>
                                       </th>
                                       <th className="p-4 text-end">{t('actions')}</th>
                                   </tr>
                               </thead>
                               <tbody>
                                   {users
                                      .filter(u => u.school === selectedSchool.name && u.city === selectedSchool.city && (u.role === UserRole.PROFESSOR || u.role === UserRole.COORDINATOR))
                                      .map(u => (
                                       <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                                           <td className="p-4 font-medium text-gray-800">{u.name}</td>
                                           <td className="p-4">
                                               {u.role === UserRole.COORDINATOR 
                                                  ? <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold">{t('coordinator')}</span>
                                                  : <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs">{t('professor')}</span>
                                               }
                                           </td>
                                           <td className="p-4 font-mono text-gray-600">{u.username}</td>
                                           <td className="p-4 font-mono text-gray-500">
                                               {showPasswords ? (u.password || 'N/A') : '••••••'}
                                           </td>
                                           <td className="p-4 text-end flex justify-end gap-2">
                                                <button onClick={() => handleResetPassword(u.id)} className="text-orange-500 hover:bg-orange-50 p-1 rounded" title={t('resetPass')}>
                                                    <RefreshCcw className="w-4 h-4"/>
                                                </button>
                                                <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:bg-red-50 p-1 rounded" title={t('delete')}>
                                                    <Trash2 className="w-4 h-4"/>
                                                </button>
                                            </td>
                                       </tr>
                                   ))}
                               </tbody>
                           </table>
                       )}

                       {schoolDetailTab === 'STUDENTS' && (
                           <table className="w-full text-sm text-start">
                               <thead className="bg-gray-50 sticky top-0 border-b shadow-sm z-10">
                                   <tr>
                                       <th className="p-4 text-start">{t('profName')}</th>
                                       <th className="p-4 text-start">{t('className')}</th>
                                       <th className="p-4 text-start">{t('username')}</th>
                                       <th className="p-4 text-start">
                                            <div className="flex items-center gap-2">
                                                {t('password')}
                                                <button onClick={() => setShowPasswords(!showPasswords)} className="text-gray-400 hover:text-gray-600">
                                                    {showPasswords ? <EyeOff className="w-3 h-3"/> : <Eye className="w-3 h-3"/>}
                                                </button>
                                            </div>
                                       </th>
                                       <th className="p-4 text-end">{t('actions')}</th>
                                   </tr>
                               </thead>
                               <tbody>
                                   {users
                                      .filter(u => u.school === selectedSchool.name && u.city === selectedSchool.city && u.role === UserRole.STUDENT)
                                      .map(u => (
                                       <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                                           <td className="p-4 font-medium text-gray-800">{u.name}</td>
                                           <td className="p-4">
                                               {u.enrolledClasses?.join(', ') || '-'}
                                           </td>
                                           <td className="p-4 font-mono text-gray-600">{u.username}</td>
                                           <td className="p-4 font-mono text-gray-500">
                                               {showPasswords ? (u.password || 'N/A') : '••••••'}
                                           </td>
                                           <td className="p-4 text-end flex justify-end gap-2">
                                                <button onClick={() => handleResetPassword(u.id)} className="text-orange-500 hover:bg-orange-50 p-1 rounded" title={t('resetPass')}>
                                                    <RefreshCcw className="w-4 h-4"/>
                                                </button>
                                                <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:bg-red-50 p-1 rounded" title={t('delete')}>
                                                    <Trash2 className="w-4 h-4"/>
                                                </button>
                                           </td>
                                       </tr>
                                   ))}
                                   {users.filter(u => u.school === selectedSchool.name && u.city === selectedSchool.city && u.role === UserRole.STUDENT).length === 0 && (
                                       <tr><td colSpan={5} className="p-8 text-center text-gray-500">{t('noResults')}</td></tr>
                                   )}
                               </tbody>
                           </table>
                       )}
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};

export default AdminDashboard;
