import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Search, ArrowLeft, Mail, Compass } from "lucide-react";

const NotFoundPage: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  const floatingVariants = {
    initial: { y: 0 },
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut" as const,
      },
    },
  };

  const quickLinks = [
    {
      icon: Home,
      label: "Home",
      href: "/",
      description: "Go back to the homepage",
    },
    {
      icon: Search,
      label: "Browse Jobs",
      href: "/student/browse-jobs",
      description: "Explore available opportunities",
    },
    {
      icon: Compass,
      label: "Dashboard",
      href: "/student",
      description: "Access your personal dashboard",
    },
  ];

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex items-center justify-center px-4 py-20"
    >
      <div className="max-w-4xl w-full">
        {/* 404 Illustration */}
        <motion.div
          variants={floatingVariants}
          initial="initial"
          animate="animate"
          className="text-center mb-12"
        >
          <div className="relative inline-block">
            <motion.div
              variants={itemVariants}
              className="text-9xl font-bold bg-gradient-to-r from-primary via-primary/70 to-primary/40 bg-clip-text text-transparent select-none"
            >
              404
            </motion.div>
            <motion.div
              variants={itemVariants}
              className="absolute inset-0 text-9xl font-bold text-primary/20 blur-xl select-none"
            >
              404
            </motion.div>
          </div>
        </motion.div>

        {/* Error Message */}
        <motion.div variants={itemVariants} className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Page Not Found
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-2">
            Oops! The page you're looking for seems to have vanished into the
            digital void.
          </p>
          <p className="text-muted-foreground">
            Don't worry though, let's get you back on track.
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="mb-12">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-3 gap-6">
                {quickLinks.map((link, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      className="w-full h-auto p-6 flex flex-col items-center gap-3 hover:bg-primary/5 hover:border-primary/20 group"
                      onClick={() => (window.location.href = link.href)}
                    >
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <link.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{link.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {link.description}
                        </div>
                      </div>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Additional Actions */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            onClick={handleGoBack}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Go Back
          </Button>

          <Button
            onClick={() => (window.location.href = "/")}
            size="lg"
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 group"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Home
            <motion.span
              className="inline-block ml-2"
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
            >
              →
            </motion.span>
          </Button>
        </motion.div>

        {/* Help Section */}
        <motion.div variants={itemVariants} className="mt-12 text-center">
          <Card className="border-0 bg-muted/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Mail className="w-5 h-5 text-primary" />
                <span className="font-semibold">Still having trouble?</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                If you believe this is an error or need assistance, please
                contact our support team.
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary/80"
                onClick={() =>
                  (window.location.href = "mailto:support@ku-connect.com")
                }
              >
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Fun Element */}
        <motion.div variants={itemVariants} className="text-center mt-8">
          <p className="text-xs text-muted-foreground italic">
            Fun fact: Even the best explorers sometimes get lost. You're in good
            company! 🗺️
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default NotFoundPage;
