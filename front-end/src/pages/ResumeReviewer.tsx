import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, CheckCircle, AlertCircle, TrendingUp, Download, FileText, X, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useJobKaiStore } from "@/store/useJobKaiStore";
import { analyzeResume, downloadImprovedResume } from "@/services/jobKaiAPI";
import type { UploadedCV } from "@/store/types";

export default function ResumeReviewer() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Global state
  const uploadedCV = useJobKaiStore((state) => state.uploadedCV);
  const resumeAnalysis = useJobKaiStore((state) => state.resumeAnalysis);
  const isLoading = useJobKaiStore((state) => state.isLoadingResume);
  const setUploadedCV = useJobKaiStore((state) => state.setUploadedCV);
  const setResumeAnalysis = useJobKaiStore((state) => state.setResumeAnalysis);
  const setIsLoading = useJobKaiStore((state) => state.setIsLoadingResume);

  const [isImproving, setIsImproving] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF or DOCX file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Create object URL for preview
    const fileUrl = URL.createObjectURL(file);

    // Store in global state
    const cvData: UploadedCV = {
      fileName: file.name,
      fileObject: file,
      fileUrl,
      fileType: file.type,
      lastModified: file.lastModified,
      uploadedAt: new Date().toISOString(),
    };

    setUploadedCV(cvData);
    
    toast({
      title: "File Uploaded",
      description: `${file.name} is ready for analysis`,
    });
  };

  const handleAnalyze = async () => {
    if (!uploadedCV?.fileObject) {
      toast({
        title: "No File Selected",
        description: "Please upload a resume first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Starting resume analysis for:', uploadedCV.fileName);
      const analysis = await analyzeResume(uploadedCV.fileObject);
      console.log('Resume analysis completed:', analysis);
      setResumeAnalysis(analysis);
      
      toast({
        title: "Analysis Complete",
        description: `Your resume scored ${analysis.score}/100`,
      });
    } catch (error: any) {
      console.error('Resume analysis error:', error);
      console.error('Error response:', error.response?.data);
      toast({
        title: "Analysis Failed",
        description: error.response?.data?.message || "Failed to analyze resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImprove = async () => {
    if (!uploadedCV?.fileObject) {
      toast({
        title: "No File Selected",
        description: "Please upload a resume first",
        variant: "destructive",
      });
      return;
    }

    setIsImproving(true);
    try {
      console.log('Starting resume improvement for:', uploadedCV.fileName);
      await downloadImprovedResume(
        uploadedCV.fileObject,
        `improved_${uploadedCV.fileName}`
      );
      console.log('Resume improvement completed successfully');
      
      toast({
        title: "Resume Improved",
        description: "Your improved resume has been downloaded",
      });
    } catch (error: any) {
      console.error('Resume improvement error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error message:', error.message);
      toast({
        title: "Improvement Failed",
        description: error.message || error.response?.data?.message || "Failed to improve resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsImproving(false);
    }
  };

  const handleRemoveFile = () => {
    if (uploadedCV?.fileUrl) {
      URL.revokeObjectURL(uploadedCV.fileUrl);
    }
    setUploadedCV(null);
    setResumeAnalysis(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Resume Reviewer</h1>
        <p className="text-muted-foreground mt-2">
          Get AI-powered insights to improve your resume
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upload Section */}
        <Card className="shadow-soft lg:col-span-1">
          <CardHeader>
            <CardTitle>Upload Resume</CardTitle>
            <CardDescription>PDF or DOCX format (max 5MB)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />

            {!uploadedCV ? (
              <div 
                className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                onClick={handleBrowseClick}
              >
                <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drop your resume here or click to browse
                </p>
                <Button variant="outline" size="sm" type="button">
                  Select File
                </Button>
              </div>
            ) : (
              <div className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-primary mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {uploadedCV.fileName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {uploadedCV.fileObject 
                        ? `${(uploadedCV.fileObject.size / 1024 / 1024).toFixed(2)} MB`
                        : 'Size unknown'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                {!uploadedCV.fileObject && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      File lost after page refresh. Please re-upload your CV to analyze it.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {uploadedCV && !resumeAnalysis && (
              <Button 
                className="w-full" 
                onClick={handleAnalyze}
                disabled={isLoading || !uploadedCV.fileObject}
              >
                {isLoading 
                  ? "Analyzing..." 
                  : !uploadedCV.fileObject 
                    ? "Please re-upload your CV" 
                    : "Analyze Resume"}
              </Button>
            )}

            {resumeAnalysis && (
              <div className="space-y-2">
                <Button 
                  className="w-full"
                  onClick={handleImprove}
                  disabled={isImproving}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isImproving ? "Improving..." : "Download Improved Version"}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleAnalyze}
                  disabled={isLoading}
                >
                  Analyze Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analysis Results */}
        <Card className="shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>AI-powered suggestions to enhance your resume</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-primary animate-pulse" />
                  <span className="text-foreground">Analyzing your resume...</span>
                </div>
                <Progress value={66} className="h-2" />
              </div>
            )}

            {resumeAnalysis && !isLoading && (
              <>
                {/* Overall Score */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10">
                  <div>
                    <h3 className="font-semibold text-foreground">Overall Score</h3>
                    <p className="text-sm text-muted-foreground">Based on industry standards</p>
                  </div>
                  <div className="text-4xl font-bold text-primary">{resumeAnalysis.score}/100</div>
                </div>

                {/* Missing Sections */}
                {resumeAnalysis.missingSections && resumeAnalysis.missingSections.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-destructive" />
                      Missing Sections
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {resumeAnalysis.missingSections.map((section, index) => (
                        <Badge key={index} variant="destructive">
                          {section}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths */}
                {resumeAnalysis.strengths && resumeAnalysis.strengths.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-success" />
                      Strengths
                    </h3>
                    {resumeAnalysis.strengths.map((strength, index) => (
                      <div
                        key={index}
                        className="flex gap-3 p-4 rounded-lg bg-success/10 hover:bg-success/20 transition-colors"
                      >
                        <CheckCircle className="w-5 h-5 mt-0.5 text-success" />
                        <p className="text-sm text-foreground">{strength}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Weaknesses */}
                {resumeAnalysis.weaknesses && resumeAnalysis.weaknesses.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-accent" />
                      Areas for Improvement
                    </h3>
                    {resumeAnalysis.weaknesses.map((weakness, index) => (
                      <div
                        key={index}
                        className="flex gap-3 p-4 rounded-lg bg-accent/10 hover:bg-accent/20 transition-colors"
                      >
                        <AlertCircle className="w-5 h-5 mt-0.5 text-accent" />
                        <p className="text-sm text-foreground">{weakness}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommendations */}
                {resumeAnalysis.recommendations && resumeAnalysis.recommendations.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground">Recommendations</h3>
                    {resumeAnalysis.recommendations.map((recommendation, index) => (
                      <div
                        key={index}
                        className="flex gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <TrendingUp className="w-5 h-5 mt-0.5 text-primary" />
                        <p className="text-sm text-foreground">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {!isLoading && !resumeAnalysis && (
              <div className="text-center py-12">
                <Upload className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Upload your resume to get started with AI analysis
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
