import { Edit, Download, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const JobPreferencesTab = () => {
  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Job preferences</h1>
      </div>

      {/* Job Goals Section */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl">Job goals</CardTitle>
            <Edit className="w-4 h-4 text-muted-foreground" />
          </div>
          <CardDescription>
            Get customized job recommendations by keeping your preferences updated.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Row 1: Salary, Currency, Pay Period */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="salary" className="text-sm font-medium">
                Desired minimum salary
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                <Input 
                  id="salary"
                  className="pl-7 bg-background border-border"
                  placeholder="Enter amount"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currency" className="text-sm font-medium">
                Currency
              </Label>
              <Select defaultValue="thb">
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thb">Bath (THB)</SelectItem>
                  <SelectItem value="usd">US Dollar (USD)</SelectItem>
                  <SelectItem value="eur">Euro (EUR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pay-period" className="text-sm font-medium">
                Pay period
              </Label>
              <Select defaultValue="monthly">
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Location & Remote Work */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="desired-location" className="text-sm font-medium">
                Desired location
              </Label>
              <Input 
                id="desired-location"
                value="Bangkok, Thailand" 
                className="bg-background border-border"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="remote-work" className="text-sm font-medium">
                Open to remote work
              </Label>
              <Select defaultValue="yes">
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resume Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Resume</CardTitle>
          <CardDescription>
            Add a resume to save time and autofill certain job applications. You can also share it to hear from employers about openings.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center gap-4 p-4 border border-border rounded-lg bg-background">
            <div className="w-10 h-10 bg-primary rounded flex items-center justify-center">
              <span className="text-primary-foreground font-bold">📄</span>
            </div>
            <div className="flex-1">
              <div className="font-medium text-foreground">Resume.pdf</div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobPreferencesTab;