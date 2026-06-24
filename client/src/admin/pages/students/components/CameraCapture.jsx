// components/CameraCapture.jsx
// Full camera modal: front/back toggle + crop/rotate editor
// Install: npm install react-easy-crop
import { useEffect, useRef, useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import {
  Camera,
  X,
  RotateCcw,
  RotateCw,
  Check,
  FlipHorizontal,
  SwitchCamera,
  ZoomIn,
  ZoomOut,
  Crop,
} from "lucide-react";
import { COLORS } from "./FormFields";

// ── Helper: crop the image using canvas ──────────────────────────────────────
async function getCroppedImage(imageSrc, croppedAreaPixels, rotation = 0) {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", reject);
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);
  ctx.drawImage(
    image,
    safeArea / 2 - image.width / 2,
    safeArea / 2 - image.height / 2
  );

  const data = ctx.getImageData(0, 0, safeArea, safeArea);
  canvas.width = croppedAreaPixels.width;
  canvas.height = croppedAreaPixels.height;
  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - croppedAreaPixels.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - croppedAreaPixels.y)
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const file = new File([blob], `photo-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      resolve({ file, url: URL.createObjectURL(blob) });
    }, "image/jpeg", 0.92);
  });
}

// ── Crop/Edit screen ─────────────────────────────────────────────────────────
function CropEditor({ imageSrc, onConfirm, onRetake }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleConfirm = async () => {
    setProcessing(true);
    try {
      const result = await getCroppedImage(imageSrc, croppedAreaPixels, rotation);
      onConfirm(result.file, result.url);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Crop area */}
      <div className="relative flex-1 bg-black" style={{ minHeight: 280 }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={1}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          style={{
            containerStyle: { borderRadius: 0 },
          }}
        />
      </div>

      {/* Edit controls */}
      <div
        className="px-4 py-3 space-y-3"
        style={{ background: "#111", borderTop: "1px solid #333" }}
      >
        {/* Zoom slider */}
        <div className="flex items-center gap-3">
          <ZoomOut size={14} className="text-white/60 shrink-0" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-white h-1"
          />
          <ZoomIn size={14} className="text-white/60 shrink-0" />
        </div>

        {/* Rotation buttons */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setRotation((r) => r - 90)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white/80 hover:text-white transition-colors"
            style={{ background: "#222", border: "1px solid #333" }}
          >
            <RotateCcw size={13} /> Rotate Left
          </button>
          <button
            onClick={() => { setRotation(0); setZoom(1); setCrop({ x: 0, y: 0 }); }}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white transition-colors"
            style={{ background: "#222", border: "1px solid #333" }}
          >
            Reset
          </button>
          <button
            onClick={() => setRotation((r) => r + 90)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white/80 hover:text-white transition-colors"
            style={{ background: "#222", border: "1px solid #333" }}
          >
            <RotateCw size={13} /> Rotate Right
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={onRetake}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white/70 hover:text-white transition-colors"
            style={{ background: "#222", border: "1px solid #333" }}
          >
            <RotateCcw size={14} /> Retake
          </button>
          <button
            onClick={handleConfirm}
            disabled={processing}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-60"
            style={{ background: "#16a34a" }}
          >
            {processing ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Check size={15} />
            )}
            Use Photo
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main CameraCapture component ─────────────────────────────────────────────
export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [facingMode, setFacingMode] = useState("user"); // "user" = front, "environment" = back
  const [captured, setCaptured] = useState(null);       // base64 after snap
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  // Check if device has multiple cameras
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videoDevices = devices.filter((d) => d.kind === "videoinput");
      setHasMultipleCameras(videoDevices.length > 1);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

  const startCamera = async () => {
    stopCamera();
    setLoading(true);
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setLoading(false);
        };
      }
    } catch (err) {
      setLoading(false);
      if (err.name === "NotAllowedError") {
        setError("Camera permission denied. Please allow camera access in your browser/app settings.");
      } else if (err.name === "NotFoundError") {
        setError("No camera found on this device.");
      } else if (err.name === "OverconstrainedError") {
        // Fallback: try without facingMode constraint
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current.play();
              setLoading(false);
            };
          }
        } catch {
          setError("Could not access camera.");
        }
      } else {
        setError("Could not access camera: " + err.message);
      }
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const flipCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const takeSnapshot = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    // Mirror only front camera
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCaptured(dataUrl);
    stopCamera();
  };

  const retake = () => {
    setCaptured(null);
    // camera restarts via useEffect on facingMode, but we need to trigger it manually
    startCamera();
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <div
        className="bg-black w-full h-full sm:h-auto sm:rounded-2xl overflow-hidden shadow-2xl sm:max-w-md flex flex-col"
        style={{ border: "1px solid #333" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ background: "#111", borderBottom: "1px solid #333" }}
        >
          <div className="flex items-center gap-2">
            <Camera size={16} className="text-white/80" />
            <p className="text-sm font-bold text-white">
              {captured ? "Edit & Crop" : "Take Photo"}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {!captured ? (
            <>
              {/* Live camera view */}
              <div className="relative flex-1 bg-black" style={{ minHeight: 280 }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{
                    display: loading || error ? "none" : "block",
                    transform: facingMode === "user" ? "scaleX(-1)" : "none",
                  }}
                />

                {/* Loading */}
                {loading && !error && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-full border-4 border-white/20 border-t-white animate-spin" />
                    <p className="text-white/60 text-sm">Starting camera…</p>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
                    <Camera size={36} className="text-white/30" />
                    <p className="text-white/70 text-sm text-center">{error}</p>
                    <button
                      onClick={startCamera}
                      className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                      style={{ background: COLORS.primary }}
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {/* Flip camera button — top right of video */}
                {!loading && !error && hasMultipleCameras && (
                  <button
                    onClick={flipCamera}
                    className="absolute top-3 right-3 p-2.5 rounded-full transition-all active:scale-90"
                    style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)" }}
                    title={facingMode === "user" ? "Switch to back camera" : "Switch to front camera"}
                  >
                    <SwitchCamera size={18} className="text-white" />
                  </button>
                )}

                {/* Camera label */}
                {!loading && !error && (
                  <div
                    className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white/80"
                    style={{ background: "rgba(0,0,0,0.5)" }}
                  >
                    {facingMode === "user" ? "Front Camera" : "Back Camera"}
                  </div>
                )}
              </div>

              {/* Capture controls */}
              <div
                className="flex items-center justify-center gap-4 px-4 py-5 shrink-0"
                style={{ background: "#111", borderTop: "1px solid #222" }}
              >
                <button
                  onClick={handleClose}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white/60 hover:text-white transition-colors"
                  style={{ background: "#222", border: "1px solid #333" }}
                >
                  <X size={14} /> Cancel
                </button>

                {/* Big capture button */}
                <button
                  onClick={takeSnapshot}
                  disabled={loading || !!error}
                  className="w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-40"
                  style={{ background: "white", boxShadow: "0 0 0 4px rgba(255,255,255,0.2)" }}
                  title="Take Photo"
                >
                  <Camera size={24} className="text-black" />
                </button>

                {/* Flip button (also shown here for devices with multiple cameras) */}
                {hasMultipleCameras ? (
                  <button
                    onClick={flipCamera}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white/60 hover:text-white transition-colors"
                    style={{ background: "#222", border: "1px solid #333" }}
                  >
                    <SwitchCamera size={14} /> Flip
                  </button>
                ) : (
                  <div className="w-[80px]" /> // spacer to keep capture button centered
                )}
              </div>
            </>
          ) : (
            /* Crop editor */
            <CropEditor
              imageSrc={captured}
              onConfirm={(file, url) => {
                stopCamera();
                onCapture(file, url);
              }}
              onRetake={retake}
            />
          )}
        </div>
      </div>
    </div>
  );
}