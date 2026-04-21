/**
 * Admin Templates Management Page
 * 
 * Manage design templates for predesigned products
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import Link from 'next/link';
import Image from 'next/image';

interface DesignTemplate {
  id: string;
  name: string;
  description: string | null;
  image_url: string;
  thumbnail_url: string | null;
  category: string | null;
  tags: string[] | null;
  usage_count: number;
  is_template: boolean;
  is_public: boolean;
  is_active: boolean;
  created_at: string;
  user_id: string | null;
}

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<DesignTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DesignTemplate | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');

  // Filter state
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const categories = [
    'abstract',
    'nature',
    'artistic',
    'minimal',
    'trendy',
    'geometric',
    'floral',
    'vintage',
    'modern',
    'seasonal'
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/designs/templates');
      const data = await res.json();
      
      if (res.ok) {
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setCategory('');
    setTags('');
    setIsPublic(true);
    setIsActive(true);
    setError('');
    setEditingTemplate(null);
    setShowForm(false);
  };

  const handleEdit = (template: DesignTemplate) => {
    setEditingTemplate(template);
    setName(template.name);
    setDescription(template.description || '');
    setCategory(template.category || '');
    setTags(template.tags?.join(', ') || '');
    setIsPublic(template.is_public);
    setIsActive(template.is_active);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Template name is required');
      return;
    }
    
    if (!editingTemplate) {
      setError('Can only edit existing templates. Upload new designs at /designs/create');
      return;
    }
    
    setFormLoading(true);
    setError('');
    
    try {
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      
      const res = await fetch(`/api/designs/${editingTemplate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          category: category.trim() || null,
          tags: tagsArray.length > 0 ? tagsArray : null,
          is_public: isPublic,
          is_active: isActive,
          is_template: true, // Always keep as template
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update template');
      }
      
      await fetchTemplates();
      resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const toggleTemplate = async (id: string, currentValue: boolean) => {
    try {
      const res = await fetch(`/api/designs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_template: !currentValue }),
      });
      
      if (res.ok) {
        await fetchTemplates();
      }
    } catch (error) {
      console.error('Error toggling template status:', error);
    }
  };

  const toggleActive = async (id: string, currentValue: boolean) => {
    try {
      const res = await fetch(`/api/designs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentValue }),
      });
      
      if (res.ok) {
        await fetchTemplates();
      }
    } catch (error) {
      console.error('Error toggling active status:', error);
    }
  };

  const deleteTemplate = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will affect any predesigned products using this template.`)) {
      return;
    }
    
    try {
      const res = await fetch(`/api/designs/${id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        await fetchTemplates();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(search.toLowerCase()) ||
                         template.description?.toLowerCase().includes(search.toLowerCase()) ||
                         template.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    
    const matchesCategory = !filterCategory || template.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Design Templates</h1>
              <p className="text-sm text-gray-600 mt-1">Manage design templates for predesigned products</p>
            </div>
            <div className="flex space-x-2">
              <Link href="/admin">
                <Button variant="outline" size="sm">Back to Admin</Button>
              </Link>
              <Link href="/designs/create">
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                  ➕ Upload New Design
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 sm:px-6 max-w-7xl mx-auto">
        {/* Edit Form */}
        {showForm && editingTemplate && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Edit Template: {editingTemplate.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Template Name */}
                  <div>
                    <Label htmlFor="name">Template Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Sunset Gradient, Floral Pattern"
                      className="h-11"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full h-11 px-3 rounded-lg border border-input bg-transparent"
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe this design template..."
                    rows={3}
                  />
                </div>

                {/* Tags */}
                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="e.g., sunset, gradient, warm, orange"
                    className="h-11"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Separate tags with commas for better searchability
                  </p>
                </div>

                {/* Checkboxes */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">🌍 Public (visible to all users)</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">✓ Active (available for use)</span>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={formLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={formLoading}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {formLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Updating...
                      </>
                    ) : (
                      'Update Template'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <Input
                  placeholder="Search templates by name, description, or tags..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11"
                />
              </div>
              
              {/* Category Filter */}
              <div className="sm:w-48">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-input bg-transparent"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-gray-600">Loading templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">🎨</div>
              <h3 className="text-lg font-semibold mb-2">No Design Templates</h3>
              <p className="text-gray-600 mb-6">
                Upload designs and mark them as templates to get started
              </p>
              <div className="space-y-3">
                <Link href="/designs/create">
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    ➕ Upload First Design
                  </Button>
                </Link>
                <div className="text-sm text-gray-500">
                  After uploading, mark designs as templates in the database or edit them here
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="overflow-hidden">
                {/* Template Image */}
                <div className="relative h-48 bg-gray-100">
                  <Image
                    src={template.thumbnail_url || template.image_url}
                    alt={template.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    {!template.is_active && (
                      <div className="bg-gray-800 text-white px-2 py-1 rounded text-xs font-semibold">
                        Inactive
                      </div>
                    )}
                    {!template.is_template && (
                      <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
                        Not Template
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <div className="bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
                      Used {template.usage_count} times
                    </div>
                  </div>
                </div>

                {/* Template Info */}
                <CardContent className="p-4">
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">{template.name}</h3>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    {template.category && (
                      <div>
                        <span className="font-semibold">Category:</span> {template.category}
                      </div>
                    )}
                    {template.tags && template.tags.length > 0 && (
                      <div>
                        <span className="font-semibold">Tags:</span>{' '}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {template.tags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                          {template.tags.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{template.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {template.description && (
                      <p className="text-xs line-clamp-2">{template.description}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={template.is_template ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleTemplate(template.id, template.is_template)}
                        className="text-xs"
                      >
                        {template.is_template ? '🖼️ Template' : 'Make Template'}
                      </Button>
                      <Button
                        variant={template.is_active ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleActive(template.id, template.is_active)}
                        className="text-xs"
                      >
                        {template.is_active ? '✓ Active' : 'Activate'}
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(template)}
                        className="text-xs"
                      >
                        ✏️ Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteTemplate(template.id, template.name)}
                        className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        🗑️ Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Instructions */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                📋 How to Create Templates
              </h3>
              <ol className="text-blue-800 text-sm space-y-1 list-decimal list-inside">
                <li>Upload designs at <Link href="/designs/create" className="underline">/designs/create</Link></li>
                <li>Mark them as templates using the toggle buttons above</li>
                <li>Set categories and tags for better organization</li>
                <li>Use templates in <Link href="/admin/predesigned/create" className="underline">predesigned products</Link></li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}