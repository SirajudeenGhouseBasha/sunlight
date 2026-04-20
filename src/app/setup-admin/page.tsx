/**
 * First-Time Admin Setup Page
 * 
 * Allows the first user to become admin
 * This page should be disabled after first admin is created
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';

export default function SetupAdminPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/setup-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to setup admin');
      }

      setSuccess('Admin setup successful! Redirecting...');
      
      setTimeout(() => {
        router.push('/admin');
      }, 2000);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-gray-200 shadow-lg">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">👑</span>
          </div>
          <CardTitle className="text-2xl font-bold">First-Time Admin Setup</CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Set up the first admin account for your phone case platform
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSetup} className="space-y-6">
            {/* Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-sm text-blue-900 mb-2">
                📋 Instructions
              </h3>
              <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                <li>Enter the email address you signed up with</li>
                <li>Click "Become Admin"</li>
                <li>You'll be granted admin access immediately</li>
                <li>Access admin panel at /admin</li>
              </ol>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">
                Your Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your-email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                className="h-12"
              />
              <p className="text-xs text-gray-600">
                This must be the email you used to sign up
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Setting up...
                </>
              ) : (
                <>
                  👑 Become Admin
                </>
              )}
            </Button>

            {/* Warning */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-sm text-orange-900 mb-2">
                ⚠️ Security Note
              </h3>
              <p className="text-xs text-orange-800">
                This page should only be used for initial setup. After creating the first admin, 
                use the admin panel to manage other users' roles.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
