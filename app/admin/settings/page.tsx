'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { toast } from "react-hot-toast"

interface SiteSettings {
  site_name: string;
  site_description: string;
  site_keywords: string;
  site_email: string;
  site_phone: string;
  site_address: string;
  favicon_url?: string;
  // Add notification settings
  email_notifications_enabled: boolean;
  order_notifications_enabled: boolean;
  payment_notifications_enabled: boolean;
  dispute_notifications_enabled: boolean;
  marketing_emails_enabled: boolean;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  // const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/site-settings');
      if (!res.ok) {
        throw new Error(`Failed to fetch settings: ${res.statusText}`);
      }
      const data = await res.json();
      setSettings(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch site settings.');

    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type, checked, files } = e.target as HTMLInputElement;
    if (type === 'file' && files) {
      setFaviconFile(files[0]);
    } else {
      setSettings((prevSettings) => ({
        ...prevSettings!,
        [id]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSubmitting(true);
    let updatedFaviconUrl = settings.favicon_url;

    try {
      if (faviconFile) {
        const formData = new FormData();
        formData.append('favicon', faviconFile);

        const uploadRes = await fetch('/api/upload-favicon', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json();
          throw new Error(errorData.error || 'Failed to upload favicon.');
        }
        const uploadData = await uploadRes.json();
        updatedFaviconUrl = uploadData.url; // Assuming the API returns the URL of the uploaded favicon
        toast.success('Favicon uploaded successfully.');        
      }

      const res = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...settings, favicon_url: updatedFaviconUrl }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to update settings: ${res.statusText}`);
      }

      toast.success('Site settings updated successfully.');
      fetchSettings(); // Re-fetch settings to update favicon preview if any
    } catch (error: any) {
      toast.error(error.message || 'Failed to update site settings.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading settings...</div>;
  }

  if (!settings) {
    return <div className="p-4">Failed to load settings.</div>;
  }

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Site Settings</CardTitle>
          <CardDescription>Manage your website's general information and notification preferences.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="site_name">Site Name</Label>
                <Input id="site_name" value={settings.site_name || ''} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="site_email">Site Email</Label>
                <Input id="site_email" type="email" value={settings.site_email || ''} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="site_phone">Site Phone</Label>
                <Input id="site_phone" value={settings.site_phone || ''} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="site_address">Site Address</Label>
                <Input id="site_address" value={settings.site_address || ''} onChange={handleChange} />
              </div>
            </div>
            <div>
              <Label htmlFor="site_description">Site Description</Label>
              <Textarea id="site_description" value={settings.site_description || ''} onChange={handleChange} rows={3} />
            </div>
            <div>
              <Label htmlFor="site_keywords">Site Keywords</Label>
              <Textarea id="site_keywords" value={settings.site_keywords || ''} onChange={handleChange} rows={2} />
            </div>

            <div>
              <Label htmlFor="favicon">Favicon</Label>
              <Input id="favicon" type="file" accept="image/*" onChange={handleChange} />
              {settings.favicon_url && (
                <div className="mt-2">
                  <p>Current Favicon:</p>
                  <img src={settings.favicon_url} alt="Favicon" className="w-10 h-10" />
                </div>
              )}
            </div>

            <h3 className="text-lg font-semibold mt-8 mb-4">Notification Settings</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email_notifications_enabled"
                  checked={settings.email_notifications_enabled}
                  onCheckedChange={(checked) => handleChange({ target: { id: 'email_notifications_enabled', type: 'checkbox', checked } } as any)}
                />
                <Label htmlFor="email_notifications_enabled">Enable Email Notifications</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="order_notifications_enabled"
                  checked={settings.order_notifications_enabled}
                  onCheckedChange={(checked) => handleChange({ target: { id: 'order_notifications_enabled', type: 'checkbox', checked } } as any)}
                />
                <Label htmlFor="order_notifications_enabled">Enable Order Notifications</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="payment_notifications_enabled"
                  checked={settings.payment_notifications_enabled}
                  onCheckedChange={(checked) => handleChange({ target: { id: 'payment_notifications_enabled', type: 'checkbox', checked } } as any)}
                />
                <Label htmlFor="payment_notifications_enabled">Enable Payment Notifications</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dispute_notifications_enabled"
                  checked={settings.dispute_notifications_enabled}
                  onCheckedChange={(checked) => handleChange({ target: { id: 'dispute_notifications_enabled', type: 'checkbox', checked } } as any)}
                />
                <Label htmlFor="dispute_notifications_enabled">Enable Dispute Notifications</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="marketing_emails_enabled"
                  checked={settings.marketing_emails_enabled}
                  onCheckedChange={(checked) => handleChange({ target: { id: 'marketing_emails_enabled', type: 'checkbox', checked } } as any)}
                />
                <Label htmlFor="marketing_emails_enabled">Enable Marketing Emails</Label>
              </div>
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}