import { useRef, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import UploadSection from "@/components/UploadSection";
import ResultsDisplay, { type AnalysisResult } from "@/components/ResultsDisplay";
import BatchResultsDisplay, { type BatchItem } from "@/components/BatchResultsDisplay";
import HowItWorks from "@/components/HowItWorks";
import PricingSection from "@/components/PricingSection";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const uploadRef = useRef<HTMLDivElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [singleResult, setSingleResult] = useState<{ result: AnalysisResult; preview: string } | null>(null);
  const [batchResults, setBatchResults] = useState<BatchItem[] | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const scrollToUpload = useCallback(() => {
    uploadRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const analyzeOne = async (file: File): Promise<{ result: AnalysisResult; preview: string }> => {
    const preview = URL.createObjectURL(file);
    const formData = new FormData();
    formData.append("image", file);

    const { data, error } = await supabase.functions.invoke("analyze-image", {
      body: formData,
    });

    if (error) throw error;
    const result = data as AnalysisResult;

    // Save to history if logged in
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
        // Run all analyses in parallel
        const settled = await Promise.allSettled(files.map((f) => analyzeOne(f)));

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

  const showResults = singleResult || batchResults;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection onScrollToUpload={scrollToUpload} />

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
