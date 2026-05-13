import React, { useState, useEffect } from 'react';
import { User, UserRole, Message } from '../../types';
import { StorageService } from '../../services/storageService';
import { ApiService } from '../../services/apiService';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNetworkMode } from '../../contexts/NetworkModeContext';
import { ChevronRight, MessageCircle, Send, Users, Radio } from 'lucide-react';

export const MessagesView: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLanguage();
    const { mode, addToLoraQueue } = useNetworkMode();
    const [contacts, setContacts] = useState<User[]>([]);
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const staffRoomId = `group_staff_${user.school}_${user.city}`;

    useEffect(() => {
        const loadData = async () => {
            const allUsers = await ApiService.getUsers();
            // Coordinators and Professors see all Professors and Students in their school
            const relevantUsers = allUsers.filter(u => 
                (u.role === UserRole.PROFESSOR || u.role === UserRole.STUDENT || u.role === UserRole.COORDINATOR) && 
                u.school === user.school && 
                u.city === user.city &&
                u.id !== user.id
            );
            setContacts(relevantUsers);
        };
        loadData();
    }, [user]);

    useEffect(() => {
        const updateUnreads = () => {
            const newCounts: Record<string, number> = {};
            contacts.forEach(c => {
                newCounts[c.id] = StorageService.getUnreadCountFromSender(user.id, c.id);
            });
            setUnreadCounts(newCounts);
        };
        updateUnreads();
        const interval = setInterval(updateUnreads, 3000);
        return () => clearInterval(interval);
    }, [contacts, user.id]);

    useEffect(() => {
        if (selectedContactId) {
            const fetchMessages = () => {
                if (selectedContactId === staffRoomId) {
                    setMessages(StorageService.getGroupMessages(staffRoomId));
                } else {
                    StorageService.markMessagesAsRead(user.id, selectedContactId);
                    setMessages(StorageService.getMessages(user.id, selectedContactId));
                    // Update local unread state immediately
                    setUnreadCounts(prev => ({...prev, [selectedContactId]: 0}));
                }
            };
            
            // Initial load
            fetchMessages();
            
            // Poll for messages
            const interval = setInterval(fetchMessages, 3000);
            return () => clearInterval(interval);
        }
    }, [selectedContactId, user.id, staffRoomId]);

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
        
        if (mode === 'LORAWAN') {
            // Compress and queue for LoRa
            addToLoraQueue('MESSAGE', msg);
            // Optimistic display with Lora hint
            const mockMsg = { ...msg, content: `[LoRa Queue] ${msg.content}` };
            setMessages(prev => [...prev, mockMsg]);
        } else {
            StorageService.sendMessage(msg);
            setMessages(prev => [...prev, msg]);
        }
        
        setNewMessage('');
    };

    const isStaffRoom = selectedContactId === staffRoomId;

    return (
        <div className="bg-white rounded-lg shadow h-[600px] flex overflow-hidden border animate-fade-in">
             <div className="w-1/3 border-e bg-gray-50 flex flex-col">
                <div className="p-4 border-b font-bold text-gray-700 bg-gray-100">{t('contact')}</div>
                <div className="flex-1 overflow-y-auto">
                    {/* Salle des Profs (Group Chat) */}
                    {(user.role === UserRole.PROFESSOR || user.role === UserRole.COORDINATOR) && (
                        <button 
                            onClick={() => setSelectedContactId(staffRoomId)} 
                            className={`w-full p-4 text-start hover:bg-indigo-50 transition border-b flex justify-between items-center group ${selectedContactId === staffRoomId ? 'bg-indigo-100 border-l-4 border-l-indigo-600' : 'border-l-4 border-l-transparent'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-indigo-200 text-indigo-700 p-2 rounded-full">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-bold text-indigo-800 text-sm group-hover:text-indigo-900">Salle des Profs</div>
                                    <div className="text-xs text-gray-500">Équipe pédagogique</div>
                                </div>
                            </div>
                            <ChevronRight className={`w-4 h-4 text-gray-300 ${selectedContactId === staffRoomId ? 'text-indigo-500' : ''}`}/>
                        </button>
                    )}

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
                                    {contact.role === UserRole.PROFESSOR && <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold text-[10px]">PROF</span>}
                                    {contact.role === UserRole.STUDENT && <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold text-[10px]">ÉTUDIANT</span>}
                                    {contact.role === UserRole.COORDINATOR && <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold text-[10px]">COORD</span>}
                                    {contact.subject && <span className="text-gray-400">• {contact.subject}</span>}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {unreadCounts[contact.id] > 0 && selectedContactId !== contact.id && (
                                    <span className="bg-red-500 text-white min-w-[20px] h-[20px] flex items-center justify-center rounded-full text-xs font-bold px-1.5">
                                        {unreadCounts[contact.id]}
                                    </span>
                                )}
                                <ChevronRight className={`w-4 h-4 text-gray-300 ${selectedContactId === contact.id ? 'text-indigo-500' : ''}`}/>
                            </div>
                        </button>
                    ))}
                </div>
             </div>
             <div className="w-2/3 flex flex-col bg-white">
                  {selectedContactId ? (
                       <>
                            <div className="p-4 border-b font-bold bg-white flex items-center gap-3 shadow-sm z-10">
                                {isStaffRoom ? (
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                        <Users className="w-5 h-5" />
                                    </div>
                                ) : (
                                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                                )}
                                <div>
                                    <div className="text-gray-800">
                                        {isStaffRoom ? 'Salle des Profs' : contacts.find(u => u.id === selectedContactId)?.name}
                                    </div>
                                    <div className="text-xs text-gray-400 font-normal">
                                        {isStaffRoom ? 'Discussion de l\'équipe pédagogique' : t('online')}
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                                {messages.map(m => (
                                    <div key={m.id} className={`flex flex-col ${m.senderId === user.id ? 'items-end' : 'items-start'}`}>
                                        {isStaffRoom && m.senderId !== user.id && (
                                            <span className="text-xs text-gray-500 mb-1 ml-1 font-medium">{m.senderName}</span>
                                        )}
                                        <div className={`max-w-[70%] p-3 rounded-2xl text-sm shadow-sm ${m.senderId === user.id ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border text-gray-800 rounded-bl-none'}`}>
                                            {m.content}
                                            <div className={`text-[10px] mt-1 text-end ${m.senderId === user.id ? 'text-indigo-200' : 'text-gray-400'}`}>
                                                {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
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
                           <p>Sélectionnez un contact ou la salle des profs pour discuter.</p>
                       </div>
                   )}
             </div>
         </div>
    );
};
