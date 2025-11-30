import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { Login } from './components/Login';
import { VoiceRecorder } from './components/VoiceRecorder';
import { TaskCard } from './components/TaskCard';
import type { Task } from './types';
import type { User } from '@supabase/supabase-js';
import { LogOut, Mic, Calendar, LayoutDashboard } from 'lucide-react';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Check Auth Session on Load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchTasks(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchTasks(session.user.id);
      else setTasks([]);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchTasks = async (userId: string) => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (data) setTasks(data as Task[]);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleRecordingComplete = async (audioBlob: Blob) => {
    if (!user) return;
    setIsProcessing(true);

    const tempId = crypto.randomUUID();
    const newTask: Task = {
      id: tempId,
      user_id: user.id,
      created_at: new Date().toISOString(),
      audio_url: null,
      transcription: null,
      title: "Processing voice note...",
      event_date: null,
      status: 'processing'
    };
    
    setTasks(prev => [newTask, ...prev]);

    try {
      const fileName = `${user.id}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from('voice-notes')
        .upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('voice-notes')
        .getPublicUrl(fileName);

      const { data, error: fnError } = await supabase.functions.invoke('process-audio', {
        body: { audioUrl: publicUrl, userId: user.id }
      });

      if (fnError) throw fnError;

      const completedTask: Task = {
        ...newTask,
        status: 'synced',
        title: data.data.title,
        event_date: data.data.date,
        transcription: data.transcription,
      };

      setTasks(prev => prev.map(t => t.id === tempId ? completedTask : t));

    } catch (error) {
      console.error('Workflow failed:', error);
      setTasks(prev => prev.map(t => t.id === tempId ? { ...t, status: 'failed', title: 'Processing failed' } : t));
      alert('Error processing voice note. Check console for details.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar - Full Width */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Mic className="text-white w-5 h-5" />
              </div>
              <span className="font-bold text-xl text-gray-900 tracking-tight">VoiceFlow</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500 hidden md:block">
                {user.email}
              </div>
              <button 
                onClick={handleLogout} 
                className="cursor-pointer text-gray-500 hover:text-red-600 transition p-2 rounded-full hover:bg-gray-100"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content - Dashboard Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT PANEL: Recorder & Quick Actions (Takes 4/12 columns) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col items-center text-center">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">New Voice Note</h2>
              <p className="text-sm text-gray-500 mb-8">
                Record your meeting notes or reminders. AI will sync them to your calendar.
              </p>
              <VoiceRecorder 
                isProcessing={isProcessing} 
                onRecordingComplete={handleRecordingComplete} 
              />
            </div>

            {/* Stats / Info Card */}
            <div className="bg-indigo-900 rounded-2xl shadow-sm p-6 text-white hidden lg:block">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-6 h-6 text-indigo-300" />
                <h3 className="font-semibold text-lg">Calendar Sync</h3>
              </div>
              <p className="text-indigo-200 text-sm leading-relaxed">
                Your tasks are automatically synced to your primary Google Calendar. 
                Say "Meeting tomorrow at 2pm" to test it out.
              </p>
            </div>
          </div>

          {/* RIGHT PANEL: Task Grid (Takes 8/12 columns) */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <LayoutDashboard className="w-6 h-6 text-gray-400" />
                Recent Tasks
              </h2>
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                {tasks.length} Items
              </span>
            </div>

            {tasks.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 h-64 flex flex-col items-center justify-center text-gray-400">
                <Calendar className="w-10 h-10 mb-2 opacity-20" />
                <p>No tasks yet. Start recording on the left.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;