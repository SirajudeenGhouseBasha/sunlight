'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/ui/button';
import { Mail, ArrowLeft } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleResend = async () => {
    setIsResending(true);
    setResendMessage('');
    
    try {
      // TODO: Implement resend confirmation email
      setResendMessage('Verification email sent! Check your inbox.');
    } catch (error) {
      setResendMessage('Failed to resend email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          
          <h1 className="text-3xl font-bold mb-2">Check your email</h1>
          
          <p className="text-muted-foreground mb-6">
            We've sent you a verification link. Click the link in the email to verify your account.
          </p>
          
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <p className="text-sm text-muted-foreground">
              <strong>Didn't receive the email?</strong>
              <br />
              Check your spam folder or click the button below to resend.
            </p>
          </div>
          
          {resendMessage && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              resendMessage.includes('sent') 
                ? 'bg-green-500/10 text-green-600' 
                : 'bg-destructive/10 text-destructive'
            }`}>
              {resendMessage}
            </div>
          )}
          
          <div className="space-y-3">
            <Button
              onClick={handleResend}
              disabled={isResending}
              variant="outline"
              className="w-full h-12"
            >
              {isResending ? 'Sending...' : 'Resend verification email'}
            </Button>
            
            <Button
              onClick={() => router.push('/auth/login')}
              variant="ghost"
              className="w-full h-12"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
