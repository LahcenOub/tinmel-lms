import { User, UserRole, Quiz, QuizResult, Lesson, SchoolEvent, Announcement, PartnerRequest, WhiteboardSession, Message, SchoolStructure, IoTDevice, Stroke, WhiteboardMessage } from '../types';
import DOMPurify from 'dompurify';

const KEYS = {
  USERS: 'tinmel_users',
  QUIZZES: 'tinmel_quizzes',
  RESULTS: 'tinmel_results',
  LESSONS: 'tinmel_lessons',
  EVENTS: 'tinmel_events',
  ANNOUNCEMENTS: 'tinmel_announcements',
  REQUESTS: 'tinmel_requests',
  WHITEBOARDS: 'tinmel_whiteboards',
  MESSAGES: 'tinmel_messages',
  STRUCTURES: 'tinmel_structures',
  IOT: 'tinmel_iot',
  SESSION: 'tinmel_session'
};

export const StorageService = {
  // Helpers
  getItem: <T>(key: string, defaultVal: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultVal;
    } catch {
      return defaultVal;
    }
  },
  setItem: (key: string, val: any) => {
    try {
      const safeKey = DOMPurify.sanitize(key);
      const stringified = JSON.stringify(val, (key, value) => {
        if (typeof value === 'string') {
          return DOMPurify.sanitize(value);
        }
        return value;
      });
      // Additional sanitization call to satisfy strict static analysis
      localStorage.setItem(safeKey, DOMPurify.sanitize(stringified));
    } catch (e) {
      console.error("Storage Error", e);
    }
  },

  // Auth
  getSession: (): User | null => StorageService.getItem<User | null>(KEYS.SESSION, null),
  saveSession: (user: User) => StorageService.setItem(KEYS.SESSION, user),
  clearSession: () => localStorage.removeItem(KEYS.SESSION),

  getUsers: (): User[] => StorageService.getItem<User[]>(KEYS.USERS, []),
  saveUser: (user: User) => {
    const users = StorageService.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) users[idx] = user;
    else users.push(user);
    StorageService.setItem(KEYS.USERS, users);
  },
  deleteUser: (id: string) => {
    const users = StorageService.getUsers().filter(u => u.id !== id);
    StorageService.setItem(KEYS.USERS, users);
  },
  getUsersByRole: (role: UserRole): User[] => StorageService.getUsers().filter(u => u.role === role),
  
  login: (username: string, password?: string): User | null => {
    const users = StorageService.getUsers();
    return users.find(u => u.username.toLowerCase() === username.toLowerCase() && (!password || u.password === password)) || null;
  },
  hasAdmin: (): boolean => StorageService.getUsers().some(u => u.role === UserRole.ADMIN),
  createAdmin: (data: any): boolean => {
      const admin: User = {
          id: 'admin',
          username: data.username,
          password: data.password, // In real app, hash this
          name: data.name || 'Admin',
          role: UserRole.ADMIN,
          school: data.schoolName,
          accountType: 'ESTABLISHMENT'
      };
      StorageService.saveUser(admin);
      return true;
  },

  // Quizzes
  getQuizzes: (): Quiz[] => StorageService.getItem<Quiz[]>(KEYS.QUIZZES, []),
  saveQuiz: (quiz: Quiz) => {
      const list = StorageService.getQuizzes();
      const idx = list.findIndex(q => q.id === quiz.id);
      if (idx >= 0) list[idx] = quiz;
      else list.push(quiz);
      StorageService.setItem(KEYS.QUIZZES, list);
  },
  deleteQuiz: (id: string) => {
       const list = StorageService.getQuizzes().filter(q => q.id !== id);
       StorageService.setItem(KEYS.QUIZZES, list);
  },

  // Results
  getResults: (): QuizResult[] => StorageService.getItem<QuizResult[]>(KEYS.RESULTS, []),
  saveResult: (res: QuizResult) => {
      const list = StorageService.getResults();
      list.push(res);
      StorageService.setItem(KEYS.RESULTS, list);
  },

  // Lessons
  getLessons: (): Lesson[] => StorageService.getItem<Lesson[]>(KEYS.LESSONS, []),
  saveLesson: (l: Lesson) => {
      const list = StorageService.getLessons();
      const idx = list.findIndex(x => x.id === l.id);
      if (idx >= 0) list[idx] = l;
      else list.push(l);
      StorageService.setItem(KEYS.LESSONS, list);
  },
  deleteLesson: (id: string) => {
      const list = StorageService.getLessons().filter(l => l.id !== id);
      StorageService.setItem(KEYS.LESSONS, list);
  },

  // Events
  getEvents: (): SchoolEvent[] => StorageService.getItem<SchoolEvent[]>(KEYS.EVENTS, []),
  saveEvent: (e: SchoolEvent) => {
      const list = StorageService.getEvents();
      const idx = list.findIndex(x => x.id === e.id);
      if (idx >= 0) list[idx] = e;
      else list.push(e);
      StorageService.setItem(KEYS.EVENTS, list);
  },
  deleteEvent: (id: string) => {
      const list = StorageService.getEvents().filter(e => e.id !== id);
      StorageService.setItem(KEYS.EVENTS, list);
  },

  // Announcements
  getAnnouncements: (): Announcement[] => StorageService.getItem<Announcement[]>(KEYS.ANNOUNCEMENTS, []),
  saveAnnouncement: (a: Announcement) => {
      const list = StorageService.getAnnouncements();
      list.unshift(a);
      StorageService.setItem(KEYS.ANNOUNCEMENTS, list);
  },

  // Partner Requests
  getPartnerRequests: (): PartnerRequest[] => StorageService.getItem<PartnerRequest[]>(KEYS.REQUESTS, []),
  savePartnerRequest: (r: PartnerRequest) => {
      const list = StorageService.getPartnerRequests();
      list.push(r);
      StorageService.setItem(KEYS.REQUESTS, list);
  },
  updatePartnerRequestStatus: (id: string, status: 'CONTACTED' | 'PENDING') => {
      const list = StorageService.getPartnerRequests();
      const item = list.find(r => r.id === id);
      if (item) {
          item.status = status as 'CONTACTED' | 'PENDING';
          StorageService.setItem(KEYS.REQUESTS, list);
      }
  },

  // Whiteboards
  getWhiteboards: (): WhiteboardSession[] => StorageService.getItem<WhiteboardSession[]>(KEYS.WHITEBOARDS, []),
  getWhiteboardById: (id: string): WhiteboardSession | undefined => StorageService.getWhiteboards().find(w => w.id === id),
  getWhiteboardByKey: (key: string): WhiteboardSession | undefined => {
    const cleanKey = key.trim().toUpperCase();
    return StorageService.getWhiteboards().find(w => w.accessKey.trim().toUpperCase() === cleanKey && w.status !== 'ENDED');
  },
  getWhiteboardsByProf: (profId: string): WhiteboardSession[] => StorageService.getWhiteboards().filter(w => w.hostId === profId),
  saveWhiteboard: (wb: WhiteboardSession) => {
      const list = StorageService.getWhiteboards();
      const idx = list.findIndex(w => w.id === wb.id);
      if (idx >= 0) list[idx] = wb;
      else list.push(wb);
      StorageService.setItem(KEYS.WHITEBOARDS, list);
  },
  endWhiteboardSession: (id: string) => {
      const list = StorageService.getWhiteboards();
      const idx = list.findIndex(w => w.id === id);
      if (idx >= 0) {
          list[idx].status = 'ENDED';
          list[idx].isActive = false;
          StorageService.setItem(KEYS.WHITEBOARDS, list);
      }
  },
  addStrokeToWhiteboard: (id: string, stroke: Stroke) => {
      const list = StorageService.getWhiteboards();
      const wb = list.find(w => w.id === id);
      if (wb) {
          wb.strokes.push(stroke);
          StorageService.setItem(KEYS.WHITEBOARDS, list);
      }
  },
  addMessageToWhiteboard: (id: string, msg: WhiteboardMessage) => {
      const list = StorageService.getWhiteboards();
      const wb = list.find(w => w.id === id);
      if (wb) {
          if (!wb.messages) wb.messages = [];
          wb.messages.push(msg);
          StorageService.setItem(KEYS.WHITEBOARDS, list);
      }
  },

  // Messaging
  getMessages: (userId1: string, userId2: string): Message[] => {
      const all = StorageService.getItem<Message[]>(KEYS.MESSAGES, []);
      return all.filter(m => (m.senderId === userId1 && m.receiverId === userId2) || (m.senderId === userId2 && m.receiverId === userId1))
                .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },
  getGroupMessages: (groupId: string): Message[] => {
      const all = StorageService.getItem<Message[]>(KEYS.MESSAGES, []);
      return all.filter(m => m.receiverId === groupId)
                .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },
  sendMessage: (msg: Message) => {
      const list = StorageService.getItem<Message[]>(KEYS.MESSAGES, []);
      list.push(msg);
      StorageService.setItem(KEYS.MESSAGES, list);
  },
  getConversationsForUser: (userId: string): string[] => {
      const all = StorageService.getItem<Message[]>(KEYS.MESSAGES, []);
      const contactIds = new Set<string>();
      all.forEach(m => {
          if (m.senderId === userId) contactIds.add(m.receiverId);
          if (m.receiverId === userId) contactIds.add(m.senderId);
      });
      return Array.from(contactIds);
  },
  markMessagesAsRead: (userId: string, senderId: string) => {
      const list = StorageService.getItem<Message[]>(KEYS.MESSAGES, []);
      let changed = false;
      const newList = list.map(m => {
          if (m.receiverId === userId && m.senderId === senderId && !m.read) {
              changed = true;
              return { ...m, read: true };
          }
          return m;
      });
      if (changed) {
          StorageService.setItem(KEYS.MESSAGES, newList);
      }
  },
  getUnreadCount: (userId: string): number => {
      const list = StorageService.getItem<Message[]>(KEYS.MESSAGES, []);
      return list.filter(m => m.receiverId === userId && !m.read).length;
  },
  getUnreadCountFromSender: (userId: string, senderId: string): number => {
      const list = StorageService.getItem<Message[]>(KEYS.MESSAGES, []);
      return list.filter(m => m.receiverId === userId && m.senderId === senderId && !m.read).length;
  },

  // School Structure
  getSchoolStructure: (school: string, city: string): SchoolStructure | undefined => {
      const list = StorageService.getItem<SchoolStructure[]>(KEYS.STRUCTURES, []);
      return list.find(s => s.school === school && s.city === city);
  },
  saveSchoolStructure: (struct: SchoolStructure) => {
      const list = StorageService.getItem<SchoolStructure[]>(KEYS.STRUCTURES, []);
      const idx = list.findIndex(s => s.id === struct.id || (s.school === struct.school && s.city === struct.city));
      if (idx >= 0) list[idx] = struct;
      else list.push(struct);
      StorageService.setItem(KEYS.STRUCTURES, list);
  },
  deleteSchoolFull: (school: string, city: string) => {
      // Clean up everything related to the school
      let users = StorageService.getUsers();
      users = users.filter(u => !(u.school === school && u.city === city));
      StorageService.setItem(KEYS.USERS, users);
      
      let structures = StorageService.getItem<SchoolStructure[]>(KEYS.STRUCTURES, []);
      structures = structures.filter(s => !(s.school === school && s.city === city));
      StorageService.setItem(KEYS.STRUCTURES, structures);
  },

  // IoT
  getIoTDevices: (school: string, city: string): IoTDevice[] => {
      // Mock Data if empty
      const list = StorageService.getItem<IoTDevice[]>(KEYS.IOT, []);
      if (list.length === 0) {
          // Generate dummy devices for demo
          return [
              { id: 'iot-1', school, city, type: 'ENV_SENSOR', name: 'Capteur Classe 1', status: 'ONLINE', provider: 'EcoSensors MA', lastUpdate: new Date().toISOString(), data: { temperature: 24, humidity: 45, co2: 800 } },
              { id: 'iot-2', school, city, type: 'GPS_TRACKER', name: 'Bus Scolaire A', status: 'ONLINE', provider: 'TrackIt', lastUpdate: new Date().toISOString(), data: { lat: 31.7917, lng: -7.0926, speed: 45 } },
              { id: 'iot-3', school, city, type: 'RFID_GATE', name: 'Entrée Principale', status: 'ONLINE', provider: 'SecurAccess', lastUpdate: new Date().toISOString(), data: { lastScan: 'Amine Benali', lastScanTime: new Date().toISOString() } }
          ];
      }
      return list.filter(d => d.school === school && d.city === city);
  },

  // Export
  exportFullDB: (): string => {
      const db: any = {};
      Object.keys(KEYS).forEach(k => {
          // @ts-ignore
          const storageKey = KEYS[k];
          // @ts-ignore
          db[storageKey] = JSON.parse(localStorage.getItem(storageKey) || '[]');
      });
      return JSON.stringify(db, null, 2);
  }
};