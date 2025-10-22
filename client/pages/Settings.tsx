import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useFontSize } from "@/hooks/use-font-size";

export default function Settings() {
  const { value, setValue } = useFontSize();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground max-w-prose">
          Manage application settings.
        </p>
      </div>

      <section className="rounded-lg border bg-white p-4 space-y-4">
        <div>
          <div className="font-medium">Font size</div>
          <div className="text-sm text-muted-foreground">
            Choose how large text appears across the app.
          </div>
        </div>
        <RadioGroup
          value={value}
          onValueChange={(v) => setValue(v as any)}
          className="grid gap-3 sm:grid-cols-2"
        >
          <div className="flex items-center space-x-2 rounded-md border p-3">
            <RadioGroupItem value="small" id="fs-small" />
            <Label htmlFor="fs-small" className="cursor-pointer">
              Small
            </Label>
          </div>
          <div className="flex items-center space-x-2 rounded-md border p-3">
            <RadioGroupItem value="medium" id="fs-medium" />
            <Label htmlFor="fs-medium" className="cursor-pointer">
              Medium
            </Label>
          </div>
          <div className="flex items-center space-x-2 rounded-md border p-3">
            <RadioGroupItem value="large" id="fs-large" />
            <Label htmlFor="fs-large" className="cursor-pointer">
              Large (current)
            </Label>
          </div>
          <div className="flex items-center space-x-2 rounded-md border p-3">
            <RadioGroupItem value="extra-large" id="fs-xl" />
            <Label htmlFor="fs-xl" className="cursor-pointer">
              Extra large
            </Label>
          </div>
        </RadioGroup>
      </section>

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
