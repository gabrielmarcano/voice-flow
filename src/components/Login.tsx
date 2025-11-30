import { supabase } from '../lib/supabase';

export function Login() {
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/calendar',
        redirectTo: window.location.origin,
      },
    });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 to-white flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden grid md:grid-cols-2">
        
        {/* Left Side: Brand & Login */}
        <div className="p-12 flex flex-col justify-center items-start">
          <div className="bg-indigo-600 p-3 rounded-xl mb-8 inline-block">
             <svg 
              className="w-8 h-8 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            Voice to Calendar,<br />
            <span className="text-indigo-600">Simplified.</span>
          </h1>
          
          <p className="text-gray-500 mb-8 text-lg leading-relaxed">
            Stop typing dates. Just speak, and our AI will organize your Google Calendar instantly.
          </p>

          <button 
            onClick={handleLogin}
            className="cursor-pointer w-full sm:w-auto bg-white border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm flex items-center justify-center gap-3 group"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="Google" />
            <span>Continue with Google</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>

        {/* Right Side: Decorative/Abstract */}
        <div className="bg-indigo-600 hidden md:flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-indigo-600 to-purple-700 opacity-90"></div>
          {/* Abstract Circle decoration */}
          <div className="absolute -right-20 -top-20 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-purple-400 opacity-20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 text-white p-12 text-center">
            <div className="space-y-4 opacity-90">
              <div className="bg-white/10 backdrop-blur-lg p-4 rounded-xl border border-white/20 text-left">
                <div className="h-2 w-20 bg-white/40 rounded mb-2"></div>
                <div className="h-2 w-32 bg-white/20 rounded"></div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg p-4 rounded-xl border border-white/20 text-left translate-x-4">
                <div className="h-2 w-24 bg-white/40 rounded mb-2"></div>
                <div className="h-2 w-16 bg-white/20 rounded"></div>
              </div>
              <p className="mt-8 text-indigo-100 font-medium">Trusted by productivity seekers.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}