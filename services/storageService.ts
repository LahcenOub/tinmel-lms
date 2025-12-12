import { User, Quiz, QuizResult, UserRole, Message, Lesson, Announcement, SchoolStructure, PartnerRequest, WhiteboardSession, Stroke, WhiteboardMessage, IoTDevice, IoTDeviceType, SchoolEvent, LessonActivity } from '../types';

const KEYS = {
  USERS: 'quizmaster_users',
  QUIZZES: 'quizmaster_quizzes',
  RESULTS: 'quizmaster_results',
  MESSAGES: 'quizmaster_messages',
  LESSONS: 'quizmaster_lessons',
  ANNOUNCEMENTS: 'quizmaster_announcements',
  SCHOOL_STRUCTURES: 'quizmaster_structures',
  CURRENT_USER: 'quizmaster_current_user',
  PARTNER_REQUESTS: 'quizmaster_partner_requests',
  WHITEBOARDS: 'quizmaster_whiteboards',
  IOT_DEVICES: 'quizmaster_iot_devices',
  EVENTS: 'quizmaster_events',
  LESSON_ACTIVITY: 'quizmaster_lesson_activity', // New Key
};

// --- INITIALIZATION ---
const init = () => {
  const defaults: Record<string, any> = {
    [KEYS.USERS]: [],
    [KEYS.QUIZZES]: [],
    [KEYS.RESULTS]: [],
    [KEYS.MESSAGES]: [],
    [KEYS.LESSONS]: [],
    [KEYS.ANNOUNCEMENTS]: [],
    [KEYS.SCHOOL_STRUCTURES]: [],
    [KEYS.PARTNER_REQUESTS]: [],
    [KEYS.WHITEBOARDS]: [],
    [KEYS.IOT_DEVICES]: [],
    [KEYS.EVENTS]: [],
    [KEYS.LESSON_ACTIVITY]: [],
  };

  Object.keys(defaults).forEach(key => {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(defaults[key]));
    }
  });
};

init();

export const StorageService = {
  
  // --- 1. SYSTEM & SESSION ---
  
  saveSession: (user: User) => {
      sessionStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
  },
  getSession: (): User | null => {
      const stored = sessionStorage.getItem(KEYS.CURRENT_USER);
      return stored ? JSON.parse(stored) : null;
  },
  clearSession: () => {
      sessionStorage.removeItem(KEYS.CURRENT_USER);
  },
  
  // Check if Admin exists (for installation wizard)
  hasAdmin: (): boolean => {
      const users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
      return users.some(u => u.role === UserRole.ADMIN);
  },

  createAdmin: (data: { username: string, password: string, name: string, schoolName?: string }): boolean => {
      const users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
      if (users.some(u => u.role === UserRole.ADMIN)) return false;

      const newUser: User = {
          id: `admin-${Date.now()}`,
          username: data.username,
          password: data.password,
          name: data.name,
          role: UserRole.ADMIN,
          school: data.schoolName,
          accountType: 'INDIVIDUAL'
      };
      
      users.push(newUser);
      localStorage.setItem(KEYS.USERS, JSON.stringify(users));
      return true;
  },

  exportFullDB: () => {
      const data: Record<string, any> = {};
      Object.values(KEYS).forEach(key => {
          if (key !== KEYS.CURRENT_USER) {
            data[key] = localStorage.getItem(key);
          }
      });
      return JSON.stringify(data);
  },
  
  importFullDB: (json: string) => {
      try {
          const data = JSON.parse(json);
          Object.keys(data).forEach(key => {
              if (data[key]) localStorage.setItem(key, data[key]);
          });
          return true;
      } catch (e) {
          return false;
      }
  },

  // --- 2. USER MANAGEMENT ---

  getUsers: (): User[] => JSON.parse(localStorage.getItem(KEYS.USERS) || '[]'),
  
  getUsersByRole: (role: UserRole): User[] => {
    return StorageService.getUsers().filter((u) => u.role === role);
  },

  saveUser: (user: User) => {
    const users = StorageService.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
        users[index] = user;
    } else {
        users.push(user);
    }
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  },

  deleteUser: (id: string) => {
      const users = StorageService.getUsers().filter(u => u.id !== id);
      localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  },

  login: (username: string, password?: string): User | null => {
    const users = StorageService.getUsers();
    const clean = (str: string) => str.trim().toLowerCase();
    const cleanUsername = clean(username);
    const user = users.find((u) => clean(u.username) === cleanUsername);
    const cleanInputPass = password ? password.trim() : '';
    
    if (user && (user.password === cleanInputPass || !user.password)) { 
        StorageService.saveSession(user);
        return user;
    }
    return null;
  },

  resetUserPassword: (userId: string, newPass: string) => {
      const users = StorageService.getUsers();
      const user = users.find(u => u.id === userId);
      if (user) {
          user.password = newPass;
          localStorage.setItem(KEYS.USERS, JSON.stringify(users));
      }
  },

  updateLastLogin: (userId: string) => {
      const users = StorageService.getUsers();
      const idx = users.findIndex(u => u.id === userId);
      if (idx >= 0) {
          users[idx].lastLogin = new Date().toISOString();
          localStorage.setItem(KEYS.USERS, JSON.stringify(users));
      }
  },

  // --- 3. SCHOOL MANAGEMENT & STRUCTURE ---

  deleteSchoolFull: (schoolName: string, cityName: string) => {
      const clean = (str?: string) => str?.trim().toLowerCase() || '';
      const targetSchool = clean(schoolName);
      const targetCity = clean(cityName);

      // Filter out everything related to this school
      const filterOut = (item: any) => {
          // Check for direct school/city properties (User, SchoolStructure)
          if (item.school && item.city) {
              return !(clean(item.school) === targetSchool && clean(item.city) === targetCity);
          }
          return true;
      };

      // 1. Users
      const allUsers = StorageService.getUsers();
      const usersToDelete = allUsers.filter(u => clean(u.school) === targetSchool && clean(u.city) === targetCity);
      const userIdsToDelete = new Set(usersToDelete.map(u => u.id));
      localStorage.setItem(KEYS.USERS, JSON.stringify(allUsers.filter(filterOut)));

      // 2. Structures
      const structures = JSON.parse(localStorage.getItem(KEYS.SCHOOL_STRUCTURES) || '[]');
      localStorage.setItem(KEYS.SCHOOL_STRUCTURES, JSON.stringify(structures.filter(filterOut)));

      // 3. Quizzes & Lessons (by professor ID)
      const quizzes = StorageService.getQuizzes();
      localStorage.setItem(KEYS.QUIZZES, JSON.stringify(quizzes.filter(q => !userIdsToDelete.has(q.professorId))));

      const lessons = StorageService.getLessons();
      localStorage.setItem(KEYS.LESSONS, JSON.stringify(lessons.filter(l => !userIdsToDelete.has(l.professorId))));
      
      // 4. Results (by student ID)
      const results = StorageService.getResults();
      localStorage.setItem(KEYS.RESULTS, JSON.stringify(results.filter(r => !userIdsToDelete.has(r.studentId))));

      // 5. Messages
      const messages = JSON.parse(localStorage.getItem(KEYS.MESSAGES) || '[]');
      const staffChatIdPattern = `chat_${targetSchool}_${targetCity}`; 
      const remainingMessages = messages.filter((m: Message) => 
          !m.receiverId.toLowerCase().includes(staffChatIdPattern) && 
          !userIdsToDelete.has(m.senderId) && 
          !userIdsToDelete.has(m.receiverId)
      );
      localStorage.setItem(KEYS.MESSAGES, JSON.stringify(remainingMessages));
      
      // 6. IoT Devices
      const iot = JSON.parse(localStorage.getItem(KEYS.IOT_DEVICES) || '[]');
      localStorage.setItem(KEYS.IOT_DEVICES, JSON.stringify(iot.filter(filterOut)));
  },

  getSchoolStructure: (school: string, city: string): SchoolStructure | undefined => {
      const structures: SchoolStructure[] = JSON.parse(localStorage.getItem(KEYS.SCHOOL_STRUCTURES) || '[]');
      return structures.find(s => s.school === school && s.city === city);
  },

  saveSchoolStructure: (structure: SchoolStructure) => {
      const structures: SchoolStructure[] = JSON.parse(localStorage.getItem(KEYS.SCHOOL_STRUCTURES) || '[]');
      const index = structures.findIndex(s => s.school === structure.school && s.city === structure.city);
      if (index >= 0) {
          structures[index] = structure;
      } else {
          structures.push(structure);
      }
      localStorage.setItem(KEYS.SCHOOL_STRUCTURES, JSON.stringify(structures));
  },

  getSchoolStats: (school: string, city: string) => {
      const users = StorageService.getUsers();
      const quizzes = StorageService.getQuizzes();
      const lessons = StorageService.getLessons();
      const results = StorageService.getResults();

      const schoolProfs = users.filter(u => u.role === UserRole.PROFESSOR && u.school === school && u.city === city);
      const profIds = new Set(schoolProfs.map(u => u.id));

      const schoolQuizzes = quizzes.filter(q => profIds.has(q.professorId));
      const schoolLessons = lessons.filter(l => profIds.has(l.professorId));
      const schoolResults = results.filter(r => schoolQuizzes.some(q => q.id === r.quizId));

      return {
          quizCount: schoolQuizzes.length,
          lessonCount: schoolLessons.length,
          totalResults: schoolResults.length,
          profCount: schoolProfs.length
      };
  },

  getSchoolGradebook: (school: string, city: string) => {
      const users = StorageService.getUsers();
      const quizzes = StorageService.getQuizzes();
      const results = StorageService.getResults();

      const schoolProfs = users.filter(u => u.role === UserRole.PROFESSOR && u.school === school && u.city === city);
      const profIds = new Set(schoolProfs.map(u => u.id));
      const schoolQuizzes = quizzes.filter(q => profIds.has(q.professorId));
      const students = users.filter(u => u.role === UserRole.STUDENT && u.school === school && u.city === city);

      return students.map(student => {
          const row: any = {
              Name: student.name,
              Username: student.username,
              Classes: student.enrolledClasses?.join(', ') || ''
          };
          schoolQuizzes.forEach(q => {
              const res = results.find(r => r.quizId === q.id && r.studentId === student.id);
              row[q.title] = res ? `${res.score}/${res.maxScore}` : '-';
          });
          return row;
      });
  },

  // --- 4. CONTENT (Quizzes & Lessons) ---

  getQuizzes: (): Quiz[] => JSON.parse(localStorage.getItem(KEYS.QUIZZES) || '[]'),
  
  saveQuiz: (quiz: Quiz) => {
    const quizzes = StorageService.getQuizzes();
    const index = quizzes.findIndex((q) => q.id === quiz.id);
    if (index >= 0) quizzes[index] = quiz;
    else quizzes.push(quiz);
    localStorage.setItem(KEYS.QUIZZES, JSON.stringify(quizzes));
  },

  getQuizzesByProf: (profId: string): Quiz[] => {
      return StorageService.getQuizzes().filter(q => q.professorId === profId);
  },

  getAvailableQuizzesForStudent: (student: User): Quiz[] => {
      const validClasses = new Set<string>();
      if (student.class) validClasses.add(student.class);
      if (student.enrolledClasses) student.enrolledClasses.forEach(c => validClasses.add(c));
      
      if (validClasses.size === 0) return [];
      
      const quizzes = StorageService.getQuizzes().filter(q => 
          q.status === 'PUBLISHED' && 
          (q.assignedClasses.length === 0 || q.assignedClasses.some(ac => validClasses.has(ac)))
      );
      
      // Filter by School Scope
      const users = StorageService.getUsers();
      const profsMap = new Map(users.map(u => [u.id, u]));
      return quizzes.filter(q => {
          const prof = profsMap.get(q.professorId);
          return !(student.school && prof && (prof.school !== student.school || prof.city !== student.city));
      });
  },

  getLessons: (): Lesson[] => JSON.parse(localStorage.getItem(KEYS.LESSONS) || '[]'),

  saveLesson: (lesson: Lesson) => {
      const lessons = StorageService.getLessons();
      const index = lessons.findIndex(l => l.id === lesson.id);
      if (index >= 0) lessons[index] = lesson;
      else lessons.push(lesson);
      localStorage.setItem(KEYS.LESSONS, JSON.stringify(lessons));
  },

  completeLesson: (lessonId: string, studentId: string) => {
      const lessons = StorageService.getLessons();
      const index = lessons.findIndex(l => l.id === lessonId);
      if (index >= 0) {
          const lesson = lessons[index];
          const completedBy = lesson.completedBy || [];
          if (!completedBy.includes(studentId)) {
              lesson.completedBy = [...completedBy, studentId];
              lessons[index] = lesson;
              localStorage.setItem(KEYS.LESSONS, JSON.stringify(lessons));
          }
      }
  },

  deleteLesson: (id: string) => {
      const lessons = StorageService.getLessons().filter(l => l.id !== id);
      localStorage.setItem(KEYS.LESSONS, JSON.stringify(lessons));
  },

  getLessonsByProf: (profId: string): Lesson[] => {
      return StorageService.getLessons().filter(l => l.professorId === profId);
  },

  getLessonsForStudent: (student: User): Lesson[] => {
      const validClasses = new Set<string>();
      if (student.class) validClasses.add(student.class);
      if (student.enrolledClasses) student.enrolledClasses.forEach(c => validClasses.add(c));

      if (validClasses.size === 0) return [];
      
      const now = new Date().toISOString();

      const lessons = StorageService.getLessons().filter(l => 
          l.status === 'PUBLISHED' && 
          l.assignedClasses.some(ac => validClasses.has(ac)) &&
          (!l.availableFrom || l.availableFrom <= now) &&
          (!l.availableUntil || l.availableUntil >= now)
      );

      const users = StorageService.getUsers();
      const profsMap = new Map(users.map(u => [u.id, u]));
      return lessons.filter(l => {
          const prof = profsMap.get(l.professorId);
          return !(student.school && prof && (prof.school !== student.school || prof.city !== student.city));
      });
  },

  // --- REAL TIME LESSON ACTIVITY (Heartbeat) ---
  
  updateLessonActivity: (lessonId: string, studentId: string) => {
      const activities: LessonActivity[] = JSON.parse(localStorage.getItem(KEYS.LESSON_ACTIVITY) || '[]');
      const now = Date.now();
      
      // Remove old activity for this specific user on this lesson
      const filtered = activities.filter(a => !(a.lessonId === lessonId && a.studentId === studentId));
      
      // Add new activity
      filtered.push({ lessonId, studentId, timestamp: now });
      
      // Optional: Cleanup very old activities (e.g. > 1 hour) to keep storage clean
      const cleaned = filtered.filter(a => now - a.timestamp < 3600000);
      
      localStorage.setItem(KEYS.LESSON_ACTIVITY, JSON.stringify(cleaned));
  },

  getActiveStudentCount: (lessonId: string): number => {
      const activities: LessonActivity[] = JSON.parse(localStorage.getItem(KEYS.LESSON_ACTIVITY) || '[]');
      const now = Date.now();
      const ACTIVE_THRESHOLD_MS = 30000; // 30 seconds to be considered "online"

      // Filter activities for this lesson that are recent
      const activeUsers = activities.filter(a => 
          a.lessonId === lessonId && 
          (now - a.timestamp) < ACTIVE_THRESHOLD_MS
      );

      // Count unique student IDs
      const uniqueStudents = new Set(activeUsers.map(a => a.studentId));
      return uniqueStudents.size;
  },

  // --- 4.1 EVENTS & SCHEDULE ---
  
  getEvents: (): SchoolEvent[] => JSON.parse(localStorage.getItem(KEYS.EVENTS) || '[]'),

  saveEvent: (event: SchoolEvent) => {
      const events = StorageService.getEvents();
      const idx = events.findIndex(e => e.id === event.id);
      if (idx >= 0) events[idx] = event;
      else events.push(event);
      localStorage.setItem(KEYS.EVENTS, JSON.stringify(events));
  },

  deleteEvent: (id: string) => {
      const events = StorageService.getEvents().filter(e => e.id !== id);
      localStorage.setItem(KEYS.EVENTS, JSON.stringify(events));
  },

  getEventsByProf: (profId: string): SchoolEvent[] => {
      return StorageService.getEvents().filter(e => e.professorId === profId);
  },

  getEventsForStudent: (student: User): SchoolEvent[] => {
      const validClasses = new Set<string>();
      if (student.class) validClasses.add(student.class);
      if (student.enrolledClasses) student.enrolledClasses.forEach(c => validClasses.add(c));

      if (validClasses.size === 0) return [];

      const events = StorageService.getEvents().filter(e => 
          e.assignedClasses.some(ac => validClasses.has(ac))
      );
      
      return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  // --- 5. RESULTS & ANALYTICS ---

  getResults: (): QuizResult[] => JSON.parse(localStorage.getItem(KEYS.RESULTS) || '[]'),

  saveResult: (result: QuizResult) => {
    const results = StorageService.getResults();
    results.push(result);
    localStorage.setItem(KEYS.RESULTS, JSON.stringify(results));
    
    // Gamification Update
    const users = StorageService.getUsers();
    const studentIdx = users.findIndex(u => u.id === result.studentId);
    if (studentIdx >= 0) {
        const student = users[studentIdx];
        if (!student.xp) student.xp = 0;
        if (!student.level) student.level = 1;
        if (!student.badges) student.badges = [];

        const percentage = result.score / result.maxScore;
        student.xp += Math.floor(percentage * 100); 

        const newLevel = Math.floor(student.xp / 1000) + 1;
        if (newLevel > student.level) student.level = newLevel;

        const badges = new Set(student.badges);
        badges.add('badge_first_quiz');
        if (percentage === 1) badges.add('badge_perfect_score');
        if (result.timeSpent && result.timeSpent < 60 && result.maxScore >= 5) badges.add('badge_speedster');

        student.badges = Array.from(badges);
        users[studentIdx] = student;
        localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    }
  },

  getStudentsAtRisk: (school: string, city: string) => {
      const users = StorageService.getUsers();
      const results = StorageService.getResults();
      const now = new Date();

      const schoolStudents = users.filter(u => u.role === UserRole.STUDENT && u.school === school && u.city === city);

      return schoolStudents.map(student => {
          const myResults = results.filter(r => r.studentId === student.id);
          let avgScore = 0;
          if (myResults.length > 0) {
              const totalPct = myResults.reduce((acc, r) => acc + (r.score / r.maxScore), 0);
              avgScore = (totalPct / myResults.length) * 100;
          }

          let daysAbsent = -1; 
          if (student.lastLogin) {
              const last = new Date(student.lastLogin);
              daysAbsent = Math.ceil(Math.abs(now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
          } else {
              daysAbsent = 999;
          }

          let riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
          if (daysAbsent > 7 || (myResults.length > 0 && avgScore < 40)) riskLevel = 'HIGH';
          else if (daysAbsent > 3 || (myResults.length > 0 && avgScore < 60)) riskLevel = 'MEDIUM';

          return { ...student, avgScore: Math.round(avgScore), daysAbsent, riskLevel };
      }).filter(s => s.riskLevel !== 'LOW');
  },

  // --- 6. MESSAGING ---

  getMessages: (userId1: string, userId2: string): Message[] => {
      const all: Message[] = JSON.parse(localStorage.getItem(KEYS.MESSAGES) || '[]');
      return all.filter(m => 
        (m.senderId === userId1 && m.receiverId === userId2) || 
        (m.senderId === userId2 && m.receiverId === userId1)
      ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  getGroupMessages: (groupId: string): Message[] => {
      const all: Message[] = JSON.parse(localStorage.getItem(KEYS.MESSAGES) || '[]');
      return all.filter(m => m.receiverId === groupId)
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  sendMessage: (msg: Message) => {
      const all: Message[] = JSON.parse(localStorage.getItem(KEYS.MESSAGES) || '[]');
      all.push(msg);
      localStorage.setItem(KEYS.MESSAGES, JSON.stringify(all));
  },

  getConversationsForUser: (userId: string): string[] => {
      const all: Message[] = JSON.parse(localStorage.getItem(KEYS.MESSAGES) || '[]');
      const involved = new Set<string>();
      all.forEach(m => {
          if (m.senderId === userId && !m.receiverId.startsWith('chat_')) involved.add(m.receiverId);
          if (m.receiverId === userId && !m.senderId.startsWith('chat_')) involved.add(m.senderId);
      });
      return Array.from(involved);
  },

  getUnreadCount: (userId: string): number => {
      const all: Message[] = JSON.parse(localStorage.getItem(KEYS.MESSAGES) || '[]');
      return all.filter(m => m.receiverId === userId && !m.read).length;
  },

  markAsRead: (messageIds: string[]) => {
      const all: Message[] = JSON.parse(localStorage.getItem(KEYS.MESSAGES) || '[]');
      let updated = false;
      const newMessages = all.map(m => {
          if (messageIds.includes(m.id) && !m.read) {
              updated = true;
              return { ...m, read: true };
          }
          return m;
      });
      if (updated) localStorage.setItem(KEYS.MESSAGES, JSON.stringify(newMessages));
  },

  getNewStaffMessagesCount: (groupId: string, lastVisited: string, currentUserId: string): number => {
      const all: Message[] = JSON.parse(localStorage.getItem(KEYS.MESSAGES) || '[]');
      const lastVisitTime = new Date(lastVisited).getTime();
      return all.filter(m => 
          m.receiverId === groupId && 
          m.senderId !== currentUserId &&
          new Date(m.timestamp).getTime() > lastVisitTime
      ).length;
  },

  getProfessorsForStudent: (student: User): User[] => {
      if (!student.class && (!student.enrolledClasses || student.enrolledClasses.length === 0)) return [];
      const users = StorageService.getUsers();
      const studentClasses = new Set(student.enrolledClasses || []);
      if (student.class) studentClasses.add(student.class);

      return users.filter(u => 
          u.role === UserRole.PROFESSOR && 
          u.school === student.school && 
          u.city === student.city &&
          u.assignedSections?.some(section => studentClasses.has(section))
      );
  },

  // --- 7. ANNOUNCEMENTS & PARTNERS ---

  getAnnouncements: (): Announcement[] => JSON.parse(localStorage.getItem(KEYS.ANNOUNCEMENTS) || '[]'),
  
  saveAnnouncement: (announcement: Announcement) => {
      const all = StorageService.getAnnouncements();
      all.unshift(announcement); 
      localStorage.setItem(KEYS.ANNOUNCEMENTS, JSON.stringify(all));
  },

  getPartnerRequests: (): PartnerRequest[] => JSON.parse(localStorage.getItem(KEYS.PARTNER_REQUESTS) || '[]'),
  
  savePartnerRequest: (req: PartnerRequest) => {
      const all = StorageService.getPartnerRequests();
      all.unshift(req);
      localStorage.setItem(KEYS.PARTNER_REQUESTS, JSON.stringify(all));
  },
  
  updatePartnerRequestStatus: (id: string, status: 'PENDING' | 'CONTACTED') => {
      const all = StorageService.getPartnerRequests();
      const updated = all.map(r => r.id === id ? { ...r, status } : r);
      localStorage.setItem(KEYS.PARTNER_REQUESTS, JSON.stringify(updated));
  },

  // --- 8. WHITEBOARD ---

  getWhiteboards: (): WhiteboardSession[] => JSON.parse(localStorage.getItem(KEYS.WHITEBOARDS) || '[]'),
  
  saveWhiteboard: (wb: WhiteboardSession) => {
      const list = StorageService.getWhiteboards();
      const idx = list.findIndex(w => w.id === wb.id);
      if (idx >= 0) list[idx] = wb;
      else list.push(wb);
      localStorage.setItem(KEYS.WHITEBOARDS, JSON.stringify(list));
  },

  getWhiteboardByKey: (key: string): WhiteboardSession | undefined => {
      return StorageService.getWhiteboards().find(w => w.accessKey === key && w.isActive);
  },
  
  getWhiteboardById: (id: string): WhiteboardSession | undefined => {
      return StorageService.getWhiteboards().find(w => w.id === id);
  },

  addStrokeToWhiteboard: (wbId: string, stroke: Stroke) => {
      const list = StorageService.getWhiteboards();
      const idx = list.findIndex(w => w.id === wbId);
      if (idx >= 0) {
          list[idx].strokes.push(stroke);
          localStorage.setItem(KEYS.WHITEBOARDS, JSON.stringify(list));
      }
  },

  addMessageToWhiteboard: (wbId: string, message: WhiteboardMessage) => {
      const list = StorageService.getWhiteboards();
      const idx = list.findIndex(w => w.id === wbId);
      if (idx >= 0) {
          if (!list[idx].messages) list[idx].messages = [];
          list[idx].messages.push(message);
          localStorage.setItem(KEYS.WHITEBOARDS, JSON.stringify(list));
      }
  },

  // --- 9. IoT DEVICES ---

  getIoTDevices: (school: string, city: string): IoTDevice[] => {
      const all: IoTDevice[] = JSON.parse(localStorage.getItem(KEYS.IOT_DEVICES) || '[]');
      const devices = all.filter(d => d.school === school && d.city === city);
      
      // If no devices exist for this school, simulate initial setup
      if (devices.length === 0) {
          const mockDevices: IoTDevice[] = [
              {
                  id: `iot-1-${Date.now()}`,
                  type: 'ENV_SENSOR',
                  name: 'Capteur Classe 3',
                  school, city,
                  status: 'ONLINE',
                  provider: 'Morocco IoT Sol.',
                  data: { temperature: 22, humidity: 45, co2: 450 },
                  lastUpdate: new Date().toISOString()
              },
              {
                  id: `iot-2-${Date.now()}`,
                  type: 'ENV_SENSOR',
                  name: 'Capteur Cantine',
                  school, city,
                  status: 'ONLINE',
                  provider: 'Morocco IoT Sol.',
                  data: { temperature: 26, humidity: 60, co2: 800 },
                  lastUpdate: new Date().toISOString()
              },
              {
                  id: `iot-3-${Date.now()}`,
                  type: 'GPS_TRACKER',
                  name: 'Bus Scolaire #4',
                  school, city,
                  status: 'ONLINE',
                  provider: 'GPS Maroc',
                  data: { lat: 31.7917, lng: -7.0926, speed: 45 },
                  lastUpdate: new Date().toISOString()
              },
              {
                  id: `iot-4-${Date.now()}`,
                  type: 'RFID_GATE',
                  name: 'Portail Principal',
                  school, city,
                  status: 'ONLINE',
                  provider: 'SecuTech',
                  data: { lastScan: 'Amine B.', lastScanTime: new Date().toISOString() },
                  lastUpdate: new Date().toISOString()
              }
          ];
          const newAll = [...all, ...mockDevices];
          localStorage.setItem(KEYS.IOT_DEVICES, JSON.stringify(newAll));
          return mockDevices;
      }
      
      // Simulate real-time updates on fetch (Mock Data fluctuation)
      return devices.map(d => {
          if (d.type === 'ENV_SENSOR') {
              d.data.temperature = parseFloat((d.data.temperature! + (Math.random() - 0.5)).toFixed(1));
              d.data.co2 = Math.floor(d.data.co2! + (Math.random() * 20 - 10));
          }
          if (d.type === 'GPS_TRACKER') {
              d.data.lat = d.data.lat! + (Math.random() * 0.001 - 0.0005);
              d.data.lng = d.data.lng! + (Math.random() * 0.001 - 0.0005);
          }
          d.lastUpdate = new Date().toISOString();
          return d;
      });
  }
};