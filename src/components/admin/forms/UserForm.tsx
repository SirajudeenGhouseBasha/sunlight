/**
 * UserForm Component
 *
 * Form for creating and editing users.
 * Requirements: 20.1–20.7, 21.1–21.5 - User form specifications
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Select } from '@/src/components/ui/select';

// User type
export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: 'user' | 'admin';
  is_active?: boolean;
  last_login?: string;
  created_at: string;
}

// Form data type
interface UserFormData {
  email: string;
  full_name?: string;
  role: 'user' | 'admin';
  password?: string;
}

export interface UserFormProps {
  user?: User | null;
  onSave: (data: UserFormData) => void | Promise<void>;
  onCancel: () => void;
}

export function UserForm({ user, onSave, onCancel }: UserFormProps) {
  const [formData, setFormData] = useState<UserFormData>({
    email: user?.email || '',
    full_name: user?.full_name || '',
    role: user?.role || 'user',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!user && !formData.password) {
      newErrors.password = 'Password is required for new users';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof UserFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field as string]) {
      setErrors((prev) => ({ ...prev, [field as string]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email */}
      <div>
        <Label htmlFor="email">
          Email <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="user@example.com"
          className={errors.email ? 'border-red-500' : ''}
          disabled={isSubmitting}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{errors.email}</p>
        )}
      </div>

      {/* Full Name */}
      <div>
        <Label htmlFor="full_name">Full Name</Label>
        <Input
          id="full_name"
          type="text"
          value={formData.full_name || ''}
          onChange={(e) => handleChange('full_name', e.target.value)}
          placeholder="John Doe"
          disabled={isSubmitting}
        />
      </div>

      {/* Role */}
      <div>
        <Label htmlFor="role">
          Role <span className="text-red-500">*</span>
        </Label>
        <Select
          id="role"
          value={formData.role}
          onChange={(e) =>
            handleChange('role', e.target.value as 'user' | 'admin')
          }
          disabled={isSubmitting}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </Select>
      </div>

      {/* Password (only for create) */}
      {!user && (
        <div>
          <Label htmlFor="password">
            Password <span className="text-red-500">*</span>
          </Label>
          <Input
            id="password"
            type="password"
            value={formData.password || ''}
            onChange={(e) => handleChange('password', e.target.value)}
            placeholder="Enter password"
            className={errors.password ? 'border-red-500' : ''}
            disabled={isSubmitting}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password}</p>
          )}
        </div>
      )}

      {/* Form actions */}
      <div className="flex items-center justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : user ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
