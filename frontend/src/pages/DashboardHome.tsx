import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Building2,
  TrendingUp,
  Users,
  Star,
  MapPin,
  Plus,
  ArrowUpRight,
  Calendar,
  Target,
  BarChart3
} from "lucide-react";

const recentActivities = [
  {
    type: 'scrape',
    business: 'Downtown Restaurant',
    action: 'New reviews scraped',
    count: 12,
    time: '2 hours ago'
  },
  {
    type: 'analysis',
    business: 'Tech Solutions Inc',
    action: 'AI analysis completed',
    count: 25,
    time: '4 hours ago'
  },
  {
    type: 'invite',
    business: 'Coffee Shop Chain',
    action: 'Campaign sent',
    count: 150,
    time: '6 hours ago'
  },
];

const DashboardHome = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Dashboard Overview
          </h1>
          <p className="text-muted-foreground mt-2">
            Welcome back! Here's what's happening with your reviews.
          </p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90">
          <Plus className="h-4 w-4 mr-2" />
          New Business
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover-scale border-primary/10 shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-emerald-500 inline-flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +2
              </span>
              from last month
            </p>
          </CardContent>
        </Card>

        <Card className="hover-scale border-primary/10 shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <Star className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,345</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-emerald-500 inline-flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +15%
              </span>
              from last month
            </p>
          </CardContent>
        </Card>

        <Card className="hover-scale border-primary/10 shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.3</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-emerald-500 inline-flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +0.2
              </span>
              from last month
            </p>
          </CardContent>
        </Card>

        <Card className="hover-scale border-primary/10 shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-primary inline-flex items-center">
                <Target className="h-3 w-3 mr-1" />
                3
              </span>
              ending this week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reviews Chart */}
        <Card className="lg:col-span-2 shadow-elegant">
          <CardHeader>
            <CardTitle>Reviews Overview</CardTitle>
            <CardDescription>Monthly review collection and sentiment trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg">
              <div className="text-center space-y-2">
                <BarChart3 className="h-12 w-12 mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">Interactive charts coming soon</p>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">612</div>
                    <div className="text-xs text-muted-foreground">This Month</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600">+15%</div>
                    <div className="text-xs text-muted-foreground">Growth</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">4.3</div>
                    <div className="text-xs text-muted-foreground">Avg Rating</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sentiment Distribution */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Sentiment Analysis</CardTitle>
            <CardDescription>Overall review sentiment distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <div className="space-y-4 w-full">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
                      <span className="text-sm">Positive</span>
                    </div>
                    <span className="text-sm font-medium">68%</span>
                  </div>
                  <Progress value={68} className="h-2" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                      <span className="text-sm">Neutral</span>
                    </div>
                    <span className="text-sm font-medium">22%</span>
                  </div>
                  <Progress value={22} className="h-2" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-500"></div>
                      <span className="text-sm">Negative</span>
                    </div>
                    <span className="text-sm font-medium">10%</span>
                  </div>
                  <Progress value={10} className="h-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your businesses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {activity.type === 'scrape' && <Star className="h-5 w-5 text-primary" />}
                  {activity.type === 'analysis' && <TrendingUp className="h-5 w-5 text-primary" />}
                  {activity.type === 'invite' && <Users className="h-5 w-5 text-primary" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.business}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.action} • {activity.count} items
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Create New Business
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg">
              <MapPin className="h-4 w-4 mr-2" />
              Add Location
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg">
              <Users className="h-4 w-4 mr-2" />
              Start Campaign
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Analysis
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Progress Section */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>Monthly Goals</CardTitle>
          <CardDescription>Track your progress towards monthly targets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Reviews Collected</span>
              <span className="font-medium">612 / 800</span>
            </div>
            <Progress value={76} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Response Rate</span>
              <span className="font-medium">89%</span>
            </div>
            <Progress value={89} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Customer Satisfaction</span>
              <span className="font-medium">94%</span>
            </div>
            <Progress value={94} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardHome;
