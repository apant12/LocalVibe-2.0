import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "lucide-react";
import type { Category, FilterOptions } from "@/types";

interface QuickFiltersProps {
  onFilterChange: (filters: FilterOptions) => void;
  activeFilters: FilterOptions;
}

export default function QuickFilters({ onFilterChange, activeFilters }: QuickFiltersProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const handleFilterClick = (filter: FilterOptions) => {
    onFilterChange(filter);
  };

  const handleDateSelect = (date: string) => {
    onFilterChange({ date });
    setShowDatePicker(false);
  };

  const isActive = (filter: FilterOptions) => {
    if (filter.availability) {
      return activeFilters.availability === filter.availability;
    }
    if (filter.categoryId) {
      return activeFilters.categoryId === filter.categoryId;
    }
    return false;
  };

  const formatDateForDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateStr === today.toISOString().split('T')[0]) return 'Today';
    if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getQuickDates = () => {
    const dates = [];
    const today = new Date();
    
    // Add next 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  };

  return (
    <div className="absolute top-20 left-0 right-0 z-40 p-4">
      <div className="flex space-x-3 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setShowDatePicker(!showDatePicker)}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold cursor-pointer transition-colors ${
            activeFilters.date
              ? "bg-primary text-white"
              : "bg-surface/80 backdrop-blur hover:bg-primary/20"
          }`}
        >
          <Calendar className="w-4 h-4 mr-2" />
          {activeFilters.date ? formatDateForDisplay(activeFilters.date) : 'Date'}
        </button>
        
        <button
          onClick={() => handleFilterClick({ availability: "available" })}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold cursor-pointer transition-colors ${
            isActive({ availability: "available" })
              ? "bg-primary text-white"
              : "bg-surface/80 backdrop-blur hover:bg-primary/20"
          }`}
        >
          <i className="fas fa-clock mr-2"></i>Available Now
        </button>
        
        {categories.slice(0, 3).map((category) => (
          <button
            key={category.id}
            onClick={() => handleFilterClick({ categoryId: category.id })}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm cursor-pointer transition-colors ${
              isActive({ categoryId: category.id })
                ? "bg-primary text-white"
                : "bg-surface/80 backdrop-blur hover:bg-primary/20"
            }`}
          >
            <i className={`${category.icon} mr-2`}></i>
            {category.name}
          </button>
        ))}
      </div>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <div className="absolute top-16 left-4 right-4 bg-surface rounded-lg p-4 shadow-xl z-50">
          <div className="grid grid-cols-4 gap-2">
            {getQuickDates().map((date) => (
              <button
                key={date}
                onClick={() => handleDateSelect(date)}
                className={`p-3 rounded-lg text-sm cursor-pointer transition-colors ${
                  activeFilters.date === date
                    ? "bg-primary text-white"
                    : "bg-background hover:bg-primary/20"
                }`}
              >
                {formatDateForDisplay(date)}
              </button>
            ))}
          </div>
          <div className="flex justify-between items-center mt-4">
            <input
              type="date"
              onChange={(e) => handleDateSelect(e.target.value)}
              className="bg-background border border-gray-600 rounded px-3 py-2 text-white"
              min={new Date().toISOString().split('T')[0]}
            />
            <button
              onClick={() => setShowDatePicker(false)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
