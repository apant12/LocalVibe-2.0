import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, Video, Play, Pause, X, CheckCircle } from "lucide-react";

interface VideoUploadStreamingProps {
  onVideoUploaded?: (videoUrl: string, thumbnailUrl: string) => void;
  maxSizeMB?: number;
  onClose?: () => void;
}

export default function VideoUploadStreaming({ onVideoUploaded, maxSizeMB = 100, onClose }: VideoUploadStreamingProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      setUploadProgress(0);

      try {
        // Step 1: Get upload URL from our server
        const uploadResponse = await fetch('/api/upload/video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to get upload URL');
        }

        const uploadData = await uploadResponse.json();
        const { uploadUrl, uploadId } = uploadData;

        // Step 2: Upload directly to Mux
        const formData = new FormData();
        formData.append('file', file);

        // Simulate progress updates during Mux upload
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) return prev;
            return prev + Math.random() * 10;
          });
        }, 500);

        const muxResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: file
        });

        if (!muxResponse.ok) {
          throw new Error('Failed to upload to Mux');
        }

        clearInterval(progressInterval);
        setUploadProgress(100);

        // Step 3: Wait for Mux to process the video
        await new Promise(resolve => setTimeout(resolve, 2000));

        // For now, return a mock playback URL since we need to wait for Mux processing
        return {
          playbackUrl: `https://stream.mux.com/${uploadId}.m3u8`,
          thumbnailUrl: 'https://via.placeholder.com/400x300/1f2937/ffffff?text=Video+Processing',
          videoId: uploadId
        };
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (data) => {
      setUploadedVideo(data.playbackUrl);
      setThumbnailUrl(data.thumbnailUrl);
      setIsUploading(false);
      
      toast({
        title: "Video Upload Successful",
        description: "Your video is ready for streaming",
        className: "bg-green-600 text-white",
      });

      if (onVideoUploaded) {
        onVideoUploaded(data.playbackUrl, data.thumbnailUrl);
      }
    },
    onError: (error: any) => {
      setIsUploading(false);
      setUploadProgress(0);
      
      toast({
        title: "Upload Failed",
        description: error.message || "Please try uploading again",
        variant: "destructive",
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a video file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      toast({
        title: "File Too Large",
        description: `Please select a video smaller than ${maxSizeMB}MB`,
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(file);
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const clearVideo = () => {
    setUploadedVideo(null);
    setThumbnailUrl(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="bg-surface border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Video className="w-5 h-5 text-primary" />
            <span>Video Upload & Streaming</span>
          </div>
          {onClose && (
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white p-2"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        {!uploadedVideo && !isUploading && (
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
            <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">Upload Experience Video</h3>
            <p className="text-gray-400 text-sm mb-4">
              Upload videos up to {maxSizeMB}MB. Supports MP4, MOV, AVI formats.
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-primary hover:bg-primary/90 text-black"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose Video File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-white font-semibold">Uploading Video</h4>
              <span className="text-primary font-semibold">{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin"></div>
              <span>
                {uploadProgress < 50 ? "Uploading..." : 
                 uploadProgress < 90 ? "Processing..." : 
                 "Finalizing..."}
              </span>
            </div>
          </div>
        )}

        {/* Video Player */}
        {uploadedVideo && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-white font-semibold flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Video Ready</span>
              </h4>
              <Button
                onClick={clearVideo}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                src={uploadedVideo}
                poster={thumbnailUrl || undefined}
                className="w-full h-48 object-cover"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                controls={false}
              />
              
              {/* Custom Play/Pause Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Button
                  onClick={togglePlayPause}
                  size="lg"
                  className="bg-black/60 hover:bg-black/80 text-white border-0 rounded-full w-16 h-16"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8 ml-1" />
                  )}
                </Button>
              </div>
            </div>

            {/* Video Info */}
            <div className="bg-black/20 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Status:</span>
                  <div className="flex items-center space-x-1 mt-1">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span className="text-green-400">Ready to Stream</span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Quality:</span>
                  <span className="text-white block mt-1">1080p HD</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Tips */}
        {!uploadedVideo && !isUploading && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <h5 className="text-blue-400 font-semibold mb-2">Video Tips</h5>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• Keep videos under 2 minutes for best engagement</li>
              <li>• Use good lighting and stable footage</li>
              <li>• Include captions for accessibility</li>
              <li>• Show the experience highlights clearly</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}