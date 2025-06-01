import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: { type: 'track' | 'artist'; data: any } | null;
}

export default function TipModal({ open, onOpenChange, target }: TipModalProps) {
  const [customAmount, setCustomAmount] = useState('');
  const [tipType, setTipType] = useState<'song' | 'artist'>('song');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get artist information
  const { data: artist } = useQuery({
    queryKey: ['/api/artists', target?.data.artistId],
    enabled: !!target?.data.artistId,
  });

  const tipMutation = useMutation({
    mutationFn: async (tipData: any) => {
      return await apiRequest("POST", "/api/tips", tipData);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Tip sent successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tips'] });
      onOpenChange(false);
      setCustomAmount('');
      setTipType('song');
    },
    onError: (error: Error) => {
      toast({ 
        title: "Tip Failed", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const sendTip = (amount: number) => {
    if (!target) return;

    // Generate unique tracking number
    const trackingNumber = `TIP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const tipData = {
      toArtistId: target.data.artistId, // Use artistId from song data
      songId: tipType === 'song' ? target.data.id : null,
      amount: amount.toString(),
      message: tipType === 'song' 
        ? `Tip for song: ${target.data.title}` 
        : `Tip for artist: ${artist?.name || 'Artist'}`,
      trackingNumber: trackingNumber,
    };

    tipMutation.mutate(tipData);
  };

  const handleCustomTip = () => {
    const amount = parseFloat(customAmount);
    if (amount >= 0.10) {
      sendTip(amount);
    } else {
      toast({ 
        title: "Invalid Amount", 
        description: "Minimum tip amount is $0.10",
        variant: "destructive" 
      });
    }
  };

  if (!target) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card-bg max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Send a Tip</DialogTitle>
        </DialogHeader>
        
        <div className="text-center mb-6">
          <img 
            src={artist?.profileImageUrl || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"} 
            alt="Artist" 
            className="w-16 h-16 rounded-full object-cover mx-auto mb-3" 
          />
          <h3 className="font-semibold">{artist?.name || 'AI Artist'}</h3>
          <p className="text-text-secondary text-sm">
            {tipType === 'song' ? target.data.title : `Support ${artist?.name || 'this artist'}`}
          </p>
        </div>

        {/* Tip Type Selection */}
        <div className="mb-6">
          <div className="flex bg-dark-bg rounded-lg p-1">
            <button
              onClick={() => setTipType('song')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                tipType === 'song'
                  ? 'bg-ai-purple text-white'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              Tip Song
            </button>
            <button
              onClick={() => setTipType('artist')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                tipType === 'artist'
                  ? 'bg-ai-purple text-white'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              Tip Artist
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Button
            variant="outline"
            className="p-3 bg-dark-bg hover:bg-gray-700 transition-colors text-center flex flex-col"
            onClick={() => sendTip(1)}
            disabled={tipMutation.isPending}
          >
            <div className="text-lg font-bold">$1</div>
            <div className="text-xs text-text-secondary">Quick tip</div>
          </Button>
          <Button
            variant="outline"
            className="p-3 bg-dark-bg hover:bg-gray-700 transition-colors text-center flex flex-col"
            onClick={() => sendTip(5)}
            disabled={tipMutation.isPending}
          >
            <div className="text-lg font-bold">$5</div>
            <div className="text-xs text-text-secondary">Nice work</div>
          </Button>
          <Button
            variant="outline"
            className="p-3 bg-dark-bg hover:bg-gray-700 transition-colors text-center flex flex-col"
            onClick={() => sendTip(10)}
            disabled={tipMutation.isPending}
          >
            <div className="text-lg font-bold">$10</div>
            <div className="text-xs text-text-secondary">Love it!</div>
          </Button>
        </div>
        
        <div className="mb-6">
          <Label htmlFor="custom-amount" className="block text-sm font-medium mb-2">
            Custom Amount
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">$</span>
            <Input
              id="custom-amount"
              type="number"
              min="0.10"
              step="0.10"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="bg-dark-bg border-gray-600 pl-8 focus:border-ai-purple"
              placeholder="0.00"
            />
          </div>
        </div>
        
        <Button
          onClick={handleCustomTip}
          disabled={tipMutation.isPending || !customAmount}
          className="w-full py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-semibold rounded-lg hover:shadow-lg transition-all"
        >
          <i className="fas fa-coins mr-2"></i>
          {tipMutation.isPending ? 'Sending...' : 'Send Tip'}
        </Button>
        
        <p className="text-xs text-text-secondary text-center mt-3">
          Your tip helps support AI music creators
        </p>
      </DialogContent>
    </Dialog>
  );
}
