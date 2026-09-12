import random
import re
import pandas as pd
import numpy as np
import os

CITIES = {
    'Karachi': {'tier': 1, 'base_rto': 0.18, 'lat': 24.8607, 'lon': 67.0011},
    'Lahore': {'tier': 1, 'base_rto': 0.16, 'lat': 31.5204, 'lon': 74.3587},
    'Islamabad': {'tier': 1, 'base_rto': 0.12, 'lat': 33.6844, 'lon': 73.0479},
    'Rawalpindi': {'tier': 1, 'base_rto': 0.19, 'lat': 33.5651, 'lon': 73.0169},
    'Faisalabad': {'tier': 2, 'base_rto': 0.28, 'lat': 31.4504, 'lon': 73.1350},
    'Multan': {'tier': 2, 'base_rto': 0.30, 'lat': 30.1575, 'lon': 71.5249},
    'Peshawar': {'tier': 2, 'base_rto': 0.34, 'lat': 34.0151, 'lon': 71.5249},
    'Sialkot': {'tier': 2, 'base_rto': 0.24, 'lat': 32.4945, 'lon': 74.5229},
    'Gujranwala': {'tier': 2, 'base_rto': 0.27, 'lat': 32.1877, 'lon': 74.1945},
    'Hyderabad': {'tier': 2, 'base_rto': 0.32, 'lat': 25.3960, 'lon': 68.3578},
    'Quetta': {'tier': 2, 'base_rto': 0.38, 'lat': 30.1798, 'lon': 66.9750},
    'Dera Ismail Khan': {'tier': 3, 'base_rto': 0.48, 'lat': 31.8626, 'lon': 70.9019},
    'Turbat': {'tier': 3, 'base_rto': 0.55, 'lat': 26.0031, 'lon': 63.0544},
    'Muzaffarabad': {'tier': 3, 'base_rto': 0.42, 'lat': 34.3700, 'lon': 73.4711},
    'Sukkur': {'tier': 3, 'base_rto': 0.40, 'lat': 27.7052, 'lon': 68.8574}
}

VALID_PREFIXES = ['0300', '0301', '0302', '0305', '0312', '0315', '0321', '0322', '0333', '0334', '0345', '0346']
INVALID_PREFIXES = ['0399', '0388', '0377', '0366']

STREET_TYPES = ['Street', 'Gali', 'Lane', 'Sector', 'Block', 'Phase', 'Mohallah', 'Chowk']
LANDMARKS = ['near Jamia Masjid', 'opposite Meezan Bank', 'behind Shell Pump', 'near Government College', 'adjacent to General Hospital', 'near City Bakery']

FIRST_NAMES = ['Muhammad', 'Ali', 'Ahmed', 'Usman', 'Bilal', 'Fatima', 'Ayesha', 'Zainab', 'Hamza', 'Saad', 'Omar', 'Sana', 'Hassan', 'Zubair', 'Maryam']
LAST_NAMES = ['Khan', 'Malik', 'Chaudhry', 'Sheikh', 'Bhatti', 'Ansari', 'Siddiqui', 'Qureshi', 'Shah', 'Mughal', 'Rehman', 'Tariq']

def generate_order(order_id):
    city_name = random.choices(list(CITIES.keys()), weights=[25, 20, 10, 10, 8, 6, 5, 4, 4, 3, 2, 1, 1, 1, 1])[0]
    city_meta = CITIES[city_name]
    customer_name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
    
    is_fake_phone = random.random() < 0.08
    if is_fake_phone:
        prefix = random.choice(INVALID_PREFIXES)
        phone = f"{prefix}{random.randint(100000, 9999999)}"
    else:
        prefix = random.choice(VALID_PREFIXES)
        phone = f"{prefix}{random.randint(1000000, 9999999)}"
        
    addr_quality = random.choices(['complete', 'vague', 'gibberish'], weights=[0.60, 0.32, 0.08])[0]
    
    if addr_quality == 'complete':
        house_num = f"House #{random.randint(1, 450)}"
        street = f"{random.choice(STREET_TYPES)} #{random.randint(1, 35)}"
        landmark = random.choice(LANDMARKS)
        address = f"{house_num}, {street}, {landmark}, {city_name}"
    elif addr_quality == 'vague':
        landmark = random.choice(LANDMARKS)
        address = f"{landmark}, {city_name}"
    else:
        address = random.choice(['main bazar', 'home', 'shop', 'near bridge', 'call on arrival', 'deliver at office'])
        
    cod_amount = round(random.choice([
        random.uniform(900, 3500),
        random.uniform(3500, 8500),
        random.uniform(8500, 28000)
    ]), -1)
    
    order_hour = random.choices(range(24), weights=[2, 1, 1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 8, 7, 7, 8, 8, 9, 10, 11, 10, 8, 5, 3])[0]
    is_repeat = random.random() < 0.22
    
    rto_prob = city_meta['base_rto']
    if addr_quality == 'vague':
        rto_prob += 0.25
    elif addr_quality == 'gibberish':
        rto_prob += 0.55
        
    if is_fake_phone:
        rto_prob += 0.40
        
    if cod_amount > 15000:
        rto_prob += 0.18
    elif cod_amount < 2500:
        rto_prob -= 0.05
        
    if order_hour in [1, 2, 3, 4]:
        rto_prob += 0.12
        
    if is_repeat:
        rto_prob -= 0.20
        
    rto_prob = np.clip(rto_prob, 0.02, 0.98)
    delivery_success = 1 if random.random() > rto_prob else 0
    
    lat = city_meta['lat'] + random.uniform(-0.04, 0.04)
    lon = city_meta['lon'] + random.uniform(-0.04, 0.04)
    
    return {
        'order_id': f"ORD-PK-{order_id:05d}",
        'customer_name': customer_name,
        'customer_phone': phone,
        'shipping_address': address,
        'city': city_name,
        'city_tier': city_meta['tier'],
        'cod_amount': cod_amount,
        'order_hour': order_hour,
        'is_repeat_customer': int(is_repeat),
        'latitude': round(lat, 5),
        'longitude': round(lon, 5),
        'delivery_success': delivery_success
    }

def main():
    print('Generating 10,000 synthetic Pakistani orders...')
    random.seed(42)
    np.random.seed(42)
    
    orders = [generate_order(i) for i in range(1, 10001)]
    df = pd.DataFrame(orders)
    os.makedirs('ml_service/data', exist_ok=True)
    out_path = 'ml_service/data/pakistan_orders_synthetic_10k.csv'
    df.to_csv(out_path, index=False)
    print(f'Successfully generated 10,000 orders to {out_path}! Baseline delivery success rate: {df["delivery_success"].mean()*100:.2f}%')

if __name__ == '__main__':
    main()
