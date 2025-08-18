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
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBusiness } from "@/contexts/BusinessContext";

import { locationService, Location, LocationCreate, LocationUpdate } from "@/services/location";

// Extended interface for UI display (combines API data with computed fields)
interface LocationWithStats extends Location {
    sourceCount: number;
    reviewCount: number;
    avgRating: number;
    status: 'active' | 'inactive' | 'pending';
    lastScraped: string;
}

interface Source {
    id: string;
    name: string;
    type: 'google' | 'yelp' | 'facebook' | 'tripadvisor' | 'other';
    url: string;
    status: 'active' | 'inactive' | 'error';
    lastScraped: string;
    reviewCount: number;
}

const AVAILABLE_SOURCES = [
    { type: 'google', name: 'Google Reviews', icon: '🇬' },
    { type: 'yelp', name: 'Yelp', icon: '🅨' },
    { type: 'facebook', name: 'Facebook', icon: '🇫' },
    { type: 'tripadvisor', name: 'TripAdvisor', icon: '🇹' },
    { type: 'other', name: 'Other Source', icon: '🔗' },
];

const Locations = () => {
    const { selectedBusiness, hasBusinesses } = useBusiness();
    const [locations, setLocations] = useState<LocationWithStats[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<LocationWithStats | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedLocationForSources, setSelectedLocationForSources] = useState<LocationWithStats | null>(null);

    // Form state - using backend field name 'adresse'
    const [formData, setFormData] = useState<LocationCreate>({
        name: "",
        adresse: "",
        business_id: selectedBusiness?.id || "",
    });

    // Load locations for selected business
    const loadLocations = async () => {
        if (!selectedBusiness) {
            setLocations([]);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            const data = await locationService.getLocationsByBusiness(selectedBusiness.id);

            // Transform API data to include UI fields (with mock data for now)
            const locationsWithStats: LocationWithStats[] = data.map(location => ({
                ...location,
                sourceCount: Math.floor(Math.random() * 5) + 1, // TODO: Get from sources API
                reviewCount: Math.floor(Math.random() * 1000) + 100, // TODO: Get from reviews API
                avgRating: Math.round((Math.random() * 2 + 3) * 10) / 10, // TODO: Get from reviews API
                status: Math.random() > 0.8 ? 'inactive' : 'active' as const, // TODO: Get real status
                lastScraped: '2 hours ago', // TODO: Get from scraping API
            }));

            setLocations(locationsWithStats);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load locations');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadLocations();
    }, [selectedBusiness]);

    // Update form business_id when selected business changes
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            business_id: selectedBusiness?.id || "",
        }));
    }, [selectedBusiness]);

    // Create location handler
    const handleCreateLocation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBusiness) return;

        try {
            setIsSubmitting(true);
            await locationService.createLocation(formData);
            await loadLocations();
            setIsCreateDialogOpen(false);
            setFormData({ name: "", adresse: "", business_id: selectedBusiness.id });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create location');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Edit location handler
    const handleEditLocation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingLocation) return;

        try {
            setIsSubmitting(true);
            const updateData: LocationUpdate = {
                name: formData.name,
                adresse: formData.adresse,
            };
            await locationService.updateLocation(editingLocation.id, updateData);
            await loadLocations();
            setIsEditDialogOpen(false);
            setEditingLocation(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update location');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete location handler
    const handleDeleteLocation = async (locationId: string) => {
        if (!confirm('Are you sure you want to delete this location?')) return;

        try {
            await locationService.deleteLocation(locationId);
            await loadLocations();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete location');
        }
    };

    // Open edit dialog
    const openEditDialog = (location: LocationWithStats) => {
        setEditingLocation(location);
        setFormData({
            name: location.name,
            adresse: location.adresse,
            business_id: location.business_id,
        });
        setIsEditDialogOpen(true);
    };

    // Filter locations
    const filteredLocations = locations.filter(location =>
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
                                    required
                                />
                            </div>
                            {error && (
                                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                                    {error}
                                </div>
                            )}
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
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
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
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                                <p className="text-muted-foreground">Loading locations...</p>
                            </div>
                        </div>
                    ) : filteredLocations.length === 0 ? (
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
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last Scraped</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLocations.map((location) => (
                                    <TableRow key={location.id} className="hover:bg-muted/50">
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
                                                onClick={() => setSelectedLocationForSources(location)}
                                                className="h-8"
                                            >
                                                <Globe className="h-3 w-3 mr-1" />
                                                {location.sourceCount} sources
                                            </Button>
                                        </TableCell>
                                        <TableCell>{location.reviewCount.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                                {location.avgRating.toFixed(1)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    location.status === 'active' ? 'default' :
                                                        location.status === 'inactive' ? 'secondary' : 'outline'
                                                }
                                            >
                                                {location.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {location.lastScraped}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => setSelectedLocationForSources(location)}>
                                                        <Settings className="h-4 w-4 mr-2" />
                                                        Manage Sources
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openEditDialog(location)}>
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit Location
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteLocation(location.id)}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete Location
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
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
                                required
                            />
                        </div>
                        {error && (
                            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                                {error}
                            </div>
                        )}
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
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
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
                        {/* TODO: Replace with real source management component */}
                        <div className="grid grid-cols-1 gap-3">
                            {AVAILABLE_SOURCES.map((source) => (
                                <div key={source.type} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{source.icon}</span>
                                        <div>
                                            <div className="font-medium">{source.name}</div>
                                            <div className="text-sm text-muted-foreground">
                                                Configure scraping for this platform
                                            </div>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="outline">
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add Source
                                    </Button>
                                </div>
                            ))}
                        </div>

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
        </div>
    );
};

export default Locations;