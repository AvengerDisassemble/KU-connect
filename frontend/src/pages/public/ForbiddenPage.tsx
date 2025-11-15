import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ForbiddenPage = () => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className="max-w-lg space-y-2">
        <h1 className="text-4xl font-bold text-primary">Access Denied</h1>
        <p className="text-muted-foreground">
          You do not have permission to view this page. If you believe this is a
          mistake, please contact the KU-Connect support team.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link to="/login">Back to Login</Link>
        </Button>
        <Button variant="outline" asChild size="lg">
          <Link to="/">Go Home</Link>
        </Button>
      </div>
    </div>
  );
};

export default ForbiddenPage;
