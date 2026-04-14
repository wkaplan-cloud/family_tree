export default function UnsubscribePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <h1 className="text-2xl font-semibold">You have been unsubscribed</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          You will not receive future reminder emails for this invitation.
        </p>
      </div>
    </main>
  );
}
