import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Camera, MapPin } from 'lucide-react';

export default function Attendance() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Attendance</h1>
        <p className="page-description">Track your daily clock-in and clock-out</p>
      </div>

      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Clock In</CardTitle>
          <CardDescription>Capture your attendance with a selfie</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
            <Camera className="h-16 w-16 text-muted-foreground/50" />
          </div>
          <Button className="w-full" size="lg">
            <Clock className="h-4 w-4 mr-2" />
            Clock In Now
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            <MapPin className="h-3 w-3 inline mr-1" />
            Location will be captured with your clock-in
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
