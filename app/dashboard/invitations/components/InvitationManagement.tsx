'use client';

import { useState } from 'react';
import { InvitationWithDetails } from '@/lib/db/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  UserCircle, 
  Baby, 
  Calendar, 
  Clock, 
  MessageCircle, 
  Mail, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

interface InvitationManagementProps {
  sentInvitations: InvitationWithDetails[];
  receivedInvitations: InvitationWithDetails[];
}

export function InvitationManagement({ 
  sentInvitations, 
  receivedInvitations 
}: InvitationManagementProps) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={colors[status as keyof typeof colors] || colors.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      parent: 'bg-blue-100 text-blue-800',
      guardian: 'bg-green-100 text-green-800',
      caregiver: 'bg-purple-100 text-purple-800'
    };
    
    return (
      <Badge className={colors[role as keyof typeof colors] || colors.caregiver}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  const copyInvitationLink = (token: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Invitation link copied to clipboard!');
  };

  const handleCancelInvitation = async (invitationId: string) => {
    setCancellingId(invitationId);
    
    try {
      const response = await fetch('/api/invitations/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invitationId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to cancel invitation');
    } finally {
      setCancellingId(null);
    }
  };

  const SentInvitationsTab = () => (
    <div className="space-y-4">
      {sentInvitations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No invitations sent yet</p>
          </CardContent>
        </Card>
      ) : (
        sentInvitations.map((invitation) => (
          <Card key={invitation.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(invitation.status)}
                  <CardTitle className="text-lg">
                    Invitation to {invitation.inviteeEmail}
                  </CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(invitation.status)}
                  {getRoleBadge(invitation.inviteeRole)}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Baby className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Child</p>
                    <p className="text-sm text-gray-600">{invitation.child.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Sent</p>
                    <p className="text-sm text-gray-600">{formatDate(invitation.createdAt)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Expires</p>
                    <p className="text-sm text-gray-600">{formatDate(invitation.expiresAt)}</p>
                  </div>
                </div>
                
                {invitation.acceptedAt && (
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Accepted</p>
                      <p className="text-sm text-gray-600">{formatDate(invitation.acceptedAt)}</p>
                    </div>
                  </div>
                )}
              </div>

              {invitation.personalMessage && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <MessageCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Personal Message</p>
                      <p className="text-sm text-blue-800">{invitation.personalMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2 pt-2">
                {invitation.status === 'pending' && (
                  <>
                    <Button
                      onClick={() => copyInvitationLink(invitation.token)}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Copy className="h-4 w-4" />
                      <span>Copy Link</span>
                    </Button>
                    <Button
                      onClick={() => handleCancelInvitation(invitation.id)}
                      disabled={cancellingId === invitation.id}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>{cancellingId === invitation.id ? 'Cancelling...' : 'Cancel'}</span>
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  const ReceivedInvitationsTab = () => (
    <div className="space-y-4">
      {receivedInvitations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No invitations received</p>
          </CardContent>
        </Card>
      ) : (
        receivedInvitations.map((invitation) => (
          <Card key={invitation.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(invitation.status)}
                  <CardTitle className="text-lg">
                    Invitation from {invitation.inviter.fullName}
                  </CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(invitation.status)}
                  {getRoleBadge(invitation.inviteeRole)}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <UserCircle className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">From</p>
                    <p className="text-sm text-gray-600">{invitation.inviter.fullName}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Baby className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Child</p>
                    <p className="text-sm text-gray-600">{invitation.child.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Received</p>
                    <p className="text-sm text-gray-600">{formatDate(invitation.createdAt)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Expires</p>
                    <p className="text-sm text-gray-600">{formatDate(invitation.expiresAt)}</p>
                  </div>
                </div>
              </div>

              {invitation.personalMessage && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <MessageCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Personal Message</p>
                      <p className="text-sm text-blue-800">{invitation.personalMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              {invitation.status === 'pending' && new Date() < invitation.expiresAt && (
                <div className="flex items-center space-x-2 pt-2">
                  <Button
                    onClick={() => window.location.href = `/invite/${invitation.token}`}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    View Invitation
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <Tabs defaultValue="sent" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="sent">
          Sent ({sentInvitations.length})
        </TabsTrigger>
        <TabsTrigger value="received">
          Received ({receivedInvitations.length})
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="sent" className="mt-6">
        <SentInvitationsTab />
      </TabsContent>
      
      <TabsContent value="received" className="mt-6">
        <ReceivedInvitationsTab />
      </TabsContent>
    </Tabs>
  );
}