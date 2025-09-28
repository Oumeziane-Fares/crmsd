import { useEffect, useState } from 'react';
import { Honoraire } from '../../types/honoraire';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '../ui/table';
import { PencilIcon, TrashBinIcon, DownloadIcon } from '../../icons';
import Pagination from './DataTables/TableThree/Pagination';
import Button from '../ui/button/Button';
import Badge from '../ui/badge/Badge';
import * as XLSX from 'xlsx';

// Helper function to get initials from a name
const getInitials = (name: string) => {
  const names = name.split(' ');
  const initials = names.map((n) => n[0]).join('');
  return initials.toUpperCase().slice(0, 2);
};


const HcpHonoraireTable = () => {
  const [data, setData] = useState<Honoraire[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage] = useState<number>(10);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('http://localhost/crmsd/finances-old/hcps_action.php?action=fetch_actes');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const result = await response.json();
        setData(result);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDownload = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Honoraires");
    XLSX.writeFile(workbook, "Santedom_Honoraires.xlsx");
  };

  const filteredData = data.filter(item =>
    item.hcp.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.acte.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalEntries = filteredData.length;
  const totalPages = Math.ceil(totalEntries / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalEntries);
  const currentTableData = filteredData.slice(startIndex, endIndex);

  if (loading) {
    return <div className="text-center p-10">Loading data...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-lg dark:border-gray-800 dark:bg-gray-dark">
      <div className="flex flex-col gap-4 xs:flex-row xs:items-center xs:justify-between mb-4">
        <div className="relative w-full max-w-sm">
            <span className="absolute -translate-y-1/2 pointer-events-none left-4 top-1/2">
              <svg /* Search Icon */ className="fill-gray-500 dark:fill-gray-400" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" >
                <path fillRule="evenodd" clipRule="evenodd" d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 16.5344L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z" fill=""></path>
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search by HCP, Patient, Acte..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-11 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white dark:placeholder:text-gray-400"
            />
        </div>
        <Button onClick={handleDownload}>
            <DownloadIcon className="size-5" />
            Download
        </Button>
      </div>
      <div>
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>HCP</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Acte</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentTableData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-gray-900 text-theme-sm dark:text-white whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                          <div className="flex items-center justify-center font-bold text-white rounded-full size-11 bg-brand-500">
                           {getInitials(item.hcp)}
                          </div>
                      </div>
                      <div className="flex flex-col">
                        <span>{item.hcp}</span>
                        <span className="text-xs text-gray-500">{item.poste}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{item.patient}</TableCell>
                  <TableCell>{item.acte}</TableCell>
                  <TableCell>
                     <Badge color={item.activite === 'médicale' ? 'success' : 'primary'}>
                        {item.activite}
                      </Badge>
                  </TableCell>
                  <TableCell>{item.ca_total.toFixed(2)} DZD</TableCell>
                  <TableCell>
                    <div className="flex items-center w-full gap-2">
                      <button className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90">
                        <PencilIcon className="size-5" />
                      </button>
                      <button className="text-gray-500 hover:text-error-500 dark:text-gray-400 dark:hover:text-error-500">
                        <TrashBinIcon className="size-5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="border-t-0 rounded-b-xl border-gray-100 py-4 pl-[18px] pr-4 dark:border-white/[0.05]">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between">
          <p className="pb-3 text-sm font-medium text-center text-gray-500 border-b border-gray-100 dark:border-gray-800 dark:text-gray-400 xl:border-b-0 xl:pb-0 xl:text-left">
            Showing {startIndex + 1} to {endIndex} of {totalEntries} entries
          </p>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      </div>
    </div>
  );
};

export default HcpHonoraireTable;

