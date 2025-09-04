// src/pages/Jobs.tsx - Fixed toast integration
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
import { useToast } from "@/hooks/use-toast"; // FIXED: Proper useToast import
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

const Jobs = () => {
    const navigate = useNavigate();
    const { selectedBusiness, businesses, hasBusinesses } = useBusiness();
    const { toast } = useToast(); // FIXED: Using the proper hook

    // Jobs data and mutations
    const { data: jobs = [], isLoading, refetch } = useJobsByBusiness(selectedBusiness?.id);
    const deleteJob = useDeleteJob();
    const cancelJob = useCancelJob();
    const retryJob = useRetryJob();
    const createJob = useCreateJob();
    const uploadCSV = useUploadCSV();

    // Analysis mutations
    const analyzeJobMutation = useAnalyzeJobReviews();
    const analyzeSourceMutation = useAnalyzeSourceReviews();
    const analyzeLocationMutation = useAnalyzeLocationReviews();
    const analyzeBusinessMutation = useAnalyzeBusinessReviews();

    // Supporting data
    const { data: sources = [] } = useSourcesByBusiness(selectedBusiness?.id);
    const { data: locations = [] } = useLocationsByBusiness(selectedBusiness?.id);

    // UI state
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [businessFilter, setBusinessFilter] = useState<string>("all");
    const [locationFilter, setLocationFilter] = useState<string>("all");
    const [sourceFilter, setSourceFilter] = useState<string>("all");
    const [timeFilter, setTimeFilter] = useState<string>("all");

    // Dialog states
    const [isDataJobDialogOpen, setIsDataJobDialogOpen] = useState(false);
    const [isAnalysisJobDialogOpen, setIsAnalysisJobDialogOpen] = useState(false);

    // Data job form state
    const [jobType, setJobType] = useState<"scraping" | "csv_upload">("scraping");
    const [selectedSourceId, setSelectedSourceId] = useState("");
    const [jobName, setJobName] = useState("");
    const [csvFile, setCsvFile] = useState<File | null>(null);

    // Analysis job form state
    const [analysisTarget, setAnalysisTarget] = useState<"job" | "source" | "location" | "business">("job");
    const [selectedJobId, setSelectedJobId] = useState("");
    const [selectedAnalysisSourceId, setSelectedAnalysisSourceId] = useState("");
    const [selectedLocationId, setSelectedLocationId] = useState("");
    const [selectedBusinessId, setSelectedBusinessId] = useState("");
    const [overrideAnalysis, setOverrideAnalysis] = useState(false);

    // Real-time status tracking for active jobs
    const [activeJobIds, setActiveJobIds] = useState<string[]>([]);

    // Track active jobs for real-time updates
    useEffect(() => {
        if (jobs) {
            const activeIds = jobs.filter(job => isJobActive(job.status)).map(job => job.id);
            setActiveJobIds(activeIds);
        }
    }, [jobs]);

    // Polling for active jobs with immediate feedback
    useEffect(() => {
        if (activeJobIds.length === 0) return;

        const interval = setInterval(() => {
            // Refetch jobs data when there are active jobs
            refetch();
        }, 2000); // Poll every 2 seconds

        return () => clearInterval(interval);
    }, [activeJobIds, refetch]);


    // Handle data job creation
    const handleCreateDataJob = async () => {
        try {
            if (jobType === "scraping") {
                const selectedSource = sources.find(s => s.id === selectedSourceId);
                if (!selectedSource || !selectedBusiness) return;

                const result = await createJob.mutateAsync({
                    name: jobName || undefined,
                    job_type: "scraping",
                    source_id: selectedSourceId,
                    source_type: selectedSource.type,
                    business_id: selectedBusiness.id,
                    location_id: selectedSource.location_id || null
                });

                toast({
                    title: 'Scraping Job Started',
                    description: `Job "${jobName || 'Unnamed'}" has been created and started`,
                });

            } else if (jobType === "csv_upload" && csvFile) {
                const selectedSource = sources.find(s => s.id === selectedSourceId);
                if (!selectedSource || !selectedBusiness) return;

                await uploadCSV.mutateAsync({
                    file: csvFile,
                    jobName: jobName || null,
                    businessId: selectedBusiness.id,
                    locationId: selectedSource.location_id || null
                });

                toast({
                    title: 'CSV Upload Started',
                    description: `CSV file "${csvFile.name}" is being processed`,
                });
            }

            setIsDataJobDialogOpen(false);
            setSelectedSourceId("");
            setJobName("");
            setCsvFile(null);

        } catch (error) {
            console.error('Failed to create data job:', error);
            toast({
                variant: 'destructive',
                title: 'Job Creation Failed',
                description: error instanceof Error ? error.message : 'Unknown error occurred',
            });
        }
    };

    // FIXED: Handle analysis job creation with proper error handling
    const handleCreateAnalysisJob = async () => {
        try {
            const request = { override_analysis: overrideAnalysis };

            switch (analysisTarget) {
                case "job":
                    await analyzeJobMutation.mutateAsync({ jobId: selectedJobId, request });
                    break;
                case "source":
                    await analyzeSourceMutation.mutateAsync({ sourceId: selectedAnalysisSourceId, request });
                    break;
                case "location":
                    await analyzeLocationMutation.mutateAsync({ locationId: selectedLocationId, request });
                    break;
                case "business":
                    await analyzeBusinessMutation.mutateAsync({ businessId: selectedBusinessId, request });
                    break;
            }

            toast({
                title: 'Analysis Job Started',
                description: `Analysis job has been created and started${overrideAnalysis ? ' (re-analyzing all reviews)' : ' (skipping already analyzed reviews)'}`,
            });

            setIsAnalysisJobDialogOpen(false);
            setSelectedJobId("");
            setSelectedAnalysisSourceId("");
            setSelectedLocationId("");
            setSelectedBusinessId("");
            setOverrideAnalysis(false);

        } catch (error) {
            console.error('Failed to create analysis job:', error);
            // FIXED: Use addToast instead of Toast()
            toast({
                variant: 'destructive',
                title: 'Analysis Job Failed',
                description: error instanceof Error ? error.message : 'Unknown error occurred',
            });
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
            const timeDiff = now.getTime() - jobCreated.getTime();
            const hoursDiff = timeDiff / (1000 * 3600);

            switch (timeFilter) {
                case "1h": return hoursDiff <= 1;
                case "24h": return hoursDiff <= 24;
                case "7d": return hoursDiff <= 24 * 7;
                case "30d": return hoursDiff <= 24 * 30;
                default: return true;
            }
        })();

        return matchesSearch && matchesStatus && matchesType &&
            matchesBusiness && matchesLocation && matchesSource && matchesTime;
    });

    // Status badge with error tooltip
    const StatusBadgeWithError = ({ job }: { job: Job }) => {
        const statusColor = getJobStatusColor(job.status);
        const statusLabel = getJobStatusLabel(job.status);

        const badge = (
            <Badge variant="outline" className={`${statusColor} border cursor-help`}>
                {isJobActive(job.status) && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                {job.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                {job.status === 'failed' && <AlertCircle className="w-3 h-3 mr-1" />}
                {statusLabel}
                {job.status === 'running' && job.total_reviews && (
                    <span className="ml-1">
                        ({job.reviews_handled || 0}/{job.total_reviews})
                    </span>
                )}
            </Badge>
        );

        if (job.status === 'failed') {
            return (
                <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                        <span className="inline-block">
                            {badge}
                        </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                        <p className="text-sm">
                            {job.error || 'Job failed without specific error message'}
                        </p>
                    </TooltipContent>
                </Tooltip>
            );
        }

        return badge;
    };

    if (!hasBusinesses) {
        return (
            <div className="p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>No Business Selected</CardTitle>
                        <CardDescription>
                            Please create a business first to manage jobs.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
                        <p className="text-muted-foreground">
                            Manage and monitor your data collection and analysis jobs
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Dialog open={isDataJobDialogOpen} onOpenChange={setIsDataJobDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Upload className="w-4 h-4 mr-2" />
                                    New Data Job
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Create New Data Job</DialogTitle>
                                    <DialogDescription>
                                        Create a scraping job or upload CSV data
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label>Job Type</Label>
                                        <RadioGroup value={jobType} onValueChange={(value: any) => setJobType(value)}>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="scraping" id="scraping" />
                                                <Label htmlFor="scraping">Web Scraping</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="csv_upload" id="csv_upload" />
                                                <Label htmlFor="csv_upload">CSV Upload</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    <div>
                                        <Label htmlFor="job-name">Job Name (Optional)</Label>
                                        <Input
                                            id="job-name"
                                            placeholder="Enter job name..."
                                            value={jobName}
                                            onChange={(e) => setJobName(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="source-select">Source</Label>
                                        <Select value={selectedSourceId} onValueChange={setSelectedSourceId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a source" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {sources.map((source) => (
                                                    <SelectItem key={source.id} value={source.id}>
                                                        {source.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {jobType === "csv_upload" && (
                                        <div>
                                            <Label htmlFor="csv-file">CSV File</Label>
                                            <Input
                                                id="csv-file"
                                                type="file"
                                                accept=".csv"
                                                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                                            />
                                        </div>
                                    )}
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsDataJobDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleCreateDataJob}
                                        disabled={!selectedSourceId || (jobType === "csv_upload" && !csvFile) || createJob.isPending || uploadCSV.isPending}
                                    >
                                        {(createJob.isPending || uploadCSV.isPending) && (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        )}
                                        Create Job
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={isAnalysisJobDialogOpen} onOpenChange={setIsAnalysisJobDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline">
                                    <BarChart3 className="w-4 h-4 mr-2" />
                                    New Analysis Job
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Create Analysis Job</DialogTitle>
                                    <DialogDescription>
                                        Analyze reviews from jobs, sources, locations, or entire business
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label>Analysis Target</Label>
                                        <RadioGroup value={analysisTarget} onValueChange={(value: any) => setAnalysisTarget(value)}>
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

                                    {/* FIXED: Override Analysis Checkbox with proper type handling */}
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="override-analysis"
                                            checked={overrideAnalysis}
                                            onCheckedChange={(checked) => setOverrideAnalysis(Boolean(checked))}
                                        />
                                        <Label htmlFor="override-analysis" className="text-sm">
                                            Re-analyze all reviews (including already analyzed ones)
                                        </Label>
                                    </div>

                                    {analysisTarget === "job" && (
                                        <div>
                                            <Label htmlFor="job-select">Job</Label>
                                            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a job" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {jobs
                                                        .filter(job => job.job_type !== 'analysis')
                                                        .map((job) => (
                                                            <SelectItem key={job.id} value={job.id}>
                                                                {job.name || `${job.job_type} - ${new Date(job.created_at).toLocaleDateString()}`}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {analysisTarget === "source" && (
                                        <div>
                                            <Label htmlFor="analysis-source-select">Source</Label>
                                            <Select value={selectedAnalysisSourceId} onValueChange={setSelectedAnalysisSourceId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a source" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {sources.map((source) => (
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
                                            <Label htmlFor="location-select">Location</Label>
                                            <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a location" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {locations.map((location) => (
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
                                            <Label htmlFor="business-select">Business</Label>
                                            <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a business" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {businesses?.map((business) => (
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
                                    <Button variant="outline" onClick={() => setIsAnalysisJobDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleCreateAnalysisJob}
                                        disabled={
                                            (analysisTarget === "job" && !selectedJobId) ||
                                            (analysisTarget === "source" && !selectedAnalysisSourceId) ||
                                            (analysisTarget === "location" && !selectedLocationId) ||
                                            (analysisTarget === "business" && !selectedBusinessId) ||
                                            analyzeJobMutation.isPending || analyzeSourceMutation.isPending ||
                                            analyzeLocationMutation.isPending || analyzeBusinessMutation.isPending
                                        }
                                    >
                                        {(analyzeJobMutation.isPending || analyzeSourceMutation.isPending ||
                                            analyzeLocationMutation.isPending || analyzeBusinessMutation.isPending) && (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            )}
                                        Create Analysis
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Filters</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search jobs..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="running">Running</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                    <SelectItem value="canceled">Canceled</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="scraping">Scraping</SelectItem>
                                    <SelectItem value="csv_upload">CSV Upload</SelectItem>
                                    <SelectItem value="analysis">Analysis</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={businessFilter} onValueChange={setBusinessFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Business" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Businesses</SelectItem>
                                    {businesses?.map((business) => (
                                        <SelectItem key={business.id} value={business.id}>
                                            {business.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={locationFilter} onValueChange={setLocationFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Location" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Locations</SelectItem>
                                    {locations.map((location) => (
                                        <SelectItem key={location.id} value={location.id}>
                                            {location.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={sourceFilter} onValueChange={setSourceFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Source" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sources</SelectItem>
                                    {sources.map((source) => (
                                        <SelectItem key={source.id} value={source.id}>
                                            {source.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={timeFilter} onValueChange={setTimeFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Time" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Time</SelectItem>
                                    <SelectItem value="1h">Last Hour</SelectItem>
                                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                                    <SelectItem value="7d">Last 7 Days</SelectItem>
                                    <SelectItem value="30d">Last 30 Days</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Clear filters button */}
                        {(searchTerm || statusFilter !== "all" || typeFilter !== "all" ||
                            businessFilter !== "all" || locationFilter !== "all" ||
                            sourceFilter !== "all" || timeFilter !== "all") && (
                                <div className="flex justify-end mt-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSearchTerm("");
                                            setStatusFilter("all");
                                            setTypeFilter("all");
                                            setBusinessFilter("all");
                                            setLocationFilter("all");
                                            setSourceFilter("all");
                                            setTimeFilter("all");
                                        }}
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Clear Filters
                                    </Button>
                                </div>
                            )}
                    </CardContent>
                </Card>

                {/* Jobs Table */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Jobs ({filteredJobs.length})</CardTitle>
                            <CardDescription>
                                Monitor your data collection and analysis jobs
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => refetch()}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <span className="ml-2">Loading jobs...</span>
                            </div>
                        ) : filteredJobs.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">No jobs found</p>
                                {jobs.length === 0 && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Create your first job to get started
                                    </p>
                                )}
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Progress</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredJobs.map((job) => {
                                        const typeConfig = JOB_TYPE_CONFIG[job.job_type as keyof typeof JOB_TYPE_CONFIG];
                                        const TypeIcon = typeConfig?.icon || FileText;
                                        const business = businesses?.find(b => b.id === job.business_id);
                                        const source = sources.find(s => s.id === job.source_id);
                                        const location = locations.find(l => l.id === job.location_id);
                                        const progress = getJobProgress(job);

                                        return (
                                            <TableRow key={job.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`p-1.5 rounded-md ${typeConfig?.bgColor} ${typeConfig?.borderColor} border`}>
                                                            <TypeIcon className={`w-3 h-3 ${typeConfig?.color}`} />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">
                                                                {job.name || `${typeConfig?.label} Job`}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {business?.name}
                                                                {location && ` • ${location.name}`}
                                                                {source && ` • ${source.name}`}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">
                                                        {typeConfig?.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadgeWithError job={job} />
                                                </TableCell>
                                                <TableCell>
                                                    {job.total_reviews ? (
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between text-xs">
                                                                <span>{job.reviews_handled || 0}/{job.total_reviews}</span>
                                                                <span>{progress}%</span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                                <div
                                                                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                                                    style={{ width: `${progress}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                        <Timer className="w-3 h-3" />
                                                        <span>
                                                            {(() => {
                                                                if (!job.started_at) return "—";

                                                                const startTime = new Date(job.started_at);
                                                                const endTime = job.ended_at ? new Date(job.ended_at) : new Date();
                                                                const diffMs = endTime.getTime() - startTime.getTime();

                                                                if (diffMs < 60000) { // Less than 1 minute
                                                                    return `${Math.floor(diffMs / 1000)}s`;
                                                                } else if (diffMs < 3600000) { // Less than 1 hour
                                                                    return `${Math.floor(diffMs / 60000)}m`;
                                                                } else if (diffMs < 86400000) { // Less than 1 day
                                                                    const hours = Math.floor(diffMs / 3600000);
                                                                    const minutes = Math.floor((diffMs % 3600000) / 60000);
                                                                    return `${hours}h ${minutes}m`;
                                                                } else { // 1 day or more
                                                                    const days = Math.floor(diffMs / 86400000);
                                                                    const hours = Math.floor((diffMs % 86400000) / 3600000);
                                                                    return `${days}d ${hours}h`;
                                                                }
                                                            })()}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(job.created_at).toLocaleDateString()}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <MoreHorizontal className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() => navigate(`/reviews?job_id=${job.id}`)}
                                                            >
                                                                <Eye className="w-4 h-4 mr-2" />
                                                                View Reviews
                                                            </DropdownMenuItem>

                                                            {isJobActive(job.status) && (
                                                                <DropdownMenuItem
                                                                    onClick={() => cancelJob.mutate(job.id)}
                                                                >
                                                                    <Pause className="w-4 h-4 mr-2" />
                                                                    Cancel Job
                                                                </DropdownMenuItem>
                                                            )}

                                                            {(job.status === 'failed' || job.status === 'canceled') && (
                                                                <DropdownMenuItem
                                                                    onClick={() => retryJob.mutate(job)}
                                                                >
                                                                    <RotateCcw className="w-4 h-4 mr-2" />
                                                                    Retry Job
                                                                </DropdownMenuItem>
                                                            )}

                                                            <DropdownMenuSeparator />

                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <DropdownMenuItem
                                                                        className="text-red-600 focus:text-red-600"
                                                                        onSelect={(e) => e.preventDefault()}
                                                                    >
                                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                                        Delete Job
                                                                    </DropdownMenuItem>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Delete Job</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            Are you sure you want to delete this job?
                                                                            This action cannot be undone and will remove all associated data.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            onClick={() => deleteJob.mutate(job.id)}
                                                                            className="bg-red-600 hover:bg-red-700"
                                                                        >
                                                                            Delete
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
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
        </TooltipProvider>
    );
};

export default Jobs;