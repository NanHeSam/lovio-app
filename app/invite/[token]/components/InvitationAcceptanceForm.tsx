'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InvitationWithDetails } from '@/lib/db/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCircle, Baby, Calendar, Clock, MessageCircle } from 'lucide-react';

interface InvitationAcceptanceFormProps {
  invitation: InvitationWithDetails;
  userId: string;
}

export function InvitationAcceptanceForm({ invitation, userId }: InvitationAcceptanceFormProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  const handleAccept = async () => {
    setIsAccepting(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: invitation.token,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to accept invitation. Please try again.' });
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/invitations/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: invitation.token,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Invitation declined successfully.' });
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to decline invitation. Please try again.' });
    } finally {
      setIsRejecting(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'parent':
        return 'bg-blue-100 text-blue-800';
      case 'guardian':
        return 'bg-green-100 text-green-800';
      case 'caregiver':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatExpirationDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-gray-900">
          You're Invited!
        </CardTitle>
        <CardDescription className="text-base">
          {invitation.inviter.fullName} has invited you to help care for their child
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Invitation Details */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <UserCircle className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">From</p>
              <p className="text-sm text-gray-600">{invitation.inviter.fullName}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Baby className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Child</p>
              <p className="text-sm text-gray-600">{invitation.child.name}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="h-5 w-5 flex items-center justify-center">
              <Badge className={getRoleBadgeColor(invitation.inviteeRole)}>
                {invitation.inviteeRole}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Role</p>
              <p className="text-sm text-gray-600 capitalize">{invitation.inviteeRole}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Expires</p>
              <p className="text-sm text-gray-600">{formatExpirationDate(invitation.expiresAt)}</p>
            </div>
          </div>
        </div>

        {/* Personal Message */}
        {invitation.personalMessage && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <MessageCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Personal Message</p>
                <p className="text-sm text-blue-800 mt-1">{invitation.personalMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <p className={`text-sm font-medium ${
              message.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {message.text}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            onClick={handleAccept}
            disabled={isAccepting || isRejecting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isAccepting ? 'Accepting...' : 'Accept Invitation'}
          </Button>
          <Button
            onClick={handleReject}
            disabled={isAccepting || isRejecting}
            variant="outline"
            className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {isRejecting ? 'Declining...' : 'Decline'}
          </Button>
        </div>

        {/* Terms */}
        <div className="text-xs text-gray-500 text-center pt-4 border-t">
          <p>
            By accepting this invitation, you agree to help care for {invitation.child.name} 
            and will have access to their activity tracking and information.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}