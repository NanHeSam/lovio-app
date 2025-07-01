import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecentActivity, DiaperDetails } from "@/lib/db/types";

interface DiaperCardProps {
  lastDiaper?: RecentActivity;
}

export default function DiaperCard({ lastDiaper }: DiaperCardProps) {
  if (lastDiaper) {
    const details = lastDiaper.details as DiaperDetails;
    
    const getContentsEmoji = (contents: string) => {
      switch (contents) {
        case 'pee': return '💧';
        case 'poo': return '💩';
        case 'both': return '💧💩';
        default: return '👶';
      }
    };
    
    const getVolumeText = (volume?: string) => {
      if (!volume) return '';
      return ` (${volume})`;
    };

    return (
      <Card className="hover:shadow-md transition-all duration-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <span className="text-2xl">👶</span>
            <span className="text-lg font-bold">Last Diaper</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="text-sm text-gray-600 font-medium">
              {lastDiaper.ago}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {getContentsEmoji(details?.contents || 'pee')}
              </span>
              <span className="text-xl font-bold text-gray-900 capitalize">
                {details?.contents || 'Unknown'}{getVolumeText(details?.volume)}
              </span>
            </div>
            {details?.hasRash && (
              <div className="text-sm text-red-600 bg-red-50 rounded-lg p-2 font-medium">
                ⚠️ Rash detected
              </div>
            )}
            {details?.pooColor && details?.contents !== 'pee' && (
              <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                Color: {details.pooColor} | Texture: {details.pooTexture}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200 hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-gray-600">
          <span className="text-2xl opacity-50">👶</span>
          <span className="text-lg font-bold">Diaper</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-sm text-gray-500">
          No recent diaper changes
        </div>
      </CardContent>
    </Card>
  );
}