import { Card, CardContent } from "@/components/ui/card";

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingState({
  message = "Ça charge...",
  fullScreen = false,
}: LoadingStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      {/* Quebec Blue spinner */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-zyeute-snow rounded-full"></div>
        <div className="absolute inset-0 border-4 border-zyeute-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
      {/* Loading text in Joual */}
      <p className="text-gray-600 text-sm font-medium">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return (
    <Card className="bg-zyeute-snow">
      <CardContent>{content}</CardContent>
    </Card>
  );
}
