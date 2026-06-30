import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageIcon, Trash2, Upload, X, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { WorkOrderAttachment } from '@/types/maintenance/WorkOrder';
import workOrderService from '@/services/api/workOrderService';
import MessengerService from '@/services/ui/messengerService';
import { WorkOrderStatus } from '@/config/enum';
import ImageViewer, { ImageViewerProvider } from '../ui/ImageViewer';
import useImageError from '@/hooks/use-image-error';

interface WorkOrderAttachmentsProps {
  workOrderId: string;
  status: WorkOrderStatus;
  initialAttachments: WorkOrderAttachment[];
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const WorkOrderAttachments: React.FC<WorkOrderAttachmentsProps> = ({
  workOrderId,
  status,
  initialAttachments,
}) => {
  const { handleImageError } = useImageError();
  const { t } = useTranslation();
  const [attachments, setAttachments] = useState<WorkOrderAttachment[]>(initialAttachments);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditable =
    status !== WorkOrderStatus.Cancelled && status !== WorkOrderStatus.Completed;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        MessengerService.error(t('workOrders.attachments.invalidFileType'));
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        MessengerService.error(t('workOrders.attachments.fileTooLarge'));
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

    setUploading(true);
    try {
      for (const file of files) {
        const attachment = await workOrderService.uploadAttachment(workOrderId, file);
        setAttachments((prev) => [...prev, attachment]);
      }
      MessengerService.success(t('workOrders.attachments.uploadSuccess'));
    } catch {
      MessengerService.error(t('workOrders.attachments.uploadFailed'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (attachmentId: string) => {
    setDeletingId(attachmentId);
    try {
      await workOrderService.deleteAttachment(workOrderId, attachmentId);
      setAttachments((prev) => prev.filter((a) => a.attachmentId !== attachmentId));
      MessengerService.success(t('workOrders.attachments.deleteSuccess'));
    } catch {
      MessengerService.error(t('workOrders.attachments.deleteFailed'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              {t('workOrders.attachments.title')} ({attachments.length})
            </CardTitle>
            {isEditable && (
              <Button
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {uploading ? t('common.uploading') : t('workOrders.attachments.upload')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          {attachments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{t('workOrders.attachments.noAttachments')}</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <ImageViewerProvider>
                {attachments.map((attachment) => (
                  <div
                    key={attachment.attachmentId}
                    className="relative aspect-square rounded-md overflow-hidden border bg-muted cursor-pointer"
                  >
                    <ImageViewer url={attachment.url}>
                      <img
                        src={attachment.url}
                        alt={attachment.fileName}
                        className="size-20 rounded object-cover border border-muted"
                        onError={() => handleImageError(attachment.url)}
                      />
                    </ImageViewer>
                    {isEditable && (
                      <button
                        className="absolute top-0 right-0 size-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-90 hover:opacity-100 disabled:opacity-50"
                        disabled={deletingId === attachment.attachmentId}
                        onClick={() => handleDelete(attachment.attachmentId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </ImageViewerProvider>
            </div>
          )}
        </CardContent >
      </Card >

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setLightboxUrl(null)}
        >
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-4 right-4 text-white hover:text-white hover:bg-white/20"
            onClick={() => setLightboxUrl(null)}
          >
            <X className="h-6 w-6" />
          </Button>
          <img
            src={lightboxUrl}
            alt="preview"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default WorkOrderAttachments;
