import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const CompanyProfileCard = () => {
  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-teal rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">Ag</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Agoda</h2>
            <p className="text-muted-foreground text-sm">Bangkok, Thailand • Travel Technology</p>
            <p className="text-muted-foreground text-sm">1,000+ employees</p>
          </div>
        </div>
        <Button asChild variant="outline" className="px-8 border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white">
          <Link to="/employer/profile">Edit Company Profile</Link>
        </Button>
      </div>
    </div>
  );
};

export default CompanyProfileCard;
