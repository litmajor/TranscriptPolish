
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Filter, CalendarIcon, Hash, User, MapPin } from "lucide-react";
import { format } from "date-fns";

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
}

interface SearchFilters {
  query?: string;
  detective?: string;
  section?: string;
  dateRange?: { from: Date; to: Date };
  caseNumber?: string;
  location?: string;
  status?: string;
  qualityScore?: { min: number; max: number };
}

export default function AdvancedSearch({ onSearch }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearch = () => {
    onSearch(filters);
  };

  const clearFilters = () => {
    setFilters({});
    onSearch({});
  };

  const activeFilterCount = Object.keys(filters).filter(key => 
    filters[key as keyof SearchFilters] !== undefined && 
    filters[key as keyof SearchFilters] !== ""
  ).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced Search
            {activeFilterCount > 0 && (
              <Badge variant="secondary">{activeFilterCount} filters</Badge>
            )}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {showAdvanced ? "Hide" : "Show"} Filters
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Search */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Search transcripts..."
              value={filters.query || ""}
              onChange={(e) => setFilters({ ...filters, query: e.target.value })}
              className="w-full"
            />
          </div>
          <Button onClick={handleSearch}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <User className="h-4 w-4" />
                Detective
              </label>
              <Input
                placeholder="Detective name"
                value={filters.detective || ""}
                onChange={(e) => setFilters({ ...filters, detective: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Section</label>
              <Select
                value={filters.section || ""}
                onValueChange={(value) => setFilters({ ...filters, section: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Homicide">Homicide</SelectItem>
                  <SelectItem value="Robbery">Robbery</SelectItem>
                  <SelectItem value="Sexual Assault">Sexual Assault</SelectItem>
                  <SelectItem value="Burglary">Burglary</SelectItem>
                  <SelectItem value="Vice">Vice</SelectItem>
                  <SelectItem value="Narcotics">Narcotics</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Hash className="h-4 w-4" />
                Case Number
              </label>
              <Input
                placeholder="Case number"
                value={filters.caseNumber || ""}
                onChange={(e) => setFilters({ ...filters, caseNumber: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Location
              </label>
              <Input
                placeholder="Interview location"
                value={filters.location || ""}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status || ""}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                Date Range
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange ? (
                      `${format(filters.dateRange.from, "LLL dd")} - ${format(filters.dateRange.to, "LLL dd")}`
                    ) : (
                      "Pick a date range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={filters.dateRange?.from}
                    selected={filters.dateRange}
                    onSelect={(range) => setFilters({ ...filters, dateRange: range as any })}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="md:col-span-2 lg:col-span-3 flex gap-2 pt-4">
              <Button onClick={handleSearch} className="flex-1">
                Apply Filters
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
