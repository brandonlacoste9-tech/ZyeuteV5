import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = "Oups, y'a un bobo",
  onRetry,
}: ErrorStateProps) {
  return (
    <Card className="bg-zyeute-snow border-zyeute-alert/20">
      <CardContent className="p-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          {/* Error icon */}
          <div className="w-16 h-16 bg-zyeute-alert/10 rounded-full flex items-center justify-center">
            <span className="text-3xl">😕</span>
          </div>
          {/* Error message in Joual */}
          <div>
            <h3 className="text-lg font-semibold text-zyeute-alert mb-2">
              Oups, y'a un bobo
            </h3>
            <p className="text-sm text-gray-600">{message}</p>
          </div>
          {/* Retry button if provided */}
          {onRetry && (
            <Button onClick={onRetry} variant="primary">
              Réessayer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
