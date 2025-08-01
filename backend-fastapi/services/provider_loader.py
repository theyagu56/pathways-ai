import os
import json
from fastapi import HTTPException
from typing import List, Dict

_provider_cache = None

def clear_provider_cache():
    """Clear the provider cache to force reload of data"""
    global _provider_cache
    _provider_cache = None

def get_providers() -> List[Dict]:
    global _provider_cache
    if _provider_cache is not None:
        return _provider_cache
    possible_paths = [
        "../shared-data/providers.json",
        "./shared-data/providers.json",
        "/Users/thiyagarajankamalakannan/Projects/pathways-ai/shared-data/providers.json",
        "../../shared-data/providers.json",
        "./providers.json",  # Current directory
        "providers.json"     # Current directory (relative)
    ]
    for path in possible_paths:
        if os.path.exists(path):
            with open(path, "r") as f:
                _provider_cache = json.load(f)
                return _provider_cache
    raise HTTPException(status_code=500, detail="Provider data file not found.") 