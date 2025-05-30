import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const tipMutation = useMutation({
    mutationFn: async (tipData: any) => {
      return await apiRequest("POST", "/api/tips", tipData);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Tip sent successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      onOpenChange(false);
      setCustomAmount('');
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

    const tipData = {
      toArtistId: 1, // This would be the actual artist ID
      songId: target.type === 'track' ? target.data.id : null,
      amount: amount.toString(),
      message: `Tip for ${target.data.title || target.data.name}`,
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
            src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100" 
            alt="Artist" 
            className="w-16 h-16 rounded-full object-cover mx-auto mb-3" 
          />
          <h3 className="font-semibold">AI Artist</h3>
          <p className="text-text-secondary text-sm">{target.data.title || target.data.name}</p>
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
