import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  className?: string;
}

export interface SearchFilters {
  query: string;
  genre: string;
  mood: string;
  aiMethod: string;
  sortBy: string;
  tags: string[];
}

const GENRES = [
  'Electronic', 'Hip Hop', 'Pop', 'Rock', 'Jazz', 'Classical', 
  'Ambient', 'Techno', 'House', 'Trap', 'R&B', 'Indie'
];

const MOODS = [
  'Energetic', 'Relaxed', 'Uplifting', 'Melancholic', 'Aggressive', 
  'Peaceful', 'Dreamy', 'Dark', 'Playful', 'Romantic'
];

const AI_METHODS = [
  'fully_ai', 'ai_assisted', 'ai_post_processing'
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'most_streamed', label: 'Most Streamed' },
  { value: 'trending', label: 'Trending' },
  { value: 'alphabetical', label: 'Alphabetical' }
];

export default function AdvancedSearch({ onSearch, className = '' }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    genre: '',
    mood: '',
    aiMethod: '',
    sortBy: 'newest',
    tags: []
  });
  const [showFilters, setShowFilters] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const handleSearch = () => {
    onSearch(filters);
  };

  const addTag = () => {
    if (tagInput.trim() && !filters.tags.includes(tagInput.trim())) {
      setFilters(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      genre: '',
      mood: '',
      aiMethod: '',
      sortBy: 'newest',
      tags: []
    });
    onSearch({
      query: '',
      genre: '',
      mood: '',
      aiMethod: '',
      sortBy: 'newest',
      tags: []
    });
  };

  return (
    <div className={`bg-card-bg rounded-lg p-4 ${className}`}>
      {/* Main Search Bar */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
          <Input
            placeholder="Search songs, artists, or keywords..."
            value={filters.query}
            onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
            className="pl-10 bg-dark-bg border-gray-600 text-white"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button 
          variant="outline" 
          onClick={() => setShowFilters(!showFilters)}
          className="border-gray-600 text-white hover:bg-gray-700"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
        <Button 
          onClick={handleSearch}
          className="bg-gradient-to-r from-ai-purple to-ai-blue text-white"
        >
          Search
        </Button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="space-y-4 border-t border-gray-600 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Genre Filter */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Genre</label>
              <Select value={filters.genre} onValueChange={(value) => setFilters(prev => ({ ...prev, genre: value }))}>
                <SelectTrigger className="bg-dark-bg border-gray-600 text-white">
                  <SelectValue placeholder="Any Genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any Genre</SelectItem>
                  {GENRES.map(genre => (
                    <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mood Filter */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Mood</label>
              <Select value={filters.mood} onValueChange={(value) => setFilters(prev => ({ ...prev, mood: value }))}>
                <SelectTrigger className="bg-dark-bg border-gray-600 text-white">
                  <SelectValue placeholder="Any Mood" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any Mood</SelectItem>
                  {MOODS.map(mood => (
                    <SelectItem key={mood} value={mood}>{mood}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* AI Method Filter */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">AI Generation</label>
              <Select value={filters.aiMethod} onValueChange={(value) => setFilters(prev => ({ ...prev, aiMethod: value }))}>
                <SelectTrigger className="bg-dark-bg border-gray-600 text-white">
                  <SelectValue placeholder="Any Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any Method</SelectItem>
                  <SelectItem value="fully_ai">Fully AI Generated</SelectItem>
                  <SelectItem value="ai_assisted">AI Assisted</SelectItem>
                  <SelectItem value="ai_post_processing">AI Post-Processing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Sort By</label>
              <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                <SelectTrigger className="bg-dark-bg border-gray-600 text-white">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Tags</label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="flex-1 bg-dark-bg border-gray-600 text-white"
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
              />
              <Button onClick={addTag} variant="outline" className="border-gray-600">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="bg-ai-purple/20 text-ai-purple">
                  {tag}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex justify-end">
            <Button onClick={clearFilters} variant="ghost" className="text-text-secondary">
              Clear All Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}