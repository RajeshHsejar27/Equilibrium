import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  User, 
  Moon, 
  Sun, 
  Bell, 
  Mail, 
  Camera,
  ExternalLink,
  Download,
  ShieldCheck,
  SmartphoneIcon
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const profile = useLiveQuery(() => db.profile.get(1));
  const settings = useLiveQuery(() => db.settings.get(1));

  const [name, setName] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (profile) setName(profile.name);
  }, [profile]);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleUpdateProfile = async () => {
    await db.profile.update(1, { name });
    toast.success("Profile updated");
  };

  const handleUpdateAvatar = async () => {
    // Mock avatar upload
    const mockAvatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop";
    await db.profile.update(1, { avatar: mockAvatar });
    toast.success("Avatar updated");
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      toast.info("Install option not available. Try using the browser menu.");
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground font-medium">Personalize your Equilibrium experience.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Settings */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <User className="h-5 w-5 text-primary" />
               Profile
            </CardTitle>
            <CardDescription>How you appear in the app</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="flex flex-col items-center gap-4">
                <div className="relative group cursor-pointer" onClick={handleUpdateAvatar}>
                  <Avatar className="h-24 w-24 border-4 border-muted shadow-xl transition-all group-hover:opacity-80">
                    <AvatarImage src={profile?.avatar} />
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground font-black">
                       {profile?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full shadow-lg">
                     <Camera size={16} />
                  </div>
                </div>
                <div className="w-full space-y-2">
                   <Label>Display Name</Label>
                   <div className="flex gap-2">
                      <Input 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        className="bg-muted/50 border-none h-11"
                      />
                      <Button onClick={handleUpdateProfile} className="h-11 font-bold">Save</Button>
                   </div>
                </div>
             </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
               {theme === 'dark' ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
               Appearance
            </CardTitle>
            <CardDescription>Customize the look and feel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                <div className="space-y-0.5">
                   <Label className="text-base">Dark Mode</Label>
                   <p className="text-xs text-muted-foreground">Switch between light and dark themes</p>
                </div>
                <Switch 
                  checked={theme === 'dark'} 
                  onCheckedChange={(checked: boolean) => setTheme(checked ? 'dark' : 'light')} 
                />
             </div>
             <div className="p-4 bg-muted/50 rounded-xl space-y-4">
                <div className="space-y-0.5">
                   <Label className="text-base">Color Theme</Label>
                   <p className="text-xs text-muted-foreground">Select your primary accent color</p>
                </div>
                <div className="flex gap-3">
                   {['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'].map(color => (
                     <div 
                       key={color} 
                       className="w-8 h-8 rounded-full cursor-pointer hover:scale-110 transition-transform shadow-sm border-2 border-transparent hover:border-foreground/20" 
                       style={{ backgroundColor: color }}
                     />
                   ))}
                </div>
             </div>
          </CardContent>
        </Card>

        {/* Notifications & Alerts */}
        <Card className="border-none shadow-lg md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <Bell className="h-5 w-5 text-primary" />
               Alerts & Notifications
            </CardTitle>
            <CardDescription>Stay on top of your budget</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
             <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <div className="space-y-0.5">
                      <Label className="text-base">Overspending Alert</Label>
                      <p className="text-xs text-muted-foreground">Get notified when a category budget is high</p>
                   </div>
                   <Switch 
                     checked={settings?.overspendingAlert} 
                     onCheckedChange={(checked: boolean) => db.settings.update(1, { overspendingAlert: checked })} 
                   />
                </div>
                <div className="space-y-4">
                   <div className="flex justify-between">
                      <Label className="text-sm">Alert Threshold</Label>
                      <span className="text-sm font-black text-primary">{settings?.alertThreshold}%</span>
                   </div>
                   <Slider 
                     value={[settings?.alertThreshold || 80]} 
                     onValueChange={(val: any) => db.settings.update(1, { alertThreshold: val[0] })} 
                     max={100} 
                     step={5} 
                   />
                </div>
             </div>
             
             <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <div className="space-y-0.5">
                      <Label className="text-base">Email Reports</Label>
                      <p className="text-xs text-muted-foreground">Weekly summary of your finances</p>
                   </div>
                   <Switch 
                     checked={settings?.emailReports} 
                     onCheckedChange={(checked: boolean) => db.settings.update(1, { emailReports: checked })} 
                   />
                </div>
                <div className="space-y-2">
                   <Label className="text-xs uppercase font-bold text-muted-foreground">Email Address</Label>
                   <div className="flex gap-2">
                      <Input 
                        placeholder="your@email.com" 
                        defaultValue={settings?.emailAddress}
                        className="bg-muted/50 border-none"
                      />
                      <Button variant="outline" size="icon"><Mail size={16} /></Button>
                   </div>
                </div>
             </div>

             <div className="flex items-center justify-between md:col-span-2 pt-4 border-t">
                <div className="space-y-0.5">
                   <Label className="text-base">Bill Reminders</Label>
                   <p className="text-xs text-muted-foreground">Notify me before recurring bills are due</p>
                </div>
                <Switch 
                  checked={settings?.billReminders} 
                  onCheckedChange={(checked: boolean) => db.settings.update(1, { billReminders: checked })} 
                />
             </div>
          </CardContent>
        </Card>

        {/* PWA / App */}
        <Card className="border-none shadow-lg md:col-span-2 bg-primary text-primary-foreground">
          <CardContent className="p-6">
             <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                   <div className="bg-white/20 p-4 rounded-2xl">
                      <SmartphoneIcon size={40} className="text-white" />
                   </div>
                   <div>
                      <h3 className="text-xl font-bold">Install Equilibrium</h3>
                      <p className="text-primary-foreground/80 text-sm">Add to your home screen for a fast, app-like experience on Android & iOS.</p>
                   </div>
                </div>
                <Button 
                  onClick={handleInstall} 
                  className="bg-white text-primary hover:bg-white/90 font-black px-8 h-12 shadow-xl"
                >
                   {deferredPrompt ? 'Install Now' : 'Check PWA Status'}
                </Button>
             </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="border-none shadow-lg md:col-span-2 bg-muted/30">
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
             <div className="flex items-center gap-4">
                <ShieldCheck className="text-primary" />
                <div>
                   <p className="text-sm font-bold">Privacy Guaranteed</p>
                   <p className="text-xs text-muted-foreground">Your data is stored locally in your browser using IndexedDB. No server synchronization.</p>
                </div>
             </div>
             <div className="flex gap-4">
                <Button variant="ghost" size="sm" className="text-xs font-bold gap-2">
                   <ExternalLink size={14} /> Help Center
                </Button>
                <Button variant="ghost" size="sm" className="text-xs font-bold gap-2">
                   <Download size={14} /> Export Backup
                </Button>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
