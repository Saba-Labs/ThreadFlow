import { useAppUpdater } from "@/hooks/useAppUpdater";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

/**
 * App Update Notification Component
 * Displays a notification when a new app version is available
 * Must be rendered inside BrowserRouter context
 */
import { useAppUpdaterHook } from "@/hooks/useAppUpdater";

export function AppUpdateNotification() {
  const { updateAvailable, refreshing, handleRefresh } = useAppUpdaterHook();

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200 shadow-lg">
        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-blue-900 text-sm">
            Update Available
          </p>
          <p className="text-xs text-blue-700 mt-0.5">
            A new version is ready to install
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          size="sm"
          className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
        >
          {refreshing ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Refresh
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
