"""
FinSathi AI - Financial Data Normalization
Utility functions for cleaning and normalizing financial values extracted from PDFs
"""

import re
import json
from typing import Union, Optional, Dict, List, Any, Tuple
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from concurrent.futures import ThreadPoolExecutor, as_completed

@dataclass
class NormalizationConfig:
    """Configuration for financial value normalization"""
    default_value: float = 0.0
    allow_negative: bool = True
    round_to: Optional[int] = 2
    remove_currency: bool = True

class FinancialNormalizer:
    """Main class for financial data normalization"""
    
    # Nepali currency patterns
    CURRENCY_PATTERNS = [
        r'NPR',
        r'Rs\.?',
        r'रू\s*\.?',  # Devanagari Rs
        r'₹',  # Indian Rupee
        r'\$',  # Dollar
        r'€',  # Euro
        r'£',  # Pound
        r'¥',  # Yen/Yuan
        r'रु\.?',  # Devanagari Rupee
        r'रू',  # Devanagari
    ]
    
    # Nepali number words
    NUMBER_WORDS = {
        'LAKH': 100000,
        'LAKHS': 100000,
        'CRORE': 10000000,
        'CRORES': 10000000,
        'ARAB': 1000000000,
        'ARABS': 1000000000,
        'KARB': 1000000000,
        'KARBS': 1000000000,
    }
    
    # Devanagari digit mapping
    DEVANAGARI_DIGITS = {
        '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
        '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
    }
    
    # Validation rules
    VALIDATION_RULES = {
        'revenue': {'min': 0, 'max': 1000000000000, 'required': True},
        'netProfit': {'min': -100000000000, 'max': 100000000000, 'required': True},
        'totalAssets': {'min': 0, 'max': 1000000000000, 'required': True},
        'totalEquity': {'min': 0, 'max': 1000000000000, 'required': True},
        'totalDebt': {'min': 0, 'max': 1000000000000, 'required': True},
    }
    
    def __init__(self, config: Optional[NormalizationConfig] = None):
        self.config = config or NormalizationConfig()
    
    def normalize_financial_value(self, value: Union[str, int, float, None]) -> Optional[float]:
        """
        Main normalization function for financial values
        
        Args:
            value: Raw value from PDF extraction
            
        Returns:
            Normalized numeric value or None if invalid
        """
        # Handle null/undefined/empty values
        if value is None or value == '':
            return self.config.default_value
        
        # Convert to string for processing
        string_value = str(value).strip()
        
        # Remove currency symbols and text
        if self.config.remove_currency:
            string_value = self._remove_currency_symbols(string_value)
        
        # Handle parentheses for negative numbers
        string_value = self._handle_parentheses(string_value)
        
        # Remove commas and other formatting
        string_value = self._remove_formatting(string_value)
        
        # Handle Nepali number formats
        string_value = self._convert_devanagari_digits(string_value)
        
        # Check for Nepali lakh/crore notation
        lakh_crore_result = self._handle_nepali_notation(string_value)
        if lakh_crore_result is not None:
            return lakh_crore_result
        
        # Convert to number
        try:
            numeric_value = float(string_value)
        except ValueError:
            return self.config.default_value
        
        # Handle invalid numbers
        if not isinstance(numeric_value, (int, float)) or str(numeric_value).lower() == 'nan':
            return self.config.default_value
        
        # Handle negative numbers
        if not self.config.allow_negative and numeric_value < 0:
            numeric_value = abs(numeric_value)
        
        # Round if specified
        if self.config.round_to is not None:
            numeric_value = self._round(numeric_value, self.config.round_to)
        
        return numeric_value
    
    def _remove_currency_symbols(self, value: str) -> str:
        """Remove currency symbols and text"""
        cleaned = value
        
        # Remove currency symbols
        for pattern in self.CURRENCY_PATTERNS:
            cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)
        
        # Remove currency words
        currency_words = [
            r'\bnpr\b',
            r'\brupees?\b',
            r'\bdollars?\b',
            r'\beuros?\b',
            r'\bpounds?\b',
            r'\byen\b',
            r'\bरुपैयाँ?\b',
            r'\bरू\b',
        ]
        
        for pattern in currency_words:
            cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)
        
        return cleaned.strip()
    
    def _handle_parentheses(self, value: str) -> str:
        """Handle parentheses for negative numbers"""
        # Handle (1,200,000) -> -1,200,000
        parentheses_pattern = r'^\(([\d,\.\s-]+)\)$'
        match = re.match(parentheses_pattern, value.strip())
        
        if match:
            return '-' + match.group(1)
        
        return value
    
    def _remove_formatting(self, value: str) -> str:
        """Remove formatting characters"""
        # Remove commas, spaces, and other formatting
        return re.sub(r'[,\s]', '', value).strip()
    
    def _convert_devanagari_digits(self, value: str) -> str:
        """Convert Devanagari digits to Arabic digits"""
        converted = value
        for devanagari, arabic in self.DEVANAGARI_DIGITS.items():
            converted = converted.replace(devanagari, arabic)
        return converted
    
    def _handle_nepali_notation(self, value: str) -> Optional[float]:
        """Handle Nepali lakh/crore notation"""
        value_upper = value.upper().strip()
        
        for word, multiplier in self.NUMBER_WORDS.items():
            pattern = rf'([\d,\.]+)\s*{word}'
            match = re.search(pattern, value_upper)
            
            if match:
                number = self.normalize_financial_value(match.group(1))
                if number is not None:
                    return number * multiplier
        
        return None
    
    def _round(self, value: float, decimals: int) -> float:
        """Round number to specified decimal places"""
        multiplier = 10 ** decimals
        return round(value * multiplier) / multiplier
    
    def normalize_financial_data(self, data: Dict[str, Any], fields: List[str]) -> Dict[str, Any]:
        """
        Batch normalize multiple financial fields
        
        Args:
            data: Object with financial fields
            fields: Array of field names to normalize
            
        Returns:
            Object with normalized values
        """
        normalized = data.copy()
        
        for field in fields:
            if field in data:
                normalized[field] = self.normalize_financial_value(data[field])
        
        return normalized
    
    def validate_and_normalize(self, financial_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate and normalize financial statement data
        
        Args:
            financial_data: Raw financial statement data
            
        Returns:
            Dictionary with validation results and normalized data
        """
        required_fields = [
            'revenue', 'netProfit', 'totalAssets', 'totalEquity', 'totalDebt'
        ]
        
        normalized = self.normalize_financial_data(financial_data, required_fields)
        errors = []
        warnings = []
        
        # Validate each field
        for field, rules in self.VALIDATION_RULES.items():
            value = normalized.get(field)
            
            if rules['required'] and value is None:
                errors.append(f"{field} is required but missing")
                continue
            
            if isinstance(value, (int, float)):
                if value < rules['min']:
                    errors.append(f"{field} ({value}) is below minimum ({rules['min']})")
                if value > rules['max']:
                    warnings.append(f"{field} ({value}) seems unusually high")
        
        # Business logic validation
        assets = normalized.get('totalAssets')
        equity = normalized.get('totalEquity')
        debt = normalized.get('totalDebt')
        
        if all(isinstance(v, (int, float)) for v in [assets, equity, debt]):
            if equity + debt > assets * 1.1:
                warnings.append('Equity + Debt exceeds Assets (possible data error)')
        
        return {
            'data': normalized,
            'valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings,
        }
    
    def create_normalization_pipeline(self, raw_data: List[Dict[str, Any]], 
                                options: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Create normalization pipeline for batch processing
        
        Args:
            raw_data: Array of raw financial data objects
            options: Pipeline options
            
        Returns:
            Processing results with summary
        """
        opts = options or {}
        fields = opts.get('fields', [
            'revenue', 'netProfit', 'totalAssets', 'totalEquity', 'totalDebt'
        ])
        parallel = opts.get('parallel', False)
        on_progress = opts.get('on_progress')
        
        results = {
            'processed': [],
            'errors': [],
            'summary': {
                'total': len(raw_data),
                'successful': 0,
                'failed': 0,
                'warnings': 0,
            }
        }
        
        def process_item(item: Dict[str, Any], index: int) -> None:
            try:
                validation = self.validate_and_normalize(item)
                
                if validation['valid']:
                    results['processed'].append(validation['data'])
                    results['summary']['successful'] += 1
                else:
                    results['errors'].append({
                        'index': index,
                        'item': item,
                        'errors': validation['errors'],
                    })
                    results['summary']['failed'] += 1
                
                if validation['warnings']:
                    results['summary']['warnings'] += len(validation['warnings'])
                
                if on_progress:
                    on_progress(index + 1, len(raw_data), validation)
                    
            except Exception as error:
                results['errors'].append({
                    'index': index,
                    'item': item,
                    'error': str(error),
                })
                results['summary']['failed'] += 1
        
        if parallel:
            # Process items in parallel
            with ThreadPoolExecutor(max_workers=4) as executor:
                futures = [
                    executor.submit(process_item, item, index)
                    for index, item in enumerate(raw_data)
                ]
                
                for future in as_completed(futures):
                    future.result()  # Wait for completion
        else:
            # Process items sequentially
            for index, item in enumerate(raw_data):
                process_item(item, index)
        
        return results

# Convenience functions for direct usage
def normalize_financial_value(value: Union[str, int, float, None], 
                         config: Optional[NormalizationConfig] = None) -> Optional[float]:
    """Convenience function for single value normalization"""
    normalizer = FinancialNormalizer(config)
    return normalizer.normalize_financial_value(value)

def normalize_financial_data(data: Dict[str, Any], 
                         fields: List[str],
                         config: Optional[NormalizationConfig] = None) -> Dict[str, Any]:
    """Convenience function for batch normalization"""
    normalizer = FinancialNormalizer(config)
    return normalizer.normalize_financial_data(data, fields)

def normalize_nepali_number(value: str) -> Optional[float]:
    """Specialized function for Nepali number formats"""
    normalizer = FinancialNormalizer()
    return normalizer.normalize_financial_value(value)

# Example usage and testing
if __name__ == "__main__":
    # Test examples
    test_values = [
        "1,200,000",
        "NPR 1,200,000",
        "(1,200,000)",
        "रू १,२०,०००",
        "1.2 LAKH",
        "12 CRORE",
        "Rs. 1,200,000.50",
        "",
        None,
        "N/A",
    ]
    
    normalizer = FinancialNormalizer()
    
    print("Financial Value Normalization Test Results:")
    print("=" * 50)
    
    for test_value in test_values:
        result = normalizer.normalize_financial_value(test_value)
        print(f"'{test_value}' -> {result}")
    
    # Test batch processing
    print("\nBatch Processing Test:")
    print("=" * 50)
    
    test_data = [
        {
            "revenue": "1,200,000",
            "netProfit": "(120,000)",
            "totalAssets": "2.5 CRORE",
            "totalEquity": "NPR 800,000",
            "totalDebt": "400,000",
        },
        {
            "revenue": "रू १,५०,०००",
            "netProfit": "150,000",
            "totalAssets": "3 CRORE",
            "totalEquity": "1 LAKH",
            "totalDebt": "500,000",
        },
    ]
    
    results = normalizer.create_normalization_pipeline(test_data)
    
    print(f"Total processed: {results['summary']['total']}")
    print(f"Successful: {results['summary']['successful']}")
    print(f"Failed: {results['summary']['failed']}")
    print(f"Warnings: {results['summary']['warnings']}")
    
    print("\nNormalized Data:")
    for item in results['processed']:
        print(json.dumps(item, indent=2))
