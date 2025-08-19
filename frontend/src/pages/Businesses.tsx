import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Building2,
  Plus,
  Search,
  MapPin,
  Star,
  MoreHorizontal,
  Edit,
  Trash2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateBusinessData } from "../services/business";
import {
  useBusinesses,
  useCreateBusiness,
  useUpdateBusiness,
  useDeleteBusiness,
  useBusinessCounts
} from "../hooks/useBusinesses";

const Businesses = () => {
  // ✅ React Query hooks - handles all data fetching and caching
  const { data: businesses = [], isLoading, error, refetch } = useBusinesses();
  const createMutation = useCreateBusiness();
  const updateMutation = useUpdateBusiness();
  const deleteMutation = useDeleteBusiness();

  // ✅ Local UI state only
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<any>(null);

  // ✅ Form state
  const [formData, setFormData] = useState<CreateBusinessData>({
    name: "",
    description: "",
    segments: [],
  });

  // ✅ Create business handler - much simpler now
  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync(formData);
      setIsCreateDialogOpen(false);
      setFormData({ name: "", description: "", segments: [] });
    } catch (err) {
      console.error('Failed to create business:', err);
    }
  };

  // ✅ Update business handler
  const handleUpdateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBusiness) return;

    try {
      await updateMutation.mutateAsync({
        id: editingBusiness.id,
        data: formData
      });
      setIsEditDialogOpen(false);
      setEditingBusiness(null);
      setFormData({ name: "", description: "", segments: [] });
    } catch (err) {
      console.error('Failed to update business:', err);
    }
  };

  // ✅ Delete business handler
  const handleDeleteBusiness = async (id: string) => {
    if (!confirm('Are you sure you want to delete this business?')) return;

    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      console.error('Failed to delete business:', err);
    }
  };

  // ✅ Edit business handler
  const handleEditBusiness = (business: any) => {
    setEditingBusiness(business);
    setFormData({
      name: business.name,
      description: business.description || "",
      segments: business.segments || [],
    });
    setIsEditDialogOpen(true);
  };

  const filteredBusinesses = businesses.filter(business =>
    business.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        Error: {error.message}
        <Button onClick={() => refetch()} className="ml-4">
          <RefreshCw className="h-4 w-4 mr-2" />
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
          <h1 className="text-3xl font-bold tracking-tight">Businesses</h1>
          <p className="text-muted-foreground mt-2">
            Manage your businesses and track their review performance
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Business
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Business</DialogTitle>
              <DialogDescription>
                Create a new business to start collecting and analyzing reviews.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateBusiness} className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Business Name</label>
                <Input
                  placeholder="Enter business name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Enter business description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Business
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards - Using the counts you originally had */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{businesses.length}</div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Loading...</div>
            <p className="text-xs text-muted-foreground mt-1">
              Calculating from all businesses
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Loading...</div>
            <p className="text-xs text-muted-foreground mt-1">
              Calculating from all businesses
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sources</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Loading...</div>
            <p className="text-xs text-muted-foreground mt-1">
              Calculating from all businesses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-elegant">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Business Directory</CardTitle>
              <CardDescription>
                View and manage all your businesses in one place
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search businesses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Locations</TableHead>
                <TableHead>Sources</TableHead>
                <TableHead>Reviews</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBusinesses.map((business) => (
                <BusinessRow
                  key={business.id}
                  business={business}
                  onEdit={handleEditBusiness}
                  onDelete={handleDeleteBusiness}
                  isDeleting={deleteMutation.isPending}
                />
              ))}
            </TableBody>
          </Table>

          {filteredBusinesses.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No businesses found matching your search.' : 'No businesses yet. Create your first business!'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Business</DialogTitle>
            <DialogDescription>
              Update business information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateBusiness} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Business Name</label>
              <Input
                placeholder="Enter business name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Enter business description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update Business
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ✅ Separate component for business row with stats
const BusinessRow = ({ business, onEdit, onDelete, isDeleting }: {
  business: any;
  onEdit: (business: any) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) => {
  // ✅ Get stats for this specific business
  const { data: counts } = useBusinessCounts(business.id);

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell className="font-medium">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div>{business.name}</div>
            {business.description && (
              <div className="text-sm text-muted-foreground">{business.description}</div>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        {counts ? (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            {counts.location_count}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">...</div>
        )}
      </TableCell>
      <TableCell>
        {counts ? counts.source_count : '...'}
      </TableCell>
      <TableCell>
        {counts ? counts.review_count.toLocaleString() : '...'}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {new Date(business.created_at).toLocaleDateString()}
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isDeleting}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(business)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Business
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(business.id)}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export default Businesses;