import re
import pandas as pd
import numpy as np

VALID_PREFIXES = ('0300', '0301', '0302', '0305', '0312', '0315', '0321', '0322', '0333', '0334', '0345', '0346')
HOUSE_REGEX = re.compile(r'\b(house|flat|h#|f#|plot|banglow|bungalow|room|floor|makan)\b', re.I)
STREET_REGEX = re.compile(r'\b(street|gali|lane|sector|block|phase|mohallah|chowk|road|st#)\b', re.I)
LANDMARK_REGEX = re.compile(r'\b(near|opp|opposite|behind|adjacent|masjid|mosque|bank|hospital|school|college|bazar|market|pump|stop)\b', re.I)

CITY_TIERS = {
    'Islamabad': 1, 'Lahore': 1, 'Karachi': 1, 'Rawalpindi': 1,
    'Sialkot': 2, 'Gujranwala': 2, 'Faisalabad': 2, 'Multan': 2, 'Hyderabad': 2, 'Peshawar': 2, 'Quetta': 2,
    'Dera Ismail Khan': 3, 'Turbat': 3, 'Muzaffarabad': 3, 'Sukkur': 3
}

def extract_features_from_row(order: dict) -> dict:
    """Extracts ML input feature vector from a single order dictionary."""
    address = str(order.get('shipping_address', '')).strip().lower()
    phone = re.sub(r'\D', '', str(order.get('customer_phone', '')))
    city = str(order.get('city', 'Other')).strip()
    cod_amount = float(order.get('cod_amount', 0.0))
    order_hour = int(order.get('order_hour', 14))
    is_repeat = int(order.get('is_repeat_customer', 0))
    
    # 1. Address features
    words = address.split()
    word_count = len(words)
    char_count = len(address)
    has_house = 1 if HOUSE_REGEX.search(address) else 0
    has_street = 1 if STREET_REGEX.search(address) else 0
    has_landmark = 1 if LANDMARK_REGEX.search(address) else 0
    
    # Address completeness heuristic (0 to 1)
    completeness_score = (has_house * 0.4) + (has_street * 0.35) + (has_landmark * 0.25)
    if word_count < 4:
        completeness_score *= 0.5
        
    # 2. Phone Sanity
    phone_len_valid = 1 if len(phone) == 11 else 0
    prefix_valid = 1 if phone.startswith(VALID_PREFIXES) else 0
    phone_valid = 1 if (phone_len_valid and prefix_valid) else 0
    
    # 3. City & Geo Tier
    city_tier = CITY_TIERS.get(city, 2)
    
    # 4. Value & Time Anomaly
    is_high_value = 1 if cod_amount >= 12000 else 0
    is_midnight = 1 if order_hour in [0, 1, 2, 3, 4] else 0
    
    return {
        'city_tier': city_tier,
        'cod_amount': cod_amount,
        'order_hour': order_hour,
        'is_repeat_customer': is_repeat,
        'word_count': word_count,
        'char_count': char_count,
        'has_house': has_house,
        'has_street': has_street,
        'has_landmark': has_landmark,
        'completeness_score': completeness_score,
        'phone_valid': phone_valid,
        'is_high_value': is_high_value,
        'is_midnight': is_midnight
    }

def prepare_feature_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Batch processes dataframe into feature matrix."""
    records = df.to_dict('records')
    features = [extract_features_from_row(r) for r in records]
    return pd.DataFrame(features)
