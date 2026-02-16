import { useRef, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import UploadSection from "@/components/UploadSection";
import ResultsDisplay, { type AnalysisResult } from "@/components/ResultsDisplay";
import HowItWorks from "@/components/HowItWorks";
import PricingSection from "@/components/PricingSection";
import Footer from "@/components/Footer";

// Mock analysis — will be replaced with real API call
const mockAnalyze = (): Promise<AnalysisResult> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const isAI = Math.random() > 0.4;
      resolve({
        verdict: isAI ? "ai" : "human",
        confidence: isAI
          ? Math.floor(Math.random() * 15) + 85
          : Math.floor(Math.random() * 15) + 85,
        reasons: isAI
          ? [
              "Unnatural symmetry detected in facial features",
              "Perfect gradient transitions uncommon in photographs",
              "Lack of natural sensor noise in shadow regions",
              "Metadata inconsistent with known camera models",
            ]
          : [
              "Natural noise distribution consistent with camera sensor",
              "EXIF data matches known camera model (Canon EOS R5)",
              "Micro-imperfections in lighting consistent with real capture",
              "No repeating pattern artifacts detected",
            ],
        tips: [
          "Check the image metadata with an EXIF viewer",
          "Try a reverse image search on Google or TinEye",
          "Look for subtle artifacts around hands, text, or edges",
          "Compare with known authentic images from the same source",
        ],
      });
    }, 2500);
  });

const Index = () => {
  const uploadRef = useRef<HTMLDivElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const scrollToUpload = useCallback(() => {
    uploadRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleAnalyze = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    setResult(null);
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      const res = await mockAnalyze();
      setResult(res);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

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
