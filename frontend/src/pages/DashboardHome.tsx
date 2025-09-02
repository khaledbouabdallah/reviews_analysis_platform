import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  TrendingUp,
  Star,
  ArrowUpRight,
  BarChart3,
  AlertTriangle,
  Clock,
  MessageSquare,
  ExternalLink,
  BookOpen,
  Target,
  Zap,
  Bold
} from "lucide-react";
import { useBusiness } from "@/contexts/BusinessContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { reviewService } from "@/services/review";



// TODO: Replace with real data from API
const FAKE_URGENT_ALERTS = [
  {
    id: 1,
    type: "negative_review",
    business: "Downtown Restaurant",
    location: "Main Street",
    message: "reviews that need immediate response",
    count: 3,
    priority: "high"
  },

];

const FAKE_STATS = {
  totalBusinesses: 12,
  totalReviews: 2345,
  avgRating: 4.3,
  responseRate: 89,
  monthlyChange: {
    businesses: +2,
    reviews: +15,
    rating: +0.2,
    responseRate: +12
  }
};

const FAKE_ACTION_ITEMS = [
  {
    id: 1,
    business: "Downtown Restaurant",
    location: "Main Street",
    type: "negative_review",
    rating: 1,
    preview: "Terrible service, waited 45 minutes for cold food...",
    timeAgo: "2 hours ago",
    urgent: true
  },
  {
    id: 2,
    business: "Coffee Shop Chain",
    location: "Mall Location",
    type: "neutral_review",
    rating: 3,
    preview: "Coffee was okay, service could be better...",
    timeAgo: "4 hours ago",
    urgent: false
  },
  {
    id: 3,
    business: "Tech Solutions Inc",
    location: "Downtown Office",
    type: "positive_review",
    rating: 5,
    preview: "Excellent service and very professional team...",
    timeAgo: "6 hours ago",
    urgent: false
  },
  {
    id: 4,
    business: "Downtown Restaurant",
    location: "West Branch",
    type: "negative_review",
    rating: 2,
    preview: "Food quality has gone downhill recently...",
    timeAgo: "1 day ago",
    urgent: true
  }
];

const DashboardHome = () => {
  const { hasBusinesses, selectedBusiness, isLoading } = useBusiness();
  const { currentUser, setCurrentUser, loading} = useAuth();
  const navigate = useNavigate();

  if (hasBusinesses) {
    var reviewsNeedAttention = reviewService.getReviewsNeedingAttentionByBusiness(selectedBusiness?.id || "");
  } 
  
  // Show loading state while fetching businesses
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show onboarding when no businesses exist
  if (!hasBusinesses) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto space-y-8">
          {/* Welcome Header */}
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Welcome to Reviewoly!</h1>
            <p className="text-lg text-muted-foreground">
              Let's get you started by creating your first business to monitor.
            </p>
          </div>

          {/* Quick Tutorial Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="text-center p-6">
              <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Create Business</h3>
              <p className="text-sm text-muted-foreground">Add your business details and locations to start monitoring reviews.</p>
            </Card>

            <Card className="text-center p-6">
              <div className="w-12 h-12 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">Monitor Reviews</h3>
              <p className="text-sm text-muted-foreground">Automatically collect reviews from Google, Yelp, and other platforms.</p>
            </Card>

            <Card className="text-center p-6">
              <div className="w-12 h-12 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="font-semibold mb-2">AI Analysis</h3>
              <p className="text-sm text-muted-foreground">Get AI-powered insights and automated response suggestions.</p>
            </Card>
          </div>

          {/* CTA Button */}
          <div className="pt-6">
            <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            onClick={() => navigate("/dashboard/businesses", { state: { openCreateDialog: true } })}>
              <Building2 className="w-5 h-5 mr-2"/>
              Create Your First Business
            </Button>
          </div>

          {/* Optional: Demo/Help Links */}
          <div className="pt-4 space-y-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/documentation")}>
              <BookOpen className="w-4 h-4 mr-2" />
              View Documentation
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard content when businesses exist
  return (
    <div className="h-full flex flex-col space-y-4 overflow-hidden">
      {/* Header - Simplified without business selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Dashboard Overview
          </h1>
          <p className="text-sm text-muted-foreground">
            Welcome back <span className="font-semibold text-primary">{currentUser.username}</span>
            ! Here's what needs your attention today.
            {selectedBusiness && (
              <span className="ml-2 text-primary font-medium">
                • {selectedBusiness.name}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Urgent Alerts Banner - Only show when there are alerts */}
      {/* TODO: Replace with real alert data and make dismissible */}
      {FAKE_URGENT_ALERTS.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-medium text-orange-900 mb-1">Urgent Attention Required</h3>
                {FAKE_URGENT_ALERTS.map((alert) => (
                  <div key={alert.id} className="text-sm text-orange-800 mb-2 last:mb-0">
                    <span className="font-medium">{alert.business}</span> - {alert.message}
                  </div>
                ))}
              </div>
              <Button size="sm" variant="outline" className="text-orange-700 border-orange-300">
                View All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        {/* TODO: Replace with real metrics from API based on selectedBusiness */}
        <Card className="hover:shadow-lg transition-shadow border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{FAKE_STATS.totalBusinesses}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-emerald-500 inline-flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +{FAKE_STATS.monthlyChange.businesses}
              </span>
              from last month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <Star className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{FAKE_STATS.totalReviews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-emerald-500 inline-flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +{FAKE_STATS.monthlyChange.reviews}%
              </span>
              from last month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{FAKE_STATS.avgRating}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-emerald-500 inline-flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +{FAKE_STATS.monthlyChange.rating}
              </span>
              from last month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <MessageSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{FAKE_STATS.responseRate}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-emerald-500 inline-flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +{FAKE_STATS.monthlyChange.responseRate}%
              </span>
              from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area - Chart + Action Items */}
      <div className="grid grid-cols-5 gap-6 flex-1 min-h-0">
        {/* Reviews Chart - Takes 3/5 of the width */}
        <Card className="col-span-3 flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Reviews Overview</CardTitle>
                <CardDescription>Monthly trends and performance metrics</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Full Analytics
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            {/* TODO: Replace with real chart component (Chart.js, Recharts, etc.) */}
            <div className="h-full flex items-center justify-center bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg">
              <div className="text-center space-y-4">
                <BarChart3 className="h-12 w-12 mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">Chart will be implemented here</p>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-xl font-bold text-primary">612</div>
                    <div className="text-xs text-muted-foreground">This Month</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-emerald-600">+15%</div>
                    <div className="text-xs text-muted-foreground">Growth</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">4.3</div>
                    <div className="text-xs text-muted-foreground">Avg Rating</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Action Items - Takes 2/5 of the width */}
        <Card className="col-span-2 flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Today's Actions</CardTitle>
                <CardDescription>Reviews requiring your attention</CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs">
                {FAKE_ACTION_ITEMS.filter(item => item.urgent).length} urgent
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <div className="space-y-3 h-full overflow-y-auto pr-2">
              {/* TODO: Replace with real action items filtered by selectedBusiness */}
              {FAKE_ACTION_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border-l-4 hover:bg-muted/30 cursor-pointer transition-colors ${item.urgent
                      ? 'border-l-red-500 bg-red-50/30'
                      : item.rating >= 4
                        ? 'border-l-green-500 bg-green-50/30'
                        : 'border-l-yellow-500 bg-yellow-50/30'
                    }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${i < item.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                          />
                        ))}
                      </div>
                      {item.urgent && (
                        <Badge variant="destructive" className="text-xs px-1 py-0">
                          URGENT
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {item.timeAgo}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {item.business}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.location}
                    </p>
                    <p className="text-xs text-foreground line-clamp-2">
                      {item.preview}
                    </p>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      View
                    </Button>
                    <Button size="sm" className="h-7 text-xs">
                      Respond
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardHome;