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
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { acronymApi, type AcronymResult } from '@/lib/api';
import { Edit, MinusCircle } from 'lucide-react';

// ─── Acronym Form Schema ────────────────────────────────────────────────────

const acronymSchema = z.object({
  term: z.string().min(1, 'Term is required'),
  aliases: z.string(),
  fields: z.array(z.object({
    key: z.string().min(1, 'Key is required (e.g., en:tech:label)'),
    value: z.string().min(1, 'Value is required'),
  })).min(1, 'At least one field is required'),
});

type AcronymFormData = z.infer<typeof acronymSchema>;

type AcronymTableRow = AcronymResult & { _aliases?: string };

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
  const [acronyms, setAcronyms] = useState<AcronymTableRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingTerm, setEditingTerm] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<AcronymFormData>({
    resolver: zodResolver(acronymSchema),
    defaultValues: { term: '', aliases: '', fields: [{ key: '', value: '' }] },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'fields',
  });

  const fetchAcronyms = useCallback(async (query?: string) => {
    try {
      setIsLoading(true);
      const response = await acronymApi.search(query || '');
      setAcronyms(response.results || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load acronyms');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAcronyms();
  }, [fetchAcronyms]);

  const openCreateModal = () => {
    setEditingTerm(null);
    reset({ term: '', aliases: '', fields: [{ key: '', value: '' }] });
    setIsOpen(true);
  };

  const openEditModal = (acronym: AcronymTableRow) => {
    setEditingTerm(acronym.master_id);
    const fieldEntries = Object.entries(acronym.data).map(([key, value]) => ({
      key,
      value,
    }));
    reset({
      term: acronym.master_id,
      aliases: acronym._aliases || '',
      fields: fieldEntries.length > 0 ? fieldEntries : [{ key: '', value: '' }],
    });
    setIsOpen(true);
  };

  const onSubmit = async (data: AcronymFormData) => {
    try {
      setError('');
      setSuccess('');
      setIsSubmitting(true);

      const fieldsMap: Record<string, string> = {};
      for (const field of data.fields) {
        fieldsMap[field.key] = field.value;
      }

      const aliases = data.aliases
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean);

      await acronymAdminApi.upsert(data.term, { fields: fieldsMap, aliases });
      setSuccess(`Acronym "${data.term}" saved successfully`);
      setIsOpen(false);
      setEditingTerm(null);
      await fetchAcronyms(searchTerm || undefined);
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
      setSuccess('');
      setActionLoading(term);
      await acronymAdminApi.delete(term);
      setSuccess(`Acronym "${term}" deleted`);
      await fetchAcronyms(searchTerm || undefined);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete acronym');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    fetchAcronyms(value || undefined);
  };

  const renderDataPreview = (data: Record<string, string>) => {
    const entries = Object.entries(data).slice(0, 2);
    return (
      <div className="flex flex-col gap-0.5">
        {entries.map(([key, value]) => (
          <span key={key} className="text-xs truncate max-w-[250px]">
            <span className="text-muted">{key}:</span> {value}
          </span>
        ))}
        {Object.keys(data).length > 2 && (
          <span className="text-xs text-muted">+{Object.keys(data).length - 2} more</span>
        )}
      </div>
    );
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
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full h-9 pl-9 text-sm"
          />
        </div>

        <Button onPress={openCreateModal}>
          <Plus className="h-4 w-4" />
          Add Acronym
        </Button>
      </div>

      {/* Acronym Modal (Create / Edit) */}
      <Modal>
        {isOpen && (
          <Modal.Backdrop isOpen={isOpen} onOpenChange={setIsOpen} isDismissable>
            <Modal.Container>
              <Modal.Dialog>
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Heading>
                    {editingTerm ? `Edit "${editingTerm}"` : 'Add Acronym'}
                  </Modal.Heading>
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

                    <div className="flex flex-col gap-2">
                      <Label>Fields</Label>
                      {fields.map((field, index) => (
                        <div key={field.id} className="flex items-start gap-2">
                          <div className="flex-1 flex flex-col gap-2">
                            <TextField
                              isInvalid={!!errors.fields?.[index]?.key}
                              name={`fields.${index}.key`}
                            >
                              <Label className="text-xs">Key</Label>
                              <Input
                                {...register(`fields.${index}.key`)}
                                placeholder="en:tech:label"
                                disabled={isSubmitting}
                              />
                              {errors.fields?.[index]?.key && (
                                <FieldError>{errors.fields[index]?.key?.message}</FieldError>
                              )}
                            </TextField>
                            <TextField
                              isInvalid={!!errors.fields?.[index]?.value}
                              name={`fields.${index}.value`}
                            >
                              <Label className="text-xs">Value</Label>
                              <Input
                                {...register(`fields.${index}.value`)}
                                placeholder="Amazon Web Services"
                                disabled={isSubmitting}
                              />
                              {errors.fields?.[index]?.value && (
                                <FieldError>{errors.fields[index]?.value?.message}</FieldError>
                              )}
                            </TextField>
                          </div>
                          <Button
                            isIconOnly
                            variant="ghost"
                            size="sm"
                            className="mt-6 shrink-0"
                            onPress={() => remove(index)}
                            isDisabled={fields.length === 1 || isSubmitting}
                            aria-label="Remove field"
                          >
                            <MinusCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {errors.fields && (
                        <p className="text-xs text-danger">{errors.fields.message}</p>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onPress={() => append({ key: '', value: '' })}
                        isDisabled={isSubmitting}
                      >
                        <Plus className="h-3 w-3" />
                        Add Field
                      </Button>
                    </div>

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

      {/* Acronyms Table */}
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Acronyms table" className="min-w-[700px]">
            <Table.Header>
              <Table.Column isRowHeader>Term</Table.Column>
              <Table.Column>Aliases</Table.Column>
              <Table.Column>Data Preview</Table.Column>
              <Table.Column>Actions</Table.Column>
            </Table.Header>
            <Table.Body>
              {acronyms.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={4} className="text-center text-muted py-8">
                    No acronyms found
                  </Table.Cell>
                </Table.Row>
              ) : (
                acronyms.map((acronym) => (
                  <Table.Row key={acronym.master_id}>
                    <Table.Cell className="font-semibold">{acronym.master_id}</Table.Cell>
                    <Table.Cell className="text-sm text-muted max-w-[200px] truncate">
                      {acronym._aliases || '—'}
                    </Table.Cell>
                    <Table.Cell>
                      {renderDataPreview(acronym.data)}
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-1">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="ghost"
                          onPress={() => openEditModal(acronym)}
                          aria-label={`Edit ${acronym.master_id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="ghost"
                          isPending={actionLoading === acronym.master_id}
                          onPress={() => handleDelete(acronym.master_id)}
                          aria-label={`Delete ${acronym.master_id}`}
                        >
                          <Trash2 className="h-4 w-4 text-danger" />
                        </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </div>
  );
}
