import { Info } from "lucide-react";
import { useRef, useState } from "react";
import { supabase } from "../lib/supabase";

export function Login() {
	const [isTooltipOpen, setIsTooltipOpen] = useState(false);
	const timeoutRef = useRef<number | null>(null);

	const handleLogin = async () => {
		await supabase.auth.signInWithOAuth({
			provider: "google",
			options: {
				scopes: "https://www.googleapis.com/auth/calendar",
				redirectTo: window.location.origin,
				queryParams: {
					access_type: "offline",
					prompt: "consent",
				},
			},
		});
	};

	const handleMouseEnter = () => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
		setIsTooltipOpen(true);
	};

	const handleMouseLeave = () => {
		timeoutRef.current = setTimeout(() => {
			setIsTooltipOpen(false);
		}, 300);
	};

	return (
		<div className="min-h-screen bg-linear-to-br from-indigo-50 to-white flex items-center justify-center p-4 relative">
			<div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden grid md:grid-cols-2">
				<div className="p-12 flex flex-col justify-center items-start relative">
					<div className="w-full flex justify-between items-center mb-8">
						<div className="bg-indigo-600 p-3 rounded-xl inline-block">
							<svg
								className="w-8 h-8 text-white"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<title>Voice to Calendar</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
								/>
							</svg>
						</div>

						{/* biome-ignore lint/a11y/noStaticElementInteractions: Tooltip wrapper */}
						<div
							className="relative z-50"
							onMouseEnter={handleMouseEnter}
							onMouseLeave={handleMouseLeave}
						>
							<div
								className={`absolute right-0 top-full mt-4 w-80 bg-white p-5 rounded-2xl shadow-xl border border-indigo-100 transition-all duration-300 origin-top-right ${
									isTooltipOpen
										? "opacity-100 visible translate-y-0 scale-100 pointer-events-auto"
										: "opacity-0 invisible -translate-y-2 scale-95 pointer-events-none"
								}`}
							>
								<div className="flex items-start gap-3 mb-3">
									<div className="p-2 bg-amber-100 rounded-lg shrink-0">
										<svg
											className="w-4 h-4 text-amber-600"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<title>Warning</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
											/>
										</svg>
									</div>
									<div>
										<h4 className="font-bold text-gray-900 text-sm">
											Restricted Access
										</h4>
										<p className="text-xs text-gray-500 mt-1 leading-relaxed">
											This demo uses sensitive Google Calendar scopes. To test
											it, your email must be allowlisted.
										</p>
									</div>
								</div>

								<a
									href="mailto:gabrielmarcano120@gmail.com?subject=Request Access to VoiceFlow Demo"
									target="_blank"
									rel="noopener noreferrer"
									className="block w-full text-center bg-indigo-50 text-indigo-700 text-xs font-semibold py-2.5 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer"
								>
									Request Access &rarr;
								</a>
							</div>

							<div
								className={`flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 rounded-full border border-amber-200 cursor-help hover:bg-amber-100 transition-all`}
							>
								<Info className="w-4 h-4" />
								<span className="text-xs font-bold uppercase tracking-wide">
									Demo Access
								</span>
							</div>
						</div>
					</div>

					<h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
						Voice to Calendar,
						<br />
						<span className="text-indigo-600">Simplified.</span>
					</h1>

					<p className="text-gray-500 mb-8 text-lg leading-relaxed">
						Stop typing dates. Just speak, and our AI will organize your Google
						Calendar instantly.
					</p>

					<button
						type="button"
						onClick={handleLogin}
						className="cursor-pointer w-full sm:w-auto bg-white border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm flex items-center justify-center gap-3 group"
					>
						<img
							src="https://www.svgrepo.com/show/475656/google-color.svg"
							className="w-6 h-6"
							alt="Google"
						/>
						<span>Continue with Google</span>
						<span className="group-hover:translate-x-1 transition-transform">
							→
						</span>
					</button>
				</div>

				<div className="bg-indigo-600 hidden md:flex items-center justify-center relative overflow-hidden">
					<div className="absolute inset-0 bg-linear-to-br from-indigo-600 to-purple-700 opacity-90" />
					<div className="absolute -right-20 -top-20 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl" />
					<div className="absolute -left-20 -bottom-20 w-80 h-80 bg-purple-400 opacity-20 rounded-full blur-3xl" />

					<div className="relative z-10 text-white p-12 text-center">
						<div className="space-y-4 opacity-90">
							<div className="bg-white/10 backdrop-blur-lg p-4 rounded-xl border border-white/20 text-left">
								<div className="h-2 w-20 bg-white/40 rounded mb-2" />
								<div className="h-2 w-32 bg-white/20 rounded" />
							</div>
							<div className="bg-white/10 backdrop-blur-lg p-4 rounded-xl border border-white/20 text-left translate-x-4">
								<div className="h-2 w-24 bg-white/40 rounded mb-2" />
								<div className="h-2 w-16 bg-white/20 rounded" />
							</div>
							<p className="mt-8 text-indigo-100 font-medium">
								Trusted by productivity seekers.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
