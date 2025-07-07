import React from 'react';
import { Award } from '@/types/restaurant';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { TrophyIcon } from 'lucide-react';

interface RestaurantAwardsProps {
  awards: Award[] | null;
  className?: string;
}

const RestaurantAwards: React.FC<RestaurantAwardsProps> = ({ awards, className }) => {
  if (!awards || awards.length === 0) {
    return null;
  }

  // Group awards by organization
  const awardsByOrg: Record<string, Award[]> = {};
  for (const award of awards) {
    if (!awardsByOrg[award.organization]) {
      awardsByOrg[award.organization] = [];
    }
    awardsByOrg[award.organization].push(award);
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="bg-muted/20 pb-4">
        <div className="flex items-center gap-2">
          <TrophyIcon className="h-5 w-5 text-amber-500" />
          <CardTitle className="text-lg font-semibold">Accolades & Recognition</CardTitle>
        </div>
        <CardDescription>
          Notable awards and distinctions
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-5">
        {Object.entries(awardsByOrg).map(([org, orgAwards], index) => (
          <div key={org} className={index > 0 ? 'mt-4' : ''}>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">{org}</h4>
            <div className="space-y-3">
              {orgAwards.map((award, idx) => (
                <div key={`${award.name}-${idx}`} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{award.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {award.year}
                    </Badge>
                  </div>
                  {award.category && (
                    <div className="text-sm text-muted-foreground">
                      Category: {award.category}
                    </div>
                  )}
                  {award.description && (
                    <div className="text-sm italic">{award.description}</div>
                  )}
                </div>
              ))}
            </div>
            {index < Object.keys(awardsByOrg).length - 1 && (
              <Separator className="mt-4" />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default RestaurantAwards;