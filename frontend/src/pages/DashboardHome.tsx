// frontend/src/pages/DashboardHome.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
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
  Brain,
  Target,
  Zap,
  Calendar,
  Shield
} from "lucide-react";
import { useBusiness } from "@/contexts/BusinessContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useReviewsByBusiness, useReviewStatsByBusiness } from "@/hooks/useReviews";
import { useLocationsByBusiness } from "@/hooks/useLocations";
import { useBusinessCounts } from "@/hooks/useBusinesses";
import { getReviewSentiment, getReviewUrgency, reviewNeedsAttention, isReviewSpam } from "@/services/review";
import { processReviewsData } from "@/utils/analyticsUtils";
import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, LineChart, Line } from "recharts";

const DashboardHome = () => {
  const { hasBusinesses, selectedBusiness, isLoading } = useBusiness();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Get real data
  const { data: reviews = [] } = useReviewsByBusiness(selectedBusiness?.id || '');
  const { data: locations = [] } = useLocationsByBusiness(selectedBusiness?.id || '');
  const { data: businessCounts } = useBusinessCounts(selectedBusiness?.id || '');

  // Process analytics data
  const analyticsData = useMemo(() => {
    if (reviews.length === 0) return null;
    return processReviewsData(reviews);
  }, [reviews]);

  // Get urgent reviews
  const urgentReviews = useMemo(() => {
    return reviews.filter(review => {
      const urgency = getReviewUrgency(review);
      return urgency === 'critical' || urgency === 'high' || reviewNeedsAttention(review);
    }).slice(0, 5); // Latest 5 urgent reviews
  }, [reviews]);

  // Calculate real stats
  const stats = useMemo(() => {
    if (!reviews.length || !analyticsData) {
      return {
        totalReviews: 0,
        avgRating: 0,
        analyzedCount: 0,
        urgentCount: 0,
        spamRate: 0,
        sentimentBreakdown: { positive: 0, negative: 0, neutral: 0 }
      };
    }

    const avgRating = reviews
      .filter(r => r.data?.rating && typeof r.data.rating === 'number')
      .reduce((sum, r) => sum + r.data.rating, 0) / 
      reviews.filter(r => r.data?.rating && typeof r.data.rating === 'number').length || 0;

    const sentimentBreakdown = {
      positive: analyticsData.sentimentData.find(s => s.name === 'Positive')?.value || 0,
      negative: analyticsData.sentimentData.find(s => s.name === 'Negative')?.value || 0,
      neutral: analyticsData.sentimentData.find(s => s.name === 'Neutral')?.value || 0
    };

    return {
      totalReviews: reviews.length,
      avgRating: Math.round(avgRating * 10) / 10,
      analyzedCount: analyticsData.analyzedCount,
      urgentCount: urgentReviews.length,
      spamRate: Math.round((analyticsData.spamCount / reviews.length) * 100),
      sentimentBreakdown
    };
  }, [reviews, analyticsData, urgentReviews]);

  // Carousel data for mini charts
  const carouselData = useMemo(() => {
    if (!analyticsData) return [];

    return [
      {
        id: 'sentiment',
        title: 'Sentiment Overview',
        icon: TrendingUp,
        component: (
          <div className="h-full flex flex-col">
            <div className="flex-1" style={{ minHeight: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {analyticsData.sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-3 flex-wrap flex-shrink-0">
              {analyticsData.sentimentData.map((item) => (
                <div key={item.name} className="flex items-center gap-1 text-xs">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )
      },
      {
        id: 'topics',
        title: 'Top Topics',
        icon: Target,
        component: (
          <div className="h-full flex flex-col">
            {analyticsData.topicData.length > 0 ? (
              <>
                <div className="flex-1" style={{ minHeight: '280px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={analyticsData.topicData.slice(0, 4)} 
                      margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                    >
                      <XAxis 
                        dataKey="topic" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        tick={{ fontSize: 10 }}
                        interval={0}
                      />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Bar 
                        dataKey="count" 
                        fill="#3b82f6" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-xs text-muted-foreground text-center mt-2 flex-shrink-0">
                  Top {Math.min(4, analyticsData.topicData.length)} topics • 
                  {analyticsData.topicData.reduce((sum, t) => sum + t.count, 0)} mentions
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No topics analyzed yet</p>
                  <p className="text-xs">Run AI analysis to see topic insights</p>
                </div>
              </div>
            )}
          </div>
        )
      },
      {
        id: 'trends',
        title: 'Recent Activity',
        icon: Calendar,
        component: (
          <div className="h-full flex flex-col">
            {analyticsData.timeSeriesData.length > 0 ? (
              <>
                <div className="flex-1" style={{ minHeight: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={analyticsData.timeSeriesData.slice(-14)}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <XAxis 
                        dataKey="displayDate" 
                        fontSize={10}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis fontSize={10} />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ r: 3, fill: '#3b82f6' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-border flex-shrink-0">
                  <div className="text-center">
                    <div className="text-xl font-bold text-primary">{stats.totalReviews}</div>
                    <div className="text-xs text-muted-foreground">Total Reviews</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">
                      {stats.sentimentBreakdown.positive}
                    </div>
                    <div className="text-xs text-muted-foreground">Positive</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-orange-600">
                      ★ {stats.avgRating}
                    </div>
                    <div className="text-xs text-muted-foreground">Avg Rating</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Not enough data for trends</p>
                  <p className="text-xs">Add more reviews to see trends</p>
                </div>
              </div>
            )}
          </div>
        )
      }
    ];
  }, [analyticsData, stats]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!hasBusinesses || !selectedBusiness) {
    return (
      <div className="space-y-8 animate-in fade-in duration-800">
        <div className="text-center space-y-4 py-12">
          <Building2 className="h-16 w-16 mx-auto text-muted-foreground" />
          <h2 className="text-2xl font-semibold text-foreground">Welcome to Reviewoly</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Get started by creating your first business to begin analyzing reviews and gaining insights.
          </p>
          <Button onClick={() => navigate('/dashboard/businesses')} className="mt-4">
            <Building2 className="h-4 w-4 mr-2" />
            Create Your First Business
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-800">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Good morning, {currentUser?.username || 'User'}! 👋
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening with your reviews today.
              {selectedBusiness && (
                <span className="ml-2 text-primary font-medium">
                  • {selectedBusiness.name}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Urgent Alerts Banner */}
      {urgentReviews.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-medium text-orange-900 mb-1">Urgent Attention Required</h3>
                <div className="text-sm text-orange-800">
                  <span className="font-medium">{urgentReviews.length}</span> reviews need immediate response
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-orange-700 border-orange-300"
                onClick={() => navigate('/dashboard/reviews?needs_attention=true')}
              >
                View All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{locations.length}</div>
            <p className="text-xs text-muted-foreground">Active locations</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <Star className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReviews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.analyzedCount} analyzed with AI
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgRating}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-emerald-500">★</span> Overall rating
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spam Rate</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.spamRate}%</div>
            <p className="text-xs text-muted-foreground">
              AI-detected spam reviews
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area - Carousel Chart + Action Items */}
      <div className="grid grid-cols-5 gap-6 flex-1 min-h-0">
        {/* Reviews Chart Carousel - Takes 3/5 of the width */}
        <Card className="col-span-3 flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Analytics Overview</CardTitle>
                <CardDescription>Key insights from your reviews</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/dashboard/analytics')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Full Analytics
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0 p-4">
            {carouselData.length > 0 ? (
              <Carousel className="w-full h-full flex flex-col">
                <CarouselContent className="flex-1 h-full">
                  {carouselData.map((item, index) => (
                    <CarouselItem key={item.id} className="h-full flex flex-col">
                      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                        <item.icon className="h-4 w-4 text-primary" />
                        <h3 className="font-medium text-sm text-foreground">{item.title}</h3>
                      </div>
                      <div className="flex-1 min-h-0">
                        {item.component}
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="flex justify-center items-center gap-4 mt-3 flex-shrink-0">
                  <CarouselPrevious className="static translate-y-0" />
                  <CarouselNext className="static translate-y-0" />
                </div>
              </Carousel>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg">
                <div className="text-center space-y-4">
                  <BarChart3 className="h-12 w-12 mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground">No review data available yet</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/dashboard/jobs')}
                  >
                    Start Collecting Reviews
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Action Items - Takes 2/5 of the width */}
        <Card className="col-span-2 flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Urgent Reviews</CardTitle>
                <CardDescription>Reviews requiring your attention</CardDescription>
              </div>
              <Badge variant="destructive" className="text-xs">
                {urgentReviews.length} urgent
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            {urgentReviews.length > 0 ? (
              <div className="space-y-3 h-full overflow-y-auto pr-2">
                {urgentReviews.map((review) => {
                  const rating = review.data?.rating || 0;
                  const urgency = getReviewUrgency(review);
                  const isSpam = isReviewSpam(review);
                  const reviewText = review.data?.text || review.data?.original_text || 'No text available';
                  
                  return (
                    <div
                      key={review.id}
                      className={`p-3 rounded-lg border-l-4 hover:bg-muted/30 cursor-pointer transition-colors ${
                        urgency === 'critical' 
                          ? 'border-l-red-500 bg-red-50/30'
                          : urgency === 'high'
                            ? 'border-l-orange-500 bg-orange-50/30'
                            : 'border-l-yellow-500 bg-yellow-50/30'
                      }`}
                      onClick={() => navigate(`/dashboard/reviews?highlight=${review.id}`)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < rating 
                                    ? 'text-yellow-400 fill-current' 
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <div className="flex gap-1">
                            {urgency && urgency !== 'none' && (
                              <Badge 
                                variant={urgency === 'critical' ? 'destructive' : 'secondary'} 
                                className="text-xs px-1"
                              >
                                {urgency.toUpperCase()}
                              </Badge>
                            )}
                            {isSpam && (
                              <Badge variant="destructive" className="text-xs px-1">
                                SPAM
                              </Badge>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {reviewText}
                      </p>
                      {review.location_id && (
                        <div className="flex items-center mt-1">
                          <span className="text-xs font-medium text-primary">
                            {review.location_id}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No urgent reviews</p>
                  <p className="text-xs">Great job staying on top of things!</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardHome;