import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    MapPin,
    Plus,
    Search,
    Building2,
    Globe,
    Star,
    MoreHorizontal,
    Eye,
    Edit,
    Trash2,
    Loader2,
    ExternalLink,
    Settings,
    Lock,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBusiness } from "@/contexts/BusinessContext";
import { LocationCreate } from "@/services/location";
import { SourceCreate, SourceType, SourceUpdate } from "@/services/source";
import {
    useLocationsByBusiness,
    useCreateLocation,
    useUpdateLocation,
    useDeleteLocation,
    useLocationStats
} from "@/hooks/useLocations";
import {
    useSourcesByBusiness,
    useCreateSource,
    useUpdateSource,
    useDeleteSource
} from "@/hooks/useSources";

// **NEW: Define available and coming soon source types**
const SOURCE_TYPES = [
    { value: "google", label: "Google Reviews", available: true, icon: "🔍" },
    { value: "csv", label: "CSV Upload", available: true, icon: "📄" },
    { value: "yelp", label: "Yelp", available: false, icon: "🟡" },
    { value: "facebook", label: "Facebook", available: false, icon: "📘" },
    { value: "tripadvisor", label: "TripAdvisor", available: false, icon: "🦉" },
    { value: "trustpilot", label: "Trustpilot", available: false, icon: "⭐" },
    { value: "glassdoor", label: "Glassdoor", available: false, icon: "🏢" },
];

const Locations = () => {
    const { selectedBusiness, hasBusinesses } = useBusiness();

    // **CHANGED: Use hooks instead of manual state**
    const { data: locations = [], isLoading, error } = useLocationsByBusiness(selectedBusiness?.id || '');
    const { data: sources = [] } = useSourcesByBusiness(selectedBusiness?.id || '');
    const createLocationMutation = useCreateLocation();
    const updateLocationMutation = useUpdateLocation();
    const deleteLocationMutation = useDeleteLocation();
    const createSourceMutation = useCreateSource();
    const updateSourceMutation = useUpdateSource();
    const deleteSourceMutation = useDeleteSource();

    // **KEPT: UI-specific state**
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<any>(null);
    const [selectedLocationForSources, setSelectedLocationForSources] = useState<any>(null);
    const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false);
    const [isEditSourceDialogOpen, setIsEditSourceDialogOpen] = useState(false);
    const [editingSource, setEditingSource] = useState<any>(null);
    const [sourceError, setSourceError] = useState<string>("");

    // **KEPT: Form state**
    const [formData, setFormData] = useState<LocationCreate>({
        name: "",
        adresse: "",
        business_id: selectedBusiness?.id || "",
    });

    // **NEW: Source form state**
    const [sourceFormData, setSourceFormData] = useState<SourceCreate>({
        name: "",
        type: "google" as SourceType,
        url: "",
        business_id: selectedBusiness?.id || "",
        location_id: "",
    });

    // **KEPT: Manual stats loading - simpler approach avoiding hook rule violations**
    const [locationStats, setLocationStats] = useState<any[]>([]);
    const [isLoadingStats, setIsLoadingStats] = useState(false);

    // **NEW: Helper function to get stats for a location**
    const getLocationStats = (locationId: string) => {
        return locationStats.find(stats => stats.location_id === locationId);
    };

    // **NEW: Load location stats manually when locations change**
    const loadLocationStats = async () => {
        if (!locations.length) return;

        try {
            setIsLoadingStats(true);
            const statsPromises = locations.map((location: any) =>
                fetch(`${import.meta.env.VITE_API_URL}/api/stats/locations/${location.id}`, {
                    credentials: 'include'
                }).then(res => res.ok ? res.json() : null).catch(() => null)
            );
            const statsData = await Promise.all(statsPromises);
            setLocationStats(statsData.filter(Boolean));
        } catch (err) {
            console.error('Failed to load location stats:', err);
        } finally {
            setIsLoadingStats(false);
        }
    };

    // **NEW: Load stats when locations change**
    useEffect(() => {
        loadLocationStats();
    }, [locations]);

    // **KEPT: Helper function to get sources for a location**
    const getLocationSources = (locationId: string) => {
        return sources.filter(source => source.location_id === locationId);
    };

    // **NEW: Check if source has been used for scraping**
    const hasBeenScraped = (source: any) => {
        return source.last_collection_time !== null;
    };

    // **NEW: Check if source can be edited**
    const canEditSource = (source: any) => {
        return !hasBeenScraped(source);
    };

    // Update form business_id when selected business changes
    useEffect(() => {
        if (selectedBusiness) {
            setFormData(prev => ({
                ...prev,
                business_id: selectedBusiness.id,
            }));
            setSourceFormData(prev => ({
                ...prev,
                business_id: selectedBusiness.id,
            }));
        }
    }, [selectedBusiness]);

    // **CHANGED: Use mutation hooks**
    const handleCreateLocation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBusiness) return;

        try {
            await createLocationMutation.mutateAsync(formData);
            // **NEW: Refresh stats after creating location**
            await loadLocationStats();
            setIsCreateDialogOpen(false);
            setFormData({ name: "", adresse: "", business_id: selectedBusiness.id });
        } catch (err) {
            console.error('Failed to create location:', err);
        }
    };

    // **CHANGED: Use mutation hooks**
    const handleEditLocation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingLocation) return;

        try {
            await updateLocationMutation.mutateAsync({
                id: editingLocation.id,
                data: {
                    name: formData.name,
                    adresse: formData.adresse,
                }
            });
            // **NEW: Refresh stats after updating location**  
            await loadLocationStats();
            setIsEditDialogOpen(false);
            setEditingLocation(null);
        } catch (err) {
            console.error('Failed to update location:', err);
        }
    };

    // **CHANGED: Use mutation hooks**
    const handleDeleteLocation = async (locationId: string) => {
        if (!confirm('Are you sure you want to delete this location?')) return;

        try {
            await deleteLocationMutation.mutateAsync(locationId);
            // **NEW: Refresh stats after deleting location**
            await loadLocationStats();
        } catch (err) {
            console.error('Failed to delete location:', err);
        }
    };

    // **FIXED: Handle source creation - ensure location_id is properly set**
    const handleCreateSource = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLocationForSources) return;

        try {
            await createSourceMutation.mutateAsync({
                ...sourceFormData,
                location_id: selectedLocationForSources.id, // **FIXED: This was the bug!**
            });
            // **NEW: Refresh stats after adding source**
            await loadLocationStats();
            setIsSourceDialogOpen(false);
            setSourceFormData({
                name: "",
                type: "google" as SourceType,
                url: "",
                business_id: selectedBusiness?.id || "",
                location_id: "", // Reset this too
            });
        } catch (err) {
            console.error('Failed to create source:', err);
        }
    };

    // **NEW: Handle source update**
    const handleUpdateSource = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSource) return;

        try {
            await updateSourceMutation.mutateAsync({
                id: editingSource.id,
                data: {
                    name: sourceFormData.name,
                    type: sourceFormData.type,
                    url: sourceFormData.url,
                    // Don't change location_id on update
                }
            });
            await loadLocationStats();
            setIsEditSourceDialogOpen(false);
            setEditingSource(null);
            setSourceFormData({
                name: "",
                type: "google" as SourceType,
                url: "",
                business_id: selectedBusiness?.id || "",
                location_id: "",
            });
        } catch (err) {
            console.error('Failed to update source:', err);
        }
    };

    // **MODIFIED: Handle source deletion with warning for used sources**
    const handleDeleteSource = async (sourceId: string, hasData = false) => {
        const confirmMessage = hasData 
            ? '⚠️ WARNING: This source has collected data. Deleting it will remove ALL reviews and analytics from this source. This action cannot be undone.\n\nAre you sure you want to proceed?'
            : 'Are you sure you want to delete this source?';
            
        if (!confirm(confirmMessage)) return;

        try {
            await deleteSourceMutation.mutateAsync(sourceId);
            // **NEW: Refresh stats after deleting source**
            await loadLocationStats();
        } catch (err) {
            console.error('Failed to delete source:', err);
        }
    };

    // Open edit dialog
    const openEditDialog = (location: any) => {
        setEditingLocation(location);
        setFormData({
            name: location.name,
            adresse: location.adresse,
            business_id: location.business_id,
        });
        setIsEditDialogOpen(true);
    };

    // Open source management dialog
    const openSourceDialog = (location: any) => {
        setSelectedLocationForSources(location);
    };

    // **NEW: Open edit source dialog**
    const openEditSourceDialog = (source: any) => {
        setSourceError(""); // Clear any previous errors
        setEditingSource(source);
        setSourceFormData({
            name: source.name,
            type: source.type,
            url: source.url,
            business_id: source.business_id,
            location_id: source.location_id,
        });
        setIsEditSourceDialogOpen(true);
    };

    // **NEW: Handle creating replacement source**
    const handleCreateReplacementSource = async (oldSource: any) => {
        // Pre-fill form with old source data
        setSourceFormData({
            name: `${oldSource.name} (Updated)`,
            type: oldSource.type,
            url: "", // User must enter new URL
            business_id: selectedBusiness?.id || "",
            location_id: oldSource.location_id,
        });
        setIsSourceDialogOpen(true);
    };

    // **FIX: Properly initialize form when opening add source dialog**
    const openAddSourceDialog = () => {
        setSourceError(""); // Clear any previous errors
        if (selectedLocationForSources) {
            setSourceFormData({
                name: "",
                type: "google" as SourceType,
                url: "",
                business_id: selectedBusiness?.id || "",
                location_id: selectedLocationForSources.id, // Ensure location_id is set
            });
        }
        setIsSourceDialogOpen(true);
    };

    // Filter locations
    const filteredLocations = locations.filter((location: any) =>
        location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.adresse.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Show message when no business is selected
    if (!hasBusinesses) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">No businesses found</h2>
                    <p className="text-muted-foreground mb-4">Create a business first to manage locations.</p>
                    <Button>Go to Businesses</Button>
                </div>
            </div>
        );
    }

    if (!selectedBusiness) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Select a business</h2>
                    <p className="text-muted-foreground">Choose a business from the header to view its locations.</p>
                </div>
            </div>
        );
    }

    // **CHANGED: Use hook loading state**
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    // **CHANGED: Use hook error state**
    if (error) {
        return (
            <div className="text-center text-red-600 p-4">
                Error: {error instanceof Error ? error.message : 'An error occurred'}
                <Button onClick={() => window.location.reload()} className="ml-4">
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Locations</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage locations for <span className="font-medium text-foreground">{selectedBusiness.name}</span>
                    </p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Location
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Location</DialogTitle>
                            <DialogDescription>
                                Create a new location for {selectedBusiness.name}.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateLocation} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-sm font-medium">
                                    Location Name
                                </label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Downtown Branch"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="adresse" className="text-sm font-medium">
                                    Address
                                </label>
                                <Input
                                    id="adresse"
                                    value={formData.adresse}
                                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                                    placeholder="123 Main St, City, State 12345"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setIsCreateDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1"
                                    disabled={createLocationMutation.isPending}
                                >
                                    {createLocationMutation.isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        'Create Location'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search and Stats */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search locations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium">{filteredLocations.length}</span>
                    location{filteredLocations.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Locations Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Locations</CardTitle>
                    <CardDescription>
                        Manage your business locations and their review sources
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {filteredLocations.length === 0 ? (
                        <div className="text-center py-12">
                            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No locations found</h3>
                            <p className="text-muted-foreground mb-4">
                                {searchTerm ? 'No locations match your search.' : 'Get started by adding your first location.'}
                            </p>
                            {!searchTerm && (
                                <Button onClick={() => setIsCreateDialogOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Location
                                </Button>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Sources</TableHead>
                                    <TableHead>Reviews</TableHead>
                                    <TableHead>Rating</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLocations.map((location: any) => {
                                    const locationSources = getLocationSources(location.id);
                                    const stats = getLocationStats(location.id);

                                    return (
                                        <LocationRow
                                            key={location.id}
                                            location={location}
                                            sources={locationSources}
                                            stats={stats}
                                            onEdit={() => openEditDialog(location)}
                                            onDelete={() => handleDeleteLocation(location.id)}
                                            onManageSources={() => openSourceDialog(location)}
                                        />
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Edit Location Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Location</DialogTitle>
                        <DialogDescription>
                            Update the location details.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditLocation} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="edit-name" className="text-sm font-medium">
                                Location Name
                            </label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Downtown Branch"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="edit-adresse" className="text-sm font-medium">
                                Address
                            </label>
                            <Input
                                id="edit-adresse"
                                value={formData.adresse}
                                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                                placeholder="123 Main St, City, State 12345"
                            />
                        </div>
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => setIsEditDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={updateLocationMutation.isPending}
                            >
                                {updateLocationMutation.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Source Management Dialog */}
            <Dialog
                open={!!selectedLocationForSources}
                onOpenChange={() => setSelectedLocationForSources(null)}
            >
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Manage Sources</DialogTitle>
                        <DialogDescription>
                            Configure review sources for {selectedLocationForSources?.name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Existing Sources */}
                        {selectedLocationForSources && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium">Current Sources</h4>
                                    <Button
                                        size="sm"
                                        onClick={openAddSourceDialog}
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add Source
                                    </Button>
                                </div>

                                {getLocationSources(selectedLocationForSources.id).map((source: any) => {
                                    const isUsed = hasBeenScraped(source);
                                    
                                    return (
                                        <div key={source.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Globe className="h-4 w-4 text-muted-foreground" />
                                                <div className="flex-1">
                                                    <div className="font-medium">{source.name}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {source.type} • <a href={source.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
                                                            <ExternalLink className="inline h-3 w-3 mb-0.5" />
                                                        </a>
                                                    </div>
                                                    {isUsed && (
                                                        <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                            Data collected - Source locked for integrity
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {/* Only show edit if source hasn't been used */}
                                                {!isUsed ? (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => openEditSourceDialog(source)}
                                                        title="Edit source (only available before data collection)"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleCreateReplacementSource(source)}
                                                        title="Create a new source to replace this one"
                                                        className="text-blue-600 hover:text-blue-700"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                
                                                {/* Delete with warning for used sources */}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDeleteSource(source.id, isUsed)}
                                                    disabled={deleteSourceMutation.isPending}
                                                    className={isUsed ? "text-orange-600 hover:text-orange-700" : ""}
                                                    title={isUsed ? "⚠️ Will delete source AND all collected data" : "Delete source"}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}

                                {getLocationSources(selectedLocationForSources.id).length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No sources configured for this location.
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="pt-4 border-t">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setSelectedLocationForSources(null)}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Source Dialog */}
            <Dialog open={isSourceDialogOpen} onOpenChange={setIsSourceDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Source</DialogTitle>
                        <DialogDescription>
                            Add a new review source for {selectedLocationForSources?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateSource} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Source Name</label>
                            <Input
                                value={sourceFormData.name}
                                onChange={(e) => setSourceFormData({ ...sourceFormData, name: e.target.value })}
                                placeholder="Google Reviews"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Source Type</label>
                            <Select
                                value={sourceFormData.type}
                                onValueChange={(value: SourceType) => setSourceFormData({ ...sourceFormData, type: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {SOURCE_TYPES.map((type) => (
                                        <SelectItem 
                                            key={type.value} 
                                            value={type.value}
                                            disabled={!type.available}
                                            className={!type.available ? "opacity-60" : ""}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span>{type.icon}</span>
                                                <span>{type.label}</span>
                                                {!type.available && (
                                                    <Badge variant="secondary" className="ml-auto text-xs">
                                                        Coming Soon
                                                    </Badge>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Show URL input only for Google type */}
                        {sourceFormData.type === "google" && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Source URL</label>
                                <Input
                                    value={sourceFormData.url}
                                    onChange={(e) => setSourceFormData({ ...sourceFormData, url: e.target.value })}
                                    placeholder="https://maps.google.com/..."
                                    required
                                />
                            </div>
                        )}
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => setIsSourceDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={createSourceMutation.isPending}
                            >
                                {createSourceMutation.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    'Add Source'
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Source Dialog */}
            <Dialog open={isEditSourceDialogOpen} onOpenChange={setIsEditSourceDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Source</DialogTitle>
                        <DialogDescription>
                            Update source details for {selectedLocationForSources?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateSource} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Source Name</label>
                            <Input
                                value={sourceFormData.name}
                                onChange={(e) => setSourceFormData({ ...sourceFormData, name: e.target.value })}
                                placeholder="Google Reviews"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Source Type</label>
                            <Select
                                value={sourceFormData.type}
                                onValueChange={(value: SourceType) => setSourceFormData({ ...sourceFormData, type: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {SOURCE_TYPES.map((type) => (
                                        <SelectItem 
                                            key={type.value} 
                                            value={type.value}
                                            disabled={!type.available}
                                            className={!type.available ? "opacity-60" : ""}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span>{type.icon}</span>
                                                <span>{type.label}</span>
                                                {!type.available && (
                                                    <Badge variant="secondary" className="ml-auto text-xs">
                                                        Coming Soon
                                                    </Badge>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Show URL input only for Google type */}
                        {sourceFormData.type === "google" && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Source URL</label>
                                <Input
                                    value={sourceFormData.url}
                                    onChange={(e) => setSourceFormData({ ...sourceFormData, url: e.target.value })}
                                    placeholder="https://maps.google.com/..."
                                    required
                                />
                            </div>
                        )}
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => setIsEditSourceDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={updateSourceMutation.isPending}
                            >
                                {updateSourceMutation.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    'Update Source'
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

// **NEW: Extracted LocationRow component for cleaner code**
const LocationRow = ({ location, sources, stats, onEdit, onDelete, onManageSources }: any) => (
    <TableRow className="hover:bg-muted/50">
        <TableCell className="font-medium">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                    <div>{location.name}</div>
                    <div className="text-sm text-muted-foreground">{location.adresse}</div>
                </div>
            </div>
        </TableCell>
        <TableCell>
            <Button
                variant="outline"
                size="sm"
                onClick={onManageSources}
                className="h-8"
            >
                <Globe className="h-3 w-3 mr-1" />
                {sources.length} sources
            </Button>
        </TableCell>
        <TableCell>{stats ? stats.review_count.toLocaleString() : '-'}</TableCell>
        <TableCell>
            {stats && stats.average_rating > 0 ? (
                <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    {stats.average_rating.toFixed(1)}
                </div>
            ) : '-'}
        </TableCell>
        <TableCell className="text-muted-foreground text-sm">
            {new Date(location.created_at).toLocaleDateString()}
        </TableCell>
        <TableCell className="text-right">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onManageSources}>
                        <Settings className="h-4 w-4 mr-2" />
                        Manage Sources
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onEdit}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Location
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={onDelete}
                        className="text-destructive"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Location
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </TableCell>
    </TableRow>
);

export default Locations;