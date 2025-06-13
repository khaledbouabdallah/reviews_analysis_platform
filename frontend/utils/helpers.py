from typing import Dict, Any, Optional


def get_item_id(item: Dict[str, Any]) -> Optional[str]:
    """Get ID from item, handling both 'id' and '_id' fields"""
    return item.get("id", item.get("_id"))


def format_date(date_string: str) -> str:
    """Format date string for display"""
    if not date_string:
        return "Unknown"
    return date_string[:10] if len(date_string) > 10 else date_string


def truncate_text(text: str, max_length: int = 50) -> str:
    """Truncate text to max length with ellipsis"""
    if len(text) <= max_length:
        return text
    return text[: max_length - 3] + "..."
