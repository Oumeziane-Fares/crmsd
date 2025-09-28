import { useState, useEffect, useMemo } from "react";
import * as XLSX from 'xlsx';

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../ui/table";
import { PencilIcon, TrashBinIcon } from "../../../../icons";
import Badge from "../../../ui/badge/Badge";
import Pagination from "./Pagination";
import Button from "../../../ui/button/Button";
import DatePicker from "../../../form/date-picker"; // Adjust path as needed

// Type definition for your API data
interface ActesData {
  id: number;
  hcp: string;
  poste: string;
  acte: string;
  bon: string | null;
  activite: string;
  rdv: string;
  patient: string;
  sponsoring: string;
  ca_total: number;
  ca_acte: number;
  honoraire: number;
  part_sd: number;
  moment: string;
}

type SortableKeys = keyof Pick<ActesData, 'hcp' | 'acte' | 'bon' | 'activite' | 'rdv' | 'patient' | 'sponsoring' | 'ca_total' | 'honoraire' | 'part_sd'>;

export default function DataTableThree() {
  const [allData, setAllData] = useState<ActesData[]>([]);
  const [filteredData, setFilteredData] = useState<ActesData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // States for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'asc' | 'desc' }>({ key: 'hcp', direction: 'asc' });

  // Helper function to parse DD/MM/YYYY dates from the API
  const parseCustomDate = (dateString: string): Date | null => {
      if (!dateString || dateString === "Non défini" || dateString === "Non dÃ©fini") return null;
      const [datePart, timePart] = dateString.split(' ');
      if (!datePart) return null;
      const [day, month, year] = datePart.split('/');
      if (!day || !month || !year) return null;
      
      // Validate numeric values
      const dayNum = parseInt(day, 10);
      const monthNum = parseInt(month, 10);
      const yearNum = parseInt(year, 10);
      
      if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) return null;
      if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12) return null;
      
      // Handle time part - make it optional
      const timeString = timePart || "00:00";
      const [hours, minutes] = timeString.split(':');
      const hoursNum = parseInt(hours || '0', 10);
      const minutesNum = parseInt(minutes || '0', 10);
      
      if (isNaN(hoursNum) || isNaN(minutesNum)) return null;
      if (hoursNum < 0 || hoursNum > 23 || minutesNum < 0 || minutesNum > 59) return null;
      
      return new Date(yearNum, monthNum - 1, dayNum, hoursNum, minutesNum, 0);
  };

  // Handle date range change from DatePicker
  const handleDateRangeChange = (selectedDates: Date[]) => {
    if (selectedDates.length === 2) {
      // Only set the date range when both dates are selected
      setDateRange([selectedDates[0], selectedDates[1]]);
    } else {
      // Clear the range if less than 2 dates are selected
      setDateRange([null, null]);
    }
  };

  useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      const response = await fetch("http://localhost/crmsd/finances-old/hcps_action.php?action=fetch_actes");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ActesData[] = await response.json();
      
      // Validate that data is an array
      if (!Array.isArray(data)) {
        throw new Error("Invalid data format received from server");
      }
      
      setAllData(data);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
      setError(errorMessage);
      console.error("Error fetching data:", e);
    } finally {
      setLoading(false);
    }
  };
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...allData];

    // Search filtering with null safety
    if (searchTerm && searchTerm.trim()) {
        const lowercasedFilter = searchTerm.toLowerCase().trim();
        filtered = filtered.filter(item => {
            const hcp = item.hcp?.toLowerCase() || '';
            const patient = item.patient?.toLowerCase() || '';
            const acte = item.acte?.toLowerCase() || '';
            const sponsoring = item.sponsoring?.toLowerCase() || '';
            
            return hcp.includes(lowercasedFilter) ||
                   patient.includes(lowercasedFilter) ||
                   acte.includes(lowercasedFilter) ||
                   sponsoring.includes(lowercasedFilter);
        });
    }

    // Date range filtering - only apply when both dates are selected
    const [startDate, endDate] = dateRange;
    if (startDate && endDate) {
        filtered = filtered.filter(item => {
            const itemDate = parseCustomDate(item.rdv);
            if (!itemDate) return false;
            
            const startOfDay = new Date(startDate);
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date(endDate);
            endOfDay.setHours(23, 59, 59, 999);
            
            return itemDate >= startOfDay && itemDate <= endOfDay;
        });
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchTerm, dateRange, allData]);

  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        const directionMultiplier = sortConfig.direction === 'asc' ? 1 : -1;
        
        // Handle null/undefined values consistently
        if (valA == null && valB == null) return 0;
        if (valA == null) return -1 * directionMultiplier;
        if (valB == null) return 1 * directionMultiplier;
        
        // Handle different data types
        if (typeof valA === 'string' && typeof valB === 'string') {
          return valA.localeCompare(valB) * directionMultiplier;
        }
        
        if (typeof valA === 'number' && typeof valB === 'number') {
          return (valA - valB) * directionMultiplier;
        }
        
        // Fallback to string comparison
        const strA = String(valA);
        const strB = String(valB);
        return strA.localeCompare(strB) * directionMultiplier;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const currentData = sortedData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const totalEntries = sortedData.length;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalEntries);

  const handleSort = (key: SortableKeys) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
    }
  };
  
  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setCurrentPage(1);
  };
  
  const formatCurrency = (value: number | null | undefined) => {
    if (value == null || isNaN(value)) return '0.00 DZD';
    return value.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' DZD';
  };

  const handleDownload = () => {
    try {
      if (sortedData.length === 0) {
        alert('No data to download');
        return;
      }
      
      const dataForExcel = sortedData.map(item => ({ 
        'HCP': item.hcp || '', 
        'Acte': item.acte || '', 
        'N° de Bon': item.bon || '', 
        'Activité': item.activite || '', 
        'RDV': item.rdv || '', 
        'Patient': item.patient || '', 
        'Sponsoring': item.sponsoring || '', 
        'CA Total': item.ca_total || 0, 
        'Honoraire': item.honoraire || 0, 
        'Part SD': item.part_sd || 0
      }));
      
      const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Honoraires");
      
      const filename = `Honoraires_Actes_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error occurred while downloading the file');
    }
  };

  const handleReset = () => {
      setSearchTerm("");
      setDateRange([null, null]);
      
      // Clear the flatpickr input manually
      const dateInput = document.getElementById('date-range') as HTMLInputElement;
      if (dateInput) {
          dateInput.value = '';
          // Trigger flatpickr to clear its internal state
          if ((dateInput as any)._flatpickr) {
              (dateInput as any)._flatpickr.clear();
          }
      }
  };

  const SortIcon = ({ columnKey }: { columnKey: SortableKeys }) => {
    const isActive = sortConfig.key === columnKey;
    return (
    <button className="flex flex-col gap-0.5">
      <svg className={isActive && sortConfig.direction === 'asc' ? 'text-gray-800 dark:text-white' : 'text-gray-300 dark:text-gray-700'} width="8" height="5" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.40962 0.585167C4.21057 0.300808 3.78943 0.300807 3.59038 0.585166L1.05071 4.21327C0.81874 4.54466 1.05582 5 1.46033 5H6.53967C6.94418 5 7.18126 4.54466 6.94929 4.21327L4.40962 0.585167Z" fill="currentColor"/></svg>
      <svg className={isActive && sortConfig.direction === 'desc' ? 'text-gray-800 dark:text-white' : 'text-gray-300 dark:text-gray-700'} width="8" height="5" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.40962 4.41483C4.21057 4.69919 3.78943 4.69919 3.59038 4.41483L1.05071 0.786732C0.81874 0.455343 1.05582 0 1.46033 0H6.53967C6.94418 0 7.18126 0.455342 6.94929 0.786731L4.40962 4.41483Z" fill="currentColor"/></svg>
    </button>
    )
  };

  return (
    <div className="overflow-hidden rounded-xl bg-white dark:bg-white/[0.03]">

      <div className="flex flex-col gap-2 px-4 py-4 border-t border-b-0 border-gray-100 dark:border-white/[0.05] sm:flex-row sm:items-center sm:justify-between">
         <div className="flex items-center gap-3">
          <span className="text-gray-500 dark:text-gray-400"> Show </span>
          <div className="relative z-20 bg-transparent">
            <select
              className="w-full py-2 pl-3 pr-8 text-sm text-gray-800 bg-transparent border border-gray-300 rounded-lg appearance-none dark:bg-dark-900 h-9 bg-none shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
          <span className="text-gray-500 dark:text-gray-400"> entries </span>
        </div>
        
        <div className="flex flex-col flex-wrap gap-3 sm:flex-row sm:items-center">
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="h-11 rounded-lg border border-gray-300 bg-transparent py-2.5 px-4 text-sm dark:border-gray-700"
            />
            
            {/* Use single DatePicker with range mode for date selection */}
            <div className="min-w-[200px]">
              <DatePicker
                id="date-range"
                mode="range"
                placeholder="Select Date Range"
                onChange={handleDateRangeChange}
              />
            </div>

          <Button variant="outline" size="sm" onClick={handleReset}>Reset</Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>Download</Button>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                 <TableCell isHeader className="px-4 py-3 border-t border-gray-100 dark:border-white/[0.05]"><div onClick={() => handleSort('hcp')} className="flex items-center justify-between cursor-pointer"><span className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">HCP</span><SortIcon columnKey="hcp"/></div></TableCell>
                <TableCell isHeader className="px-4 py-3 border-t border-gray-100 dark:border-white/[0.05]"><div onClick={() => handleSort('acte')} className="flex items-center justify-between cursor-pointer"><p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">Acte</p><SortIcon columnKey="acte"/></div></TableCell>
                <TableCell isHeader className="px-4 py-3 border-t border-gray-100 dark:border-white/[0.05]"><div onClick={() => handleSort('bon')} className="flex items-center justify-between cursor-pointer"><p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">N° de Bon</p><SortIcon columnKey="bon"/></div></TableCell>
                <TableCell isHeader className="px-4 py-3 border-t border-gray-100 dark:border-white/[0.05]"><div onClick={() => handleSort('activite')} className="flex items-center justify-between cursor-pointer"><p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">Activité</p><SortIcon columnKey="activite"/></div></TableCell>
                <TableCell isHeader className="px-4 py-3 border-t border-gray-100 dark:border-white/[0.05]"><div onClick={() => handleSort('rdv')} className="flex items-center justify-between cursor-pointer"><p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">RDV</p><SortIcon columnKey="rdv"/></div></TableCell>
                <TableCell isHeader className="px-4 py-3 border-t border-gray-100 dark:border-white/[0.05]"><div onClick={() => handleSort('patient')} className="flex items-center justify-between cursor-pointer"><p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">Patient</p><SortIcon columnKey="patient"/></div></TableCell>
                <TableCell isHeader className="px-4 py-3 border-t border-gray-100 dark:border-white/[0.05]"><div onClick={() => handleSort('sponsoring')} className="flex items-center justify-between cursor-pointer"><p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">Sponsoring</p><SortIcon columnKey="sponsoring"/></div></TableCell>
                <TableCell isHeader className="px-4 py-3 border-t border-gray-100 dark:border-white/[0.05]"><div onClick={() => handleSort('ca_total')} className="flex items-center justify-between cursor-pointer"><p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">CA Total</p><SortIcon columnKey="ca_total"/></div></TableCell>
                <TableCell isHeader className="px-4 py-3 border-t border-gray-100 dark:border-white/[0.05]"><div onClick={() => handleSort('honoraire')} className="flex items-center justify-between cursor-pointer"><p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">Honoraire</p><SortIcon columnKey="honoraire"/></div></TableCell>
                <TableCell isHeader className="px-4 py-3 border-t border-gray-100 dark:border-white/[0.05]"><div onClick={() => handleSort('part_sd')} className="flex items-center justify-between cursor-pointer"><p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">Part SD</p><SortIcon columnKey="part_sd"/></div></TableCell>
                <TableCell isHeader className="px-4 py-3 border-t border-gray-100 dark:border-white/[0.05]"><div className="flex items-center justify-between"><p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">Action</p></div></TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? ( <TableRow><td colSpan={11} className="px-4 py-8 text-center border-t border-gray-100 dark:border-white/[0.05]">Loading...</td></TableRow> ) 
              : error ? ( <TableRow><td colSpan={11} className="px-4 py-8 text-center text-red-500 border-t border-gray-100 dark:border-white/[0.05]">Error fetching data: {error}</td></TableRow> ) 
              : ( currentData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="px-4 py-4 border-t border-gray-100 dark:border-white/[0.05] whitespace-nowrap"><p className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">{item.hcp}</p></TableCell>
                    <TableCell className="px-4 py-4 font-normal text-gray-800 border-t border-gray-100 dark:border-white/[0.05] text-theme-sm dark:text-white/90 whitespace-nowrap">{item.acte}</TableCell>
                    <TableCell className="px-4 py-4 font-normal text-gray-800 border-t border-gray-100 dark:border-white/[0.05] text-theme-sm dark:text-gray-400 whitespace-nowrap">{item.bon || 'N/A'}</TableCell>
                    <TableCell className="px-4 py-4 font-normal text-gray-800 border-t border-gray-100 dark:border-white/[0.05] text-theme-sm dark:text-white/90 whitespace-nowrap"><Badge size="sm" color="warning">{item.activite}</Badge></TableCell>
                    <TableCell className="px-4 py-4 font-normal text-gray-800 border-t border-gray-100 dark:border-white/[0.05] text-theme-sm dark:text-gray-400 whitespace-nowrap"><span>{item.rdv}</span></TableCell>
                    <TableCell className="px-4 py-4 font-normal text-gray-800 border-t border-gray-100 dark:border-white/[0.05] text-theme-sm dark:text-gray-400 whitespace-nowrap"><span>{item.patient}</span></TableCell>
                    <TableCell className="px-4 py-4 font-normal text-gray-800 border-t border-gray-100 dark:border-white/[0.05] text-theme-sm dark:text-white/90 whitespace-nowrap"><Badge size="sm" color={item.sponsoring.toLowerCase() === "patient" ? "success" : "warning"}>{item.sponsoring}</Badge></TableCell>
                    <TableCell className="px-4 py-4 font-normal text-gray-800 border-t border-gray-100 dark:border-white/[0.05] text-theme-sm dark:text-white/90 whitespace-nowrap">{formatCurrency(item.ca_total)}</TableCell>
                    <TableCell className="px-4 py-4 font-normal text-gray-800 border-t border-gray-100 dark:border-white/[0.05] text-theme-sm dark:text-white/90 whitespace-nowrap">{formatCurrency(item.honoraire)}</TableCell>
                    <TableCell className="px-4 py-4 font-medium text-blue-600 border-t border-gray-100 dark:border-white/[0.05] text-theme-sm dark:text-blue-500 whitespace-nowrap">{formatCurrency(item.part_sd)}</TableCell>
                    <TableCell className="px-4 py-4 font-normal text-gray-800 border-t border-gray-100 dark:border-white/[0.05] text-theme-sm dark:text-white/90 whitespace-nowrap">
                      <div className="flex items-center w-full gap-2">
                        <button className="text-gray-500 hover:text-error-500 dark:text-gray-400 dark:hover:text-error-500"><TrashBinIcon className="size-5" /></button>
                        <button className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"><PencilIcon className="size-5" /></button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <div className="border-t-0 rounded-b-xl py-4 pl-[18px] pr-4">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between">
          <div className="pb-3 xl:pb-0">
            <p className="pb-3 text-sm font-medium text-center text-gray-500 xl:border-b-0 xl:pb-0 xl:text-left dark:text-gray-400">
              Showing {totalEntries > 0 ? startIndex + 1 : 0} to {endIndex} of {totalEntries} entries
            </p>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}