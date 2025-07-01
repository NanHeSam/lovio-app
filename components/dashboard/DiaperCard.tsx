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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            👶 Last Diaper
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              {lastDiaper.ago}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {getContentsEmoji(details?.contents || 'pee')}
              </span>
              <span className="text-lg font-semibold capitalize">
                {details?.contents || 'Unknown'}{getVolumeText(details?.volume)}
              </span>
            </div>
            {details?.hasRash && (
              <div className="text-sm text-red-600">
                ⚠️ Rash detected
              </div>
            )}
            {details?.pooColor && details?.contents !== 'pee' && (
              <div className="text-sm text-gray-500">
                Color: {details.pooColor} | Texture: {details.pooTexture}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          👶 Diaper
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-gray-500">
          No recent diaper changes
        </div>
      </CardContent>
    </Card>
  );
}