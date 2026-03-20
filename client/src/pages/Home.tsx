import { Link } from "react-router-dom";

export function Home() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
			<h1 className="text-5xl font-bold text-gray-900">Delegate</h1>
			<p className="mt-4 max-w-md text-center text-lg text-gray-600">
				The task delegation and follow-up assistant for busy small business
				owners. Create tasks by voice or text, and never forget to follow up.
			</p>

			<div className="mt-8 flex gap-4">
				<Link
					to="/dashboard"
					className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700"
				>
					Go to Dashboardh
				</Link>
				<Link
					to="/onboarding"
					className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow hover:bg-gray-50"
				>
					Get Started
				</Link>
			</div>
		</div>
	);
}
