import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Upload, Clock, Shield, FileText, Scale } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface DisputeModalProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Dispute {
  id: string;
  disputeId: string;
  orderId: string;
  reason: string;
  evidence: string[];
  status: 'open' | 'in_review' | 'resolved';
  arbiterDecision?: string;
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}

export function DisputeModal({ orderId, isOpen, onClose }: DisputeModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [reason, setReason] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [view, setView] = useState<'create' | 'view'>('create');

  // Fetch existing disputes for this order
  const { data: disputes = [] } = useQuery<any>({
    queryKey: ['/api/orders', orderId, 'disputes'],
    enabled: isOpen
  });

  const createDisputeMutation = useMutation({
    mutationFn: async (disputeData: { reason: string; evidence: string[] }) => {
      return apiRequest('POST', `/api/orders/${orderId}/dispute`, disputeData);
    },
    onSuccess: () => {
      toast({
        title: t('dispute.created'),
        description: t('dispute.createdDescription'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders', orderId, 'disputes'] });
      onClose();
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('dispute.createError'),
        variant: "destructive",
      });
    }
  });

  const addEvidenceMutation = useMutation({
    mutationFn: async ({ disputeId, evidence }: { disputeId: string; evidence: string[] }) => {
      return apiRequest('PUT', `/api/disputes/${disputeId}/evidence`, { evidence });
    },
    onSuccess: () => {
      toast({
        title: t('dispute.evidenceAdded'),
        description: t('dispute.evidenceAddedDescription'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orders', orderId, 'disputes'] });
    }
  });

  const handleCreateDispute = () => {
    if (!reason.trim()) {
      toast({
        title: t('error'),
        description: t('dispute.reasonRequired'),
        variant: "destructive",
      });
      return;
    }

    createDisputeMutation.mutate({
      reason: reason.trim(),
      evidence: evidenceUrls
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setEvidenceFile(file);
      // In a real implementation, upload the file and get URL
      const mockUrl = `evidence_${Date.now()}_${file.name}`;
      setEvidenceUrls([...evidenceUrls, mockUrl]);
    }
  };

  const renderDisputeStatus = (status: string) => {
    const statusConfig = {
      'open': { color: 'bg-yellow-500', text: t('dispute.statusOpen'), icon: Clock },
      'in_review': { color: 'bg-blue-500', text: t('dispute.statusInReview'), icon: Scale },
      'resolved': { color: 'bg-green-500', text: t('dispute.statusResolved'), icon: Shield }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || AlertTriangle;

    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config?.text || status}
      </Badge>
    );
  };

  const existingDispute = disputes[0] as Dispute;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            {existingDispute ? t('dispute.viewTitle') : t('dispute.openTitle')}
          </DialogTitle>
        </DialogHeader>

        {existingDispute ? (
          // View existing dispute
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{t('dispute.details')}</span>
                  {renderDisputeStatus(existingDispute.status)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">{t('dispute.id')}</Label>
                  <p className="text-sm text-muted-foreground">{existingDispute.disputeId}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">{t('dispute.reason')}</Label>
                  <p className="text-sm">{existingDispute.reason}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">{t('dispute.createdAt')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(existingDispute.createdAt).toLocaleString()}
                  </p>
                </div>

                {existingDispute.evidence.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">{t('dispute.evidence')}</Label>
                    <div className="mt-2 space-y-2">
                      {existingDispute.evidence.map((evidence, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                          <FileText className="w-4 h-4" />
                          <span className="text-sm">{evidence}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {existingDispute.status === 'resolved' && existingDispute.resolution && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded">
                    <Label className="text-sm font-medium text-green-800">{t('dispute.resolution')}</Label>
                    <p className="text-sm text-green-700 mt-1">{existingDispute.resolution}</p>
                    {existingDispute.arbiterDecision && (
                      <p className="text-xs text-green-600 mt-2">
                        {t('dispute.decision')}: {existingDispute.arbiterDecision}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {existingDispute.status === 'open' && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('dispute.addEvidence')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="evidence-upload">{t('dispute.uploadEvidence')}</Label>
                    <Input
                      id="evidence-upload"
                      type="file"
                      onChange={handleFileUpload}
                      accept="image/*,video/*,.pdf,.doc,.docx"
                    />
                  </div>

                  {evidenceUrls.length > 0 && (
                    <div>
                      <Label>{t('dispute.pendingEvidence')}</Label>
                      <div className="mt-2 space-y-2">
                        {evidenceUrls.map((url, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                            <Upload className="w-4 h-4" />
                            <span className="text-sm">{url}</span>
                          </div>
                        ))}
                      </div>
                      <Button
                        onClick={() => addEvidenceMutation.mutate({
                          disputeId: existingDispute.id,
                          evidence: evidenceUrls
                        })}
                        disabled={addEvidenceMutation.isPending}
                        className="mt-2"
                      >
                        {addEvidenceMutation.isPending ? t('uploading') : t('dispute.submitEvidence')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="bg-blue-50 border border-blue-200 p-4 rounded">
              <h4 className="font-medium text-blue-800 mb-2">{t('dispute.process')}</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• {t('dispute.step1')}</p>
                <p>• {t('dispute.step2')}</p>
                <p>• {t('dispute.step3')}</p>
                <p>• {t('dispute.step4')}</p>
              </div>
            </div>
          </div>
        ) : (
          // Create new dispute
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
              <h4 className="font-medium text-yellow-800 mb-2">{t('dispute.warning')}</h4>
              <p className="text-sm text-yellow-700">{t('dispute.warningText')}</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="reason">{t('dispute.reason')}</Label>
                <Textarea
                  id="reason"
                  placeholder={t('dispute.reasonPlaceholder')}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div>
                <Label htmlFor="evidence-upload">{t('dispute.uploadEvidence')}</Label>
                <Input
                  id="evidence-upload"
                  type="file"
                  onChange={handleFileUpload}
                  accept="image/*,video/*,.pdf,.doc,.docx"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t('dispute.evidenceHelp')}
                </p>
              </div>

              {evidenceUrls.length > 0 && (
                <div>
                  <Label>{t('dispute.attachedEvidence')}</Label>
                  <div className="mt-2 space-y-2">
                    {evidenceUrls.map((url, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <FileText className="w-4 h-4" />
                        <span className="text-sm">{url}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                {t('cancel')}
              </Button>
              <Button
                onClick={handleCreateDispute}
                disabled={createDisputeMutation.isPending || !reason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {createDisputeMutation.isPending ? t('creating') : t('dispute.openDispute')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}