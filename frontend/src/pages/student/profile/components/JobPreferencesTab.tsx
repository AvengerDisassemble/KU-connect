import { useState } from "react";
import { Edit, Download, MoreHorizontal, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const jobPreferencesSchema = z.object({
  minSalary: z.string().optional(),
  currency: z.string(),
  payPeriod: z.string(),
  desiredLocation: z.string(),
  remoteWork: z.string(),
});

const JobPreferencesTab = () => {
  const [isEditing, setIsEditing] = useState(false);
  
  const form = useForm<z.infer<typeof jobPreferencesSchema>>({
    resolver: zodResolver(jobPreferencesSchema),
    defaultValues: {
      minSalary: "",
      currency: "thb",
      payPeriod: "monthly",
      desiredLocation: "Bangkok, Thailand",
      remoteWork: "yes",
    },
  });

  const onSubmit = (values: z.infer<typeof jobPreferencesSchema>) => {
    console.log(values);
    setIsEditing(false);
  };

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Job preferences</h1>
      </div>

      {/* Job Goals Section */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">Job goals</CardTitle>
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  className="h-6 w-6"
                >
                  <Edit className="w-4 h-4 text-muted-foreground" />
                </Button>
              )}
            </div>
            {isEditing && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={form.handleSubmit(onSubmit)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </div>
            )}
          </div>
          <CardDescription>
            Get customized job recommendations by keeping your preferences updated.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Row 1: Salary, Currency, Pay Period */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="minSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Desired minimum salary</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                          <Input 
                            {...field}
                            disabled={!isEditing}
                            className="pl-7 bg-background border-border"
                            placeholder="Enter amount"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={!isEditing}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background border-border">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="thb">Bath (THB)</SelectItem>
                          <SelectItem value="usd">US Dollar (USD)</SelectItem>
                          <SelectItem value="eur">Euro (EUR)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="payPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pay period</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={!isEditing}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background border-border">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                          <SelectItem value="hourly">Hourly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 2: Location & Remote Work */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="desiredLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Desired location</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          disabled={!isEditing}
                          className="bg-background border-border"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="remoteWork"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Open to remote work</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={!isEditing}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background border-border">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
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