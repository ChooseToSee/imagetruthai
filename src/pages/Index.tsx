import { useRef, useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/lib/compress-image";
import { analyzeImageStream, type StreamConsensus } from "@/lib/analyze-stream";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import UploadSection from "@/components/UploadSection";
import ResultsDisplay, { type AnalysisResult } from "@/components/ResultsDisplay";
import BatchResultsDisplay, { type BatchItem } from "@/components/BatchResultsDisplay";
import HowItWorks from "@/components/HowItWorks";
import PricingSection from "@/components/PricingSection";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

// Sample demo results
const DEMO_AI_RESULT: AnalysisResult = {
  verdict: "ai",
  confidence: 94,
  reasons: [
    "Uniform noise pattern consistent with diffusion-based generation (DALL·E / Stable Diffusion)",
    "Skin texture lacks natural micro-details typically found in real photographs",
    "Lighting reflections in the eyes show synthetic uniformity",
    "Metadata contains no camera EXIF data — common in AI-generated outputs",
  ],
  tips: [
    "Check for unnatural symmetry in facial features",
    "Zoom into hands and fingers — AI often struggles with these",
    "Look for repeating patterns in background textures",
    "Reverse-image-search to check for known AI-generated content",
  ],
  modelBreakdown: [
    {
      model: "Winston",
      verdict: "ai",
      confidence: 96,
      reasons: ["Winston AI scored 96% AI generation probability", "Trained on millions of AI-generated images with 99.98% claimed accuracy", "Analyzes pixel patterns and metadata for synthetic generation signatures"],
    },
    {
      model: "SightEngine",
      verdict: "ai",
      confidence: 93,
      reasons: ["SightEngine scored 93.1% AI generation probability", "Pixel-level analysis detected synthetic generation patterns", "Purpose-trained classifier for diffusion and GAN detection"],
    },
    {
      model: "AI or Not",
      verdict: "ai",
      confidence: 91,
      reasons: ["AI or Not verdict: AI-generated with 91.4% confidence", "Top suspected generator: stable diffusion", "Specialized classifier trained to identify AI synthesis patterns"],
    },
  ],
};

const DEMO_REAL_RESULT: AnalysisResult = {
  verdict: "human",
  confidence: 91,
  reasons: [
    "Natural sensor noise pattern consistent with a CMOS camera sensor",
    "EXIF metadata includes camera model, lens info, and GPS coordinates",
    "Micro-texture details in skin and fabric are consistent with optical capture",
    "Depth-of-field bokeh shows authentic lens characteristics",
  ],
  tips: [
    "Real photos typically contain rich EXIF metadata from the camera",
    "Look for natural imperfections — slight motion blur, lens flare, dust spots",
    "Authentic photos have varied noise grain that differs from AI smoothness",
    "Check for consistent perspective and lighting across the scene",
  ],
  modelBreakdown: [
    {
      model: "Winston",
      verdict: "human",
      confidence: 93,
      reasons: ["Winston AI scored 93% authentic probability", "Image characteristics consistent with real camera capture", "No AI generation patterns detected by Winston's classifier"],
    },
    {
      model: "SightEngine",
      verdict: "human",
      confidence: 89,
      reasons: ["SightEngine scored 89.2% authentic probability", "Image pixel patterns consistent with optical camera capture", "No synthetic generation artifacts detected"],
    },
    {
      model: "AI or Not",
      verdict: "human",
      confidence: 88,
      reasons: ["AI or Not verdict: Human-created with 88.5% confidence", "Image characteristics match authentic photographic content", "No AI generator signatures detected"],
    },
  ],
};

const DEMO_AI_PREVIEW = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80";
const DEMO_REAL_PREVIEW = "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=400&q=80";

const DEMOS = [
  { result: DEMO_AI_RESULT, preview: DEMO_AI_PREVIEW },
  { result: DEMO_REAL_RESULT, preview: DEMO_REAL_PREVIEW },
];

const Index = () => {
  const uploadRef = useRef<HTMLDivElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [singleResult, setSingleResult] = useState<{ result: AnalysisResult; preview: string } | null>(null);
  const [batchResults, setBatchResults] = useState<BatchItem[] | null>(null);
  const [demoIndex, setDemoIndex] = useState(0);
  const [streamProgress, setStreamProgress] = useState<{ completed: number; total: number } | null>(null);
  const [partialReady, setPartialReady] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user, refreshSubscription } = useAuth();
  const { toast } = useToast();

  // Handle checkout success redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      toast({ title: "Subscription activated!", description: "Your plan has been upgraded." });
      refreshSubscription();
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // 15s timeout: show partial results if not all models done
  useEffect(() => {
    if (isAnalyzing && streamProgress && streamProgress.completed > 0 && streamProgress.completed < streamProgress.total) {
      timeoutRef.current = setTimeout(() => {
        setPartialReady(true);
      }, 15000);
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }
  }, [isAnalyzing, streamProgress?.completed]);

  const scrollToUpload = useCallback(() => {
    setSingleResult(null);
    setBatchResults(null);
    setTimeout(() => {
      uploadRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, []);

  const handleDemo = useCallback(() => {
    const demo = DEMOS[demoIndex];
    setSingleResult({ result: demo.result, preview: demo.preview });
    setDemoIndex((prev) => (prev + 1) % DEMOS.length);
    setTimeout(() => {
      window.scrollTo({ top: 600, behavior: "smooth" });
    }, 100);
  }, [demoIndex]);

  const saveToHistory = async (file: File, result: AnalysisResult) => {
    if (!user) return;

    // Upload image to storage
    let image_url: string | null = null;
    const filePath = `${user.id}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("scan-images")
      .upload(filePath, file, { contentType: file.type, upsert: false });
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from("scan-images").getPublicUrl(filePath);
      image_url = urlData.publicUrl;
    }

    await supabase.from("scan_history").insert({
      user_id: user.id,
      file_name: file.name,
      file_size: file.size,
      verdict: result.verdict,
      confidence: result.confidence,
      reasons: result.reasons,
      tips: result.tips,
      image_url,
    });
  };

  const analyzeOneStreaming = async (file: File, preview: string) => {
    const compressed = await compressImage(file);
    console.log(`Original: ${(file.size/1024).toFixed(0)}KB, Compressed: ${(compressed.size/1024).toFixed(0)}KB`);
    
    if (compressed.size > 2 * 1024 * 1024) {
      throw new Error("Image is too large even after compression. Please use a smaller image.");
    }
    setStreamProgress({ completed: 0, total: 3 });

    await analyzeImageStream(compressed, {
      onModel: () => {},
      onConsensus: (consensus) => {
        setStreamProgress({ completed: consensus.modelsCompleted, total: consensus.modelsTotal });
        // Show interim results live
        setSingleResult({ result: consensus, preview });
      },
      onDone: (finalResult) => {
        setSingleResult({ result: finalResult, preview });
        setStreamProgress(null);
        saveToHistory(file, finalResult);
      },
      onError: (error) => {
        toast({ title: "Analysis failed", description: error, variant: "destructive" });
        setStreamProgress(null);
      },
    });
  };

  const analyzeOneFallback = async (file: File): Promise<{ result: AnalysisResult; preview: string }> => {
    const preview = URL.createObjectURL(file);
    const compressed = await compressImage(file);
    const formData = new FormData();
    formData.append("image", compressed);

    const { data, error } = await supabase.functions.invoke("analyze-image", {
      body: formData,
    });

    if (error) throw error;
    const result = data as AnalysisResult;
    await saveToHistory(file, result);
    return { result, preview };
  };

  const handleAnalyze = useCallback(
    async (files: File[]) => {
      setIsAnalyzing(true);
      setSingleResult(null);
      setBatchResults(null);
      setPartialReady(false);

      try {
        if (files.length === 1) {
          // Single image: use streaming for progressive results
          const preview = URL.createObjectURL(files[0]);
          await analyzeOneStreaming(files[0], preview);
        } else {
          // Batch: use original approach
          const settled: PromiseSettledResult<{ result: AnalysisResult; preview: string }>[] = [];
          const concurrency = 2;
          for (let i = 0; i < files.length; i += concurrency) {
            const batch = files.slice(i, i + concurrency);
            const batchResults = await Promise.allSettled(batch.map((f) => analyzeOneFallback(f)));
            settled.push(...batchResults);
            // Small delay between batches to avoid rate limits
            if (i + concurrency < files.length) {
              await new Promise((r) => setTimeout(r, 1000));
            }
          }

          const successes: BatchItem[] = [];
          let failures = 0;

          settled.forEach((s, i) => {
            if (s.status === "fulfilled") {
              successes.push({
                fileName: files[i].name,
                preview: s.value.preview,
                result: s.value.result,
              });
            } else {
              failures++;
            }
          });

          if (failures > 0) {
            toast({
              title: `${failures} image${failures > 1 ? "s" : ""} failed`,
              description: "Some images could not be analyzed. Results shown for the rest.",
              variant: "destructive",
            });
          }

          if (successes.length === 0) {
            toast({
              title: "Analysis failed",
              description: "None of the images could be analyzed. Please try again.",
              variant: "destructive",
            });
          } else if (successes.length === 1) {
            setSingleResult({ result: successes[0].result, preview: successes[0].preview });
          } else {
            setBatchResults(successes);
          }
        }
      } catch (err: any) {
        const msg = err.message || "Please try again later";
        const isCredits = msg.includes("temporarily unavailable");
        const isRate = msg.includes("Too many requests");
        toast({
          title: isCredits ? "Service unavailable" : isRate ? "Slow down" : "Analysis failed",
          description: msg,
          variant: "destructive",
        });
      } finally {
        setIsAnalyzing(false);
        setStreamProgress(null);
        setPartialReady(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      }
    },
    [user, toast]
  );

  const handleReset = useCallback(() => {
    setSingleResult(null);
    setBatchResults(null);
    setPartialReady(false);
    scrollToUpload();
  }, [scrollToUpload]);

  const handleKeepWaiting = useCallback(() => {
    setPartialReady(false);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection onScrollToUpload={scrollToUpload} onDemo={handleDemo} />

      {singleResult ? (
        <ResultsDisplay
          result={singleResult.result}
          imagePreview={singleResult.preview}
          onReset={handleReset}
          streamProgress={streamProgress ?? undefined}
          partialReady={partialReady}
          onKeepWaiting={handleKeepWaiting}
        />
      ) : batchResults ? (
        <BatchResultsDisplay items={batchResults} onReset={handleReset} />
      ) : (
        <UploadSection ref={uploadRef} onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
      )}

      <HowItWorks />
      <PricingSection />
      <Footer />
    </div>
  );
};

export default Index;
