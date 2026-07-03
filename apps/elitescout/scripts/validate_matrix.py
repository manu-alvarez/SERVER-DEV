#!/usr/bin/env python3
import sys
import json
import numpy as np

def main():
    try:
        # Read from stdin
        input_data = sys.stdin.read()
        if not input_data:
            return
            
        products = json.loads(input_data)
        if not isinstance(products, list) or len(products) == 0:
            print(json.dumps([]))
            return
            
        # Extract valid prices and scores
        prices = [p.get('price', {}).get('current', 0) for p in products if p.get('price', {}).get('current', 0) > 0]
        scores = [p.get('opportunityScore', 0) for p in products]
        
        if not prices and not scores:
            for p in products:
                p['isElite'] = False
            print(json.dumps(products))
            return

        # Calculate percentiles
        # Top 10% highest opportunity scores OR bottom 10% lowest prices (of valid prices)
        score_threshold = np.percentile(scores, 90) if scores else 0
        price_threshold = np.percentile(prices, 10) if prices else float('inf')
        
        # Max 2 elite products to prevent grid overflow
        elite_count = 0
        max_elites = 2
        
        # Sort products by score descending to assign elites to the best ones first
        # We need to preserve original indices to reconstruct, or just modify and return
        
        for p in products:
            p['isElite'] = False
            
            price = p.get('price', {}).get('current', 0)
            score = p.get('opportunityScore', 0)
            
            # An item is Elite if its score is in the top 10% AND it has a valid price
            is_high_score = score >= score_threshold and score > 0
            is_low_price = price > 0 and price <= price_threshold
            
            if (is_high_score or is_low_price) and elite_count < max_elites:
                p['isElite'] = True
                elite_count += 1
                
        # If we still have no elites but we have products, just make the #1 product elite
        if elite_count == 0 and len(products) > 0 and products[0].get('price', {}).get('current', 0) > 0:
            products[0]['isElite'] = True
            
        print(json.dumps(products))
        
    except Exception as e:
        # On error, output empty list or original data
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
