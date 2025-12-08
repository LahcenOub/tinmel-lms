
import React, { useState, useEffect } from 'react';
import { User, UserRole, Announcement, Message } from '../../types';
import { StorageService } from '../../services/storageService';
import { LogOut, Trash, UserPlus, Megaphone, Send, Info, X, MessageCircle, Shield, Search, Filter, ChevronLeft, ChevronRight, FileDown } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import * as XLSX from 'xlsx';

interface Props {
  user: User;
  onLogout: () => void;
}

const ITEMS_PER_PAGE = 10;

const ModeratorDashboard: React.FC<Props> = ({ user, onLogout }) => {
  const { t, dir } = useLanguage();
  const [activeTab, setActiveTab] = useState<'profs' | 'communication'>('profs');
  const [profs, setProfs] = useState<User[]>(StorageService.getUsersByRole(UserRole.PROFESSOR));
  
  // Prof Management
  const [newProfName, setNewProfName] = useState('');
  const [newProfSchool, setNewProfSchool] = useState('');
  const [newProfCity, setNewProfCity] = useState('');
  
  // Search & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Announcements
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');

  // Messaging (Support)
  const [conversations, setConversations] = useState<string[]>([]);
  const [selectedProfId, setSelectedProfId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (activeTab === 'communication') {
        setConversations(StorageService.getConversationsForUser(user.id));
    }
  }, [activeTab]);

  useEffect(() => {
      if (selectedProfId) {
          setMessages(StorageService.getMessages(user.id, selectedProfId));
      }
  }, [selectedProfId]);

  // Derived state for Filtering and Pagination
  const availableSchools = Array.from(new Set(profs.map(p => p.school).filter(Boolean)));
  
  const filteredProfs = profs.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.username.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSchool = selectedSchoolFilter ? p.school === selectedSchoolFilter : true;
      return matchesSearch && matchesSchool;
  });

  const totalPages = Math.ceil(filteredProfs.length / ITEMS_PER_PAGE);
  const paginatedProfs = filteredProfs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleCreateProf = () => {
      if(!newProfName.trim()) return;
      
      const cleanName = newProfName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
      const username = `prof_${cleanName.substring(0, 10)}_${randomSuffix}`;
      const password = Math.random().toString(36).slice(-8);
      
      const newProf: User = {
          id: `usr-${Date.now()}`,
          name: newProfName.trim(),
          username,
          password,
          role: UserRole.PROFESSOR,
          school: newProfSchool.trim() || undefined,
          city: newProfCity.trim() || undefined
      };
      
      StorageService.saveUser(newProf);
      setProfs(StorageService.getUsersByRole(UserRole.PROFESSOR));
      setNewProfName('');
      setNewProfSchool('');
      setNewProfCity('');
      alert(`${t('professor')} ${t('completed')}!\nID: ${username}\nPass: ${password}`);
  };

  const handleDeleteProf = (id: string) => {
      if (confirm(t('delete') + '?')) {
        StorageService.deleteUser(id);
        setProfs(StorageService.getUsersByRole(UserRole.PROFESSOR));
      }
  };

  const handleBroadcastAnnouncement = () => {
      if(!announcementTitle || !announcementContent) return;
      
      const ann: Announcement = {
          id: `ann-${Date.now()}`,
          title: announcementTitle,
          content: announcementContent,
          date: new Date().toISOString(),
          author: user.name
      };
      StorageService.saveAnnouncement(ann);
      setAnnouncementTitle('');
      setAnnouncementContent('');
      alert(t('announceSent'));
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

  const exportProfs = () => {
      const data = profs.map(p => ({
          Name: p.name,
          School: p.school || '',
          City: p.city || '',
          Username: p.username,
          Password: p.password
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Profs_Managed");
      XLSX.writeFile(wb, "Moderator_Prof_List.xlsx");
  };

  // Helper to start conversation from prof list
  const startConversation = (profId: string) => {
      setSelectedProfId(profId);
      setActiveTab('communication');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8" dir={dir}>
       <div className="max-w-6xl mx-auto">
           <header className="flex justify-between items-center mb-8">
               <div className="flex items-center gap-4">
                  <span className="text-3xl font-black text-blue-700 font-logo tracking-tight">
                    {t('appName')}
                  </span>
                  <div className="h-6 w-px bg-gray-300"></div>
                  <div>
                      <h1 className="text-xl font-bold text-gray-800">{t('moderatorSpace')}</h1>
                      <p className="text-sm text-gray-500">{user.name} (Assistant(e))</p>
                  </div>
               </div>
               <button onClick={onLogout} className="flex items-center gap-2 text-red-600 hover:text-red-800">
                   <LogOut className="w-5 h-5 rtl:flip" /> {t('logout')}
               </button>
           </header>

           <div className="flex gap-4 mb-6 border-b">
               <button 
                  onClick={() => setActiveTab('profs')}
                  className={`pb-2 px-4 flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'profs' ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
               >
                   <UserPlus className="w-4 h-4"/> {t('manageProfs')}
               </button>
               <button 
                  onClick={() => setActiveTab('communication')}
                  className={`pb-2 px-4 flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'communication' ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
               >
                   <Shield className="w-4 h-4"/> {t('supportComm')}
               </button>
           </div>

           {activeTab === 'profs' && (
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow p-6 mb-8">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><UserPlus className="w-5 h-5"/> {t('addProf')}</h2>
                            <div className="flex flex-col md:flex-row gap-4">
                                <input 
                                        className="flex-1 border rounded p-2 text-sm"
                                        placeholder={t('profName')}
                                        value={newProfName}
                                        onChange={(e) => setNewProfName(e.target.value)}
                                />
                                <input 
                                        className="flex-1 border rounded p-2 text-sm"
                                        placeholder={t('profSchool')}
                                        value={newProfSchool}
                                        onChange={(e) => setNewProfSchool(e.target.value)}
                                />
                                <input 
                                        className="flex-1 border rounded p-2 text-sm"
                                        placeholder={t('profCity')}
                                        value={newProfCity}
                                        onChange={(e) => setNewProfCity(e.target.value)}
                                />
                                <button onClick={handleCreateProf} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm whitespace-nowrap">
                                    {t('genAccess')}
                                </button>
                            </div>
                        </div>

                         {/* Search & Filter Bar */}
                         <div className="flex flex-col md:flex-row gap-4 mb-4 items-center">
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 rtl:right-3 rtl:left-auto"/>
                                <input 
                                    className="w-full pl-9 pr-3 py-2 border rounded text-sm rtl:pr-9 rtl:pl-3"
                                    placeholder={t('search')}
                                    value={searchTerm}
                                    onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                />
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <Filter className="w-4 h-4 text-gray-500"/>
                                <select 
                                    className="border rounded p-2 text-sm flex-1 md:w-40"
                                    value={selectedSchoolFilter}
                                    onChange={e => { setSelectedSchoolFilter(e.target.value); setCurrentPage(1); }}
                                >
                                    <option value="">{t('allSchools')}</option>
                                    {availableSchools.map(s => <option key={s} value={s as string}>{s}</option>)}
                                </select>
                            </div>
                            <button onClick={exportProfs} className="bg-green-600 text-white px-4 py-2 rounded text-sm flex items-center gap-2 hover:bg-green-700">
                                <FileDown className="w-4 h-4"/> {t('exportList')}
                            </button>
                        </div>

                        <div className="bg-white rounded-lg shadow overflow-hidden mb-4">
                            <table className="w-full text-start text-sm">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="p-3 text-start">{t('username')}</th>
                                        <th className="p-3 text-start">{t('school')}</th>
                                        <th className="p-3 text-start">{t('profCity')}</th>
                                        <th className="p-3 text-start">{t('username')}</th>
                                        <th className="p-3 text-start">{t('initialPass')}</th>
                                        <th className="p-3 text-end">{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedProfs.map(p => (
                                        <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                                            <td className="p-3 font-medium">{p.name}</td>
                                            <td className="p-3 text-gray-600">{p.school || '-'}</td>
                                            <td className="p-3 text-gray-600">{p.city || '-'}</td>
                                            <td className="p-3 text-gray-600 font-mono text-xs">{p.username}</td>
                                            <td className="p-3 font-mono text-xs bg-gray-50 rounded w-fit">{p.password}</td>
                                            <td className="p-3 text-end flex justify-end gap-2">
                                                <button 
                                                    onClick={() => startConversation(p.id)}
                                                    className="text-blue-500 hover:bg-blue-50 p-2 rounded flex items-center gap-1 text-xs"
                                                    title={t('contact')}
                                                >
                                                    <MessageCircle className="w-4 h-4" /> {t('contact')}
                                                </button>
                                                <button onClick={() => handleDeleteProf(p.id)} className="text-red-500 hover:bg-red-50 p-2 rounded" title={t('delete')}>
                                                    <Trash className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {paginatedProfs.length === 0 && (
                                        <tr><td colSpan={6} className="p-8 text-center text-gray-500">{t('noProfs')}</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                         {/* Pagination */}
                         {totalPages > 1 && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">{t('page')} {currentPage} {t('of')} {totalPages}</span>
                                <div className="flex gap-2">
                                    <button 
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(p => p - 1)}
                                        className="p-1 rounded border hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        <ChevronLeft className="w-5 h-5 rtl:flip"/>
                                    </button>
                                    <button 
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(p => p + 1)}
                                        className="p-1 rounded border hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        <ChevronRight className="w-5 h-5 rtl:flip"/>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
               </div>
           )}

           {activeTab === 'communication' && (
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   {/* Broadcast */}
                   <div className="bg-white rounded-lg shadow p-6 h-fit">
                         <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-indigo-700">
                             <Megaphone className="w-5 h-5"/> {t('broadcastComm')}
                         </h2>
                         <div className="space-y-4">
                             <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-1">{t('announceTitle')}</label>
                                 <input 
                                    className="w-full border rounded p-2"
                                    value={announcementTitle}
                                    onChange={e => setAnnouncementTitle(e.target.value)}
                                 />
                             </div>
                             <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-1">{t('announceContent')}</label>
                                 <textarea 
                                    className="w-full border rounded p-2 h-32"
                                    value={announcementContent}
                                    onChange={e => setAnnouncementContent(e.target.value)}
                                 />
                             </div>
                             <button 
                                onClick={handleBroadcastAnnouncement}
                                className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 flex items-center justify-center gap-2"
                             >
                                 <Send className="w-4 h-4 rtl:flip"/> {t('publish')}
                             </button>
                         </div>
                   </div>

                   {/* Messaging / Support */}
                   <div className="bg-white rounded-lg shadow h-[600px] flex overflow-hidden border">
                       <div className="w-1/3 border-e bg-gray-50 flex flex-col">
                           <div className="p-4 border-b font-bold text-gray-700">{t('techSupport')}</div>
                           <div className="flex-1 overflow-y-auto">
                               {conversations.length === 0 && <p className="p-4 text-sm text-gray-500">{t('noMessages')}</p>}
                               {conversations.map(convId => {
                                   const prof = StorageService.getUsers().find(u => u.id === convId);
                                   if (!prof) return null;
                                   return (
                                       <button 
                                            key={convId} 
                                            onClick={() => setSelectedProfId(convId)}
                                            className={`w-full p-4 text-start hover:bg-blue-50 transition border-b ${selectedProfId === convId ? 'bg-blue-100' : ''}`}
                                        >
                                           <div className="font-medium">{prof.name}</div>
                                           <div className="text-xs text-gray-500">{prof.role === UserRole.PROFESSOR ? t('professor') : '-'}</div>
                                       </button>
                                   );
                               })}
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
               </div>
           )}
       </div>
    </div>
  );
};

export default ModeratorDashboard;
