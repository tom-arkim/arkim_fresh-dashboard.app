import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/shadcn/alert';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Forbidden() {
  return (
    <div className="bg-linear-to-br from-background to-muted/20 flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl w-full space-y-4 sm:space-y-6 md:space-y-8">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 blur-3xl bg-destructive/20 animate-pulse"></div>
            <ShieldAlert
              className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-3 sm:mb-4 text-destructive relative"
              strokeWidth={1.5}
            />
          </div>

          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold text-foreground relative">403</h1>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground">
              Access Denied
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg pt-1 sm:pt-2 px-2 sm:px-0">
              You don't have permission to access this resource
            </p>
          </div>
        </div>
        {/* Alert Message */}
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4 sm:h-5 sm:w-5" />
          <AlertTitle className="text-sm sm:text-base">Unauthorized Access</AlertTitle>
          <AlertDescription className="text-xs sm:text-sm">
            You don't have permission to access this resource. Please contact
            your administrator if you believe this is an error.
          </AlertDescription>
        </Alert>

        {/* Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Why am I seeing this?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground text-xs sm:text-sm md:text-base">
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-1">•</span>
                <span>
                  You may not have the required permissions to view this page
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-1">•</span>
                <span>Your session may have expired</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-1">•</span>
                <span>The resource you're trying to access is restricted</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <Link
            to="/company-select"
            className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors font-medium text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Company
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium text-sm sm:text-base"
          >
            <Home className="w-4 h-4 mr-2" />
            Return Home
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-xs sm:text-sm text-gray-500">
          Error Code: 403 | Forbidden Access
        </p>
      </div>
    </div>
  );
}
