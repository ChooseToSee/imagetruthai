import { useRef, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import UploadSection from "@/components/UploadSection";
import ResultsDisplay, { type AnalysisResult } from "@/components/ResultsDisplay";
import HowItWorks from "@/components/HowItWorks";
import PricingSection from "@/components/PricingSection";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const uploadRef = useRef<HTMLDivElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const scrollToUpload = useCallback(() => {
    uploadRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleAnalyze = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        "analyze-image",
        { body: formData }
      );

      if (fnError) throw fnError;

      const res = fnData as AnalysisResult;
      setResult(res);

      // Save to history if logged in
      if (user) {
        await supabase.from("scan_history").insert({
          user_id: user.id,
          file_name: file.name,
          file_size: file.size,
          verdict: res.verdict,
          confidence: res.confidence,
          reasons: res.reasons,
          tips: res.tips,
        });
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
  }, [user, toast]);

  const handleReset = useCallback(() => {
    setResult(null);
    setPreview(null);
    scrollToUpload();
  }, [scrollToUpload]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection onScrollToUpload={scrollToUpload} />

      {result && preview ? (
        <ResultsDisplay result={result} imagePreview={preview} onReset={handleReset} />
      ) : (
        <UploadSection
          ref={uploadRef}
          onAnalyze={handleAnalyze}
          isAnalyzing={isAnalyzing}
        />
      )}

      <HowItWorks />
      <PricingSection />
      <Footer />
    </div>
  );
};

export default Index;
