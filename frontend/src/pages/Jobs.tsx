// src/pages/Jobs.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Clock,
    Search,
    Filter,
    MoreHorizontal,
    Eye,
    RotateCcw,
    Trash2,
    X,
    Play,
    Pause,
    CheckCircle,
    AlertCircle,
    Loader2,
    FileText,
    Globe,
    BarChart3,
    Calendar,
    Timer,
    RefreshCw,
    Upload
} from "lucide-react";
import { useBusiness } from "@/contexts/BusinessContext";
import { 
    useJobsByBusiness,
    useDeleteJob, 
    useCancelJob, 
    useRetryJob,
    useJobStatus,
    useCreateJob,
    useUploadCSV
} from "@/hooks/useJobs";
import { 
    useAnalyzeJobReviews,
    useAnalyzeSourceReviews,
    useAnalyzeLocationReviews,
    useAnalyzeBusinessReviews
} from "@/hooks/useAnalysis";
import { useSourcesByBusiness } from "@/hooks/useSources";
import { useLocationsByBusiness } from "@/hooks/useLocations";
import { 
    Job, 
    JobStatus, 
    JobType,
    JobCreate,
    getJobStatusColor,
    getJobStatusLabel,
    getJobProgress,
    isJobActive
} from "@/services/job";
import { useNavigate } from "react-router-dom";

// Job type configurations
const JOB_TYPE_CONFIG = {
    scraping: {
        label: "Scraping",
        icon: Globe,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200"
    },
    csv_upload: {
        label: "CSV Upload", 
        icon: FileText,
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200"
    },
    analysis: {
        label: "Analysis",
        icon: BarChart3,
        color: "text-purple-600", 
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200"
    }
};

const STATUS_FILTERS = [
    { value: "all", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "running", label: "Running" },
    { value: "saving", label: "Saving" },
    { value: "completed", label: "Completed" },
    { value: "failed", label: "Failed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "partially_completed", label: "Partial" }
];

const TYPE_FILTERS = [
    { value: "all", label: "All Types" },
    { value: "scraping", label: "Scraping" },
    { value: "csv_upload", label: "CSV Upload" },
    { value: "analysis", label: "Analysis" }
];

// Component for real-time job status
const JobStatusCell = ({ job }: { job: Job }) => {
    const { data: liveStatus } = useJobStatus(job.id, isJobActive(job.status));
    const currentStatus = liveStatus?.status || job.status;
    const totalReviews = liveStatus?.total_reviews || job.total_reviews;
    const reviewsHandled = liveStatus?.reviews_handled || job.reviews_handled;
    
    const progress = totalReviews && reviewsHandled 
        ? Math.round((reviewsHandled / totalReviews) * 100)
        : 0;
    
    const isActive = isJobActive(currentStatus);
    
    return (
        <div className="flex items-center gap-2">
            <Badge className={getJobStatusColor(currentStatus)}>
                {isActive && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                {getJobStatusLabel(currentStatus)}
            </Badge>
            
            {isActive && totalReviews && (
                <div className="text-xs text-muted-foreground">
                    {reviewsHandled || 0}/{totalReviews} ({progress}%)
                </div>
            )}
            
            {currentStatus === 'failed' && liveStatus?.error && (
                <div className="text-xs text-red-600 max-w-20 truncate" title={liveStatus.error}>
                    {liveStatus.error}
                </div>
            )}
        </div>
    );
};

// Component for job duration
const JobDuration = ({ job }: { job: Job }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    
    useEffect(() => {
        if (isJobActive(job.status)) {
            const interval = setInterval(() => setCurrentTime(new Date()), 1000);
            return () => clearInterval(interval);
        }
    }, [job.status]);
    
    const getDuration = () => {
        if (!job.started_at) return null;
        
        const start = new Date(job.started_at + (job.started_at.endsWith('Z') ? '' : 'Z'));
        const end = job.ended_at 
            ? new Date(job.ended_at + (job.ended_at.endsWith('Z') ? '' : 'Z'))
            : currentTime;
        const durationMs = end.getTime() - start.getTime();
        
        const minutes = Math.floor(durationMs / 60000);
        const seconds = Math.floor((durationMs % 60000) / 1000);
        
        if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        }
        return `${seconds}s`;
    };
    
    const duration = getDuration();
    
    return (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {duration && (
                <>
                    <Timer className="h-3 w-3" />
                    {duration}
                </>
            )}
        </div>
    );
};

const Jobs = () => {
    const navigate = useNavigate();
    const { selectedBusiness, businesses } = useBusiness();
    const { data: jobs = [], isLoading, error, refetch } = useJobsByBusiness(selectedBusiness?.id || '');
    const { data: locations = []} = useLocationsByBusiness(selectedBusiness?.id || '');
    const { data: sources = [] } = useSourcesByBusiness(selectedBusiness?.id || '');
    
    // Mutations
    const deleteJobMutation = useDeleteJob();
    const cancelJobMutation = useCancelJob();
    const retryJobMutation = useRetryJob();
    const createJobMutation = useCreateJob();
    const uploadCSVMutation = useUploadCSV();
    const analyzeJobMutation = useAnalyzeJobReviews();
    const analyzeSourceMutation = useAnalyzeSourceReviews();
    const analyzeLocationMutation = useAnalyzeLocationReviews();
    const analyzeBusinessMutation = useAnalyzeBusinessReviews();
    
    // Dialog states
    const [isDataJobDialogOpen, setIsDataJobDialogOpen] = useState(false);
    const [isAnalysisJobDialogOpen, setIsAnalysisJobDialogOpen] = useState(false);
    
    // Data job form state
    const [dataJobType, setDataJobType] = useState<"scraping" | "csv_upload">("scraping");
    const [selectedSourceId, setSelectedSourceId] = useState<string>("");
    const [jobName, setJobName] = useState("");
    const [csvFile, setCsvFile] = useState<File | null>(null);
    
    // Analysis job form state
    const [analysisTarget, setAnalysisTarget] = useState<"job" | "source" | "location" | "business">("job");
    const [selectedJobId, setSelectedJobId] = useState<string>("");
    const [selectedAnalysisSourceId, setSelectedAnalysisSourceId] = useState<string>("");
    const [selectedLocationId, setSelectedLocationId] = useState<string>("");
    const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
    
    // Filters and search
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [businessFilter, setBusinessFilter] = useState("all");
    const [locationFilter, setLocationFilter] = useState("all");
    const [sourceFilter, setSourceFilter] = useState("all");
    const [timeFilter, setTimeFilter] = useState("all");

    const TIME_FILTERS = [
        { value: "all", label: "All Time" },
        { value: "5min", label: "Last 5 minutes" },
        { value: "1h", label: "Last hour" },
        { value: "12h", label: "Last 12 hours" },
        { value: "24h", label: "Last 24 hours" }
    ];
    
    // Filter sources for data job type
    const getFilteredSources = () => {
        if (dataJobType === "scraping") {
            return sources.filter(source => source.type === "google" && source.url);
        } else {
            return sources.filter(source => source.type === "csv");
        }
    };
    
    // Get completed jobs for analysis
    const getCompletedJobs = () => {
        return jobs.filter(job => 
            ['scraping', 'csv_upload'].includes(job.job_type) && 
            ['completed', 'partially_completed'].includes(job.status)
        );
    };
    
    // Note: For sources/locations with reviews, we would need to fetch their stats
    // For now, we'll show all sources/locations since stats fetching would require multiple API calls
    // In a real implementation, you might want to:
    // 1. Fetch stats for all sources/locations on component mount
    // 2. Or check if they have any associated completed jobs
    // 3. Or add a has_reviews flag to the source/location models
    
    // Handle data job creation
    const handleCreateDataJob = async () => {
        try {
            if (dataJobType === "scraping") {
                const selectedSource = sources.find(s => s.id === selectedSourceId);
                if (!selectedSource) return;
                
                const jobData: JobCreate = {
                    name: jobName || undefined,
                    job_type: "scraping",
                    url: selectedSource.url,
                    business_id: selectedSource.business_id,
                    location_id: selectedSource.location_id,
                    source_id: selectedSource.id,
                    source_type: selectedSource.type as any
                };
                
                await createJobMutation.mutateAsync(jobData);
            } else {
                if (!csvFile) return;
                const selectedSource = sources.find(s => s.id === selectedSourceId);
                if (!selectedSource) return;
                
                await uploadCSVMutation.mutateAsync({
                    file: csvFile,
                    jobName: jobName || null,
                    businessId: selectedSource.business_id,
                    locationId: selectedSource.location_id || null
                });
            }
            
            // Reset form and close dialog
            setIsDataJobDialogOpen(false);
            setSelectedSourceId("");
            setJobName("");
            setCsvFile(null);
        } catch (error) {
            console.error('Failed to create data job:', error);
        }
    };
    
    // Handle analysis job creation
    const handleCreateAnalysisJob = async () => {
        try {
            switch (analysisTarget) {
                case "job":
                    await analyzeJobMutation.mutateAsync({ jobId: selectedJobId });
                    break;
                case "source":
                    await analyzeSourceMutation.mutateAsync({ sourceId: selectedAnalysisSourceId });
                    break;
                case "location":
                    await analyzeLocationMutation.mutateAsync({ locationId: selectedLocationId });
                    break;
                case "business":
                    await analyzeBusinessMutation.mutateAsync({ businessId: selectedBusinessId });
                    break;
            }
            
            // Reset form and close dialog
            setIsAnalysisJobDialogOpen(false);
            setSelectedJobId("");
            setSelectedAnalysisSourceId("");
            setSelectedLocationId("");
            setSelectedBusinessId("");
        } catch (error) {
            console.error('Failed to create analysis job:', error);
        }
    };
    
    // Filter jobs based on current filters
    const filteredJobs = jobs.filter(job => {
        const matchesSearch = !searchTerm || 
            job.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            businesses?.find(b => b.id === job.business_id)?.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === "all" || job.status === statusFilter;
        const matchesType = typeFilter === "all" || job.job_type === typeFilter;
        const matchesBusiness = businessFilter === "all" || job.business_id === businessFilter;
        const matchesLocation = locationFilter === "all" || job.location_id === locationFilter;
        const matchesSource = sourceFilter === "all" || job.source_id === sourceFilter;

            // Time filter logic
    const matchesTime = timeFilter === "all" || (() => {
        const now = new Date();
        const jobCreated = new Date(job.created_at + (job.created_at.endsWith('Z') ? '' : 'Z'));
        const diffMs = now.getTime() - jobCreated.getTime();
        
        switch (timeFilter) {
            case "5min": return diffMs <= 5 * 60 * 1000;
            case "1h": return diffMs <= 60 * 60 * 1000;
            case "12h": return diffMs <= 12 * 60 * 60 * 1000;
            case "24h": return diffMs <= 24 * 60 * 60 * 1000;
            default: return true;
        }
    })();
        
        return matchesSearch && matchesStatus && matchesType && matchesBusiness && matchesLocation && matchesSource && matchesTime;
    });
    
    // Get business name for job
    const getBusinessName = (businessId: string) => {
        return businesses?.find(b => b.id === businessId)?.name || 'Unknown Business';
    };

        // Get location name for job
    const getLocationName = (locationId: string | null | undefined) => {
        if (!locationId) return 'N/A';
        return locations.find(l => l.id === locationId)?.name || 'Unknown Location';
      };

      // Get source name for job
      const getSourceName = (sourceId: string) => {
        return sources.find(s => s.id === sourceId)?.name || 'Unknown Source';
      };
    
    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString + (dateString.endsWith('Z') ? '' : 'Z'));
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        
        if (diffHours < 24) {
            if (diffHours < 1) {
                const diffMinutes = Math.floor(diffMs / (1000 * 60));
                return `${diffMinutes}m ago`;
            }
            return `${Math.floor(diffHours)}h ago`;
        }
        
        return date.toLocaleDateString();
    };
    
    // Handle job actions
    const handleDeleteJob = async (jobId: string) => {
        try {
            await deleteJobMutation.mutateAsync(jobId);
        } catch (error) {
            console.error('Failed to delete job:', error);
        }
    };
    
    const handleCancelJob = async (jobId: string) => {
        try {
            await cancelJobMutation.mutateAsync(jobId);
        } catch (error) {
            console.error('Failed to cancel job:', error);
        }
    };
    
    const handleRetryJob = async (job: Job) => {
        try {
            await retryJobMutation.mutateAsync(job);
        } catch (error) {
            console.error('Failed to retry job:', error);
        }
    };
    
    const handleViewResults = (job: Job) => {
        navigate(`/reviews?job_id=${job.id}`);
    };
    
    const handleAnalyzeJob = (job: Job) => {
        setAnalysisTarget("job");
        setSelectedJobId(job.id);
        setIsAnalysisJobDialogOpen(true);
    };
    
    // Get available actions for job
    const getJobActions = (job: Job) => {
        const actions = [];
        
        // Common actions
        actions.push({
            label: "View Results",
            icon: Eye,
            onClick: () => handleViewResults(job),
            disabled: !['completed', 'partially_completed'].includes(job.status)
        });
        
        // Type-specific actions
        if (['scraping', 'csv_upload'].includes(job.job_type) && 
            ['completed', 'partially_completed'].includes(job.status)) {
            actions.push({
                label: "Analyze Reviews",
                icon: BarChart3,
                onClick: () => handleAnalyzeJob(job),
                disabled: false
            });
        }
        
        // Status-specific actions
        if (isJobActive(job.status)) {
            actions.push({
                label: "Cancel Job",
                icon: X,
                onClick: () => handleCancelJob(job.id),
                disabled: false,
                destructive: true
            });
        }
        
        if (['failed', 'cancelled', 'partially_completed'].includes(job.status)) {
            actions.push({
                label: "Retry Job",
                icon: RotateCcw,
                onClick: () => handleRetryJob(job),
                disabled: false
            });
        }
        
        // Delete action
        actions.push({
            label: "Delete Job",
            icon: Trash2,
            onClick: () => handleDeleteJob(job.id),
            disabled: isJobActive(job.status),
            destructive: true
        });
        
        return actions;
    };
    
    if (error) {
        return (
            <div className="flex items-center justify-center h-32">
                <div className="text-center">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Failed to load jobs</p>
                    <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                    </Button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
                    <p className="text-muted-foreground">
                        Manage your scraping, analysis, and data import jobs
                    </p>
                </div>
                <div className="flex gap-2">
                    {/* New Data Job Dialog */}
                    <Dialog open={isDataJobDialogOpen} onOpenChange={setIsDataJobDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <FileText className="h-4 w-4" />
                                New Data Job
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Create Data Job</DialogTitle>
                                <DialogDescription>
                                    Choose how you want to collect review data
                                </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                                <div>
                                    <Label>Job Type</Label>
                                    <RadioGroup 
                                        value={dataJobType} 
                                        onValueChange={(value: "scraping" | "csv_upload") => setDataJobType(value)}
                                        className="mt-2"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="scraping" id="scraping" />
                                            <Label htmlFor="scraping" className="flex items-center gap-2">
                                                <Globe className="h-4 w-4" />
                                                Web Scraping
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="csv_upload" id="csv_upload" />
                                            <Label htmlFor="csv_upload" className="flex items-center gap-2">
                                                <Upload className="h-4 w-4" />
                                                CSV Upload
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                                
                                <div>
                                    <Label>Source</Label>
                                    <Select value={selectedSourceId} onValueChange={setSelectedSourceId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a source" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {getFilteredSources().map(source => (
                                                <SelectItem key={source.id} value={source.id}>
                                                    {source.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div>
                                    <Label>Job Name (Optional)</Label>
                                    <Input 
                                        value={jobName}
                                        onChange={(e) => setJobName(e.target.value)}
                                        placeholder="Enter job name"
                                    />
                                </div>
                                
                                {dataJobType === "csv_upload" && (
                                    <div>
                                        <Label>CSV File</Label>
                                        <Input 
                                            type="file"
                                            accept=".csv"
                                            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                                        />
                                    </div>
                                )}
                            </div>
                            
                            <DialogFooter>
                                <Button 
                                    variant="outline" 
                                    onClick={() => setIsDataJobDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={handleCreateDataJob}
                                    disabled={
                                        !selectedSourceId || 
                                        (dataJobType === "csv_upload" && !csvFile) ||
                                        createJobMutation.isPending ||
                                        uploadCSVMutation.isPending
                                    }
                                >
                                    {(createJobMutation.isPending || uploadCSVMutation.isPending) && 
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    }
                                    Create Job
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    
                    {/* New Analysis Job Dialog */}
                    <Dialog open={isAnalysisJobDialogOpen} onOpenChange={setIsAnalysisJobDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <BarChart3 className="h-4 w-4" />
                                New Analysis Job
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Create Analysis Job</DialogTitle>
                                <DialogDescription>
                                    Choose what reviews you want to analyze
                                </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                                <div>
                                    <Label>Analysis Target</Label>
                                    <RadioGroup 
                                        value={analysisTarget} 
                                        onValueChange={(value: "job" | "source" | "location" | "business") => setAnalysisTarget(value)}
                                        className="mt-2"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="job" id="job" />
                                            <Label htmlFor="job">Specific Job</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="source" id="source" />
                                            <Label htmlFor="source">Entire Source</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="location" id="location" />
                                            <Label htmlFor="location">Entire Location</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="business" id="business" />
                                            <Label htmlFor="business">Entire Business</Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                                
                                {analysisTarget === "job" && (
                                    <div>
                                        <Label>Job</Label>
                                        <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a completed job" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {getCompletedJobs().map(job => (
                                                    <SelectItem key={job.id} value={job.id}>
                                                        {job.name || `${job.job_type} job`}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                
                                {analysisTarget === "source" && (
                                    <div>
                                        <Label>Source</Label>
                                        <Select value={selectedAnalysisSourceId} onValueChange={setSelectedAnalysisSourceId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a source" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {sources.map(source => (
                                                    <SelectItem key={source.id} value={source.id}>
                                                        {source.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                
                                {analysisTarget === "location" && (
                                    <div>
                                        <Label>Location</Label>
                                        <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a location" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {locations.map(location => (
                                                    <SelectItem key={location.id} value={location.id}>
                                                        {location.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                
                                {analysisTarget === "business" && (
                                    <div>
                                        <Label>Business</Label>
                                        <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a business" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {businesses?.map(business => (
                                                    <SelectItem key={business.id} value={business.id}>
                                                        {business.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                            
                            <DialogFooter>
                                <Button 
                                    variant="outline" 
                                    onClick={() => setIsAnalysisJobDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={handleCreateAnalysisJob}
                                    disabled={
                                        (analysisTarget === "job" && !selectedJobId) ||
                                        (analysisTarget === "source" && !selectedAnalysisSourceId) ||
                                        (analysisTarget === "location" && !selectedLocationId) ||
                                        (analysisTarget === "business" && !selectedBusinessId) ||
                                        analyzeJobMutation.isPending ||
                                        analyzeSourceMutation.isPending ||
                                        analyzeLocationMutation.isPending ||
                                        analyzeBusinessMutation.isPending
                                    }
                                >
                                    {(analyzeJobMutation.isPending || 
                                      analyzeSourceMutation.isPending || 
                                      analyzeLocationMutation.isPending || 
                                      analyzeBusinessMutation.isPending) && 
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    }
                                    Start Analysis
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            
            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search jobs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-full md:w-40">
                                <SelectValue placeholder="Job Type" />
                            </SelectTrigger>
                            <SelectContent>
                                {TYPE_FILTERS.map(filter => (
                                    <SelectItem key={filter.value} value={filter.value}>
                                        {filter.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-40">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_FILTERS.map(filter => (
                                    <SelectItem key={filter.value} value={filter.value}>
                                        {filter.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        
                        <Select value={locationFilter} onValueChange={setLocationFilter}>
                            <SelectTrigger className="w-full md:w-40">
                                <SelectValue placeholder="Location" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Locations</SelectItem>
                                {locations.map(location => (
                                    <SelectItem key={location.id} value={location.id}>
                                        {location.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        
                        <Select value={sourceFilter} onValueChange={setSourceFilter}>
                            <SelectTrigger className="w-full md:w-40">
                                <SelectValue placeholder="Source" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sources</SelectItem>
                                {sources.map(source => (
                                    <SelectItem key={source.id} value={source.id}>
                                        {source.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        
                        <Select value={timeFilter} onValueChange={setTimeFilter}>
                            <SelectTrigger className="w-full md:w-40">
                                <SelectValue placeholder="Time" />
                            </SelectTrigger>
                            <SelectContent>
                                {TIME_FILTERS.map(filter => (
                                    <SelectItem key={filter.value} value={filter.value}>
                                        {filter.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
            
            {/* Jobs Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-32">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : filteredJobs.length === 0 ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="text-center">
                                <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    {jobs.length === 0 ? "No jobs found" : "No jobs match your filters"}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Job</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Source</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead className="w-16"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredJobs.map((job) => {
                                    const config = JOB_TYPE_CONFIG[job.job_type as keyof typeof JOB_TYPE_CONFIG];
                                    const IconComponent = config?.icon || FileText;
                                    
                                    return (
                                        <TableRow key={job.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${config?.bgColor} ${config?.borderColor} border`}>
                                                        <IconComponent className={`h-4 w-4 ${config?.color}`} />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">
                                                            {job.name || `${config?.label} Job`}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {config?.label}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            
                                            <TableCell>
                                                <Badge variant="outline" className={`${config?.color} ${config?.bgColor} ${config?.borderColor}`}>
                                                    {config?.label}
                                                </Badge>
                                            </TableCell>

                                            <TableCell>
                                                <div className="font-medium">
                                                    {getLocationName(job.location_id)}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="font-medium">
                                                    {getSourceName(job.source_id)}
                                                </div>
                                            </TableCell>
                                            
                                            <TableCell>
                                                <JobStatusCell job={job} />
                                            </TableCell>
                                            
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDate(job.created_at)}
                                            </TableCell>
                                            
                                            <TableCell>
                                                <JobDuration job={job} />
                                            </TableCell>
                                            
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {getJobActions(job).map((action, index) => (
                                                            <div key={index}>
                                                                {action.destructive ? (
                                                                    <AlertDialog>
                                                                        <AlertDialogTrigger asChild>
                                                                            <DropdownMenuItem 
                                                                                disabled={action.disabled}
                                                                                className="text-red-600 focus:text-red-600"
                                                                                onSelect={(e) => e.preventDefault()}
                                                                            >
                                                                                <action.icon className="h-4 w-4 mr-2" />
                                                                                {action.label}
                                                                            </DropdownMenuItem>
                                                                        </AlertDialogTrigger>
                                                                        <AlertDialogContent>
                                                                            <AlertDialogHeader>
                                                                                <AlertDialogTitle>
                                                                                    Confirm {action.label}
                                                                                </AlertDialogTitle>
                                                                                <AlertDialogDescription>
                                                                                    Are you sure? This action cannot be undone.
                                                                                </AlertDialogDescription>
                                                                            </AlertDialogHeader>
                                                                            <AlertDialogFooter>
                                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                                <AlertDialogAction 
                                                                                    onClick={action.onClick}
                                                                                    className="bg-red-600 hover:bg-red-700"
                                                                                >
                                                                                    {action.label}
                                                                                </AlertDialogAction>
                                                                            </AlertDialogFooter>
                                                                        </AlertDialogContent>
                                                                    </AlertDialog>
                                                                ) : (
                                                                    <DropdownMenuItem 
                                                                        disabled={action.disabled}
                                                                        onClick={action.onClick}
                                                                    >
                                                                        <action.icon className="h-4 w-4 mr-2" />
                                                                        {action.label}
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Jobs;