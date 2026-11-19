import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Calendar, CheckCircle2, Clock, Play, Pause, RotateCcw, 
  Plus, Trash2, Edit3, Search, Filter, Bookmark, AlertCircle, 
  BarChart3, Settings, User, Mail, Bell, Sun, Moon, ArrowRight, 
  ChevronRight, ChevronDown, Check, Folder, Tag, Download, 
  Flame, Shield, LogOut, Coffee, Timer as TimerIcon,
  Layers, FileText, CheckSquare, ListTodo, Star, Compass, RefreshCw,
  X, Zap, ExternalLink, Image as ImageIcon, Upload
} from 'lucide-react';

// ==========================================
// INITIAL MOCK DATA & PERSISTENT STORAGE KEYS
// ==========================================

// High-resolution Bob Marley artistic painting wallpaper & avatar default
const DEFAULT_ART_BG = "https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=1800&q=85";
const BOB_MARLEY_PORTRAIT = "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1600&q=85";

const INITIAL_USER = {
  name: "Alex Sterling",
  email: "alex.sterling@devmatrix.io",
  avatar: BOB_MARLEY_PORTRAIT,
  bgImage: BOB_MARLEY_PORTRAIT,
  role: "Lead Systems Architect",
  timezone: "Africa/Kigali (CAT)",
  timeFormat: "24h",
  emailDigest: true,
  emailTime: "08:00",
  reportFrequency: "daily"
};

const INITIAL_TASKS = [
  {
    id: "tsk-1",
    title: "Urgent task: Cloud Infrastructure Migration",
    description: "Refactor multi-region container orchestration and update security policies.",
    category: "Work",
    priority: "Urgent",
    status: "In Progress",
    dueDate: "2026-11-06",
    startTime: "09:00",
    endTime: "10:30",
    timeSpentSeconds: 3120,
    subtasks: [
      { id: "s1", text: "Validate terraform modules", completed: true },
      { id: "s2", text: "Apply zero-trust IAM roles", completed: true },
      { id: "s3", text: "Sync state with team @ 10:30", completed: false }
    ]
  },
  {
    id: "tsk-2",
    title: "Code review: Pull Request #482",
    description: "Audit WebSockets streaming and concurrency rate-limiters.",
    category: "Work",
    priority: "High",
    status: "In Progress",
    dueDate: "2026-11-06",
    startTime: "10:00",
    endTime: "11:00",
    timeSpentSeconds: 1800,
    subtasks: [
      { id: "s4", text: "Unit test coverage check", completed: true },
      { id: "s5", text: "Benchmarking latency", completed: false }
    ]
  },
  {
    id: "tsk-3",
    title: "Deep Learning Neural Architecture study",
    description: "Complete module 4 of transformers optimization and latent diffusion notes.",
    category: "Learning",
    priority: "Medium",
    status: "Not Started",
    dueDate: "2026-11-06",
    startTime: "11:00",
    endTime: "12:30",
    timeSpentSeconds: 0,
    subtasks: [
      { id: "s6", text: "Read Attention Is All You Need re-annotated", completed: false },
      { id: "s7", text: "Draft summary in notebook", completed: false }
    ]
  },
  {
    id: "tsk-4",
    title: "Quarterly OKR review & roadmap sync",
    description: "Consolidate Q4 team deliverables and set milestone projections.",
    category: "Projects",
    priority: "High",
    status: "Completed",
    dueDate: "2026-11-05",
    startTime: "13:00",
    endTime: "14:15",
    timeSpentSeconds: 4500,
    subtasks: [
      { id: "s8", text: "Collect sprint retros", completed: true },
      { id: "s9", text: "Present roadmap slides", completed: true }
    ]
  },
  {
    id: "tsk-5",
    title: "Hydration & posture mobility stretches",
    description: "Mobility routine and 500ml water intake.",
    category: "Personal",
    priority: "Low",
    status: "Not Started",
    dueDate: "2026-11-06",
    startTime: "15:00",
    endTime: "15:20",
    timeSpentSeconds: 0,
    subtasks: []
  }
];

const INITIAL_ROUTINES = [
  { id: "r1", period: "Morning", title: "Sunrise Mindful Meditation", time: "05:30", duration: 20, completed: true, streak: 14, days: [1,2,3,4,5,6,7] },
  { id: "r2", period: "Morning", title: "Hydration & High-Intensity Cardio", time: "06:00", duration: 45, completed: true, streak: 12, days: [1,2,3,4,5] },
  { id: "r3", period: "Morning", title: "Academic & Tech Paper Reading", time: "07:00", duration: 60, completed: true, streak: 8, days: [1,2,3,4,5,6] },
  { id: "r4", period: "Afternoon", title: "Clean Nutrition & 15m Walk", time: "13:00", duration: 45, completed: false, streak: 9, days: [1,2,3,4,5] },
  { id: "r5", period: "Afternoon", title: "Focused Architecture Deep Work", time: "14:00", duration: 120, completed: false, streak: 21, days: [1,2,3,4,5] },
  { id: "r6", period: "Evening", title: "Daily Retrospective & Tomorrow Plan", time: "20:00", duration: 25, completed: false, streak: 17, days: [1,2,3,4,5,6,7] },
  { id: "r7", period: "Evening", title: "Digital Sunset & Fiction Reading", time: "21:30", duration: 45, completed: false, streak: 5, days: [1,2,3,4,5,6,7] }
];

const INITIAL_NOTES = [
  {
    id: "nt-1",
    title: "Distributed Edge Computing Architecture",
    category: "Work",
    pinned: true,
    tags: ["architecture", "scaling", "k8s"],
    updatedAt: "Today at 10:14 AM",
    content: "Key principles for multi-region failover:\n- Replicate auth sessions through localized key-value clusters.\n- Target sub-15ms cold start for serverless edge handlers.\n- Implement circuit breakers to protect relational read replicas."
  },
  {
    id: "nt-2",
    title: "2026 Core Growth & Learning Goals",
    category: "Learning",
    pinned: true,
    tags: ["growth", "ai", "personal"],
    updatedAt: "Yesterday at 04:30 PM",
    content: "1. Master Rust for high-throughput stream engines.\n2. Deep dive into state-space neural models (Mamba/S4).\n3. Maintain 85%+ consistency across morning athletic routines."
  },
  {
    id: "nt-3",
    title: "App Idea: Voice-First AI Sprint Coach",
    category: "Ideas",
    pinned: false,
    tags: ["startup", "ideas", "mobile"],
    updatedAt: "3 days ago",
    content: "A frictionless voice memo assistant that captures ambient standup thoughts, organizes them into Kanban cards, and generates daily execution burndown charts without touching the screen."
  }
];

export default function App() {
  // Navigation & View States
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSubPage, setActiveSubPage] = useState('Overview');
  const [themeMode, setThemeMode] = useState('dark');
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState('login');
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');

  // ExBOS Floating Navigation States
  const [modulePanelOpen, setModulePanelOpen] = useState(false);
  const [quickPanelOpen, setQuickPanelOpen] = useState(false);
  const [activeModuleHover, setActiveModuleHover] = useState(null);
  const navContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Real-time Clock synced to Africa/Kigali (CAT)
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Core State (Loaded with LocalStorage fallbacks)
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('zen_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure avatar & bgImage are synchronized
        if (!parsed.bgImage) parsed.bgImage = parsed.avatar || BOB_MARLEY_PORTRAIT;
        return parsed;
      } catch (e) {
        return INITIAL_USER;
      }
    }
    return INITIAL_USER;
  });

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('zen_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [routines, setRoutines] = useState(() => {
    const saved = localStorage.getItem('zen_routines');
    return saved ? JSON.parse(saved) : INITIAL_ROUTINES;
  });

  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('zen_notes');
    return saved ? JSON.parse(saved) : INITIAL_NOTES;
  });

  // Global Active Timer Engine (Runs consistently across tab switches)
  const [timerMode, setTimerMode] = useState('pomodoro'); // pomodoro | stopwatch | countdown
  const [timerStatus, setTimerStatus] = useState('paused'); // running | paused | stopped
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [activeTaskId, setActiveTaskId] = useState('tsk-1');
  const [pomodoroStage, setPomodoroStage] = useState('work'); // work (25m) | break (5m) | longBreak (15m)
  const [pomodoroCycles, setPomodoroCycles] = useState(3);
  const [toastMessage, setToastMessage] = useState(null);

  // ExBOS Navigation Modules Configuration
  const navModules = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Compass,
      sub: ['Overview', 'Momentum', 'Schedule Today', 'Live Flow']
    },
    {
      id: 'tasks',
      label: 'To-Do List',
      icon: ListTodo,
      sub: ['All Tasks', 'Urgent Items', 'In Progress', 'Completed']
    },
    {
      id: 'timer',
      label: 'Active Tasks & Timer',
      icon: TimerIcon,
      sub: ['Pomodoro Focus', 'Stopwatch', 'Countdown Mode', 'Session Log']
    },
    {
      id: 'routine',
      label: 'Daily Routine',
      icon: Flame,
      sub: ['Morning Ritual', 'Afternoon Habits', 'Evening Reflection', 'Streaks']
    },
    {
      id: 'calendar',
      label: 'Calendar & Schedule',
      icon: Calendar,
      sub: ['Timeline View', 'Week 42 Matrix', 'Month View', 'Upcoming Deadlines']
    },
    {
      id: 'notes',
      label: 'Notebook',
      icon: FileText,
      sub: ['All Notes', 'Work Architecture', 'Ideas & Concepts', 'Archived']
    },
    {
      id: 'analytics',
      label: 'Reports & Analytics',
      icon: BarChart3,
      sub: ['Productivity Score', 'Weekly Focus Hours', 'Consistency Trend', 'Export PDF']
    },
    {
      id: 'notifications',
      label: 'Email & Alerts',
      icon: Mail,
      sub: ['Scheduled Digest', 'Email Dispatch', 'Priority Alerts']
    },
    {
      id: 'settings',
      label: 'Profile & Settings',
      icon: Settings,
      sub: ['Account Profile', 'Preferences', 'Data Backup', 'Security']
    }
  ];

  // ExBOS Quick Actions Configuration
  const quickActions = [
    { label: 'New Task', icon: Plus, action: () => { setActiveTab('tasks'); showToast("Switched to task creator"); } },
    { label: 'Start Timer', icon: Play, action: () => { setActiveTab('timer'); setTimerStatus('running'); showToast("Initiated focus timer!"); } },
    { label: 'Add Habit', icon: Flame, action: () => { setActiveTab('routine'); showToast("Opening Habit routine builder"); } },
    { label: 'New Note', icon: FileText, action: () => { setActiveTab('notes'); showToast("Opening Notebook draft"); } },
    { label: 'Week 42', icon: Calendar, action: () => { setActiveTab('calendar'); showToast("Navigated to Week 42 view"); } },
    { label: 'Send Digest', icon: Mail, action: () => { setActiveTab('notifications'); showToast("Readying email brief dispatch"); } }
  ];

  // Safe storage helper with quota detection
  const safeStorageSet = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`Storage quota exceeded or restricted for ${key}:`, e);
    }
  };

  // Sync to local storage safely (Strip heavy base64 before saving to avoid QuotaExceededError)
  useEffect(() => {
    const userToSave = { ...user };
    // If avatar or bgImage is a heavy data URL, don't crash localStorage
    if (typeof userToSave.avatar === 'string' && userToSave.avatar.startsWith('data:')) {
      userToSave.avatar = BOB_MARLEY_PORTRAIT;
    }
    if (typeof userToSave.bgImage === 'string' && userToSave.bgImage.startsWith('data:')) {
      userToSave.bgImage = BOB_MARLEY_PORTRAIT;
    }
    safeStorageSet('zen_user', userToSave);
  }, [user]);

  useEffect(() => {
    safeStorageSet('zen_tasks', tasks);
  }, [tasks]);

  useEffect(() => {
    safeStorageSet('zen_routines', routines);
  }, [routines]);

  useEffect(() => {
    safeStorageSet('zen_notes', notes);
  }, [notes]);

  // Toast auto-clear
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Synchronized Profile & Wallpaper Photo Handler
  const handleProfilePhotoChange = (newPhotoUrl) => {
    setUser(prev => ({
      ...prev,
      avatar: newPhotoUrl,
      bgImage: newPhotoUrl
    }));
    showToast("Profile avatar & dynamic ambient background updated!");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result;
        if (result && typeof result === 'string') {
          handleProfilePhotoChange(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Live Timer Interval Engine
  useEffect(() => {
    let interval = null;
    if (timerStatus === 'running') {
      interval = setInterval(() => {
        if (timerMode === 'stopwatch') {
          setTimerSeconds(s => s + 1);
        } else {
          setTimerSeconds(s => {
            if (s <= 1) {
              handleTimerCompletion();
              return 0;
            }
            return s - 1;
          });
        }

        if (activeTaskId) {
          setTasks(prev => prev.map(t => {
            if (t.id === activeTaskId) {
              return { ...t, timeSpentSeconds: (t.timeSpentSeconds || 0) + 1 };
            }
            return t;
          }));
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerStatus, timerMode, activeTaskId]);

  const handleTimerCompletion = () => {
    setTimerStatus('paused');
    if (timerMode === 'pomodoro') {
      if (pomodoroStage === 'work') {
        setPomodoroCycles(c => c + 1);
        setPomodoroStage('break');
        setTimerSeconds(5 * 60);
        showToast("Great job! Work sprint finished. Enjoy a 5-minute breather! ☕");
      } else {
        setPomodoroStage('work');
        setTimerSeconds(25 * 60);
        showToast("Break concluded! Back into flow state. 🚀");
      }
    } else {
      showToast("Time's up! Great session completed. ✨");
    }
  };

  // Helper Calculations
  const completedTasksCount = useMemo(() => tasks.filter(t => t.status === 'Completed').length, [tasks]);
  const pendingTasksCount = useMemo(() => tasks.filter(t => t.status !== 'Completed').length, [tasks]);
  const urgentTasksCount = useMemo(() => tasks.filter(t => t.priority === 'Urgent' && t.status !== 'Completed').length, [tasks]);
  const productivityScore = useMemo(() => {
    const total = tasks.length || 1;
    const taskRatio = (completedTasksCount / total) * 60;
    const routineRatio = (routines.filter(r => r.completed).length / (routines.length || 1)) * 40;
    return Math.min(100, Math.round(taskRatio + routineRatio));
  }, [tasks, routines, completedTasksCount]);

  const activeTask = tasks.find(t => t.id === activeTaskId) || tasks[0];

  const formatSeconds = (sec) => {
    const hrs = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleTaskCompletion = (taskId) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const nextStatus = t.status === 'Completed' ? 'In Progress' : 'Completed';
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  const toggleRoutine = (routineId) => {
    setRoutines(prev => prev.map(r => {
      if (r.id === routineId) {
        const nextState = !r.completed;
        return {
          ...r,
          completed: nextState,
          streak: nextState ? r.streak + 1 : Math.max(0, r.streak - 1)
        };
      }
      return r;
    }));
  };

  // Active module calculation for indicator position
  const activeModuleIndex = navModules.findIndex(m => m.id === activeTab);
  const activeModuleObj = navModules[activeModuleIndex] || navModules[0];

  return (
    <div className="relative min-h-screen w-full transition-colors duration-300 font-sans text-slate-100 selection:bg-emerald-500 selection:text-white overflow-x-hidden">
      
      {/* Hidden File Input for quick avatar/bg synchronizer */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* ======================================================== */}
      {/* DYNAMIC FULLSCREEN WALLPAPER (SYNCHRONIZED WITH AVATAR)   */}
      {/* ======================================================== */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-700 ease-out scale-100 pointer-events-none"
        style={{
          backgroundImage: `url(${user.bgImage || user.avatar || BOB_MARLEY_PORTRAIT})`
        }}
      />

      {/* Atmosphere Overlay (Solid Dark Green Tint, No Gradients) */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none transition-all duration-500"
        style={{
          backgroundColor: 'rgba(10, 26, 18, 0.68)',
          backdropFilter: 'blur(3px) saturate(130%)',
          WebkitBackdropFilter: 'blur(3px) saturate(130%)'
        }}
      />

      {/* Ambient Glow Rings (Solid Emerald Green, Responsive sizing) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 right-1/4 w-[320px] sm:w-[550px] h-[320px] sm:h-[550px] rounded-full blur-[90px] sm:blur-[120px] bg-emerald-600/15" />
        <div className="absolute -bottom-20 -left-20 w-[360px] sm:w-[650px] h-[360px] sm:h-[650px] rounded-full blur-[100px] sm:blur-[130px] bg-emerald-700/20" />
        <div className="absolute top-1/3 left-1/3 w-[260px] sm:w-[450px] h-[260px] sm:h-[450px] rounded-full blur-[80px] sm:blur-[110px] bg-emerald-500/12" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col md:flex-row">

        {/* ======================================================== */}
        {/* RESPONSIVE EXBOS NAVIGATION:                             */}
        {/* Mobile: Floating Bottom Dock (< md)                      */}
        {/* Desktop: Floating Capsule Sidebar (>= md)                */}
        {/* ======================================================== */}
        <aside className="fixed bottom-3 left-1/2 -translate-x-1/2 md:translate-x-0 md:bottom-auto md:left-4 lg:left-5 md:top-1/2 md:-translate-y-1/2 z-50 select-none max-w-[calc(100vw-24px)]">
          <nav 
            ref={navContainerRef}
            aria-label="Chronos primary navigation"
            style={{
              backgroundColor: 'rgba(16, 36, 25, 0.94)',
              backdropFilter: 'blur(14px) saturate(145%)',
              WebkitBackdropFilter: 'blur(14px) saturate(145%)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.55), 0 0 25px rgba(16, 185, 129, 0.12), inset 0 1px rgba(52, 211, 153, 0.3), inset 0 0 0 1px rgba(0,0,0,0.3)'
            }}
            className="w-auto md:w-[68px] lg:w-[72px] flex flex-row md:flex-col items-center gap-1 sm:gap-1.5 py-2 px-2.5 md:py-3 md:px-2 rounded-[32px] md:rounded-[42px] border border-emerald-500/30 relative isolation-auto transition-all duration-300 overflow-x-auto md:overflow-visible hide-scrollbar"
          >
            {/* Smooth Spring Active Indicator Pill (Responsive horizontal on mobile, vertical on desktop) */}
            <div 
              aria-hidden="true"
              style={{
                backgroundColor: '#10b981',
                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.45), inset 0 1px 2px rgba(255,255,255,0.4)',
                transition: 'top 0.54s cubic-bezier(0.2, 1.28, 0.35, 1), left 0.54s cubic-bezier(0.2, 1.28, 0.35, 1), box-shadow 0.22s ease',
                top: `${12 + (activeModuleIndex >= 0 ? activeModuleIndex : 0) * 49}px`
              }}
              className="absolute rounded-full pointer-events-none z-0 hidden md:block w-[44px] h-[44px] left-1/2 -translate-x-1/2"
            />

            {/* Navigation Module Buttons */}
            {navModules.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id;

              return (
                <div key={item.id} className="relative group/nav flex items-center justify-center shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === item.id) {
                        setModulePanelOpen(prev => !prev);
                        setQuickPanelOpen(false);
                      } else {
                        setActiveTab(item.id);
                        setActiveSubPage(item.sub[0]);
                        setModulePanelOpen(false);
                        setQuickPanelOpen(false);
                      }
                    }}
                    aria-label={item.label}
                    className={`relative z-10 w-10 h-10 md:w-[44px] md:h-[44px] rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                      isSelected 
                        ? 'text-white bg-emerald-500 md:bg-transparent shadow-md md:shadow-none' 
                        : 'text-emerald-100/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover/nav:scale-110" />

                    {/* Status Dot for Active/Urgent Notifications */}
                    {item.id === 'timer' && timerStatus === 'running' && (
                      <span className="absolute right-1.5 top-1.5 md:right-2 md:top-2 w-2 h-2 rounded-full bg-emerald-300 ring-2 ring-[#0c241a] animate-pulse" />
                    )}
                    {item.id === 'tasks' && urgentTasksCount > 0 && (
                      <span className="absolute right-1.5 top-1.5 md:right-2 md:top-2 w-2 h-2 rounded-full bg-emerald-300 ring-2 ring-[#0c241a]" />
                    )}
                  </button>

                  {/* ExBOS Tooltip (Desktop Only) */}
                  <div 
                    style={{ 
                      background: 'rgba(10, 26, 19, 0.92)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(52, 211, 153, 0.25)'
                    }}
                    className="hidden md:block absolute left-[calc(100%+16px)] top-1/2 -translate-y-1/2 z-30 px-3 py-1.5 rounded-xl text-xs font-semibold text-white whitespace-nowrap shadow-2xl opacity-0 group-hover/nav:opacity-100 pointer-events-none transition-all duration-200 translate-x-[-6px] group-hover/nav:translate-x-0"
                  >
                    {item.label}
                  </div>
                </div>
              );
            })}

            {/* Rail Divider (Horizontal on desktop, vertical on mobile) */}
            <div className="w-[1px] h-6 md:w-7 md:h-[1px] bg-emerald-400/30 mx-1 md:my-1 shrink-0" />

            {/* Solid Green Plus Quick Actions Button */}
            <div className="relative group/plus shrink-0">
              <button
                type="button"
                onClick={() => {
                  setQuickPanelOpen(prev => !prev);
                  setModulePanelOpen(false);
                }}
                aria-expanded={quickPanelOpen}
                aria-label="Open Quick Actions"
                style={{
                  backgroundColor: quickPanelOpen ? '#059669' : '#143825',
                  boxShadow: quickPanelOpen
                    ? '0 4px 18px rgba(16, 185, 129, 0.45), inset 0 1px rgba(255,255,255,0.3)'
                    : 'inset 0 1px rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.2)'
                }}
                className="w-10 h-10 md:w-[44px] md:h-[44px] rounded-full flex items-center justify-center text-white border border-emerald-500/30 transition-all duration-300 hover:scale-110 active:scale-95"
              >
                <Plus className={`w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 ${quickPanelOpen ? 'rotate-[135deg]' : ''}`} />
              </button>

              <div 
                style={{ background: 'rgba(10, 26, 19, 0.92)', backdropFilter: 'blur(8px)', border: '1px solid rgba(52, 211, 153, 0.25)' }}
                className="hidden md:block absolute left-[calc(100%+16px)] top-1/2 -translate-y-1/2 z-30 px-3 py-1.5 rounded-xl text-xs font-semibold text-white whitespace-nowrap shadow-2xl opacity-0 group-hover/plus:opacity-100 pointer-events-none transition-all duration-200 translate-x-[-6px] group-hover/plus:translate-x-0"
              >
                Quick Actions
              </div>
            </div>

            {/* User Profile / Photo Changer Trigger */}
            <div className="relative group/auth shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Click to upload profile photo & wallpaper"
                title="Click to sync photo & wallpaper"
                className="w-10 h-10 md:w-[44px] md:h-[44px] rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-all group-hover/auth:scale-105"
              >
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-7 h-7 md:w-8 md:h-8 rounded-full object-cover ring-2 ring-emerald-400/70 shadow-md" 
                />
              </button>
            </div>

            {/* Subnavigation Drawer Panel (Responsive Positioning) */}
            {modulePanelOpen && (
              <div 
                style={{
                  backgroundColor: 'rgba(14, 32, 22, 0.96)',
                  backdropFilter: 'blur(14px) saturate(145%)',
                  WebkitBackdropFilter: 'blur(14px) saturate(145%)',
                  boxShadow: '0 22px 65px rgba(0,0,0,0.7), inset 0 1px rgba(52, 211, 153, 0.25)'
                }}
                className="absolute bottom-[calc(100%+14px)] md:bottom-auto left-1/2 -translate-x-1/2 md:translate-x-0 md:left-[calc(100%+16px)] md:top-4 z-40 w-[270px] sm:w-64 p-3.5 rounded-[24px] border border-emerald-500/30 shadow-2xl text-slate-100 animate-fadeIn"
              >
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-emerald-500/20">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest font-extrabold text-emerald-300 block">
                      CHRONOS • SUBNAVIGATION
                    </span>
                    <h4 className="text-sm font-bold text-white leading-tight">
                      {activeModuleObj.label}
                    </h4>
                  </div>
                  <button 
                    onClick={() => setModulePanelOpen(false)}
                    className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1">
                  {activeModuleObj.sub.map((subName, i) => {
                    const isActive = activeSubPage === subName;
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setActiveSubPage(subName);
                          showToast(`${activeModuleObj.label} › ${subName}`);
                          setModulePanelOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                          isActive 
                            ? 'bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 backdrop-blur-sm' 
                            : 'text-slate-300 hover:bg-white/10 hover:text-white border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-[10px] font-mono text-emerald-400/70 font-bold">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span>{subName}</span>
                        </div>
                        {isActive && <span className="text-emerald-400 font-black">•</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Actions Panel (Responsive Positioning) */}
            {quickPanelOpen && (
              <div 
                style={{
                  backgroundColor: 'rgba(11, 28, 20, 0.96)',
                  backdropFilter: 'blur(12px) saturate(140%)',
                  WebkitBackdropFilter: 'blur(12px) saturate(140%)',
                  boxShadow: '0 22px 70px rgba(0,0,0,0.65), inset 0 1px rgba(52, 211, 153, 0.22)'
                }}
                className="absolute bottom-[calc(100%+14px)] md:bottom-2 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-[calc(100%+16px)] z-40 w-[290px] sm:w-80 p-3.5 rounded-[26px] border border-emerald-500/30 shadow-2xl text-slate-100 animate-fadeIn"
              >
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-emerald-500/20">
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">Quick Actions</h4>
                    <p className="text-[10px] text-emerald-200/70">Common productivity tasks</p>
                  </div>
                  <button 
                    onClick={() => setQuickPanelOpen(false)}
                    className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {quickActions.map((qa, idx) => {
                    const QAIcon = qa.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          qa.action();
                          setQuickPanelOpen(false);
                        }}
                        className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border border-emerald-500/20 bg-white/[0.08] hover:bg-emerald-500/20 text-white/90 hover:text-white transition group/act backdrop-blur-sm"
                      >
                        <QAIcon className="w-5 h-5 text-emerald-400 group-hover/act:scale-110 transition-transform" />
                        <span className="text-[10px] font-semibold text-center leading-tight">
                          {qa.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </nav>
        </aside>

        {/* ======================================================== */}
        {/* MAIN APPLICATION WORKSPACE CONTENT                        */}
        {/* Responsive padding: clears bottom bar on mobile,          */}
        {/* clears left sidebar on tablets & desktop                  */}
        {/* ======================================================== */}
        <main className="flex-1 flex flex-col w-full md:pl-[84px] lg:pl-[96px] pb-24 md:pb-8 overflow-y-auto min-h-screen">
          
          {/* Header containing exclusively the mail icon, search icon, and profile avatar */}
          <header 
            style={{
              backgroundColor: 'rgba(16, 28, 20, 0.75)',
              backdropFilter: 'blur(12px) saturate(140%)',
              WebkitBackdropFilter: 'blur(12px) saturate(140%)',
              borderBottom: '1px solid rgba(52, 211, 153, 0.15)'
            }}
            className="sticky top-0 z-30 px-4 sm:px-6 md:px-10 h-14 sm:h-16 md:h-[68px] flex items-center justify-end select-none"
          >
            {/* Action Icons: Mail, Search & Circular Profile Avatar */}
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Optional inline expandable search input */}
              {globalSearchOpen && (
                <div className="relative animate-fadeIn">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search anything..."
                    value={headerSearchQuery}
                    onChange={(e) => setHeaderSearchQuery(e.target.value)}
                    className="w-36 sm:w-52 md:w-60 px-3 py-1.5 rounded-full bg-white/10 border border-emerald-400/25 text-xs text-white placeholder-emerald-100/50 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                </div>
              )}

              {/* Minimalist Mail Icon */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('notifications');
                  showToast("Opening Email & Reports Digest");
                }}
                aria-label="Mail notifications"
                className="text-emerald-100/80 hover:text-white transition-opacity cursor-pointer p-1"
              >
                <svg 
                  className="w-[18px] h-[18px] sm:w-[19px] sm:h-[19px] stroke-current fill-none" 
                  viewBox="0 0 24 24" 
                  strokeWidth="1.6" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <rect x="2" y="4" width="20" height="16" rx="4" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </button>

              {/* Minimalist Search Icon */}
              <button
                type="button"
                onClick={() => setGlobalSearchOpen(prev => !prev)}
                aria-label="Search"
                className="text-emerald-100/80 hover:text-white transition-opacity cursor-pointer p-1"
              >
                <svg 
                  className="w-[18px] h-[18px] sm:w-[19px] sm:h-[19px] stroke-current fill-none" 
                  viewBox="0 0 24 24" 
                  strokeWidth="1.65" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="7.5" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </button>

              {/* Circular Avatar */}
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                title="Profile & Settings"
                className="relative rounded-full overflow-hidden hover:opacity-90 active:scale-95 transition cursor-pointer shrink-0"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-1 ring-emerald-400/50"
                />
              </button>
            </div>
          </header>

          {/* Module Content Switcher */}
          <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 flex-1 w-full max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView 
                user={user}
                tasks={tasks}
                routines={routines}
                notes={notes}
                currentTime={currentTime}
                productivityScore={productivityScore}
                urgentTasksCount={urgentTasksCount}
                pendingTasksCount={pendingTasksCount}
                completedTasksCount={completedTasksCount}
                activeTask={activeTask}
                timerStatus={timerStatus}
                timerSeconds={timerSeconds}
                formatSeconds={formatSeconds}
                toggleTaskCompletion={toggleTaskCompletion}
                toggleRoutine={toggleRoutine}
                setActiveTab={setActiveTab}
                showToast={showToast}
                themeMode={themeMode}
              />
            )}

            {activeTab === 'tasks' && (
              <TasksManagerView 
                tasks={tasks}
                setTasks={setTasks}
                setActiveTaskId={setActiveTaskId}
                setActiveTab={setActiveTab}
                showToast={showToast}
                themeMode={themeMode}
              />
            )}

            {activeTab === 'timer' && (
              <TimerWorkspaceView 
                timerMode={timerMode}
                setTimerMode={setTimerMode}
                timerStatus={timerStatus}
                setTimerStatus={setTimerStatus}
                timerSeconds={timerSeconds}
                setTimerSeconds={setTimerSeconds}
                activeTaskId={activeTaskId}
                setActiveTaskId={setActiveTaskId}
                tasks={tasks}
                pomodoroStage={pomodoroStage}
                pomodoroCycles={pomodoroCycles}
                formatSeconds={formatSeconds}
                showToast={showToast}
                themeMode={themeMode}
              />
            )}

            {activeTab === 'routine' && (
              <DailyRoutineView 
                routines={routines}
                setRoutines={setRoutines}
                toggleRoutine={toggleRoutine}
                showToast={showToast}
                themeMode={themeMode}
              />
            )}

            {activeTab === 'calendar' && (
              <CalendarScheduleView 
                tasks={tasks}
                routines={routines}
                showToast={showToast}
                themeMode={themeMode}
              />
            )}

            {activeTab === 'notes' && (
              <NotebookView 
                notes={notes}
                setNotes={setNotes}
                showToast={showToast}
                themeMode={themeMode}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsReportsView 
                tasks={tasks}
                routines={routines}
                productivityScore={productivityScore}
                showToast={showToast}
                themeMode={themeMode}
              />
            )}

            {activeTab === 'notifications' && (
              <NotificationsEmailView 
                user={user}
                setUser={setUser}
                tasks={tasks}
                routines={routines}
                showToast={showToast}
                themeMode={themeMode}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsProfileView 
                user={user}
                setUser={setUser}
                themeMode={themeMode}
                setThemeMode={setThemeMode}
                tasks={tasks}
                routines={routines}
                notes={notes}
                setTasks={setTasks}
                setRoutines={setRoutines}
                setNotes={setNotes}
                showToast={showToast}
                setAuthModalOpen={setAuthModalOpen}
                onPhotoChange={handleProfilePhotoChange}
                fileInputRef={fileInputRef}
              />
            )}
          </div>
        </main>
      </div>

      {/* Toast Notification Container */}
      {toastMessage && (
        <div 
          style={{
            background: 'rgba(16, 32, 22, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(52, 211, 153, 0.3)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
          }}
          className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-3 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl animate-fadeIn max-w-[calc(100vw-32px)] text-xs sm:text-sm"
        >
          <span className="font-semibold truncate">{toastMessage}</span>
        </div>
      )}

      {/* Authentication Modal */}
      {authModalOpen && (
        <AuthModal 
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          authView={authView}
          setAuthView={setAuthView}
          user={user}
          setUser={setUser}
          showToast={showToast}
          themeMode={themeMode}
        />
      )}
    </div>
  );
}

// ==========================================================
// 1. DASHBOARD VIEW (Solid Emerald Green Colors Only, Responsive)
// ==========================================================

function DashboardView({
  user, tasks, routines, notes, currentTime, productivityScore,
  urgentTasksCount, pendingTasksCount, completedTasksCount,
  activeTask, timerStatus, timerSeconds, formatSeconds,
  toggleTaskCompletion, toggleRoutine, setActiveTab, showToast, themeMode
}) {
  const cardStyle = {
    backgroundColor: 'rgba(14, 28, 20, 0.65)',
    backdropFilter: 'blur(10px) saturate(140%)',
    WebkitBackdropFilter: 'blur(10px) saturate(140%)',
    border: '1px solid rgba(52, 211, 153, 0.22)',
    boxShadow: '0 18px 45px rgba(0, 0, 0, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.12)'
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn w-full">
      {/* Welcome Banner Card */}
      <div 
        style={cardStyle}
        className="relative p-5 sm:p-7 md:p-8 rounded-[28px] sm:rounded-[32px] overflow-hidden transition-all duration-300 hover:border-emerald-400/40"
      >
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/35 text-[11px] sm:text-xs font-semibold text-emerald-300 mb-3 sm:mb-4 backdrop-blur-sm">
            Dose of Culture • 14-Day Flow
          </div>
          <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
            HELLO, WELCOME BACK TO MASTER YOUR TIME, <span className="text-emerald-400">{user.name.split(' ')[0]}</span>.
          </h1>
          <p className="mt-2 text-xs sm:text-sm md:text-base text-emerald-50/90 font-medium drop-shadow leading-relaxed">
            Channel velocity has <strong className="text-emerald-300">{urgentTasksCount} priority</strong> actions and <strong className="text-white">{pendingTasksCount} tasks</strong> queued. Your momentum score is running at <strong className="text-emerald-300">{productivityScore}%</strong>.
          </p>

          <div className="flex flex-wrap gap-2.5 sm:gap-3 mt-5 sm:mt-6">
            <button 
              onClick={() => setActiveTab('timer')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 sm:px-5 py-2.5 rounded-xl text-xs transition shadow-lg shadow-emerald-500/25 active:scale-95 flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-current text-white" />
              Focus on Current Task
            </button>
            <button 
              onClick={() => setActiveTab('routine')}
              className="bg-white/10 hover:bg-white/20 border border-emerald-500/40 text-emerald-100 font-semibold px-4 py-2.5 rounded-xl text-xs transition backdrop-blur-sm"
            >
              Review Daily Rituals
            </button>
          </div>
        </div>
      </div>

      {/* Productivity Metrics Bar - Distinct Solid Green Glass Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1 */}
        <div 
          style={cardStyle}
          className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl flex flex-col justify-between hover:scale-[1.01] transition"
        >
          <div className="flex items-center justify-between text-emerald-200/80 text-xs font-semibold">
            <span>Productivity Score</span>
          </div>
          <div className="mt-3 sm:mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">{productivityScore}%</span>
            <span className="text-xs text-emerald-400 font-bold">+12% vs avg</span>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-700" style={{ width: `${productivityScore}%` }} />
          </div>
        </div>

        {/* Metric 2 */}
        <div 
          style={cardStyle}
          className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl flex flex-col justify-between hover:scale-[1.01] transition"
        >
          <div className="flex items-center justify-between text-emerald-200/80 text-xs font-semibold">
            <span>Completed Actions</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 sm:mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">{completedTasksCount}</span>
            <span className="text-xs text-emerald-200/70 font-medium">/ {tasks.length} total</span>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(completedTasksCount / (tasks.length || 1)) * 100}%` }} />
          </div>
        </div>

        {/* Metric 3 */}
        <div 
          style={cardStyle}
          className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl flex flex-col justify-between hover:scale-[1.01] transition"
        >
          <div className="flex items-center justify-between text-emerald-200/80 text-xs font-semibold">
            <span>Active Focus Session</span>
            <TimerIcon className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 sm:mt-4 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-white font-mono">{formatSeconds(timerSeconds)}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${timerStatus === 'running' ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40' : 'bg-white/10 text-emerald-100/80'}`}>
              {timerStatus.toUpperCase()}
            </span>
          </div>
          <p className="text-[11px] text-emerald-100/75 mt-2 truncate">
            {activeTask ? activeTask.title : "No task queued"}
          </p>
        </div>

        {/* Metric 4 */}
        <div 
          style={cardStyle}
          className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl flex flex-col justify-between hover:scale-[1.01] transition"
        >
          <div className="flex items-center justify-between text-emerald-200/80 text-xs font-semibold">
            <span>Daily Routines</span>
            <Flame className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 sm:mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {routines.filter(r => r.completed).length} / {routines.length}
            </span>
            <span className="text-xs text-emerald-400 font-bold">Habits met</span>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(routines.filter(r => r.completed).length / routines.length) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Main Grid: Schedule Card & Habit Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        
        {/* LEFT COLUMN: Authentic Schedule Card in Solid Green Frosted Container */}
        <div className="lg:col-span-6 flex flex-col items-center w-full">
          <div className="w-full text-left mb-3 flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <h2 className="text-sm sm:text-base font-bold text-emerald-100 drop-shadow">Dose of Culture Schedule</h2>
            </div>
            <span className="text-xs font-semibold text-emerald-300">Week 42 Matrix</span>
          </div>

          {/* THE SIGNATURE SCHEDULE CARD (Fluid on Mobile) */}
          <div 
            style={{
              backgroundColor: 'rgba(16, 34, 24, 0.78)',
              backdropFilter: 'blur(16px) saturate(150%)',
              WebkitBackdropFilter: 'blur(16px) saturate(150%)',
              border: '1px solid rgba(52, 211, 153, 0.25)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.55), inset 0 1px 1px rgba(255,255,255,0.2)'
            }}
            className="w-full max-w-full lg:max-w-[430px] rounded-[28px] sm:rounded-[36px] p-4 sm:p-6 relative overflow-hidden text-slate-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6">
              <h3 className="text-lg sm:text-[22px] font-bold tracking-tight text-white drop-shadow">
                Week 42, 2024
              </h3>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => showToast("Week view selector clicked")}
                  aria-label="Select week dropdown"
                  style={{
                    background: 'rgba(255, 255, 255, 0.12)',
                    backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255, 255, 255, 0.18)'
                  }}
                  className="h-8 sm:h-9 px-3 sm:px-3.5 rounded-full hover:bg-white/20 flex items-center justify-center text-white/90 transition shadow-sm"
                >
                  <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                </button>

                {/* Minimalist Clock Widget */}
                <button 
                  onClick={() => showToast(`Current time: ${currentTime.toLocaleTimeString()}`)}
                  aria-label="Clock widget"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" strokeWidth="2.2" />
                    <circle cx="12" cy="4.5" r="0.7" fill="currentColor" />
                    <circle cx="19.5" cy="12" r="0.7" fill="currentColor" />
                    <circle cx="12" cy="19.5" r="0.7" fill="currentColor" />
                    <circle cx="4.5" cy="12" r="0.7" fill="currentColor" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Days Filter Row */}
            <div className="flex items-center justify-between text-xs sm:text-[15px] font-semibold text-slate-300 mb-5 sm:mb-6 px-1 select-none overflow-x-auto">
              <span className="text-white font-bold cursor-pointer hover:underline">Saśq</span>
              <span className="cursor-pointer hover:text-white transition">Mon</span>
              <span className="cursor-pointer hover:text-white transition">Tue</span>
              <span className="cursor-pointer hover:text-white transition">Tue</span>
              <span className="cursor-pointer hover:text-white transition flex items-center gap-0.5">
                <span>Tue</span>
                <span className="text-xs tracking-widest text-slate-400">....</span>
              </span>
            </div>

            {/* Schedule Timeline Section */}
            <div className="relative">
              {/* Continuous Vertical Timeline Line */}
              <div className="absolute left-[72px] sm:left-[88px] top-4 bottom-4 w-[1.5px] bg-white/20 -translate-x-1/2 pointer-events-none" />

              <div className="space-y-3.5 sm:space-y-4">
                
                {/* 1. Urgent Task Item (09:00 - Emerald chevron) */}
                <div className="flex items-center gap-2.5 sm:gap-3 relative group">
                  <div className="w-[42px] sm:w-[50px] text-right text-xs sm:text-[13px] font-semibold text-slate-300 tracking-tight shrink-0">
                    09:00
                  </div>
                  <button 
                    onClick={() => showToast("Urgent action 09:00 opened")}
                    className="relative z-10 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/40 ring-2 sm:ring-4 ring-[#16251f] shrink-0 active:scale-95 transition"
                  >
                    <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
                  </button>
                  <div 
                    onClick={() => setActiveTab('tasks')}
                    className="flex-1 min-w-0 bg-white hover:bg-slate-50 rounded-[18px] sm:rounded-[20px] p-3 sm:p-3.5 px-3.5 sm:px-4 cursor-pointer shadow-xl flex items-center justify-between transition-all transform hover:-translate-y-0.5"
                  >
                    <div className="pr-2 truncate">
                      <h4 className="text-sm sm:text-[15px] font-bold text-zinc-900 leading-tight truncate">Urgent task</h4>
                      <p className="text-[11px] sm:text-[12.5px] font-medium text-zinc-500 mt-0.5 truncate">Team sync @ 10:30</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400 stroke-[2.5] shrink-0" />
                  </div>
                </div>

                {/* 2. Code Review Item (10:00 - Green plus) */}
                <div className="flex items-center gap-2.5 sm:gap-3 relative group">
                  <div className="w-[42px] sm:w-[50px] text-right text-xs sm:text-[13px] font-semibold text-slate-300 tracking-tight shrink-0">
                    10:00
                  </div>
                  <button 
                    onClick={() => showToast("Create schedule slot at 10:00")}
                    className="relative z-10 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/40 ring-2 sm:ring-4 ring-[#16251f] shrink-0 active:scale-95 transition"
                  >
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                  </button>
                  <div 
                    onClick={() => setActiveTab('tasks')}
                    className="flex-1 min-w-0 bg-white hover:bg-slate-50 rounded-[18px] sm:rounded-[20px] p-3 sm:p-3.5 px-3.5 sm:px-4 cursor-pointer shadow-xl flex items-center justify-between transition-all transform hover:-translate-y-0.5"
                  >
                    <div className="pr-2 truncate">
                      <h4 className="text-sm sm:text-[15px] font-bold text-zinc-900 leading-tight truncate">Code review</h4>
                      <p className="text-[11px] sm:text-[12.5px] font-medium text-zinc-500 mt-0.5 truncate">Team sync @ 10:30</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400 stroke-[2.5] shrink-0" />
                  </div>
                </div>

                {/* 3. Code Review Item (11:00 with Parentheses Badge) */}
                <div className="flex items-center gap-2.5 sm:gap-3 relative group">
                  <div className="w-[42px] sm:w-[50px] text-right text-xs sm:text-[13px] font-semibold text-slate-300 tracking-tight shrink-0">
                    11:00
                  </div>
                  <button 
                    onClick={() => showToast("Review item active")}
                    className="relative z-10 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-700/40 ring-2 sm:ring-4 ring-[#16251f] shrink-0 active:scale-95 transition"
                  >
                    <span className="text-[11px] sm:text-xs font-black scale-y-125">()</span>
                  </button>
                  <div 
                    onClick={() => setActiveTab('tasks')}
                    className="flex-1 min-w-0 bg-white hover:bg-slate-50 rounded-[18px] sm:rounded-[20px] p-3 sm:p-3.5 px-3.5 sm:px-4 cursor-pointer shadow-xl flex items-center justify-between transition-all transform hover:-translate-y-0.5"
                  >
                    <div className="pr-2 truncate">
                      <h4 className="text-sm sm:text-[15px] font-bold text-zinc-900 leading-tight truncate">Code review</h4>
                      <p className="text-[11px] sm:text-[12.5px] font-medium text-zinc-500 mt-0.5 truncate">Team sync @ 10:30</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400 stroke-[2.5] shrink-0" />
                  </div>
                </div>

                {/* Dark Floating Tooltip: Review | progress */}
                <div className="absolute right-0 top-[135px] sm:top-[150px] z-30 pointer-events-none transform translate-y-1">
                  <div 
                    style={{
                      background: 'rgba(15, 23, 20, 0.94)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(52, 211, 153, 0.25)',
                      boxShadow: '0 12px 30px rgba(0,0,0,0.5)'
                    }}
                    className="text-white text-[11px] sm:text-xs font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl flex items-center gap-2"
                  >
                    <span className="text-emerald-400 font-bold">Review</span>
                    <span className="text-slate-500">|</span>
                    <span className="text-emerald-200">progress</span>
                  </div>
                </div>

                {/* 4. Code Review Item (11:00 Second slot with Green Plus) */}
                <div className="flex items-center gap-2.5 sm:gap-3 relative group">
                  <div className="w-[42px] sm:w-[50px] text-right text-xs sm:text-[13px] font-semibold text-slate-300 tracking-tight shrink-0">
                    11:00
                  </div>
                  <button 
                    onClick={() => showToast("Add 11:00 parallel item")}
                    className="relative z-10 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md ring-2 sm:ring-4 ring-[#16251f] shrink-0 active:scale-95 transition"
                  >
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                  </button>
                  <div 
                    onClick={() => setActiveTab('tasks')}
                    className="flex-1 min-w-0 bg-white hover:bg-slate-50 rounded-[18px] sm:rounded-[20px] p-3 sm:p-3.5 px-3.5 sm:px-4 cursor-pointer shadow-xl flex items-center justify-between transition-all transform hover:-translate-y-0.5"
                  >
                    <div className="pr-2 truncate">
                      <h4 className="text-sm sm:text-[15px] font-bold text-zinc-900 leading-tight truncate">Code review</h4>
                      <p className="text-[11px] sm:text-[12.5px] font-medium text-zinc-500 mt-0.5 truncate">Team sync @ 10:30</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400 stroke-[2.5] shrink-0" />
                  </div>
                </div>

                {/* White Floating Tooltip: 3 tasks this time slot */}
                <div className="absolute right-0 top-[205px] sm:top-[220px] z-30 pointer-events-none transform -translate-x-1">
                  <div className="bg-white text-zinc-900 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-left shadow-2xl border border-emerald-100">
                    <div className="text-xs sm:text-[13px] font-bold leading-tight text-emerald-600">3 tasks</div>
                    <div className="text-[11px] sm:text-[12px] font-semibold text-zinc-700 leading-tight">this time slot</div>
                  </div>
                </div>

                {/* 5. Code Review Item (13:00) */}
                <div className="flex items-center gap-2.5 sm:gap-3 relative group">
                  <div className="w-[42px] sm:w-[50px] text-right text-xs sm:text-[13px] font-semibold text-slate-300 tracking-tight shrink-0">
                    13:00
                  </div>
                  <button 
                    onClick={() => showToast("Add afternoon item 13:00")}
                    className="relative z-10 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md ring-2 sm:ring-4 ring-[#16251f] shrink-0 active:scale-95 transition"
                  >
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                  </button>
                  <div 
                    onClick={() => setActiveTab('tasks')}
                    className="flex-1 min-w-0 bg-white hover:bg-slate-50 rounded-[18px] sm:rounded-[20px] p-3 sm:p-3.5 px-3.5 sm:px-4 cursor-pointer shadow-xl flex items-center justify-between transition-all transform hover:-translate-y-0.5"
                  >
                    <div className="pr-2 truncate">
                      <h4 className="text-sm sm:text-[15px] font-bold text-zinc-900 leading-tight truncate">Code review</h4>
                      <p className="text-[11px] sm:text-[12.5px] font-medium text-zinc-500 mt-0.5 truncate">Team sync @ 10:30</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400 stroke-[2.5] shrink-0" />
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Priority Tasks & Routine Progress in Solid Green Frosted Cards */}
        <div className="lg:col-span-6 space-y-6 w-full">
          
          {/* Active To-Do Snapshot Card */}
          <div 
            style={cardStyle}
            className="p-4 sm:p-6 rounded-[28px] sm:rounded-[32px] transition hover:border-emerald-400/40"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white drop-shadow">Channel Priority Actions</h3>
                <p className="text-[11px] sm:text-xs text-emerald-200/75">Click circle to toggle completion</p>
              </div>
              <button 
                onClick={() => setActiveTab('tasks')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                View all ({tasks.length}) <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {tasks.slice(0, 4).map(task => (
                <div 
                  key={task.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(8px)',
                    borderColor: 'rgba(52, 211, 153, 0.15)'
                  }}
                  className={`p-3 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 sm:gap-4 ${
                    task.status === 'Completed' ? 'opacity-60' : 'hover:border-emerald-400/40 hover:bg-white/[0.08]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 overflow-hidden min-w-0">
                    <button 
                      onClick={() => toggleTaskCompletion(task.id)}
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border flex items-center justify-center shrink-0 transition ${
                        task.status === 'Completed'
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-white/30 hover:border-emerald-400 text-transparent'
                      }`}
                    >
                      <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
                    </button>
                    <div className="truncate">
                      <h4 className={`text-xs sm:text-sm font-semibold truncate ${task.status === 'Completed' ? 'line-through text-slate-400' : 'text-white'}`}>
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-300 mt-0.5">
                        <span className="font-mono text-emerald-300">{task.startTime}</span>
                        <span>•</span>
                        <span className="px-1.5 py-0.2 rounded-md bg-white/10 text-[9px] sm:text-[10px] font-bold text-slate-200">
                          {task.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className={`text-[9px] sm:text-[10px] font-extrabold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full uppercase tracking-wider shrink-0 ${
                    task.priority === 'Urgent'
                      ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50'
                      : task.priority === 'High'
                        ? 'bg-emerald-600/25 text-emerald-300 border border-emerald-600/40'
                        : 'bg-white/15 text-slate-200 border border-white/20'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Habit Consistency Widget Card */}
          <div 
            style={cardStyle}
            className="p-4 sm:p-6 rounded-[28px] sm:rounded-[32px] transition hover:border-emerald-400/40"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white drop-shadow">Culture Routine Streaks</h3>
                <p className="text-[11px] sm:text-xs text-emerald-200/75">Maintain daily momentum</p>
              </div>
              <button 
                onClick={() => setActiveTab('routine')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                Open Routine <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {routines.slice(0, 4).map(routine => (
                <div 
                  key={routine.id}
                  onClick={() => toggleRoutine(routine.id)}
                  style={{
                    background: routine.completed ? 'rgba(16, 185, 129, 0.22)' : 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(8px)',
                    borderColor: routine.completed ? 'rgba(52, 211, 153, 0.5)' : 'rgba(255, 255, 255, 0.12)'
                  }}
                  className="p-3 sm:p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      routine.completed ? 'bg-emerald-500 text-white shadow-sm' : 'border border-white/30'
                    }`}>
                      {routine.completed && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div className="truncate">
                      <h4 className="text-xs font-bold leading-tight text-white truncate">{routine.title}</h4>
                      <p className="text-[10px] sm:text-[11px] text-slate-300">{routine.time} • {routine.duration}m</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-emerald-400 font-extrabold text-xs shrink-0 ml-2">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    <span>{routine.streak}d</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Notebook Scratchpad Preview Card */}
          <div 
            style={cardStyle}
            className="p-4 sm:p-6 rounded-[28px] sm:rounded-[32px] transition hover:border-emerald-400/40"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs sm:text-sm font-bold text-emerald-100 flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-emerald-400" />
                Latest Pinned Idea
              </h3>
              <button 
                onClick={() => setActiveTab('notes')}
                className="text-xs text-emerald-300 hover:text-white"
              >
                Go to Notebook →
              </button>
            </div>
            {notes[0] && (
              <div 
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(52, 211, 153, 0.15)'
                }}
                className="p-3.5 sm:p-4 rounded-2xl"
              >
                <h4 className="text-xs sm:text-sm font-bold text-white mb-1">{notes[0].title}</h4>
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {notes[0].content}
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

// ==========================================================
// 2. TO-DO LIST VIEW (Full Glassmorphic Styling, Responsive)
// ==========================================================

function TasksManagerView({ tasks, setTasks, setActiveTaskId, setActiveTab, showToast, themeMode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Work',
    priority: 'Medium',
    status: 'In Progress',
    dueDate: '2026-11-06',
    startTime: '09:00',
    endTime: '10:00'
  });

  const categories = ['All', 'Work', 'Learning', 'Personal', 'Projects'];
  const priorities = ['All', 'Low', 'Medium', 'High', 'Urgent'];

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || task.category === selectedCategory;
    const matchesPriority = selectedPriority === 'All' || task.priority === selectedPriority;
    return matchesSearch && matchesCategory && matchesPriority;
  });

  const handleSaveTask = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...formData } : t));
      showToast("Task updated successfully!");
    } else {
      const newTask = {
        id: `tsk-${Date.now()}`,
        ...formData,
        timeSpentSeconds: 0,
        subtasks: []
      };
      setTasks(prev => [newTask, ...prev]);
      showToast("New task created!");
    }

    setModalOpen(false);
    setEditingTask(null);
  };

  const handleDelete = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    showToast("Task removed.");
  };

  const toggleSubtask = (taskId, subtaskId) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const nextSubtasks = t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s);
        return { ...t, subtasks: nextSubtasks };
      }
      return t;
    }));
  };

  return (
    <div className="space-y-6 animate-fadeIn w-full">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white drop-shadow">To-Do Task Command</h2>
          <p className="text-xs text-slate-300 mt-1">Organize priorities, deadlines, and multi-tier subtasks</p>
        </div>

        <button 
          onClick={() => {
            setEditingTask(null);
            setFormData({
              title: '',
              description: '',
              category: 'Work',
              priority: 'High',
              status: 'In Progress',
              dueDate: '2026-11-06',
              startTime: '09:00',
              endTime: '10:00'
            });
            setModalOpen(true);
          }}
          className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" /> Add New Task
        </button>
      </div>

      {/* Filter and Search Bar - Frosted Glass Bar */}
      <div 
        style={{
          background: 'rgba(16, 28, 20, 0.65)',
          backdropFilter: 'blur(7px) saturate(140%)',
          WebkitBackdropFilter: 'blur(7px) saturate(140%)',
          border: '1px solid rgba(52, 211, 153, 0.2)',
          boxShadow: '0 15px 35px rgba(0,0,0,0.32)'
        }}
        className="p-3.5 sm:p-4 rounded-3xl flex flex-col md:flex-row items-stretch md:items-center gap-3 sm:gap-4"
      >
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search tasks, descriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full py-1 hide-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition shrink-0 ${
                selectedCategory === cat 
                  ? 'bg-white text-zinc-900 shadow-md font-bold' 
                  : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          <Filter className="w-4 h-4 text-emerald-400" />
          <select 
            value={selectedPriority} 
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-zinc-900 border border-emerald-500/30 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {priorities.map(p => (
              <option key={p} value={p} className="bg-zinc-900 text-white">{p} Priority</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tasks List - Glassmorphic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {filteredTasks.length === 0 ? (
          <div 
            style={{
              background: 'rgba(16, 28, 20, 0.5)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(52, 211, 153, 0.15)'
            }}
            className="col-span-full p-12 text-center rounded-3xl"
          >
            <AlertCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No tasks matched your filter criteria.</p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const completedSubtasks = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0;
            const totalSubtasks = task.subtasks ? task.subtasks.length : 0;
            const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

            return (
              <div 
                key={task.id}
                style={{
                  background: 'rgba(14, 28, 20, 0.65)',
                  backdropFilter: 'blur(7px) saturate(140%)',
                  WebkitBackdropFilter: 'blur(7px) saturate(140%)',
                  border: '1px solid rgba(52, 211, 153, 0.2)',
                  boxShadow: '0 18px 40px rgba(0,0,0,0.32), inset 0 1px rgba(255,255,255,0.12)'
                }}
                className="p-5 rounded-3xl hover:border-emerald-400/40 transition group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        task.priority === 'Urgent'
                          ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50'
                          : task.priority === 'High'
                            ? 'bg-emerald-600/25 text-emerald-300 border border-emerald-600/40'
                            : 'bg-white/15 text-slate-200 border border-white/20'
                      }`}>
                        {task.priority}
                      </span>
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                        {task.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                      <button 
                        onClick={() => {
                          setEditingTask(task);
                          setFormData(task);
                          setModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
                        title="Edit Task"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(task.id)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-emerald-400"
                        title="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className={`text-base font-bold leading-snug ${task.status === 'Completed' ? 'line-through text-slate-400' : 'text-white'}`}>
                    {task.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                    {task.description}
                  </p>

                  {/* Subtasks Section */}
                  {totalSubtasks > 0 && (
                    <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-300">
                        <span>Subtasks checklist</span>
                        <span className="text-emerald-300 font-mono font-bold">{completedSubtasks}/{totalSubtasks}</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>

                      <div className="space-y-1.5 mt-2">
                        {task.subtasks.map(sub => (
                          <div 
                            key={sub.id} 
                            onClick={() => toggleSubtask(task.id, sub.id)}
                            className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-white"
                          >
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                              sub.completed ? 'bg-emerald-500 border-emerald-500' : 'border-white/30'
                            }`}>
                              {sub.completed && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                            </div>
                            <span className={sub.completed ? 'line-through text-slate-400' : ''}>{sub.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300 font-mono">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{task.startTime} - {task.endTime}</span>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTaskId(task.id);
                      setActiveTab('timer');
                      showToast(`Started focus tracking on: "${task.title}"`);
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-emerald-300 hover:text-white bg-emerald-500/20 hover:bg-emerald-500/30 px-3 py-1.5 rounded-xl border border-emerald-500/30 transition backdrop-blur-md"
                  >
                    <Play className="w-3 h-3 fill-current" /> Track Timer
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE / EDIT TASK MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
          <div 
            style={{
              background: 'rgba(16, 32, 22, 0.95)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
            }}
            className="w-full max-w-lg rounded-3xl p-5 sm:p-7 text-slate-100 my-8"
          >
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4">
              {editingTask ? 'Edit Productivity Task' : 'Create New Productivity Task'}
            </h3>

            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Task Title</label>
                <input 
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Code review: Core Auth Engine"
                  className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea 
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Details and expected deliverables..."
                  className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/15 text-white text-xs"
                  >
                    <option value="Work">Work</option>
                    <option value="Learning">Learning</option>
                    <option value="Personal">Personal</option>
                    <option value="Projects">Projects</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
                  <select 
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/15 text-white text-xs"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Start Time</label>
                  <input 
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">End Time</label>
                  <input 
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/15">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 transition"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================================
// 3. ACTIVE TASKS & TIMER VIEW (Responsive Dial & Layout)
// ==========================================================

function TimerWorkspaceView({
  timerMode, setTimerMode, timerStatus, setTimerStatus,
  timerSeconds, setTimerSeconds, activeTaskId, setActiveTaskId,
  tasks, pomodoroStage, pomodoroCycles, formatSeconds, showToast, themeMode
}) {
  const currentBoundTask = tasks.find(t => t.id === activeTaskId);

  const startTimer = () => setTimerStatus('running');
  const pauseTimer = () => setTimerStatus('paused');
  const resetTimer = () => {
    setTimerStatus('paused');
    if (timerMode === 'pomodoro') {
      setTimerSeconds(pomodoroStage === 'work' ? 25 * 60 : 5 * 60);
    } else if (timerMode === 'countdown') {
      setTimerSeconds(15 * 60);
    } else {
      setTimerSeconds(0);
    }
  };

  const switchMode = (mode) => {
    setTimerMode(mode);
    setTimerStatus('paused');
    if (mode === 'pomodoro') setTimerSeconds(25 * 60);
    if (mode === 'countdown') setTimerSeconds(15 * 60);
    if (mode === 'stopwatch') setTimerSeconds(0);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn w-full">
      {/* Timer Mode Switcher Bar */}
      <div className="flex justify-center w-full">
        <div 
          style={{
            background: 'rgba(16, 28, 20, 0.75)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(52, 211, 153, 0.2)'
          }}
          className="inline-flex p-1 sm:p-1.5 rounded-2xl shadow-xl max-w-full overflow-x-auto hide-scrollbar"
        >
          {[
            { id: 'pomodoro', label: 'Pomodoro' },
            { id: 'stopwatch', label: 'Stopwatch' },
            { id: 'countdown', label: 'Countdown' }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => switchMode(m.id)}
              className={`px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                timerMode === m.id
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Timer Dial Glass Card */}
      <div 
        style={{
          background: 'rgba(14, 28, 20, 0.65)',
          backdropFilter: 'blur(8px) saturate(140%)',
          WebkitBackdropFilter: 'blur(8px) saturate(140%)',
          border: '1px solid rgba(52, 211, 153, 0.25)',
          boxShadow: '0 25px 65px rgba(0,0,0,0.48), inset 0 1px 1px rgba(255,255,255,0.22)'
        }}
        className="relative rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 md:p-12 text-center shadow-2xl overflow-hidden"
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`w-60 sm:w-80 h-60 sm:h-80 rounded-full blur-3xl opacity-25 transition duration-700 ${
            timerStatus === 'running' ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-700'
          }`} />
        </div>

        <div 
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(52, 211, 153, 0.25)'
          }}
          className="relative z-10 mb-3 sm:mb-4 inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full text-xs text-slate-200 max-w-full truncate"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0"></span>
          <span className="hidden sm:inline">Focusing on:</span>
          <strong className="text-white truncate max-w-[200px] sm:max-w-xs">{currentBoundTask ? currentBoundTask.title : "Unassigned Session"}</strong>
        </div>

        <div className="relative z-10 text-5xl sm:text-7xl md:text-8xl font-black text-white tracking-tighter font-mono my-4 sm:my-6 select-none drop-shadow-lg">
          {formatSeconds(timerSeconds)}
        </div>

        {timerMode === 'pomodoro' && (
          <div className="relative z-10 flex items-center justify-center gap-2 mb-6 sm:mb-8">
            {[1, 2, 3, 4].map(idx => (
              <div 
                key={idx}
                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all ${
                  idx <= pomodoroCycles ? 'bg-emerald-400 scale-110 shadow-md shadow-emerald-500/50' : 'bg-emerald-950/80'
                }`}
              />
            ))}
            <span className="text-xs text-emerald-200 ml-2 font-medium">Cycle {pomodoroCycles}/4</span>
          </div>
        )}

        <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <button 
            onClick={resetTimer}
            className="p-3 sm:p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 transition active:scale-95 shadow-md"
            title="Reset Timer"
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {timerStatus === 'running' ? (
            <button 
              onClick={pauseTimer}
              className="px-6 sm:px-8 py-3 sm:py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-2 shadow-xl shadow-emerald-700/25 active:scale-95 transition text-xs sm:text-sm"
            >
              <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" /> Pause Session
            </button>
          ) : (
            <button 
              onClick={startTimer}
              className="px-6 sm:px-8 py-3 sm:py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold flex items-center gap-2 shadow-xl shadow-emerald-500/30 active:scale-95 transition text-xs sm:text-sm"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" /> Initiate Flow
            </button>
          )}

          <button 
            onClick={() => {
              if (currentBoundTask) {
                showToast(`Logged time to: ${currentBoundTask.title}`);
              }
            }}
            className="p-3 sm:p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 transition active:scale-95 shadow-md"
            title="Log Time Session"
          >
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* Task Assignment Selector */}
      <div 
        style={{
          background: 'rgba(16, 28, 20, 0.75)',
          backdropFilter: 'blur(24px) saturate(160%)',
          border: '1px solid rgba(52, 211, 153, 0.2)'
        }}
        className="p-4 sm:p-6 rounded-3xl"
      >
        <h3 className="text-xs sm:text-sm font-bold text-slate-200 mb-3">Attach Focus Session to Active Task</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          {tasks.map(task => (
            <div
              key={task.id}
              onClick={() => setActiveTaskId(task.id)}
              style={{
                background: activeTaskId === task.id ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                backdropFilter: 'blur(14px)',
                borderColor: activeTaskId === task.id ? 'rgba(52, 211, 153, 0.5)' : 'rgba(255, 255, 255, 0.12)'
              }}
              className="p-3 sm:p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between hover:bg-white/15"
            >
              <div className="truncate pr-2">
                <div className="text-xs font-bold text-white truncate">{task.title}</div>
                <div className="text-[10px] sm:text-[11px] text-emerald-300 mt-0.5">Tracked: {formatSeconds(task.timeSpentSeconds || 0)}</div>
              </div>
              {activeTaskId === task.id && (
                <span className="text-[9px] sm:text-[10px] font-extrabold uppercase px-2 sm:px-2.5 py-0.5 rounded-full bg-emerald-500 text-white shadow-sm shrink-0">Active</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================================
// 5. CALENDAR & SCHEDULE VIEW (Fluid Grid on Mobile)
// ==========================================================

function CalendarScheduleView({ tasks, routines, showToast, themeMode }) {
  const [viewMode, setViewMode] = useState('week');
  const [selectedDay, setSelectedDay] = useState(6);

  const daysOfWeek = [
    { day: 'Sun', date: 1 },
    { day: 'Mon', date: 2 },
    { day: 'Tue', date: 3 },
    { day: 'Wed', date: 4 },
    { day: 'Thu', date: 5 },
    { day: 'Fri', date: 6 },
    { day: 'Sat', date: 7 }
  ];

  const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  return (
    <div className="space-y-6 animate-fadeIn w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white drop-shadow">Interactive Schedule Matrix</h2>
          <p className="text-xs text-slate-300 mt-1">Week 42, 2026 • Unified Calendar view for all obligations</p>
        </div>

        <div 
          style={{
            background: 'rgba(16, 28, 20, 0.75)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(52, 211, 153, 0.2)'
          }}
          className="flex items-center gap-1.5 p-1 rounded-2xl"
        >
          {['day', 'week', 'month'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold uppercase transition ${
                viewMode === mode
                  ? 'bg-white text-zinc-900 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div 
        style={{
          background: 'rgba(14, 28, 20, 0.65)',
          backdropFilter: 'blur(24px) saturate(160%)',
          border: '1px solid rgba(52, 211, 153, 0.2)',
          boxShadow: '0 15px 35px rgba(0,0,0,0.35)'
        }}
        className="grid grid-cols-7 gap-1 sm:gap-2 p-2 sm:p-3 rounded-3xl overflow-x-auto hide-scrollbar"
      >
        {daysOfWeek.map((d, index) => {
          const isSelected = selectedDay === d.date;
          return (
            <button
              key={index}
              onClick={() => setSelectedDay(d.date)}
              className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center transition-all min-w-[36px] ${
                isSelected
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105 font-bold'
                  : 'hover:bg-white/10 text-slate-300 hover:text-white'
              }`}
            >
              <span className="text-[10px] sm:text-[11px] font-bold uppercase">{d.day}</span>
              <span className="text-sm sm:text-lg font-black mt-0.5">{d.date}</span>
            </button>
          );
        })}
      </div>

      <div 
        style={{
          background: 'rgba(14, 28, 20, 0.65)',
          backdropFilter: 'blur(24px) saturate(160%)',
          border: '1px solid rgba(52, 211, 153, 0.2)',
          boxShadow: '0 15px 35px rgba(0,0,0,0.35)'
        }}
        className="p-4 sm:p-6 rounded-3xl space-y-3 sm:space-y-4"
      >
        {hours.map((hour, idx) => {
          const matchingTasks = tasks.filter(t => t.startTime && t.startTime.startsWith(hour.slice(0, 2)));
          return (
            <div key={idx} className="flex items-start gap-2.5 sm:gap-4 pb-3 sm:pb-4 border-b border-white/10 last:border-0">
              <div className="w-12 sm:w-16 text-right text-[11px] sm:text-xs font-mono font-bold text-slate-300 shrink-0 pt-1">
                {hour}
              </div>

              <div className="flex-1 space-y-2 min-w-0">
                {matchingTasks.length > 0 ? (
                  matchingTasks.map(t => (
                    <div 
                      key={t.id}
                      onClick={() => showToast(`Selected: ${t.title}`)}
                      className="p-2.5 sm:p-3.5 rounded-2xl bg-white text-zinc-900 font-semibold shadow-md flex items-center justify-between cursor-pointer hover:scale-[1.01] transition"
                    >
                      <div className="truncate pr-2">
                        <div className="text-xs font-bold leading-tight truncate">{t.title}</div>
                        <div className="text-[10px] sm:text-[11px] text-zinc-500 font-mono mt-0.5 truncate">{t.startTime} - {t.endTime} • {t.category}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
                    </div>
                  ))
                ) : (
                  <div className="h-8 sm:h-9 rounded-xl border border-dashed border-white/15 flex items-center px-3 sm:px-4 text-[10px] sm:text-[11px] text-slate-400">
                    Open focus slot
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================================
// 7. REPORTS & ANALYTICS VIEW (Responsive Charts)
// ==========================================================

function AnalyticsReportsView({ tasks, routines, productivityScore, showToast, themeMode }) {
  const [timeframe, setTimeframe] = useState('weekly');

  const handleExportPDF = () => {
    showToast("Generating comprehensive PDF Productivity Dossier...");
    setTimeout(() => {
      showToast("Download Complete: 'Productivity-Report-Q4.pdf'");
    }, 1500);
  };

  const weeklyData = [
    { day: "Mon", hours: 6.5, target: 8, score: 82 },
    { day: "Tue", hours: 7.8, target: 8, score: 94 },
    { day: "Wed", hours: 8.2, target: 8, score: 98 },
    { day: "Thu", hours: 5.4, target: 8, score: 71 },
    { day: "Fri", hours: 7.2, target: 8, score: 89 },
    { day: "Sat", hours: 4.0, target: 4, score: 90 },
    { day: "Sun", hours: 3.5, target: 4, score: 85 },
  ];

  return (
    <div className="space-y-6 animate-fadeIn w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white drop-shadow">Productivity Intelligence</h2>
          <p className="text-xs text-slate-300 mt-1">Deep analysis of focus hours, habit consistency, and task velocity</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div 
            style={{
              background: 'rgba(16, 28, 20, 0.75)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(52, 211, 153, 0.2)'
            }}
            className="flex p-1 rounded-2xl"
          >
            {['daily', 'weekly', 'monthly'].map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition ${
                  timeframe === tf ? 'bg-white text-zinc-900 shadow' : 'text-slate-300 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-400/30 text-white px-3 sm:px-4 py-2 rounded-2xl text-xs font-bold transition active:scale-95 shadow-md backdrop-blur-md"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" /> Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div 
          style={{
            background: 'rgba(14, 28, 20, 0.65)',
            backdropFilter: 'blur(24px) saturate(160%)',
            border: '1px solid rgba(52, 211, 153, 0.2)',
            boxShadow: '0 15px 35px rgba(0,0,0,0.35)'
          }}
          className="p-5 sm:p-6 rounded-3xl"
        >
          <span className="text-[11px] sm:text-xs font-bold text-slate-300 uppercase tracking-wider">Weekly Focus Hours</span>
          <div className="text-2xl sm:text-3xl font-black text-white mt-1 sm:mt-2">42.6 hrs</div>
          <p className="text-[11px] sm:text-xs text-emerald-400 font-semibold mt-1">▲ 8.4% ahead of schedule</p>
        </div>

        <div 
          style={{
            background: 'rgba(14, 28, 20, 0.65)',
            backdropFilter: 'blur(24px) saturate(160%)',
            border: '1px solid rgba(52, 211, 153, 0.2)',
            boxShadow: '0 15px 35px rgba(0,0,0,0.35)'
          }}
          className="p-5 sm:p-6 rounded-3xl"
        >
          <span className="text-[11px] sm:text-xs font-bold text-slate-300 uppercase tracking-wider">Habit Consistency Index</span>
          <div className="text-2xl sm:text-3xl font-black text-white mt-1 sm:mt-2">91.4%</div>
          <p className="text-[11px] sm:text-xs text-emerald-400 font-semibold mt-1">14-day unbroken run</p>
        </div>

        <div 
          style={{
            background: 'rgba(14, 28, 20, 0.65)',
            backdropFilter: 'blur(24px) saturate(160%)',
            border: '1px solid rgba(52, 211, 153, 0.2)',
            boxShadow: '0 15px 35px rgba(0,0,0,0.35)'
          }}
          className="p-5 sm:p-6 rounded-3xl"
        >
          <span className="text-[11px] sm:text-xs font-bold text-slate-300 uppercase tracking-wider">Velocity Completion Rate</span>
          <div className="text-2xl sm:text-3xl font-black text-white mt-1 sm:mt-2">{productivityScore}%</div>
          <p className="text-[11px] sm:text-xs text-emerald-400 font-semibold mt-1">Optimal output bracket</p>
        </div>
      </div>

      <div 
        style={{
          background: 'rgba(14, 28, 20, 0.65)',
          backdropFilter: 'blur(24px) saturate(160%)',
          border: '1px solid rgba(52, 211, 153, 0.2)',
          boxShadow: '0 15px 35px rgba(0,0,0,0.35)'
        }}
        className="p-5 sm:p-8 rounded-3xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <h3 className="text-sm sm:text-base font-bold text-white drop-shadow">Daily Tracked Hours vs 8h Target</h3>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Actual Hours
            </span>
            <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-white/30"></span> Target (8h)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 sm:gap-4 md:gap-6 items-end h-44 sm:h-56 pt-6 sm:pt-8 pb-2 border-b border-white/10">
          {weeklyData.map((d, index) => {
            const heightPercent = (d.hours / 10) * 100;
            return (
              <div key={index} className="flex flex-col items-center gap-1.5 sm:gap-2 h-full justify-end group">
                <span className="text-[10px] sm:text-[11px] font-mono text-emerald-300 opacity-80 sm:opacity-0 group-hover:opacity-100 transition">
                  {d.hours}h
                </span>
                <div className="w-full max-w-[32px] sm:max-w-[42px] bg-white/10 rounded-t-xl h-full flex items-end p-0.5 sm:p-1">
                  <div 
                    className="w-full bg-emerald-500 rounded-md sm:rounded-lg transition-all duration-500 group-hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-300 mt-1.5 sm:mt-2">{d.day}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ==========================================================
// 8. NOTIFICATIONS & EMAIL VIEW
// ==========================================================

function NotificationsEmailView({ user, setUser, tasks, routines, showToast, themeMode }) {
  const [digestTime, setDigestTime] = useState(user.emailTime || '08:00');
  const [frequency, setFrequency] = useState(user.reportFrequency || 'daily');
  const [enableAlerts, setEnableAlerts] = useState(true);

  const sendTestEmail = () => {
    showToast(`Test digest dispatched to: ${user.email} 📬`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-black text-white drop-shadow">Automated Intelligence Reports</h2>
        <p className="text-xs text-slate-300 mt-1">Configure automated morning briefs, deadline reminders, and weekly recaps</p>
      </div>

      <div 
        style={{
          background: 'rgba(14, 28, 20, 0.65)',
          backdropFilter: 'blur(24px) saturate(160%)',
          border: '1px solid rgba(52, 211, 153, 0.2)',
          boxShadow: '0 20px 45px rgba(0,0,0,0.35)'
        }}
        className="p-6 sm:p-8 rounded-3xl space-y-6"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h3 className="text-base font-bold text-white">Scheduled Productivity Digest</h3>
            <p className="text-xs text-slate-300">Receive comprehensive morning task agendas</p>
          </div>
          <button 
            onClick={() => setEnableAlerts(!enableAlerts)}
            className={`w-12 h-6 rounded-full transition p-1 flex items-center ${
              enableAlerts ? 'bg-emerald-500 justify-end' : 'bg-white/10 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Delivery Cadence</label>
            <select 
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-emerald-500/30 text-white text-xs"
            >
              <option value="daily">Daily Morning Brief (08:00)</option>
              <option value="weekly">Weekly Executive Summary</option>
              <option value="monthly">Monthly Comprehensive Audit</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Destination Inbox</label>
            <input 
              type="email"
              value={user.email}
              readOnly
              className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-slate-300 text-xs font-mono"
            />
          </div>
        </div>

        <div 
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(52, 211, 153, 0.15)'
          }}
          className="p-5 rounded-2xl space-y-3"
        >
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">Email Preview Sample</div>
          <div className="text-sm font-bold text-white">Subject: [Chronos Brief] Your 08:00 Priority Briefing</div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Good morning {user.name}, you have <strong className="text-emerald-400">{tasks.filter(t => t.priority === 'Urgent').length} urgent tasks</strong> today, led by "{tasks[0]?.title}". Your consistency streak sits at 14 days. Click below to initiate your 09:00 work sprint.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button 
            onClick={sendTestEmail}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/25 active:scale-95 transition"
          >
            <Mail className="w-3.5 h-3.5" /> Send Test Briefing Now
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================================
// 9. SETTINGS & PROFILE VIEW
// ==========================================================

function SettingsProfileView({
  user, setUser, themeMode, setThemeMode,
  tasks, routines, notes, setTasks, setRoutines, setNotes, showToast, setAuthModalOpen,
  onPhotoChange, fileInputRef
}) {
  const [profileName, setProfileName] = useState(user.name);
  const [profileRole, setProfileRole] = useState(user.role);
  const [customUrl, setCustomUrl] = useState('');

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setUser(prev => ({ ...prev, name: profileName, role: profileRole }));
    showToast("Profile credentials saved!");
  };

  const handleExportJSON = () => {
    const backup = { user, tasks, routines, notes, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chronos-backup-${Date.now()}.json`;
    a.click();
    showToast("System database backup generated!");
  };

  const handleResetData = () => {
    if (confirm("Reset application data to initial demo state?")) {
      setTasks(INITIAL_TASKS);
      setRoutines(INITIAL_ROUTINES);
      setNotes(INITIAL_NOTES);
      onPhotoChange(BOB_MARLEY_PORTRAIT);
      showToast("Data restored to factory demo state.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-black text-white drop-shadow">System Settings & Profile</h2>
        <p className="text-xs text-slate-300 mt-1">Customize preferences, authentication credentials, and synchronized background art</p>
      </div>

      {/* Profile & Dynamic Wallpaper Sync Card */}
      <div 
        style={{
          background: 'rgba(14, 28, 20, 0.68)',
          backdropFilter: 'blur(28px) saturate(160%)',
          WebkitBackdropFilter: 'blur(28px) saturate(160%)',
          border: '1px solid rgba(52, 211, 153, 0.2)',
          boxShadow: '0 20px 45px rgba(0,0,0,0.38)'
        }}
        className="p-6 sm:p-8 rounded-3xl space-y-6"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Synchronized Portrait & Ambient Wallpaper</h3>
          <span className="text-xs text-emerald-400 font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
            Auto-Sync Active
          </span>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-white/[0.05] border border-white/10">
          <div className="relative group/pic cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <img 
              src={user.avatar} 
              alt={user.name} 
              className="w-24 h-24 rounded-full object-cover ring-4 ring-emerald-500/70 shadow-xl group-hover/pic:scale-105 transition" 
            />
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover/pic:opacity-100 flex items-center justify-center transition text-white">
              <Upload className="w-5 h-5 text-emerald-400" />
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="text-base font-bold text-white">{user.name}</div>
            <p className="text-xs text-slate-300">
              Changing this photo will automatically update your profile picture and transform the full glassmorphic page backdrop.
            </p>
            
            <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md transition active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" /> Upload Any Photo
              </button>

              <button 
                type="button"
                onClick={() => onPhotoChange(BOB_MARLEY_PORTRAIT)}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold transition"
              >
                Bob Marley Art (Default)
              </button>
            </div>
          </div>
        </div>

        {/* Custom Image URL input */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <label className="block text-xs font-semibold text-slate-300">Or paste an Image Web URL</label>
          <div className="flex gap-2">
            <input 
              type="url" 
              placeholder="https://images.unsplash.com/..." 
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="flex-1 px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button 
              type="button"
              onClick={() => {
                if (customUrl.trim()) {
                  onPhotoChange(customUrl.trim());
                  setCustomUrl('');
                }
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/45 border border-emerald-400/40 text-white text-xs font-bold transition"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form 
        onSubmit={handleSaveProfile} 
        style={{
          background: 'rgba(14, 28, 20, 0.68)',
          backdropFilter: 'blur(28px) saturate(160%)',
          WebkitBackdropFilter: 'blur(28px) saturate(160%)',
          border: '1px solid rgba(52, 211, 153, 0.2)',
          boxShadow: '0 20px 45px rgba(0,0,0,0.38)'
        }}
        className="p-6 sm:p-8 rounded-3xl space-y-6"
      >
        <h3 className="text-base font-bold text-white">Account Information</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Display Name</label>
            <input 
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Professional Role</label>
            <input 
              type="text"
              value={profileRole}
              onChange={(e) => setProfileRole(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow-lg shadow-emerald-500/25"
          >
            Save Account Info
          </button>
        </div>
      </form>

      {/* Backup and Data Portability */}
      <div 
        style={{
          background: 'rgba(14, 28, 20, 0.68)',
          backdropFilter: 'blur(28px) saturate(160%)',
          border: '1px solid rgba(52, 211, 153, 0.2)'
        }}
        className="p-6 sm:p-8 rounded-3xl space-y-4"
      >
        <h3 className="text-base font-bold text-white">Data Portability & State</h3>
        <p className="text-xs text-slate-300">Export complete JSON snapshots of your tasks, notes, habits, and background configurations.</p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button 
            onClick={handleExportJSON}
            className="flex items-center gap-2 bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-400/35 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-md backdrop-blur-md"
          >
            <Download className="w-4 h-4 text-emerald-400" /> Export System JSON
          </button>
          <button 
            onClick={handleResetData}
            className="flex items-center gap-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 px-4 py-2.5 rounded-xl text-xs font-bold transition"
          >
            <RotateCcw className="w-4 h-4" /> Reset Demo Seed Data
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================================
// 10. AUTHENTICATION MODAL (Solid Emerald Green Only)
// ==========================================================

function AuthModal({ isOpen, onClose, authView, setAuthView, user, setUser, showToast, themeMode }) {
  const [emailInput, setEmailInput] = useState(user.email);
  const [passInput, setPassInput] = useState('••••••••••••');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (authView === 'login') {
      showToast(`Welcome back, ${user.name}! 🚀`);
    } else if (authView === 'register') {
      setUser(prev => ({ ...prev, email: emailInput }));
      showToast("Registration successful! Workspace verified.");
    } else {
      showToast(`Password recovery link dispatched to ${emailInput}`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div 
        style={{
          background: 'rgba(14, 28, 20, 0.95)',
          backdropFilter: 'blur(32px)',
          border: '1px solid rgba(52, 211, 153, 0.3)',
          boxShadow: '0 25px 65px rgba(0,0,0,0.6)'
        }}
        className="w-full max-w-md rounded-3xl p-7 text-slate-100"
      >
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/30">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-black text-white">
            {authView === 'login' && 'Sign into Chronos'}
            {authView === 'register' && 'Create Your Workspace'}
            {authView === 'forgot' && 'Reset Secure Access'}
          </h3>
          <p className="text-xs text-slate-300 mt-1">High performance personal management</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <input 
              type="email" 
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {authView !== 'forgot' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <input 
                type="password" 
                required
                value={passInput}
                onChange={(e) => setPassInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/30 transition active:scale-95 mt-2"
          >
            {authView === 'login' && 'Sign In to Workspace'}
            {authView === 'register' && 'Register New Account'}
            {authView === 'forgot' && 'Send Recovery Instructions'}
          </button>
        </form>

        <div className="flex items-center justify-between text-xs text-slate-300 mt-6 pt-4 border-t border-white/15">
          {authView === 'login' ? (
            <>
              <button onClick={() => setAuthView('register')} className="hover:text-white">Create Account</button>
              <button onClick={() => setAuthView('forgot')} className="hover:text-white">Forgot password?</button>
            </>
          ) : (
            <button onClick={() => setAuthView('login')} className="hover:text-white mx-auto">
              Return to Login
            </button>
          )}
        </div>

        <div className="mt-4 text-center">
          <button onClick={onClose} className="text-[11px] text-slate-400 hover:text-slate-200">
            Close modal
          </button>
        </div>
      </div>
    </div>
  );
}