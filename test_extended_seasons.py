#!/usr/bin/env python3

import json
import sys
import os
sys.path.append('/home/runner/workspace/server')

try:
    from nba_api.stats.endpoints import leaguedashplayerstats
    import pandas as pd
    NBA_API_AVAILABLE = True
except ImportError:
    NBA_API_AVAILABLE = False
    print("NBA API not available")
    sys.exit(1)

def test_extended_seasons_structure():
    """Test if we can handle extended seasons without breaking data structure"""
    
    # Extended seasons list (1996-2025)
    extended_seasons = [
        '2024-25', '2023-24', '2022-23', '2021-22', '2020-21', '2019-20', 
        '2018-19', '2017-18', '2016-17', '2015-16', '2014-15', '2013-14', 
        '2012-13', '2011-12', '2010-11', '2009-10', '2008-09', '2007-08',
        '2006-07', '2005-06', '2004-05', '2003-04', '2002-03', '2001-02',
        '2000-01', '1999-00', '1998-99', '1997-98', '1996-97'
    ]
    
    print(f"Testing with {len(extended_seasons)} seasons (1996-2025)")
    
    # Test with just a few seasons to see if structure is consistent
    test_seasons = extended_seasons[:5] + [extended_seasons[-1]]  # Recent + 1996-97
    
    all_players = {}
    
    for season in test_seasons:
        print(f"Processing {season}...")
        try:
            player_stats = leaguedashplayerstats.LeagueDashPlayerStats(
                season=season,
                season_type_all_star='Regular Season'
            )
            
            df = player_stats.get_data_frames()[0]
            df = df[df['GP'] >= 10]  # Filter for meaningful data
            
            for _, row in df.iterrows():
                games_played = int(row['GP']) if row['GP'] > 0 else 1
                player_id = int(row['PLAYER_ID'])
                player_name = row['PLAYER_NAME']
                
                season_stats = {
                    'season': season,
                    'team': row['TEAM_ABBREVIATION'],
                    'position': 'G',
                    'gamesPlayed': games_played,
                    'minutesPerGame': float(row['MIN']) / games_played,
                    'points': float(row['PTS']) / games_played,
                    'assists': float(row['AST']) / games_played,
                    'rebounds': float(row['REB']) / games_played,
                    'steals': float(row['STL']) / games_played,
                    'blocks': float(row['BLK']) / games_played,
                    'turnovers': float(row['TOV']) / games_played,
                    'fieldGoalPercentage': float(row['FG_PCT']) if row['FG_PCT'] else 0.0,
                    'threePointPercentage': float(row['FG3_PCT']) if row['FG3_PCT'] else 0.0,
                    'freeThrowPercentage': float(row['FT_PCT']) if row['FT_PCT'] else 0.0,
                    'plusMinus': float(row['PLUS_MINUS']) / games_played if row['PLUS_MINUS'] else 0.0
                }
                
                if player_name not in all_players:
                    all_players[player_name] = {
                        'playerId': player_id,
                        'name': player_name,
                        'seasons': []
                    }
                
                all_players[player_name]['seasons'].append(season_stats)
        
        except Exception as e:
            print(f"Error processing {season}: {str(e)}")
            return False
    
    # Check structure
    multi_season_players = {name: data for name, data in all_players.items() 
                           if len(data['seasons']) >= 2}
    
    print(f"\nFound {len(multi_season_players)} players with multiple seasons")
    
    # Test one player's data structure
    if multi_season_players:
        sample_player_name = list(multi_season_players.keys())[0]
        sample_player = multi_season_players[sample_player_name]
        
        print(f"\nSample player: {sample_player_name}")
        print(f"Seasons: {len(sample_player['seasons'])}")
        
        # Check if all required fields are present
        required_fields = ['season', 'team', 'gamesPlayed', 'points', 'assists', 'rebounds']
        for season_data in sample_player['seasons']:
            missing = [field for field in required_fields if field not in season_data]
            if missing:
                print(f"Missing fields in {season_data['season']}: {missing}")
                return False
        
        print("✓ Data structure consistent across all seasons")
        
        # Show the progression
        for season_data in sorted(sample_player['seasons'], key=lambda x: x['season']):
            print(f"  {season_data['season']}: {season_data['points']:.1f} PPG ({season_data['team']})")
        
        return True
    
    return False

if __name__ == "__main__":
    success = test_extended_seasons_structure()
    if success:
        print("\n✓ Extended seasons data structure works!")
    else:
        print("\n✗ Extended seasons data structure failed")