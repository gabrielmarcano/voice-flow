import type { Session, User } from "@supabase/supabase-js";
import { Calendar, LayoutDashboard, LogOut, Mic } from "lucide-react";
import { useEffect, useState } from "react";
import { Login } from "./components/Login";
import { TaskCard } from "./components/TaskCard";
import { VoiceRecorder } from "./components/VoiceRecorder";
import { supabase } from "./lib/supabase";
import type { Task } from "./types";

function App() {
	const [user, setUser] = useState<User | null>(null);
	const [tasks, setTasks] = useState<Task[]>([]);
	const [isProcessing, setIsProcessing] = useState(false);
	const [loading, setLoading] = useState(true);
	const [session, setSession] = useState<Session | null>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Run on first render only
	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
			setUser(session?.user ?? null);
			if (session?.user) fetchTasks(session.user.id);
			setLoading(false);
		});

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
			setUser(session?.user ?? null);
			if (session?.user) fetchTasks(session.user.id);
			else setTasks([]);
		});

		return () => subscription.unsubscribe();
	}, []);

	const fetchTasks = async (userId: string) => {
		const { data } = await supabase
			.from("tasks")
			.select("*")
			.eq("user_id", userId)
			.order("created_at", { ascending: false });

		if (data) {
			setTasks(data as Task[]);
		}
	};

	const handleLogout = async () => {
		await supabase.auth.signOut();
	};

	const createCalendarEvent = async (title: string, dateStr: string) => {
		if (!session?.provider_token) {
			console.warn("No Google provider token found. Re-login might be needed.");
			return false;
		}

		const eventDate = new Date(dateStr);
		const endDate = new Date(eventDate.getTime() + 60 * 60 * 1000);

		const event = {
			summary: title,
			start: { dateTime: eventDate.toISOString() },
			end: { dateTime: endDate.toISOString() },
		};

		try {
			const response = await fetch(
				"https://www.googleapis.com/calendar/v3/calendars/primary/events",
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${session.provider_token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify(event),
				},
			);

			if (!response.ok) {
				const errJson = await response.json();
				console.error("Google Calendar API Error:", errJson);
				throw new Error("Failed to create Google Calendar event");
			}
			return true;
		} catch (error) {
			console.error("Calendar Sync Error:", error);
			return false;
		}
	};

	const handleRecordingComplete = async (audioBlob: Blob) => {
		if (!user) return;
		setIsProcessing(true);

		const tempId = crypto.randomUUID();

		// Optimistic UI Task
		const newTask: Task = {
			id: tempId,
			user_id: user.id,
			created_at: new Date().toISOString(),
			audio_url: null,
			transcription: null,
			title: "Processing voice note...",
			event_date: null,
			is_synced: false,
			isProcessing: true,
		};

		setTasks((prev) => [newTask, ...prev]);

		try {
			// 1. Upload
			const fileName = `${user.id}/${Date.now()}.webm`;
			const { error: uploadError } = await supabase.storage
				.from("voice-notes")
				.upload(fileName, audioBlob);
			if (uploadError) throw uploadError;

			// 2. Generate a Temporary Signed URL (Valid for 60 seconds)
			const { data: signedData, error: signedError } = await supabase.storage
				.from("voice-notes")
				.createSignedUrl(fileName, 60);

			if (signedError) throw signedError;

			const audioUrlForAI = signedData.signedUrl;

			// 3. AI Processing
			const { data: aiResponse, error: fnError } =
				await supabase.functions.invoke("process-audio", {
					body: {
						audioUrl: audioUrlForAI,
						userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
						referenceDate: new Date().toISOString(),
					},
				});
			if (fnError) throw fnError;

			const {
				transcription,
				data: { title, date },
			} = aiResponse;

			// 4. Calendar Sync
			const isSynced = await createCalendarEvent(title, date);

			// 5. Save to DB
			const isoEventDate = new Date(date).toISOString();

			const { data: insertedTask, error: dbError } = await supabase
				.from("tasks")
				.insert({
					user_id: user.id,
					audio_url: fileName,
					transcription: transcription,
					title: title,
					event_date: isoEventDate,
					is_synced: isSynced,
				})
				.select()
				.single();

			if (dbError) throw dbError;

			// 6. Update UI
			setTasks((prev) =>
				prev.map((t) => (t.id === tempId ? (insertedTask as Task) : t)),
			);
		} catch (error) {
			console.error("Workflow failed:", error);
			setTasks((prev) =>
				prev.map((t) =>
					t.id === tempId
						? {
								...t,
								isProcessing: false,
								isFailed: true,
								title: "Processing failed",
							}
						: t,
				),
			);
			alert(`Error: ${(error as Error).message}`);
		} finally {
			setIsProcessing(false);
		}
	};

	if (loading)
		return (
			<div className="h-screen flex items-center justify-center text-gray-500">
				Loading...
			</div>
		);
	if (!user) return <Login />;

	return (
		<div className="min-h-screen bg-gray-50">
			<nav className="bg-white border-b border-gray-200 sticky top-0 z-20">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between h-16">
						<div className="flex items-center gap-3">
							<div className="bg-indigo-600 p-2 rounded-lg">
								<Mic className="text-white w-5 h-5" />
							</div>
							<span className="font-bold text-xl text-gray-900 tracking-tight">
								VoiceFlow
							</span>
						</div>
						<div className="flex items-center gap-4">
							<div className="text-sm text-gray-500 hidden md:block">
								{user.email}
							</div>
							<button
								type="button"
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

			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
					<div className="lg:col-span-4 space-y-6">
						<div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col items-center text-center">
							<h2 className="text-lg font-semibold text-gray-900 mb-2">
								New Voice Note
							</h2>
							<p className="text-sm text-gray-500 mb-8">
								Record your meeting notes. AI will sync them to your calendar.
							</p>
							<VoiceRecorder
								isProcessing={isProcessing}
								onRecordingComplete={handleRecordingComplete}
							/>
						</div>

						<div className="bg-indigo-900 rounded-2xl shadow-sm p-6 text-white hidden lg:block">
							<div className="flex items-center gap-3 mb-4">
								<Calendar className="w-6 h-6 text-indigo-300" />
								<h3 className="font-semibold text-lg">Calendar Sync</h3>
							</div>
							<p className="text-indigo-200 text-sm leading-relaxed">
								Your tasks are automatically synced to your primary Google
								Calendar. Say "Meeting tomorrow at 2pm" to test it out.
							</p>
						</div>
					</div>

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
								{tasks.map((task) => (
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
