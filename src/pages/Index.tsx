import { useRef, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/lib/compress-image";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import UploadSection from "@/components/UploadSection";
import ResultsDisplay, { type AnalysisResult } from "@/components/ResultsDisplay";
import BatchResultsDisplay, { type BatchItem } from "@/components/BatchResultsDisplay";
import HowItWorks from "@/components/HowItWorks";
import PricingSection from "@/components/PricingSection";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

// Sample demo result
const DEMO_RESULT: AnalysisResult = {
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
};

const DEMO_PREVIEW = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80";

const Index = () => {
  const uploadRef = useRef<HTMLDivElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [singleResult, setSingleResult] = useState<{ result: AnalysisResult; preview: string } | null>(null);
  const [batchResults, setBatchResults] = useState<BatchItem[] | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const scrollToUpload = useCallback(() => {
    setSingleResult(null);
    setBatchResults(null);
    setTimeout(() => {
      uploadRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, []);

  const handleDemo = useCallback(() => {
    setSingleResult({ result: DEMO_RESULT, preview: DEMO_PREVIEW });
    // Scroll to results
    setTimeout(() => {
      window.scrollTo({ top: 600, behavior: "smooth" });
    }, 100);
  }, []);

  const analyzeOne = async (file: File): Promise<{ result: AnalysisResult; preview: string }> => {
    const preview = URL.createObjectURL(file);
    const compressed = await compressImage(file);
    const formData = new FormData();
    formData.append("image", compressed);

    const { data, error } = await supabase.functions.invoke("analyze-image", {
      body: formData,
    });

    if (error) throw error;
    const result = data as AnalysisResult;

    if (user) {
      await supabase.from("scan_history").insert({
        user_id: user.id,
        file_name: file.name,
        file_size: file.size,
        verdict: result.verdict,
        confidence: result.confidence,
        reasons: result.reasons,
        tips: result.tips,
      });
    }

    return { result, preview };
  };

  const handleAnalyze = useCallback(
    async (files: File[]) => {
      setIsAnalyzing(true);
      setSingleResult(null);
      setBatchResults(null);

      try {
        const settled: PromiseSettledResult<{ result: AnalysisResult; preview: string }>[] = [];
        const concurrency = 3;
        for (let i = 0; i < files.length; i += concurrency) {
          const batch = files.slice(i, i + concurrency);
          const batchResults = await Promise.allSettled(batch.map((f) => analyzeOne(f)));
          settled.push(...batchResults);
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
      } catch (err: any) {
        toast({
          title: "Analysis failed",
          description: err.message || "Please try again later",
          variant: "destructive",
        });
      } finally {
        setIsAnalyzing(false);
      }
    },
    [user, toast]
  );

  const handleReset = useCallback(() => {
    setSingleResult(null);
    setBatchResults(null);
    scrollToUpload();
  }, [scrollToUpload]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection onScrollToUpload={scrollToUpload} onDemo={handleDemo} />

      {singleResult ? (
        <ResultsDisplay result={singleResult.result} imagePreview={singleResult.preview} onReset={handleReset} />
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
