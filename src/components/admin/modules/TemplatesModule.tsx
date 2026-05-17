/**
 * TemplatesModule Component
 * 
 * Templates management module with CRUD operations
 * Requirements: 17.1-17.10 - Templates module specifications
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';
import { Modal } from '@/src/components/admin/shared/Modal';
import { DataTable } from '@/src/components/admin/shared/DataTable';
import { Pagination } from '@/src/components/admin/shared/Pagination';
import { SearchBar } from '@/src/components/admin/shared/SearchBar';
import { TemplateForm } from '@/src/components/admin/forms/TemplateForm';
import { useToast } from '@/src/components/admin/shared/Toast';

// Template type
export interface Template {
  id: string;
  name: string;
  category: string;
  thumbnail_url?: string;
  is_featured: boolean;
  created_at: string;
}

// API response type
interface TemplatesResponse {
  templates: Template[];
}

export function TemplatesModule() {
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [totalItems, setTotalItems] = useState(0);

  // Fetch templates
  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/designs/templates`);
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      const data: TemplatesResponse = await response.json();
      // Filter and paginate client-side since API doesn't support pagination
      let filtered = data.templates;
      
      if (searchQuery) {
        filtered = filtered.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
      }
      
      if (categoryFilter) {
        filtered = filtered.filter(t => t.category === categoryFilter);
      }
      
      if (featuredFilter !== 'all') {
        filtered = filtered.filter(t => (featuredFilter === 'yes') === t.is_featured);
      }
      
      setTotalItems(filtered.length);
      const start = (currentPage - 1) * pageSize;
      setTemplates(filtered.slice(start, start + pageSize));
    } catch (error) {
      console.error('Error fetching templates:', error);
      showToast('Failed to load templates', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, featuredFilter]);

  useEffect(() => {
    fetchTemplates();
  }, [currentPage, pageSize, searchQuery, categoryFilter, featuredFilter]);

  // Handle create/edit template
  const handleSaveTemplate = async (templateData: Omit<Template, 'id' | 'created_at'>) => {
    try {
      const url = editingTemplate ? `/api/designs/templates/${editingTemplate.id}` : '/api/designs/templates';
      const method = editingTemplate ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        throw new Error('Failed to save template');
      }

      const savedTemplate: Template = await response.json();
      
      if (editingTemplate) {
        setTemplates(templates.map(t => t.id === editingTemplate.id ? savedTemplate : t));
        showToast('Template updated successfully', 'success');
      } else {
        setTemplates([...templates, savedTemplate]);
        showToast('Template created successfully', 'success');
      }

      setIsModalOpen(false);
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      showToast('Failed to save template', 'error');
    }
  };

  // Handle delete template
  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/designs/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      setTemplates(templates.filter(t => t.id !== templateId));
      showToast('Template deleted successfully', 'success');
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      showToast('Failed to delete template', 'error');
    }
  };

  // Show delete confirmation
  const showDeleteConfirmation = (templateId: string, templateName: string) => {
    if (window.confirm(`Are you sure you want to delete "${templateName}"?`)) {
      handleDeleteTemplate(templateId);
    }
  };

  // Columns for DataTable
  const columns = [
    {
      key: 'thumbnail_url',
      label: 'Thumbnail',
      render: (value: string) => (
        value ? (
          <img
            src={value}
            alt="Template"
            className="w-12 h-12 rounded object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
            <span className="text-sm text-gray-500">No image</span>
          </div>
        )
      ),
    },
    {
      key: 'name',
      label: 'Template Name',
    },
    {
      key: 'category',
      label: 'Category',
    },
    {
      key: 'is_featured',
      label: 'Featured',
      render: (value: boolean) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created Date',
      render: (value: string) => {
        const date = new Date(value);
        return date.toLocaleDateString();
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search templates by name..." />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-44 rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:border-green-500"
          >
            <option value="">All Categories</option>
            {[...new Set(templates.map(t => t.category))].map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={featuredFilter}
            onChange={(e) => setFeaturedFilter(e.target.value as 'all' | 'yes' | 'no')}
            className="w-full sm:w-44 rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:border-green-500"
          >
            <option value="all">All Featured</option>
            <option value="yes">Featured</option>
            <option value="no">Not Featured</option>
          </select>
        </div>
        <button
          onClick={() => { setEditingTemplate(null); setIsModalOpen(true); }}
          className="w-full sm:w-auto sm:self-end inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors"
        >
          <span>+</span> Add Template
        </button>
      </div>

      {/* Templates table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <DataTable
          columns={columns}
          data={templates}
          isLoading={isLoading}
          isEmpty={templates.length === 0}
          emptyMessage="No templates found"
          actions={true}
          onEdit={(template) => { setEditingTemplate(template); setIsModalOpen(true); }}
          onDelete={(template) => showDeleteConfirmation(template.id, template.name)}
        />

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalItems / pageSize)}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Modal for create/edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTemplate(null); }}
        title={editingTemplate ? 'Edit Template' : 'Add Template'}
        size="md"
      >
        <TemplateForm
          template={editingTemplate}
          onSave={handleSaveTemplate}
          onCancel={() => { setIsModalOpen(false); setEditingTemplate(null); }}
        />
      </Modal>
    </div>
  );
}