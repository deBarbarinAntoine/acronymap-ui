"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { userApi, acronymAdminApi, type User as ApiUser } from '@/lib/api';
import {
  Table, Button, Modal, Input, Label, TextField, FieldError,
  Tabs, Spinner, Chip
} from '@heroui/react';
import {
  Users, BookOpen, Shield, ShieldOff, Trash2, Plus, Search, X
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ─── Acronym Form Schema ────────────────────────────────────────────────────

const acronymSchema = z.object({
  term: z.string().min(1, 'Term is required'),
  label: z.string().min(1, 'Label is required'),
  definition: z.string().min(1, 'Definition is required'),
  aliases: z.string(),
});

type AcronymFormData = z.infer<typeof acronymSchema>;

// ─── Dashboard Page ─────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted text-sm mt-1">Manage users and acronyms</p>
      </div>

      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
        className="w-full"
      >
        <Tabs.ListContainer>
          <Tabs.List aria-label="Dashboard tabs">
            <Tabs.Tab id="users">
              <Users className="h-4 w-4" />
              Users
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="acronyms">
              <BookOpen className="h-4 w-4" />
              Acronyms
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel id="users">
          <UserManagement />
        </Tabs.Panel>

        <Tabs.Panel id="acronyms">
          <AcronymManagement />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}

// ─── User Management Tab ────────────────────────────────────────────────────

function UserManagement() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await userApi.getAll();
      setUsers(response.users);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      setActionLoading(id);
      await userApi.toggleStatus(id, !currentStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, is_active: !currentStatus } : u))
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleRole = async (id: string, currentRole: string) => {
    try {
      setActionLoading(id);
      const user = users.find((u) => u.id === id);
      if (!user) return;
      await userApi.update(id, {
        email: user.email,
        profile: currentRole === 'admin' ? 'standard' : 'admin',
        is_active: user.is_active,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id
            ? { ...u, profile: currentRole === 'admin' ? 'standard' : 'admin' as 'standard' | 'admin' }
            : u
        )
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" color="accent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger-600 dark:bg-danger-900/20 dark:text-danger-400">
          {error}
          <button onClick={() => setError('')} className="ml-2 inline-block">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Users table" className="min-w-[600px]">
            <Table.Header>
              <Table.Column isRowHeader>Email</Table.Column>
              <Table.Column>Profile</Table.Column>
              <Table.Column>Status</Table.Column>
              <Table.Column>Created</Table.Column>
              <Table.Column>Actions</Table.Column>
            </Table.Header>
            <Table.Body>
              {users.map((user) => (
                <Table.Row key={user.id}>
                  <Table.Cell className="font-medium">{user.email}</Table.Cell>
                  <Table.Cell>
                    <Chip
                      size="sm"
                      color={user.profile === 'admin' ? 'accent' : 'default'}
                      variant="soft"
                    >
                      {user.profile}
                    </Chip>
                  </Table.Cell>
                  <Table.Cell>
                    <Chip
                      size="sm"
                      color={user.is_active ? 'success' : 'warning'}
                      variant="soft"
                    >
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Chip>
                  </Table.Cell>
                  <Table.Cell className="text-muted text-sm">
                    {new Date(user.created_at).toLocaleDateString()}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center gap-1">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        isPending={actionLoading === user.id}
                        onPress={() => toggleStatus(user.id, user.is_active)}
                        aria-label={user.is_active ? 'Deactivate user' : 'Activate user'}
                      >
                        {user.is_active ? (
                          <ShieldOff className="h-4 w-4" />
                        ) : (
                          <Shield className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        isPending={actionLoading === user.id}
                        onPress={() => toggleRole(user.id, user.profile)}
                        aria-label={user.profile === 'admin' ? 'Demote to standard' : 'Promote to admin'}
                      >
                        {user.profile === 'admin' ? (
                          <span className="text-xs font-bold">S</span>
                        ) : (
                          <span className="text-xs font-bold">A</span>
                        )}
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </div>
  );
}

// ─── Acronym Management Tab ─────────────────────────────────────────────────

function AcronymManagement() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AcronymFormData>({
    resolver: zodResolver(acronymSchema),
    defaultValues: { term: '', label: '', definition: '', aliases: '' },
  });

  const onSubmit = async (data: AcronymFormData) => {
    try {
      setError('');
      setSuccess('');
      setIsSubmitting(true);

      const fields: Record<string, string> = {
        'en:tech:label': data.label,
        'en:tech:def': data.definition,
      };

      const aliases = data.aliases
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean);

      await acronymAdminApi.upsert(data.term, { fields, aliases });
      setSuccess(`Acronym "${data.term}" saved successfully`);
      reset();
      setIsOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save acronym');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (term: string) => {
    if (!confirm(`Delete "${term}"? This cannot be undone.`)) return;
    try {
      setError('');
      await acronymAdminApi.delete(term);
      setSuccess(`Acronym "${term}" deleted`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete acronym');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger-600 dark:bg-danger-900/20 dark:text-danger-400">
          {error}
          <button onClick={() => setError('')} className="ml-2 inline-block">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-success-50 p-3 text-sm text-success-600 dark:bg-success-900/20 dark:text-success-400">
          {success}
          <button onClick={() => setSuccess('')} className="ml-2 inline-block">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <Input
            type="text"
            placeholder="Search acronyms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-9 text-sm"
          />
        </div>

        <Modal>
          <Button onPress={() => { reset(); setIsOpen(true); }}>
            <Plus className="h-4 w-4" />
            Add Acronym
          </Button>

          {isOpen && (
            <Modal.Backdrop isOpen={isOpen} onOpenChange={setIsOpen} isDismissable>
              <Modal.Container>
                <Modal.Dialog>
                  <Modal.CloseTrigger />
                  <Modal.Header>
                    <Modal.Heading>Add / Edit Acronym</Modal.Heading>
                  </Modal.Header>
                  <Modal.Body>
                    <form
                      id="acronym-form"
                      onSubmit={handleSubmit(onSubmit)}
                      className="flex flex-col gap-4"
                    >
                      <TextField isInvalid={!!errors.term} name="term">
                        <Label>Term</Label>
                        <Input
                          {...register('term')}
                          placeholder="e.g., AWS"
                          disabled={isSubmitting}
                        />
                        {errors.term && <FieldError>{errors.term.message}</FieldError>}
                      </TextField>

                      <TextField isInvalid={!!errors.label} name="label">
                        <Label>Label</Label>
                        <Input
                          {...register('label')}
                          placeholder="e.g., Amazon Web Services"
                          disabled={isSubmitting}
                        />
                        {errors.label && <FieldError>{errors.label.message}</FieldError>}
                      </TextField>

                      <TextField isInvalid={!!errors.definition} name="definition">
                        <Label>Definition</Label>
                        <Input
                          {...register('definition')}
                          placeholder="Full description of the acronym"
                          disabled={isSubmitting}
                        />
                        {errors.definition && <FieldError>{errors.definition.message}</FieldError>}
                      </TextField>

                      <TextField isInvalid={!!errors.aliases} name="aliases">
                        <Label>Aliases</Label>
                        <Input
                          {...register('aliases')}
                          placeholder="Comma-separated (e.g., AMAZON WEB SERVICES)"
                          disabled={isSubmitting}
                        />
                        {errors.aliases && <FieldError>{errors.aliases.message}</FieldError>}
                      </TextField>
                    </form>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" slot="close">
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      form="acronym-form"
                      isPending={isSubmitting}
                      isDisabled={isSubmitting}
                    >
                      {isSubmitting ? 'Saving...' : 'Save'}
                    </Button>
                  </Modal.Footer>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          )}
        </Modal>
      </div>

      <p className="text-sm text-muted">
        Use the search on the home page to find acronyms, then manage them here.
      </p>
    </div>
  );
}
