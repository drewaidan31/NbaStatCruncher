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

def get_current_players():
    """Get current players from API to avoid duplicates"""
    try:
        response = os.popen('curl -s "http://localhost:5000/api/nba/players"').read()
        current_players = json.loads(response)
        current_names = {player['name'] for player in current_players}
        print(f"Found {len(current_names)} current players to exclude")
        return current_names
    except:
        print("Could not fetch current players, proceeding anyway")
        return set()

def get_unique_historical_legends():
    """Get top 10 players from each historical season (1996-2010) NOT in current dataset"""
    
    current_player_names = get_current_players()
    
    # Focus on earlier historical seasons where players are more likely to be unique
    historical_seasons = ['2004-05', '2003-04', '2002-03', '2001-02', '2000-01', '1999-00', 
                         '1998-99', '1997-98', '1996-97']
    
    legend_candidates = {}
    
    for season in historical_seasons:
        print(f"Sampling legends from {season}...")
        try:
            player_stats = leaguedashplayerstats.LeagueDashPlayerStats(
                season=season,
                season_type_all_star='Regular Season'
            )
            
            df = player_stats.get_data_frames()[0]
            
            # Filter for meaningful contributors
            df = df[(df['GP'] >= 15) & (df['PTS'] >= 6)]
            df = df.sort_values('PTS', ascending=False).head(15)  # Top 15 per season for better selection
            
            for _, row in df.iterrows():
                player_name = row['PLAYER_NAME']
                player_id = int(row['PLAYER_ID'])
                ppg = float(row['PTS']) / float(row['GP'])
                
                # Skip if player is in current dataset
                if player_name in current_player_names:
                    continue
                
                if player_name not in legend_candidates:
                    legend_candidates[player_name] = {
                        'playerId': player_id,
                        'name': player_name,
                        'peak_ppg': ppg,
                        'peak_season': season
                    }
                elif ppg > legend_candidates[player_name]['peak_ppg']:
                    legend_candidates[player_name]['peak_ppg'] = ppg
                    legend_candidates[player_name]['peak_season'] = season
                    
        except Exception as e:
            print(f"Error sampling {season}: {e}")
            continue
    
    # Return all unique historical players (should be ~140 total)
    top_legends = sorted(legend_candidates.values(), 
                        key=lambda x: x['peak_ppg'], reverse=True)
    
    print(f"\nUnique historical players identified: {len(top_legends)}")
    for i, legend in enumerate(top_legends[:10]):  # Show top 10
        print(f"{i+1:2d}. {legend['name']}: {legend['peak_ppg']:.1f} PPG in {legend['peak_season']}")
    
    return top_legends

def fetch_legend_peak_seasons(legends):
    """Fetch only peak seasons for each legend to minimize API calls"""
    
    legend_data = []
    
    # Group legends by their peak season to minimize API calls
    seasons_to_fetch = {}
    for legend in legends:
        peak_season = legend['peak_season']
        if peak_season not in seasons_to_fetch:
            seasons_to_fetch[peak_season] = []
        seasons_to_fetch[peak_season].append(legend)
    
    print(f"Fetching peak season data from {len(seasons_to_fetch)} seasons...")
    
    for season, season_legends in seasons_to_fetch.items():
        print(f"Processing {season} for {len(season_legends)} legends...")
        try:
            player_stats = leaguedashplayerstats.LeagueDashPlayerStats(
                season=season,
                season_type_all_star='Regular Season'
            )
            
            df = player_stats.get_data_frames()[0]
            
            for legend in season_legends:
                player_data = df[df['PLAYER_ID'] == legend['playerId']]
                
                if len(player_data) > 0:
                    row = player_data.iloc[0]
                    games_played = int(row['GP']) if row['GP'] > 0 else 1
                    
                    # Create player entry with peak season data
                    legend_profile = {
                        'playerId': legend['playerId'],
                        'name': legend['name'],
                        'team': row['TEAM_ABBREVIATION'],
                        'position': 'G',  # Simplified
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
                        'plusMinus': float(row['PLUS_MINUS']) / games_played if row['PLUS_MINUS'] else 0.0,
                        'currentSeason': season,
                        'seasons': [{
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
                        }],
                        'availableSeasons': [season]
                    }
                    
                    legend_data.append(legend_profile)
                    
        except Exception as e:
            print(f"Error processing {season}: {e}")
            continue
    
    print(f"Successfully processed {len(legend_data)} historical legends")
    return legend_data

if __name__ == "__main__":
    print("Adding 100 unique historical legends to NBA dataset...")
    
    # Get unique historical legends
    legends = get_unique_historical_legends()
    
    if not legends:
        print("No unique historical legends found")
        sys.exit(1)
    
    # Fetch their peak season data
    legend_data = fetch_legend_peak_seasons(legends)
    
    if legend_data:
        print(f"\n✓ Successfully prepared {len(legend_data)} historical legends")
        print("This data can be added to the existing dataset")
        
        # Save to file for integration
        with open('historical_legends.json', 'w') as f:
            json.dump(legend_data, f, indent=2)
        
        print("Historical legends saved to historical_legends.json")
    else:
        print("✗ Failed to fetch historical legend data")