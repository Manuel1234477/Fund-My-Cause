'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2, Plus, Copy, Check, X, Clock, Shield } from 'lucide-react';

interface TeamMember {
  address: string;
  role: 'Owner' | 'Admin' | 'Editor' | 'Viewer' | 'Contributor';
  addedAt: number;
  expiresAt: number;
  isActive: boolean;
}

interface PendingInvitation {
  code: string;
  invitee: string;
  role: 'Owner' | 'Admin' | 'Editor' | 'Viewer' | 'Contributor';
  createdAt: number;
  expiresAt: number;
  accepted: boolean;
}

interface RoleDelegate {
  delegator: string;
  delegatee: string;
  role: 'Owner' | 'Admin' | 'Editor' | 'Viewer' | 'Contributor';
  expiresAt: number;
  isActive: boolean;
}

interface TeamManagementProps {
  campaignId: string;
  currentUserAddress: string;
  onTeamUpdate?: () => void;
}

const ROLE_PERMISSIONS = {
  Owner: [
    'Create Campaign',
    'Edit Metadata',
    'Manage Team',
    'Withdraw Funds',
    'Approve Contributions',
    'Update Status',
    'Configure Settings',
    'Manage Delegations',
    'Multi-Sig',
    'View Analytics',
  ],
  Admin: [
    'Edit Metadata',
    'Manage Team',
    'Approve Contributions',
    'Update Status',
    'Configure Settings',
    'Multi-Sig',
    'View Analytics',
  ],
  Editor: ['Edit Metadata', 'View Analytics'],
  Viewer: ['View Analytics'],
  Contributor: ['View Analytics', 'Approve Contributions'],
};

const ROLE_COLORS = {
  Owner: 'bg-red-100 text-red-800',
  Admin: 'bg-blue-100 text-blue-800',
  Editor: 'bg-green-100 text-green-800',
  Viewer: 'bg-gray-100 text-gray-800',
  Contributor: 'bg-yellow-100 text-yellow-800',
};

export function TeamManagement({
  campaignId,
  currentUserAddress,
  onTeamUpdate,
}: TeamManagementProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [delegations, setDelegations] = useState<RoleDelegate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('Viewer');
  const [delegateAddress, setDelegateAddress] = useState('');
  const [delegateRole, setDelegateRole] = useState<string>('Editor');
  const [delegateDuration, setDelegateDuration] = useState<string>('7');

  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [memberToRevokeDelegation, setMemberToRevokeDelegation] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Fetch team data
  useEffect(() => {
    fetchTeamData();
  }, [campaignId]);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      // This will be replaced with actual API call
      const mockMembers: TeamMember[] = [
        {
          address: currentUserAddress,
          role: 'Owner',
          addedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
          expiresAt: 0,
          isActive: true,
        },
      ];
      setTeamMembers(mockMembers);
      setPendingInvitations([]);
      setDelegations([]);
      setError(null);
    } catch (err) {
      setError('Failed to load team data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      setError('Email cannot be empty');
      return;
    }

    try {
      // This will be replaced with actual API call
      const newInvitation: PendingInvitation = {
        code: `inv_${Math.random().toString(36).substr(2, 9)}`,
        invitee: inviteEmail,
        role: inviteRole as any,
        createdAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        accepted: false,
      };

      setPendingInvitations([...pendingInvitations, newInvitation]);
      setInviteEmail('');
      setSuccessMessage(`Invitation sent to ${inviteEmail}`);
      setTimeout(() => setSuccessMessage(null), 3000);
      onTeamUpdate?.();
    } catch (err) {
      setError('Failed to send invitation');
      console.error(err);
    }
  };

  const handleRemoveMember = async (address: string) => {
    try {
      setTeamMembers(teamMembers.filter((m) => m.address !== address));
      setMemberToRemove(null);
      setSuccessMessage('Member removed successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      onTeamUpdate?.();
    } catch (err) {
      setError('Failed to remove member');
      console.error(err);
    }
  };

  const handleCreateDelegation = async () => {
    if (!delegateAddress.trim()) {
      setError('Address cannot be empty');
      return;
    }

    try {
      const expiresAt = Date.now() + parseInt(delegateDuration) * 24 * 60 * 60 * 1000;
      const newDelegation: RoleDelegate = {
        delegator: currentUserAddress,
        delegatee: delegateAddress,
        role: delegateRole as any,
        expiresAt,
        isActive: true,
      };

      setDelegations([...delegations, newDelegation]);
      setDelegateAddress('');
      setSuccessMessage('Delegation created successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      onTeamUpdate?.();
    } catch (err) {
      setError('Failed to create delegation');
      console.error(err);
    }
  };

  const handleRevokeDelegation = async (delegatee: string) => {
    try {
      setDelegations(delegations.filter((d) => d.delegatee !== delegatee));
      setMemberToRevokeDelegation(null);
      setSuccessMessage('Delegation revoked successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      onTeamUpdate?.();
    } catch (err) {
      setError('Failed to revoke delegation');
      console.error(err);
    }
  };

  const copyInvitationCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getDaysRemaining = (expiresAt: number) => {
    if (expiresAt === 0) return null;
    const days = Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000));
    return Math.max(0, days);
  };

  const isOwner = teamMembers.some(
    (m) => m.address === currentUserAddress && m.role === 'Owner'
  );
  const isAdmin = isOwner || teamMembers.some((m) => m.address === currentUserAddress && m.role === 'Admin');

  if (loading) {
    return <div className="flex justify-center p-4">Loading team data...</div>;
  }

  return (
    <div className="w-full space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="members">
            Team Members ({teamMembers.length})
          </TabsTrigger>
          <TabsTrigger value="invitations">
            Invitations ({pendingInvitations.length})
          </TabsTrigger>
          <TabsTrigger value="delegations">
            Delegations ({delegations.length})
          </TabsTrigger>
        </TabsList>

        {/* Team Members Tab */}
        <TabsContent value="members" className="space-y-4">
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Invite Team Member</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Input
                    placeholder="Email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {!isOwner ? (
                        <SelectItem value="Viewer">Viewer</SelectItem>
                      ) : (
                        <>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Editor">Editor</SelectItem>
                          <SelectItem value="Viewer">Viewer</SelectItem>
                          <SelectItem value="Contributor">Contributor</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleInviteMember} className="md:col-span-2">
                    <Plus className="w-4 h-4 mr-2" />
                    Send Invitation
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Current Team</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div
                    key={member.address}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {member.address.slice(0, 6)}...{member.address.slice(-4)}
                        </code>
                        <Badge className={ROLE_COLORS[member.role]}>
                          {member.role}
                        </Badge>
                        {!member.isActive && <Badge variant="outline">Inactive</Badge>}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Added {formatDate(member.addedAt)}
                        {member.expiresAt > 0 && (
                          <>
                            {' '}
                            • Expires {formatDate(member.expiresAt)}
                          </>
                        )}
                      </p>
                    </div>
                    {isAdmin && member.address !== currentUserAddress && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMemberToRemove(member.address)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingInvitations.length === 0 ? (
                <p className="text-gray-500">No pending invitations</p>
              ) : (
                <div className="space-y-3">
                  {pendingInvitations.map((invitation) => {
                    const daysRemaining = getDaysRemaining(invitation.expiresAt);
                    return (
                      <div
                        key={invitation.code}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{invitation.invitee}</p>
                            <Badge className={ROLE_COLORS[invitation.role]}>
                              {invitation.role}
                            </Badge>
                            {invitation.accepted && (
                              <Badge variant="outline" className="bg-green-50">
                                <Check className="w-3 h-3 mr-1" />
                                Accepted
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {daysRemaining && daysRemaining > 0
                              ? `Expires in ${daysRemaining} days`
                              : 'Expired'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded max-w-xs truncate">
                            {invitation.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyInvitationCode(invitation.code)}
                          >
                            {copiedCode === invitation.code ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delegations Tab */}
        <TabsContent value="delegations" className="space-y-4">
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Create Delegation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Input
                    placeholder="Delegatee address"
                    value={delegateAddress}
                    onChange={(e) => setDelegateAddress(e.target.value)}
                  />
                  <Select value={delegateRole} onValueChange={setDelegateRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Editor">Editor</SelectItem>
                      <SelectItem value="Viewer">Viewer</SelectItem>
                      <SelectItem value="Contributor">Contributor</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={delegateDuration} onValueChange={setDelegateDuration}>
                    <SelectTrigger>
                      <SelectValue placeholder="Duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleCreateDelegation}>
                    <Shield className="w-4 h-4 mr-2" />
                    Delegate
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Active Delegations</CardTitle>
            </CardHeader>
            <CardContent>
              {delegations.length === 0 ? (
                <p className="text-gray-500">No active delegations</p>
              ) : (
                <div className="space-y-3">
                  {delegations.map((delegation) => {
                    const daysRemaining = getDaysRemaining(delegation.expiresAt);
                    return (
                      <div
                        key={`${delegation.delegatee}`}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-blue-600" />
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                              {delegation.delegatee.slice(0, 6)}...
                              {delegation.delegatee.slice(-4)}
                            </code>
                            <Badge className={ROLE_COLORS[delegation.role]}>
                              {delegation.role}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Delegated by:{' '}
                            <code className="bg-gray-100 px-1 rounded">
                              {delegation.delegator.slice(0, 6)}...
                              {delegation.delegator.slice(-4)}
                            </code>
                            {daysRemaining && daysRemaining > 0
                              ? ` • Expires in ${daysRemaining} days`
                              : ' • Expired'}
                          </p>
                        </div>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMemberToRevokeDelegation(delegation.delegatee)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Permissions Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(ROLE_PERMISSIONS).map(([role, permissions]) => (
              <div key={role} className="space-y-2">
                <h3 className={`font-semibold p-2 rounded ${ROLE_COLORS[role as keyof typeof ROLE_COLORS]}`}>
                  {role}
                </h3>
                <ul className="text-sm space-y-1 ml-2">
                  {permissions.map((perm) => (
                    <li key={perm} className="flex items-start">
                      <Check className="w-3 h-3 mr-2 mt-0.5 flex-shrink-0 text-green-600" />
                      {perm}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alert Dialogs */}
      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove this team member? They will no longer have access to this campaign.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => memberToRemove && handleRemoveMember(memberToRemove)}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!memberToRevokeDelegation} onOpenChange={(open) => !open && setMemberToRevokeDelegation(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Revoke Delegation</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to revoke this delegation? The delegatee will lose their delegated permissions.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => memberToRevokeDelegation && handleRevokeDelegation(memberToRevokeDelegation)}
              className="bg-red-600 hover:bg-red-700"
            >
              Revoke
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
