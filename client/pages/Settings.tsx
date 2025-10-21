import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground max-w-prose">
          Manage application settings.
        </p>
      </div>

      <section className="rounded-lg border bg-white divide-y">
        <Link
          to="/settings/production-path"
          className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
        >
          <div>
            <div className="font-medium">Production Path</div>
            <div className="text-sm text-muted-foreground">
              Configure steps used in production paths.
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </section>
    </div>
  );
}
