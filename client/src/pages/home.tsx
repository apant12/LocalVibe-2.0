import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import HeaderNav from "@/components/HeaderNav";
import QuickFilters from "@/components/QuickFilters";
import ExperienceFeed from "@/components/ExperienceFeed";
import BottomNav from "@/components/BottomNav";
import SearchModal from "@/components/SearchModal";
import LocationDetector from "@/components/LocationDetector";
import type { FilterOptions } from "@/types";

export default function Home() {
  const { user } = useAuth();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({});

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters({ ...filters, ...newFilters });
  };

  return (
    <div className="h-screen bg-black text-white overflow-hidden">
      <HeaderNav 
        user={user} 
        onSearchClick={() => setShowSearchModal(true)}
      />
      
      <QuickFilters 
        onFilterChange={handleFilterChange}
        activeFilters={filters}
      />
      
      <ExperienceFeed filters={filters} />
      
      <BottomNav activeTab="home" />

      {showSearchModal && (
        <SearchModal 
          isOpen={showSearchModal}
          onClose={() => setShowSearchModal(false)}
          onSearch={(search) => handleFilterChange({ search })}
        />
      )}
      
      <LocationDetector />
    </div>
  );
}
