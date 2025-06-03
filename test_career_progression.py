#!/usr/bin/env python3

import json
import sys
import os
sys.path.append('/home/runner/workspace/server')

try:
    from nba_data import get_nba_players_from_api
    NBA_API_AVAILABLE = True
except ImportError:
    NBA_API_AVAILABLE = False
    print("NBA API not available")
    sys.exit(1)

def test_career_progression():
    """Test if we can build complete career progressions for players across multiple seasons"""
    
    # Test with a few seasons to see if we can match players across years
    test_seasons = ['2020-21', '2021-22', '2022-23', '2023-24', '2024-25']
    
    print("Testing career progression across recent seasons...")
    
    # Dictionary to store player data by name
    player_careers = {}
    
    for season in test_seasons:
        print(f"Fetching {season}...")
        try:
            players_data = get_nba_players_from_api(season)
            
            for player in players_data:
                name = player['name']
                
                if name not in player_careers:
                    player_careers[name] = []
                
                # Add this season's data
                player_careers[name].append({
                    'season': season,
                    'team': player['team'],
                    'points': player['points'],
                    'assists': player['assists'],
                    'rebounds': player['rebounds'],
                    'gamesPlayed': player['gamesPlayed']
                })
                
        except Exception as e:
            print(f"Error fetching {season}: {str(e)}")
            return False
    
    # Find players with data in multiple seasons
    multi_season_players = {name: seasons for name, seasons in player_careers.items() 
                           if len(seasons) >= 3}
    
    print(f"\nFound {len(multi_season_players)} players with 3+ seasons of data")
    
    # Show a few examples
    example_players = list(multi_season_players.keys())[:3]
    
    for player_name in example_players:
        seasons = multi_season_players[player_name]
        print(f"\n{player_name}: {len(seasons)} seasons")
        for season_data in seasons:
            print(f"  {season_data['season']}: {season_data['points']:.1f} PPG, {season_data['team']}")
    
    return len(multi_season_players) > 0

if __name__ == "__main__":
    success = test_career_progression()
    if success:
        print("\n✓ Career progression tracking works!")
    else:
        print("\n✗ Career progression tracking failed")