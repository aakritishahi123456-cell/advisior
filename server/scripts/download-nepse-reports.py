#!/usr/bin/env python3
"""
FinSathi AI - NEPSE Annual Report Downloader
Production-ready Python script for downloading NEPSE company annual reports
"""

import os
import sys
import json
import time
import asyncio
import aiohttp
import aiofiles
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from urllib.parse import urljoin
from dataclasses import dataclass

# Configuration
@dataclass
class Config:
    # NEPSE base URLs
    NEPSE_BASE_URL: str = "https://nepalstock.com"
    NEPSE_COMPANY_LIST_URL: str = "https://nepalstock.com/company/list"
    NEPSE_REPORTS_URL: str = "https://nepalstock.com/company/annual-reports"
    
    # Download settings
    DOWNLOAD_DIR: Path = Path(__file__).parent / "downloads" / "annual-reports"
    MAX_RETRIES: int = 3
    TIMEOUT: int = 30  # seconds
    CONCURRENT_DOWNLOADS: int = 5
    
    # File settings
    USER_AGENT: str = "FinSathi-AI-NEPSE-Scraper/1.0"
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

class Logger:
    """Enhanced logging utility"""
    
    LEVELS = {"ERROR": 0, "WARN": 1, "INFO": 2, "DEBUG": 3}
    
    @classmethod
    def log(cls, level: str, message: str, data: Optional[Dict] = None):
        timestamp = datetime.now().isoformat()
        if cls.LEVELS[level] <= cls.LEVELS[Config.LOG_LEVEL]:
            print(f"[{timestamp}] {level}: {message}")
            if data:
                print(json.dumps(data, indent=2))
    
    @classmethod
    def error(cls, message: str, data: Optional[Dict] = None):
        cls.log("ERROR", message, data)
    
    @classmethod
    def warn(cls, message: str, data: Optional[Dict] = None):
        cls.log("WARN", message, data)
    
    @classmethod
    def info(cls, message: str, data: Optional[Dict] = None):
        cls.log("INFO", message, data)
    
    @classmethod
    def debug(cls, message: str, data: Optional[Dict] = None):
        cls.log("DEBUG", message, data)

class HTTPClient:
    """Async HTTP client with retry logic and error handling"""
    
    def __init__(self):
        self.session = None
    
    async def __aenter__(self):
        timeout = aiohttp.ClientTimeout(total=Config.TIMEOUT)
        headers = {
            "User-Agent": Config.USER_AGENT,
            "Accept": "application/pdf,application/octet-stream,*/*",
        }
        self.session = aiohttp.ClientSession(
            timeout=timeout,
            headers=headers,
            connector=aiohttp.TCPConnector(limit=Config.CONCURRENT_DOWNLOADS)
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def download(self, url: str, file_path: Path, retries: int = Config.MAX_RETRIES) -> Dict:
        """Download file with retry logic"""
        for attempt in range(1, retries + 1):
            try:
                Logger.info(f"Downloading {url} (attempt {attempt}/{retries})")
                
                async with self.session.get(url) as response:
                    if response.status != 200:
                        raise Exception(f"HTTP {response.status}: {response.reason}")
                    
                    content_length = response.headers.get('content-length')
                    if content_length and int(content_length) > Config.MAX_FILE_SIZE:
                        raise Exception(f"File too large: {content_length} bytes")
                    
                    await self._save_to_file(response, file_path)
                    Logger.info(f"Successfully downloaded {file_path.name}")
                    return {"success": True, "file_path": str(file_path)}
                    
            except Exception as error:
                Logger.warn(f"Download attempt {attempt} failed: {str(error)}")
                
                if attempt == retries:
                    Logger.error(f"Failed to download after {retries} attempts: {url}", 
                               {"error": str(error)})
                    return {"success": False, "error": str(error), "url": url}
                
                # Exponential backoff
                await asyncio.sleep(2 ** attempt)
    
    async def _save_to_file(self, response: aiohttp.ClientResponse, file_path: Path):
        """Save response to file with size limit check"""
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        downloaded_bytes = 0
        async with aiofiles.open(file_path, 'wb') as file:
            async for chunk in response.content.iter_chunked(8192):
                downloaded_bytes += len(chunk)
                
                if downloaded_bytes > Config.MAX_FILE_SIZE:
                    await file.aclose()
                    file_path.unlink(missing_ok=True)
                    raise Exception(f"File size exceeded limit: {downloaded_bytes} bytes")
                
                await file.write(chunk)

class NEPSEScraper:
    """Main scraper class for NEPSE annual reports"""
    
    def __init__(self):
        self.companies: List[Dict] = []
        self.download_results: List[Dict] = []
    
    async def initialize(self):
        """Initialize the scraper"""
        Logger.info("Initializing NEPSE Annual Report Downloader")
        
        # Create download directory
        await self._ensure_directory(Config.DOWNLOAD_DIR)
        
        # Load companies
        await self._load_companies()
        
        Logger.info(f"Found {len(self.companies)} companies to process")
    
    async def _ensure_directory(self, dir_path: Path):
        """Ensure directory exists"""
        dir_path.mkdir(parents=True, exist_ok=True)
        Logger.info(f"Created directory: {dir_path}")
    
    async def _load_companies(self):
        """Load company list (mock data for demo)"""
        try:
            # In production, this would scrape NEPSE website
            self.companies = [
                {"symbol": "NABIL", "name": "Nepal Investment Bank Limited", "sector": "Banking"},
                {"symbol": "NICA", "name": "Nepal Insurance Company Limited", "sector": "Insurance"},
                {"symbol": "SCB", "name": "Standard Chartered Bank Nepal", "sector": "Banking"},
                {"symbol": "NBL", "name": "Nabil Bank Limited", "sector": "Banking"},
                {"symbol": "EBL", "name": "Everest Bank Limited", "sector": "Banking"},
            ]
            
            Logger.info(f"Loaded {len(self.companies)} companies")
        except Exception as error:
            Logger.error("Failed to load companies", {"error": str(error)})
            raise
    
    def _generate_report_url(self, company: Dict, year: int) -> str:
        """Generate URL for company annual report"""
        # NEPSE URL pattern for annual reports
        # This is a simplified pattern - actual implementation may need more sophisticated URL generation
        return f"{Config.NEPSE_REPORTS_URL}/{company['symbol'].lower()}/{year}.pdf"
    
    async def _download_company_reports(self, company: Dict) -> List[Dict]:
        """Download all reports for a single company"""
        Logger.info(f"Processing reports for {company['name']} ({company['symbol']})")
        
        current_year = datetime.now().year
        years = [current_year - 1, current_year - 2, current_year - 3]  # Last 3 years
        
        results = []
        
        for year in years:
            url = self._generate_report_url(company, year)
            file_name = f"{company['symbol']}_{year}_annual_report.pdf"
            file_path = Config.DOWNLOAD_DIR / file_name
            
            # Check if file already exists
            if file_path.exists():
                Logger.debug(f"File already exists: {file_name}")
                results.append({"year": year, "url": url, "file_path": str(file_path), "status": "EXISTS"})
                continue
            
            async with HTTPClient() as client:
                result = await client.download(url, file_path)
            
            if result["success"]:
                results.append({"year": year, "url": url, "file_path": result["file_path"], "status": "DOWNLOADED"})
            else:
                results.append({"year": year, "url": url, "error": result["error"], "status": "FAILED"})
        
        return results
    
    async def _download_all_reports(self):
        """Download reports for all companies"""
        Logger.info("Starting bulk download of annual reports")
        
        # Process companies in batches to avoid overwhelming the server
        semaphore = asyncio.Semaphore(Config.CONCURRENT_DOWNLOADS)
        
        async def download_with_semaphore(company):
            async with semaphore:
                return await self._download_company_reports(company)
        
        tasks = [download_with_semaphore(company) for company in self.companies]
        batch_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for result in batch_results:
            if isinstance(result, Exception):
                Logger.error("Batch download failed", {"error": str(result)})
            else:
                self.download_results.extend(result)
    
    def _generate_report(self) -> Dict:
        """Generate download report"""
        total_downloads = len(self.download_results)
        successful = len([r for r in self.download_results if r["status"] == "DOWNLOADED"])
        failed = len([r for r in self.download_results if r["status"] == "FAILED"])
        existing = len([r for r in self.download_results if r["status"] == "EXISTS"])
        
        return {
            "summary": {
                "total_companies": len(self.companies),
                "total_downloads": total_downloads,
                "successful": successful,
                "failed": failed,
                "existing": existing,
                "success_rate": f"{(successful / total_downloads * 100):.2f}%" if total_downloads > 0 else "0%",
            },
            "failed_downloads": [r for r in self.download_results if r["status"] == "FAILED"],
            "timestamp": datetime.now().isoformat(),
        }
    
    async def _save_report(self, report: Dict):
        """Save download report to file"""
        report_path = Config.DOWNLOAD_DIR / "download_report.json"
        async with aiofiles.open(report_path, 'w') as file:
            await file.write(json.dumps(report, indent=2))
        Logger.info(f"Report saved to: {report_path}")
    
    async def run(self) -> Dict:
        """Main execution method"""
        try:
            await self.initialize()
            await self._download_all_reports()
            
            report = self._generate_report()
            await self._save_report(report)
            
            Logger.info("Download process completed successfully")
            Logger.info(f"Summary: {report['summary']['successful']} downloaded, "
                       f"{report['summary']['failed']} failed, "
                       f"{report['summary']['existing']} already existed")
            
            return report
        except Exception as error:
            Logger.error("Download process failed", {"error": str(error)})
            raise

async def main():
    """CLI interface"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="FinSathi AI - NEPSE Annual Report Downloader"
    )
    parser.add_argument("--help", "-h", action="help", help="Show this help message")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be downloaded without actually downloading")
    parser.add_argument("--companies", help="Comma-separated list of company symbols")
    parser.add_argument("--years", help="Comma-separated list of years")
    
    args = parser.parse_args()
    
    scraper = NEPSEScraper()
    
    # Filter companies if specified
    if args.companies:
        symbols = [s.strip().upper() for s in args.companies.split(",")]
        scraper.companies = [c for c in scraper.companies if c["symbol"] in symbols]
        Logger.info(f"Filtered to {len(scraper.companies)} companies: {symbols}")
    
    try:
        if args.dry_run:
            Logger.info("DRY RUN: No files will be downloaded")
            # TODO: Implement dry run logic
        else:
            await scraper.run()
        return 0
    except Exception as error:
        Logger.error("Script failed", {"error": str(error)})
        return 1

if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
