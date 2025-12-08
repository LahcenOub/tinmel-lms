import { User, Quiz, QuizResult, UserRole, Message, Lesson, Announcement, SchoolStructure, PartnerRequest, QuestionType, LessonType } from '../types';

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
};

// Initialize Storage
const init = () => {
  // Start with empty users to trigger Installation Wizard if local
  if (!localStorage.getItem(KEYS.USERS)) {
    localStorage.setItem(KEYS.USERS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.QUIZZES)) {
    localStorage.setItem(KEYS.QUIZZES, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.RESULTS)) {
    localStorage.setItem(KEYS.RESULTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.MESSAGES)) {
    localStorage.setItem(KEYS.MESSAGES, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.LESSONS)) {
    localStorage.setItem(KEYS.LESSONS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.ANNOUNCEMENTS)) {
    localStorage.setItem(KEYS.ANNOUNCEMENTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.SCHOOL_STRUCTURES)) {
    localStorage.setItem(KEYS.SCHOOL_STRUCTURES, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.PARTNER_REQUESTS)) {
    localStorage.setItem(KEYS.PARTNER_REQUESTS, JSON.stringify([]));
  }
};

init();

export const StorageService = {
  // Session Persistence (Using sessionStorage to allow multi-tab login with different roles)
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

  // Check if Installed Locally (Has Admin)
  hasAdmin: (): boolean => {
      const users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
      return users.some(u => u.role === UserRole.ADMIN);
  },

  // Create Initial Admin locally
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

  // Backup / Restore
  exportFullDB: () => {
      const data: Record<string, any> = {};
      Object.values(KEYS).forEach(key => {
          // Skip CURRENT_USER from backup to avoid session conflicts on restore
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
  
  // User Management
  getUsers: (): User[] => JSON.parse(localStorage.getItem(KEYS.USERS) || '[]'),
  
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

  // Completely wipe an entire school (Users, Structure, Data)
  deleteSchoolFull: (schoolName: string, cityName: string) => {
      const clean = (str?: string) => str?.trim().toLowerCase() || '';
      const targetSchool = clean(schoolName);
      const targetCity = clean(cityName);

      console.log(`ATTEMPTING DELETE SCHOOL: ${targetSchool} in ${targetCity}`);

      // 1. Identify Users to delete (Staff AND Students)
      const allUsers = StorageService.getUsers();
      const usersToDelete = allUsers.filter(u => clean(u.school) === targetSchool && clean(u.city) === targetCity);
      const userIdsToDelete = new Set(usersToDelete.map(u => u.id));
      
      console.log(`Found ${usersToDelete.length} users to delete.`);

      // Keep users who are NOT in this school
      const remainingUsers = allUsers.filter(u => !(clean(u.school) === targetSchool && clean(u.city) === targetCity));
      localStorage.setItem(KEYS.USERS, JSON.stringify(remainingUsers));

      // 2. Delete Structure
      const structures: SchoolStructure[] = JSON.parse(localStorage.getItem(KEYS.SCHOOL_STRUCTURES) || '[]');
      const remainingStructures = structures.filter(s => !(clean(s.school) === targetSchool && clean(s.city) === targetCity));
      localStorage.setItem(KEYS.SCHOOL_STRUCTURES, JSON.stringify(remainingStructures));

      // 3. Delete Quizzes created by school staff
      const quizzes = StorageService.getQuizzes();
      const remainingQuizzes = quizzes.filter(q => !userIdsToDelete.has(q.professorId));
      localStorage.setItem(KEYS.QUIZZES, JSON.stringify(remainingQuizzes));

      // 4. Delete Lessons created by school staff
      const lessons = StorageService.getLessons();
      const remainingLessons = lessons.filter(l => !userIdsToDelete.has(l.professorId));
      localStorage.setItem(KEYS.LESSONS, JSON.stringify(remainingLessons));
      
      // 5. Delete Results for this school (Student is in school OR Quiz was created by school staff)
      const results = StorageService.getResults();
      const remainingResults = results.filter(r => !userIdsToDelete.has(r.studentId)); 
      localStorage.setItem(KEYS.RESULTS, JSON.stringify(remainingResults));

      // 6. Delete Messages related to this school (Staff chat or individual messages)
      const messages: Message[] = JSON.parse(localStorage.getItem(KEYS.MESSAGES) || '[]');
      const staffChatIdPattern = `chat_${targetSchool}_${targetCity}`; 
      
      const remainingMessages = messages.filter(m => 
          !m.receiverId.toLowerCase().includes(staffChatIdPattern) && 
          !userIdsToDelete.has(m.senderId) && 
          !userIdsToDelete.has(m.receiverId)
      );
      localStorage.setItem(KEYS.MESSAGES, JSON.stringify(remainingMessages));
      
      console.log("School deleted successfully from LocalStorage.");
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

  // RISK DETECTION ALGORITHM
  getStudentsAtRisk: (school: string, city: string) => {
      const users = StorageService.getUsers();
      const results = StorageService.getResults();
      const now = new Date();

      const schoolStudents = users.filter(u => u.role === UserRole.STUDENT && u.school === school && u.city === city);

      return schoolStudents.map(student => {
          // 1. Calculate Average Performance
          const myResults = results.filter(r => r.studentId === student.id);
          let avgScore = 0;
          if (myResults.length > 0) {
              const totalPct = myResults.reduce((acc, r) => acc + (r.score / r.maxScore), 0);
              avgScore = (totalPct / myResults.length) * 100;
          }

          // 2. Calculate Days Since Last Login
          let daysAbsent = -1; // -1 means never logged in or unknown
          if (student.lastLogin) {
              const last = new Date(student.lastLogin);
              const diffTime = Math.abs(now.getTime() - last.getTime());
              daysAbsent = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          } else {
              daysAbsent = 999; // Treat never logged in as high risk
          }

          // 3. Determine Risk Level
          let riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
          if (daysAbsent > 7 || (myResults.length > 0 && avgScore < 40)) {
              riskLevel = 'HIGH';
          } else if (daysAbsent > 3 || (myResults.length > 0 && avgScore < 60)) {
              riskLevel = 'MEDIUM';
          }

          return {
              ...student,
              avgScore: Math.round(avgScore),
              daysAbsent,
              riskLevel
          };
      }).filter(s => s.riskLevel !== 'LOW'); // Only return students with some risk
  },

  getUsersByRole: (role: UserRole): User[] => {
    return StorageService.getUsers().filter((u) => u.role === role);
  },

  // Auth
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

  cleanUsername: (str: string): string => {
      return str.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  },

  // Quiz Management
  getQuizzes: (): Quiz[] => JSON.parse(localStorage.getItem(KEYS.QUIZZES) || '[]'),
  
  saveQuiz: (quiz: Quiz) => {
    const quizzes = StorageService.getQuizzes();
    const index = quizzes.findIndex((q) => q.id === quiz.id);
    if (index >= 0) {
      quizzes[index] = quiz;
    } else {
      quizzes.push(quiz);
    }
    localStorage.setItem(KEYS.QUIZZES, JSON.stringify(quizzes));
  },

  getQuizzesByProf: (profId: string): Quiz[] => {
      return StorageService.getQuizzes().filter(q => q.professorId === profId);
  },

  // Filtered by enrolled classes AND school/city scope
  getAvailableQuizzesForStudent: (student: User): Quiz[] => {
      const validClasses = new Set<string>();
      if (student.class) validClasses.add(student.class);
      if (student.enrolledClasses) student.enrolledClasses.forEach(c => validClasses.add(c));
      
      if (validClasses.size === 0) return [];
      
      const quizzes = StorageService.getQuizzes().filter(q => 
          q.status === 'PUBLISHED' && 
          (q.assignedClasses.length === 0 || q.assignedClasses.some(ac => validClasses.has(ac)))
      );
      
      const users = StorageService.getUsers();
      const profsMap = new Map(users.map(u => [u.id, u]));
      
      return quizzes.filter(q => {
          const prof = profsMap.get(q.professorId);
          if (student.school && prof && (prof.school !== student.school || prof.city !== student.city)) {
              return false;
          }
          return true;
      });
  },

  // Results & Gamification
  getResults: (): QuizResult[] => JSON.parse(localStorage.getItem(KEYS.RESULTS) || '[]'),

  saveResult: (result: QuizResult) => {
    const results = StorageService.getResults();
    results.push(result);
    localStorage.setItem(KEYS.RESULTS, JSON.stringify(results));
    
    // GAMIFICATION LOGIC
    // Update Student XP
    const users = StorageService.getUsers();
    const studentIdx = users.findIndex(u => u.id === result.studentId);
    if (studentIdx >= 0) {
        const student = users[studentIdx];
        
        // Init gamification if missing
        if (!student.xp) student.xp = 0;
        if (!student.level) student.level = 1;
        if (!student.badges) student.badges = [];

        // 1. Award XP based on score %
        const percentage = result.score / result.maxScore;
        const earnedXP = Math.floor(percentage * 100); 
        student.xp += earnedXP;

        // 2. Level Up Logic (1000 XP per level)
        const newLevel = Math.floor(student.xp / 1000) + 1;
        if (newLevel > student.level) {
            student.level = newLevel;
            // Optionally: Trigger a "Level Up" alert in UI via a different mechanism
        }

        // 3. Award Badges
        const badges = new Set(student.badges);
        
        // "First Quiz" Badge
        badges.add('badge_first_quiz');
        
        // "Perfect Score" Badge
        if (percentage === 1) {
            badges.add('badge_perfect_score');
        }

        // "Speedster" Badge (Arbitrary: < 60s for > 5 questions)
        if (result.timeSpent && result.timeSpent < 60 && result.maxScore >= 5) {
             badges.add('badge_speedster');
        }

        student.badges = Array.from(badges);
        users[studentIdx] = student;
        localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    }
  },

  getResultsByQuiz: (quizId: string): QuizResult[] => {
      return StorageService.getResults().filter(r => r.quizId === quizId);
  },

  // Messages
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

  getProfessorsForStudent: (student: User): User[] => {
      if (!student.class && (!student.enrolledClasses || student.enrolledClasses.length === 0)) return [];
      
      const users = StorageService.getUsers();
      // Only get professors who are assigned to classes the student is enrolled in
      const studentClasses = new Set(student.enrolledClasses || []);
      if (student.class) studentClasses.add(student.class);

      return users.filter(u => 
          u.role === UserRole.PROFESSOR && 
          u.school === student.school && 
          u.city === student.city &&
          u.assignedSections?.some(section => studentClasses.has(section))
      );
  },

  // --- Notification Helpers ---

  // Count unread messages where the user is the receiver
  getUnreadCount: (userId: string): number => {
      const all: Message[] = JSON.parse(localStorage.getItem(KEYS.MESSAGES) || '[]');
      return all.filter(m => m.receiverId === userId && !m.read).length;
  },

  // Mark specific messages as read
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
      if (updated) {
          localStorage.setItem(KEYS.MESSAGES, JSON.stringify(newMessages));
      }
  },

  // For Staff Room: Count messages newer than last visited time
  getNewStaffMessagesCount: (groupId: string, lastVisited: string, currentUserId: string): number => {
      const all: Message[] = JSON.parse(localStorage.getItem(KEYS.MESSAGES) || '[]');
      const lastVisitTime = new Date(lastVisited).getTime();
      return all.filter(m => 
          m.receiverId === groupId && 
          m.senderId !== currentUserId && // Don't count own messages
          new Date(m.timestamp).getTime() > lastVisitTime
      ).length;
  },

  // Lessons
  getLessons: (): Lesson[] => JSON.parse(localStorage.getItem(KEYS.LESSONS) || '[]'),

  saveLesson: (lesson: Lesson) => {
      const lessons = StorageService.getLessons();
      const index = lessons.findIndex(l => l.id === lesson.id);
      if (index >= 0) lessons[index] = lesson;
      else lessons.push(lesson);
      localStorage.setItem(KEYS.LESSONS, JSON.stringify(lessons));
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
      
      const lessons = StorageService.getLessons().filter(l => 
          l.status === 'PUBLISHED' && 
          l.assignedClasses.some(ac => validClasses.has(ac))
      );

      const users = StorageService.getUsers();
      const profsMap = new Map(users.map(u => [u.id, u]));

      return lessons.filter(l => {
          const prof = profsMap.get(l.professorId);
          if (student.school && prof && (prof.school !== student.school || prof.city !== student.city)) {
              return false;
          }
          return true;
      });
  },

  // Announcements
  getAnnouncements: (): Announcement[] => JSON.parse(localStorage.getItem(KEYS.ANNOUNCEMENTS) || '[]'),
  
  saveAnnouncement: (announcement: Announcement) => {
      const all = StorageService.getAnnouncements();
      all.unshift(announcement); 
      localStorage.setItem(KEYS.ANNOUNCEMENTS, JSON.stringify(all));
  },

  // Partner Requests (Leads)
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

  // School Structures
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

  // Get School Global Stats (For Professors/Coordinator)
  getSchoolStats: (school: string, city: string) => {
      const users = StorageService.getUsers();
      const quizzes = StorageService.getQuizzes();
      const lessons = StorageService.getLessons();
      const results = StorageService.getResults();

      // Filter profs in this school
      const schoolProfs = users.filter(u => u.role === UserRole.PROFESSOR && u.school === school && u.city === city);
      const profIds = new Set(schoolProfs.map(u => u.id));

      const schoolQuizzes = quizzes.filter(q => profIds.has(q.professorId));
      const schoolLessons = lessons.filter(l => profIds.has(l.professorId));
      
      // Calculate total engagement (results)
      const schoolResults = results.filter(r => schoolQuizzes.some(q => q.id === r.quizId));

      return {
          quizCount: schoolQuizzes.length,
          lessonCount: schoolLessons.length,
          totalResults: schoolResults.length,
          profCount: schoolProfs.length
      };
  },

  // Gradebook Export Helper (Matrix)
  getSchoolGradebook: (school: string, city: string) => {
      const users = StorageService.getUsers();
      const quizzes = StorageService.getQuizzes();
      const results = StorageService.getResults();

      // 1. Get School Content
      const schoolProfs = users.filter(u => u.role === UserRole.PROFESSOR && u.school === school && u.city === city);
      const profIds = new Set(schoolProfs.map(u => u.id));
      const schoolQuizzes = quizzes.filter(q => profIds.has(q.professorId));

      // 2. Get Students
      const students = users.filter(u => u.role === UserRole.STUDENT && u.school === school && u.city === city);

      // 3. Build Matrix
      // Columns: Student Info | Quiz 1 | Quiz 2 ...
      const data = students.map(student => {
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
      
      return data;
  }
};