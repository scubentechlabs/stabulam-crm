import { useEffect } from 'react';
import { Camera, RefreshCw, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCamera } from '@/hooks/useCamera';
import { cn } from '@/lib/utils';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onCancel?: () => void;
  className?: string;
}

export function CameraCapture({ onCapture, onCancel, className }: CameraCaptureProps) {
  const {
    videoRef,
    canvasRef,
    isActive,
    isLoading,
    error,
    capturedImage,
    startCamera,
    stopCamera,
    capturePhoto,
    retakePhoto,
  } = useCamera({ facingMode: 'user' });

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const handleCapture = () => {
    const image = capturePhoto();
    if (image) {
      // Don't call onCapture yet, wait for confirmation
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  const handleCancel = () => {
    stopCamera();
    onCancel?.();
  };

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div className="relative w-full max-w-md aspect-[4/3] bg-muted rounded-xl overflow-hidden">
        {/* Hidden canvas for capturing */}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Video feed */}
        {!capturedImage && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={cn(
              'w-full h-full object-cover',
              !isActive && 'hidden'
            )}
            style={{ transform: 'scaleX(-1)' }} // Mirror for selfie
          />
        )}

        {/* Captured image preview */}
        {capturedImage && (
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
        )}

        {/* Loading state */}
        {isLoading && !isActive && !capturedImage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Camera className="h-12 w-12 animate-pulse" />
              <p className="text-sm">Starting camera...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-destructive/10">
            <div className="flex flex-col items-center gap-2 text-destructive p-4 text-center">
              <Camera className="h-12 w-12" />
              <p className="text-sm font-medium">{error}</p>
              <Button variant="outline" size="sm" onClick={startCamera}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Face guide overlay */}
        {isActive && !capturedImage && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-60 border-2 border-dashed border-primary/50 rounded-[50%]" />
            </div>
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <p className="text-sm text-white bg-black/50 inline-block px-3 py-1 rounded-full">
                Position your face in the oval
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        {!capturedImage ? (
          <>
            <Button
              variant="outline"
              size="lg"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <X className="h-5 w-5 mr-2" />
              Cancel
            </Button>
            <Button
              size="lg"
              onClick={handleCapture}
              disabled={!isActive || isLoading}
              className="min-w-[140px]"
            >
              <Camera className="h-5 w-5 mr-2" />
              Capture
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                retakePhoto();
                startCamera();
              }}
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Retake
            </Button>
            <Button
              size="lg"
              onClick={handleConfirm}
              className="min-w-[140px]"
            >
              <Check className="h-5 w-5 mr-2" />
              Confirm
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
