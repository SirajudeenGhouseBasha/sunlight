/**
 * Search Autocomplete Component
 * 
 * Real-time search with autocomplete suggestions
 * Requirements: 12.1, 12.3 - Search autocomplete and relevance
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/src/components/ui/input';
import Link from 'next/link';

interface SearchSuggestion {
  type: 'brand' | 'model' | 'product';
  id: string;
  name: string;
  subtitle?: string;
  variant_id?: string;
}

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: SearchSuggestion) => void;
  placeholder?: string;
  className?: string;
}

export function SearchAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Search by brand, model, or type...',
  className = '',
}: SearchAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions when search value changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (value.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(value)}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [value]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    onChange(suggestion.name);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    if (onSelect) {
      onSelect(suggestion);
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'brand':
        return '🏢';
      case 'model':
        return '📱';
      case 'product':
        return '🎨';
      default:
        return '🔍';
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
          setSelectedIndex(-1);
        }}
        onFocus={() => setShowSuggestions(true)}
        onKeyDown={handleKeyDown}
        className={`h-11 ${className}`}
      />

      {/* Suggestions Dropdown */}
      {showSuggestions && (value.length >= 2 || suggestions.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          {loading ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              Searching...
            </div>
          ) : suggestions.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No suggestions found
            </div>
          ) : (
            <ul className="py-2">
              {suggestions.map((suggestion, index) => (
                <li key={`${suggestion.type}-${suggestion.id}`}>
                  {suggestion.type === 'product' && suggestion.variant_id ? (
                    <Link
                      href={`/products/${suggestion.variant_id}`}
                      onClick={() => setShowSuggestions(false)}
                      className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                        index === selectedIndex ? 'bg-blue-50' : ''
                      }`}
                    >
                      <span className="text-xl">{getSuggestionIcon(suggestion.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {suggestion.name}
                        </div>
                        {suggestion.subtitle && (
                          <div className="text-sm text-gray-500 truncate">
                            {suggestion.subtitle}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 uppercase">
                        {suggestion.type}
                      </span>
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors text-left ${
                        index === selectedIndex ? 'bg-blue-50' : ''
                      }`}
                    >
                      <span className="text-xl">{getSuggestionIcon(suggestion.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {suggestion.name}
                        </div>
                        {suggestion.subtitle && (
                          <div className="text-sm text-gray-500 truncate">
                            {suggestion.subtitle}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 uppercase">
                        {suggestion.type}
                      </span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
