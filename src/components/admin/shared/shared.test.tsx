/**
 * Shared Components Test Suite
 * 
 * Tests for all shared admin components to verify they meet acceptance criteria
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DataTable, type DataTableColumn } from './DataTable';
import { Pagination } from './Pagination';
import { Modal } from './Modal';
import { SearchBar } from './SearchBar';
import { EmptyState } from './EmptyState';
import { LoadingState } from './LoadingState';

// ============================================================================
// DataTable Component Tests
// ============================================================================

describe('DataTable Component', () => {
  interface TestData {
    id: string;
    name: string;
    email: string;
    status: string;
  }

  const mockData: TestData[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com', status: 'active' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' },
  ];

  const mockColumns: DataTableColumn<TestData>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status' },
  ];

  it('should display data with configurable columns', () => {
    render(
      <DataTable<TestData>
        columns={mockColumns}
        data={mockData}
      />
    );

    // Check headers
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();

    // Check data
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('should display serial number column when enabled', () => {
    render(
      <DataTable<TestData>
        columns={mockColumns}
        data={mockData}
        serialNumber={true}
      />
    );

    expect(screen.getByText('S.No')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should render table headers with green background', () => {
    const { container } = render(
      <DataTable<TestData>
        columns={mockColumns}
        data={mockData}
      />
    );

    const thead = container.querySelector('thead tr');
    expect(thead).toHaveClass('bg-green-600', 'text-white');
  });

  it('should display loading state when isLoading is true', () => {
    const { container } = render(
      <DataTable<TestData>
        columns={mockColumns}
        data={[]}
        isLoading={true}
      />
    );

    // Check for skeleton loaders
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should display empty state when data is empty', () => {
    render(
      <DataTable<TestData>
        columns={mockColumns}
        data={[]}
        isEmpty={true}
        emptyMessage="No data available"
      />
    );

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('should render custom content for columns with render function', () => {
    const customColumns: DataTableColumn<TestData>[] = [
      {
        key: 'name',
        label: 'Name',
        render: (value) => <strong>{value}</strong>,
      },
      { key: 'email', label: 'Email' },
    ];

    const { container } = render(
      <DataTable<TestData>
        columns={customColumns}
        data={mockData}
      />
    );

    const strongElements = container.querySelectorAll('strong');
    expect(strongElements.length).toBeGreaterThan(0);
  });

  it('should display N/A for null or undefined values', () => {
    const dataWithNull: TestData[] = [
      { id: '1', name: 'John Doe', email: null as any, status: 'active' },
    ];

    render(
      <DataTable<TestData>
        columns={mockColumns}
        data={dataWithNull}
      />
    );

    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('should render Actions column when actions are enabled', () => {
    render(
      <DataTable<TestData>
        columns={mockColumns}
        data={mockData}
        actions={true}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getAllByText('Edit').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Delete').length).toBeGreaterThan(0);
  });

  it('should call onEdit when Edit button is clicked', async () => {
    const onEdit = vi.fn();
    render(
      <DataTable<TestData>
        columns={mockColumns}
        data={mockData}
        actions={true}
        onEdit={onEdit}
      />
    );

    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    expect(onEdit).toHaveBeenCalledWith(mockData[0], 0);
  });

  it('should call onDelete when Delete button is clicked', async () => {
    const onDelete = vi.fn();
    render(
      <DataTable<TestData>
        columns={mockColumns}
        data={mockData}
        actions={true}
        onDelete={onDelete}
      />
    );

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    expect(onDelete).toHaveBeenCalledWith(mockData[0], 0);
  });

  it('should apply hover background to table rows', () => {
    const { container } = render(
      <DataTable<TestData>
        columns={mockColumns}
        data={mockData}
      />
    );

    const rows = container.querySelectorAll('tbody tr');
    rows.forEach((row) => {
      expect(row).toHaveClass('hover:bg-gray-50');
    });
  });
});

// ============================================================================
// Pagination Component Tests
// ============================================================================

describe('Pagination Component', () => {
  it('should display current page, total pages, and item range', () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalPages={5}
        totalItems={50}
        pageSize={10}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    );

    // Check for pagination elements
    expect(screen.getByText(/Showing/)).toBeInTheDocument();
    expect(screen.getAllByText('50').length).toBeGreaterThan(0);
    
    // Check for page navigation buttons
    const prevButtons = screen.getAllByText('Previous');
    const nextButtons = screen.getAllByText('Next');
    expect(prevButtons.length).toBeGreaterThan(0);
    expect(nextButtons.length).toBeGreaterThan(0);
  });

  it('should disable Previous button on first page', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        totalItems={50}
        pageSize={10}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    );

    const prevButtons = screen.getAllByText('Previous');
    prevButtons.forEach((btn) => {
      if (btn.closest('button')) {
        expect(btn.closest('button')).toBeDisabled();
      }
    });
  });

  it('should disable Next button on last page', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={5}
        totalItems={50}
        pageSize={10}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    );

    const nextButtons = screen.getAllByText('Next');
    nextButtons.forEach((btn) => {
      if (btn.closest('button')) {
        expect(btn.closest('button')).toBeDisabled();
      }
    });
  });

  it('should provide page size selector with default options', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        totalItems={50}
        pageSize={10}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    );

    const select = screen.getByDisplayValue('10');
    expect(select).toBeInTheDocument();
  });

  it('should call onPageChange when Previous button is clicked', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        totalItems={50}
        pageSize={10}
        onPageChange={onPageChange}
        onPageSizeChange={vi.fn()}
      />
    );

    const prevButtons = screen.getAllByText('Previous');
    fireEvent.click(prevButtons[0]);

    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('should call onPageChange when Next button is clicked', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        totalItems={50}
        pageSize={10}
        onPageChange={onPageChange}
        onPageSizeChange={vi.fn()}
      />
    );

    const nextButtons = screen.getAllByText('Next');
    fireEvent.click(nextButtons[0]);

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('should call onPageSizeChange and reset to page 1 when page size changes', () => {
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        totalItems={50}
        pageSize={10}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    );

    const select = screen.getByDisplayValue('10');
    fireEvent.change(select, { target: { value: '25' } });

    expect(onPageSizeChange).toHaveBeenCalledWith(25);
    expect(onPageChange).toHaveBeenCalledWith(1);
  });
});

// ============================================================================
// Modal Component Tests
// ============================================================================

describe('Modal Component', () => {
  it('should render modal when isOpen is true', () => {
    render(
      <Modal
        isOpen={true}
        onClose={vi.fn()}
        title="Test Modal"
      >
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('should not render modal when isOpen is false', () => {
    render(
      <Modal
        isOpen={false}
        onClose={vi.fn()}
        title="Test Modal"
      >
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('should center content with backdrop', () => {
    const { container } = render(
      <Modal
        isOpen={true}
        onClose={vi.fn()}
        title="Test Modal"
      >
        <p>Modal content</p>
      </Modal>
    );

    const backdrop = container.querySelector('.fixed.inset-0');
    expect(backdrop).toBeInTheDocument();
    expect(backdrop).toHaveClass('flex', 'items-end', 'sm:items-center', 'justify-center');
  });

  it('should close when backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Test Modal"
        closeOnBackdrop={true}
      >
        <p>Modal content</p>
      </Modal>
    );

    const backdrop = container.querySelector('.fixed.inset-0');
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    expect(onClose).toHaveBeenCalled();
  });

  it('should close when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Test Modal"
      >
        <p>Modal content</p>
      </Modal>
    );

    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('should close when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Test Modal"
      >
        <p>Modal content</p>
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });

  it('should support different size variants', () => {
    const { container: smContainer } = render(
      <Modal
        isOpen={true}
        onClose={vi.fn()}
        title="Test Modal"
        size="sm"
      >
        <p>Modal content</p>
      </Modal>
    );

    const smModal = smContainer.querySelector('.sm\\:max-w-md');
    expect(smModal).toBeInTheDocument();
  });

  it('should have z-index 50 to appear above other content', () => {
    const { container } = render(
      <Modal
        isOpen={true}
        onClose={vi.fn()}
        title="Test Modal"
      >
        <p>Modal content</p>
      </Modal>
    );

    const modalContainer = container.querySelector('.z-50');
    expect(modalContainer).toBeInTheDocument();
  });
});

// ============================================================================
// SearchBar Component Tests
// ============================================================================

describe('SearchBar Component', () => {
  it('should render search input with placeholder', () => {
    render(
      <SearchBar
        value=""
        onChange={vi.fn()}
        placeholder="Search brands..."
      />
    );

    const input = screen.getByPlaceholderText('Search brands...');
    expect(input).toBeInTheDocument();
  });

  it('should display search icon', () => {
    const { container } = render(
      <SearchBar
        value=""
        onChange={vi.fn()}
      />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should debounce onChange by 300ms by default', async () => {
    const onChange = vi.fn();
    render(
      <SearchBar
        value=""
        onChange={onChange}
        debounceMs={300}
      />
    );

    const input = screen.getByPlaceholderText('Search...');
    fireEvent.change(input, { target: { value: 'test' } });

    // Should not be called immediately
    expect(onChange).not.toHaveBeenCalled();

    // Should be called after debounce delay
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('test');
    }, { timeout: 500 });
  });

  it('should display clear button when value is not empty', () => {
    render(
      <SearchBar
        value="test"
        onChange={vi.fn()}
      />
    );

    const clearButton = screen.getByLabelText('Clear search');
    expect(clearButton).toBeInTheDocument();
  });

  it('should clear search when clear button is clicked', () => {
    const onChange = vi.fn();
    render(
      <SearchBar
        value="test"
        onChange={onChange}
      />
    );

    const clearButton = screen.getByLabelText('Clear search');
    fireEvent.click(clearButton);

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <SearchBar
        value=""
        onChange={vi.fn()}
        disabled={true}
      />
    );

    const input = screen.getByPlaceholderText('Search...');
    expect(input).toBeDisabled();
  });
});

// ============================================================================
// EmptyState Component Tests
// ============================================================================

describe('EmptyState Component', () => {
  it('should display message', () => {
    render(
      <EmptyState
        message="No brands found"
        icon="🏢"
      />
    );

    expect(screen.getByText('No brands found')).toBeInTheDocument();
  });

  it('should display icon', () => {
    const { container } = render(
      <EmptyState
        message="No data"
        icon="📄"
      />
    );

    expect(container.textContent).toContain('📄');
  });

  it('should display description when provided', () => {
    render(
      <EmptyState
        message="No data"
        description="Try adjusting your filters"
        icon="📄"
      />
    );

    expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument();
  });

  it('should render children when provided', () => {
    render(
      <EmptyState
        message="No data"
        icon="📄"
      >
        <button>Create New</button>
      </EmptyState>
    );

    expect(screen.getByText('Create New')).toBeInTheDocument();
  });
});

// ============================================================================
// LoadingState Component Tests
// ============================================================================

describe('LoadingState Component', () => {
  it('should display loading message', () => {
    render(
      <LoadingState
        message="Loading data..."
        showSkeleton={false}
      />
    );

    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('should display spinner', () => {
    const { container } = render(
      <LoadingState
        message="Loading..."
        showSkeleton={false}
      />
    );

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should display skeleton loaders when showSkeleton is true', () => {
    const { container } = render(
      <LoadingState
        showSkeleton={true}
        rows={3}
      />
    );

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });

  it('should render specified number of skeleton rows', () => {
    const { container } = render(
      <LoadingState
        showSkeleton={true}
        rows={5}
      />
    );

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThanOrEqual(5);
  });
});
