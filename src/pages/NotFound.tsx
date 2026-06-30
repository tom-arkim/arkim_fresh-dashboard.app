import React from 'react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/shadcn/alert';
import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { SearchX, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="bg-linear-to-br from-background to-muted/20 flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl w-full space-y-4 sm:space-y-6 md:space-y-8">
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="relative inline-block">
            <div className="absolute inset-0 blur-3xl bg-primary/20 animate-pulse"></div>
            <SearchX
              className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-3 sm:mb-4 text-primary relative"
              strokeWidth={1.5}
            />
          </div>

          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold text-foreground relative">404</h1>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground">
              Page Not Found
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg pt-1 sm:pt-2 px-2 sm:px-0">
              The page you're looking for doesn't exist or has been moved
            </p>
          </div>
        </div>

        {/* Alert Message */}
        <Alert>
          <SearchX className="h-4 w-4 sm:h-5 sm:w-5" />
          <AlertTitle className="text-sm sm:text-base">Oops! We couldn't find that page</AlertTitle>
          <AlertDescription className="text-xs sm:text-sm">
            The page you're looking for doesn't exist or may have been moved to
            a different location.
          </AlertDescription>
        </Alert>

        {/* Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">What can you do?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground text-xs sm:text-sm md:text-base">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Check the URL for any typos or errors</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Return to the homepage and navigate from there</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Contact support if you believe this is an error</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="flex justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium text-sm sm:text-base w-full sm:w-auto"
          >
            <Home className="w-4 h-4 mr-2" />
            Return Home
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-xs sm:text-sm text-muted-foreground">
          Error Code: 404 | Page Not Found
        </p>
      </div>
    </div>
  );
}
