export default function Settings() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <p className="text-muted-foreground max-w-prose">
        Configure user roles, default machine sequences, and job work units here. If you want me to implement real authentication, databases, or multi-user roles, ask to connect Supabase or Neon.
      </p>
    </div>
  );
}
