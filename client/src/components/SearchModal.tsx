import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Category } from "@/types";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
}

export default function SearchModal({ isOpen, onClose, onSearch }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const recentSearches = [
    "Cocktail classes",
    "Art galleries",
    "Food tours",
    "Hiking groups",
  ];

  const handleSearch = (query: string) => {
    onSearch(query);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-[100]">
      <div className="p-4 space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            onClick={onClose}
            className="w-10 h-10 bg-surface rounded-full flex items-center justify-center"
          >
            <i className="fas fa-arrow-left"></i>
          </Button>
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Search experiences..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  handleSearch(searchQuery);
                }
              }}
              className="w-full bg-surface text-white placeholder-gray-400 rounded-2xl px-4 py-3 pl-12 border-gray-800"
              autoFocus
            />
            <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>
        </div>
        
        {searchQuery.trim() && (
          <div className="space-y-2">
            <Button
              onClick={() => handleSearch(searchQuery)}
              className="w-full text-left justify-start bg-surface hover:bg-gray-700 p-3 rounded-xl"
            >
              <i className="fas fa-search text-gray-400 mr-3"></i>
              Search for "{searchQuery}"
            </Button>
          </div>
        )}
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Recent Searches</h3>
          <div className="space-y-2">
            {recentSearches.map((search, index) => (
              <Button
                key={index}
                onClick={() => handleSearch(search)}
                className="flex items-center space-x-3 p-3 bg-surface rounded-xl cursor-pointer hover:bg-gray-700 transition-colors w-full text-left justify-start"
              >
                <i className="fas fa-clock text-gray-400"></i>
                <span>{search}</span>
              </Button>
            ))}
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Popular Categories</h3>
          <div className="grid grid-cols-2 gap-3">
            {categories.slice(0, 6).map((category) => (
              <Button
                key={category.id}
                onClick={() => {
                  // Filter by category instead of search
                  onClose();
                }}
                className="p-4 bg-surface rounded-xl cursor-pointer hover:bg-primary/20 transition-colors h-auto justify-start"
              >
                <i className={`${category.icon} text-2xl mr-3`} style={{ color: category.color }}></i>
                <span className="font-semibold">{category.name}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
