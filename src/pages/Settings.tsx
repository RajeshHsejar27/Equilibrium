import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Settings as AppSettings } from '@/lib/db';
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
import { cn } from '@/lib/utils';
import { exportData } from '@/lib/exportData';
const MIN_ALERT_THRESHOLD = 40;
const MAX_ALERT_THRESHOLD = 100;
const ALERT_THRESHOLD_STEP = 5;

const clampAlertThreshold = (value: number) => {
  if (!Number.isFinite(value)) return 80;

  const steppedValue = Math.round(value / ALERT_THRESHOLD_STEP) * ALERT_THRESHOLD_STEP;
  return Math.min(MAX_ALERT_THRESHOLD, Math.max(MIN_ALERT_THRESHOLD, steppedValue));
};

const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const profile = useLiveQuery(() => db.profile.get(1));
  const settings = useLiveQuery(() => db.settings.get(1));

  const [name, setName] = useState('');
  const [thresholdInput, setThresholdInput] = useState('80');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const alertThreshold = clampAlertThreshold(settings?.alertThreshold ?? 80);
  const overspendingAlertEnabled = Boolean(settings?.overspendingAlert);

  useEffect(() => {
    if (profile) setName(profile.name);
  }, [profile]);

  useEffect(() => {
    setThresholdInput(String(alertThreshold));
  }, [alertThreshold]);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const updateSettings = async (updates: Partial<AppSettings>) => {
    if (!settings) return;

    await db.settings.put({
      ...settings,
      ...updates,
    });
  };

  const persistAlertThreshold = async (value: number) => {
    const nextValue = clampAlertThreshold(value);
    setThresholdInput(String(nextValue));

    if (!settings || settings.alertThreshold === nextValue) return;

    await db.settings.put({
      ...settings,
      alertThreshold: nextValue,
    });
  };

  const handleDevelopmentFeatureClick = (feature: 'emailReports' | 'billReminders') => {
    toast("Feature in development:", {
      description: feature === 'emailReports'
        ? "Email reports coming soon."
        : "Bill reminders coming soon.",
    });
  };

  const handleUpdateProfile = async () => {
    await db.profile.update(1, { name });
    toast.success("Profile updated");
  };

  const handleUpdateAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      await db.profile.update(1, { avatar: base64 });
      toast.success("Avatar updated");
    };
    reader.readAsDataURL(file);
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
                <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>
                  <Avatar className="h-24 w-24 border-4 border-muted shadow-xl transition-all group-hover:opacity-80">
                    <AvatarImage src={profile?.avatar} />
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground font-black">
                       {profile?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full shadow-lg">
                     <Camera size={16} />
                  </div>
                  <input 
                    id="avatar-upload" 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleUpdateAvatar} 
                  />
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
                       onClick={() => db.settings.update(1, { accentColor: color })}
                       className={cn(
                         "w-8 h-8 rounded-full cursor-pointer hover:scale-110 transition-all shadow-sm border-2",
                         settings?.accentColor === color ? "border-foreground scale-110" : "border-transparent hover:border-foreground/20"
                       )}
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
                     checked={overspendingAlertEnabled}
                     onCheckedChange={(checked: boolean) => updateSettings({ overspendingAlert: checked })}
                   />
                </div>
                <div className={cn(
                  "space-y-4 rounded-xl bg-muted/30 p-4 transition-opacity",
                  !overspendingAlertEnabled && "opacity-50"
                )}>
                   <div className="flex items-center justify-between gap-4">
                      <Label className="text-sm">Alert Threshold</Label>
                      <span className="text-sm font-black text-primary tabular-nums">{alertThreshold}%</span>
                   </div>
                   <div className="space-y-3">
                     <div className="flex items-center gap-3">
                       <span className="text-xs font-bold text-muted-foreground tabular-nums">40</span>
                       <Slider
                         value={[alertThreshold]}
                         onValueChange={(val: any) => persistAlertThreshold(val[0])}
                         min={MIN_ALERT_THRESHOLD}
                         max={MAX_ALERT_THRESHOLD}
                         step={ALERT_THRESHOLD_STEP}
                         disabled={!overspendingAlertEnabled}
                         className={cn(!overspendingAlertEnabled && "cursor-not-allowed")}
                       />
                       <span className="text-xs font-bold text-muted-foreground tabular-nums">100</span>
                     </div>
                     <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                       <p className="text-xs leading-relaxed text-muted-foreground">
                         You will be notified when a category spending crosses the selected budget threshold.
                       </p>
                       <div className="flex h-10 w-full shrink-0 items-center rounded-lg bg-background ring-1 ring-border sm:w-28">
                         <Input
                           type="number"
                           min={MIN_ALERT_THRESHOLD}
                           max={MAX_ALERT_THRESHOLD}
                           step={ALERT_THRESHOLD_STEP}
                           value={thresholdInput}
                           disabled={!overspendingAlertEnabled}
                           onChange={(event) => {
                             const value = event.target.value;
                             setThresholdInput(value);

                             if (value !== '') {
                               persistAlertThreshold(Number(value));
                             }
                           }}
                           onBlur={() => {
                             if (thresholdInput === '') {
                               persistAlertThreshold(alertThreshold);
                             }
                           }}
                           className="h-full border-none bg-transparent text-center font-black tabular-nums shadow-none focus-visible:ring-0 disabled:cursor-not-allowed"
                         />
                         <span className="pr-3 text-sm font-bold text-muted-foreground">%</span>
                       </div>
                     </div>
                   </div>
                </div>
             </div>
             
             <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <div className="space-y-0.5">
                      <Label className="text-base">Email Reports</Label>
                      <p className="text-xs text-muted-foreground">Weekly summary of your finances</p>
                   </div>
                   <div
                     aria-disabled="true"
                     title="Feature in development"
                     className="opacity-50 cursor-not-allowed"
                     onClick={() => handleDevelopmentFeatureClick('emailReports')}
                   >
                     <Switch
                       checked={false}
                       disabled
                       className="pointer-events-none"
                     />
                   </div>
                </div>
                <div className="space-y-2">
                   <Label className="text-xs uppercase font-bold text-muted-foreground">Email Address</Label>
                   <div
                     aria-disabled="true"
                     title="Feature in development"
                     className="flex gap-2 opacity-50 cursor-not-allowed"
                     onClick={() => handleDevelopmentFeatureClick('emailReports')}
                   >
                     <Input
                       placeholder="your@email.com"
                       value={settings?.emailAddress ?? ''}
                       disabled
                       readOnly
                       className="pointer-events-none bg-muted/50 border-none disabled:cursor-not-allowed"
                     />
                     <Button
                       variant="outline"
                       size="icon"
                       disabled
                       className="pointer-events-none"
                     >
                       <Mail size={16} />
                     </Button>
                   </div>
                </div>
             </div>

             <div className="flex items-center justify-between md:col-span-2 pt-4 border-t">
                <div className="space-y-0.5">
                   <Label className="text-base">Bill Reminders</Label>
                   <p className="text-xs text-muted-foreground">Notify me before recurring bills are due</p>
                </div>
                <div
                  aria-disabled="true"
                  title="Feature in development"
                  className="opacity-50 cursor-not-allowed"
                  onClick={() => handleDevelopmentFeatureClick('billReminders')}
                >
                  <Switch
                    checked={false}
                    disabled
                    className="pointer-events-none"
                  />
                </div>
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
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs font-bold gap-2"
                  onClick={() => window.location.href = 'mailto:nrh27magnum@gmail.com?subject=Equilibrium help request'}
                >
                   <ExternalLink size={14} /> Help Center
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs font-bold gap-2"
                  onClick={() => exportData('xlsx')}
                >
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
