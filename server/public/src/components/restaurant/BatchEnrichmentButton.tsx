import React, { useState } from 'react';
import { Button } from '../ui/button';
import { useToast } from '../../hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface BatchEnrichmentButtonProps {
  restaurantId: number;
  onEnrichmentStart?: () => void;
  onSuccess?: () => void;
}

export function BatchEnrichmentButton({ restaurantId, onEnrichmentStart, onSuccess }: BatchEnrichmentButtonProps) {
  const [isEnriching, setIsEnriching] = useState(false);
  const { toast } = useToast();

  const handleBatchEnrichment = async () => {
    setIsEnriching(true);
    
    try {
      const response = await fetch('/api/restaurant-wines/enrich-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId: restaurantId, limit: 20 })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "Enrichment Started",
          description: result.message,
        });
        onEnrichmentStart?.();
      } else {
        toast({
          title: "Enrichment Failed",
          description: result.error || "Failed to start enrichment",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start wine enrichment",
        variant: "destructive",
      });
    } finally {
      setIsEnriching(false);
    }
  };

  return (
    <Button 
      onClick={handleBatchEnrichment}
      disabled={isEnriching}
      className="bg-amber-600 hover:bg-amber-700"
    >
      {isEnriching ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Starting Enrichment...
        </>
      ) : (
        'Enrich Wines'
      )}
    </Button>
  );
}