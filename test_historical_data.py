#!/usr/bin/env python3

import json
import sys
try:
    from nba_api.stats.endpoints import leaguedashplayerstats
    import pandas as pd
    NBA_API_AVAILABLE = True
except ImportError:
    NBA_API_AVAILABLE = False
    print("NBA API not available")
    sys.exit(1)

def test_historical_seasons():
    """Test if we can fetch data from historical seasons"""
    test_seasons = ['1996-97', '2000-01', '2005-06', '2010-11', '2015-16', '2020-21', '2024-25']
    
    results = {}
    
    for season in test_seasons:
        try:
            print(f"Testing season: {season}")
            
            # Try to fetch player stats for this season
            player_stats = leaguedashplayerstats.LeagueDashPlayerStats(
                season=season,
                season_type_all_star='Regular Season'
            )
            
            # Get the data
            df = player_stats.get_data_frames()[0]
            
            # Check if we got meaningful data
            if len(df) > 0:
                results[season] = {
                    'success': True,
                    'player_count': len(df),
                    'sample_players': df['PLAYER_NAME'].head(3).tolist()
                }
                print(f"  ✓ Success: {len(df)} players found")
                print(f"  Sample players: {', '.join(df['PLAYER_NAME'].head(3))}")
            else:
                results[season] = {'success': False, 'error': 'No data returned'}
                print(f"  ✗ No data returned")
                
        except Exception as e:
            results[season] = {'success': False, 'error': str(e)}
            print(f"  ✗ Error: {str(e)}")
    
    return results

if __name__ == "__main__":
    print("Testing NBA API historical data availability...")
    print("=" * 50)
    
    results = test_historical_seasons()
    
    print("\n" + "=" * 50)
    print("SUMMARY:")
    
    successful_seasons = [season for season, data in results.items() if data['success']]
    failed_seasons = [season for season, data in results.items() if not data['success']]
    
    print(f"Successful seasons: {len(successful_seasons)}")
    print(f"Failed seasons: {len(failed_seasons)}")
    
    if successful_seasons:
        print(f"Working seasons: {', '.join(successful_seasons)}")
    
    if failed_seasons:
        print(f"Failed seasons: {', '.join(failed_seasons)}")
        for season in failed_seasons:
            print(f"  {season}: {results[season]['error']}")
    
    print(json.dumps(results, indent=2))