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

def get_top_historical_players():
    """Get top players from key historical seasons (1996-2010)"""
    
    # Key historical seasons to sample from
    historical_seasons = ['2009-10', '2007-08', '2005-06', '2002-03', '1999-00', '1996-97']
    
    # Track all unique players
    all_historical_players = {}
    
    for season in historical_seasons:
        print(f"Sampling top players from {season}...")
        
        try:
            player_stats = leaguedashplayerstats.LeagueDashPlayerStats(
                season=season,
                season_type_all_star='Regular Season'
            )
            
            df = player_stats.get_data_frames()[0]
            
            # Filter for meaningful players (20+ games, 10+ points per game)
            df = df[(df['GP'] >= 20) & (df['PTS'] >= 10)]
            
            # Sort by points and take top players from this season
            df = df.sort_values('PTS', ascending=False).head(30)
            
            for _, row in df.iterrows():
                player_name = row['PLAYER_NAME']
                player_id = int(row['PLAYER_ID'])
                
                if player_name not in all_historical_players:
                    all_historical_players[player_name] = {
                        'playerId': player_id,
                        'name': player_name,
                        'seasons_found': [],
                        'peak_season': season,
                        'peak_points': float(row['PTS']) / float(row['GP'])
                    }
                
                # Track which seasons we found this player in
                all_historical_players[player_name]['seasons_found'].append(season)
                
                # Update peak if this season is better
                ppg = float(row['PTS']) / float(row['GP'])
                if ppg > all_historical_players[player_name]['peak_points']:
                    all_historical_players[player_name]['peak_points'] = ppg
                    all_historical_players[player_name]['peak_season'] = season
                    
        except Exception as e:
            print(f"Error processing {season}: {str(e)}")
            continue
    
    # Sort by peak performance and take top 100
    sorted_players = sorted(all_historical_players.values(), 
                           key=lambda x: x['peak_points'], reverse=True)[:100]
    
    print(f"\nTop 100 historical players identified:")
    for i, player in enumerate(sorted_players[:10]):  # Show top 10
        print(f"{i+1:2d}. {player['name']}: {player['peak_points']:.1f} PPG in {player['peak_season']}")
    
    return sorted_players

if __name__ == "__main__":
    historical_legends = get_top_historical_players()
    print(f"\n✓ Successfully identified {len(historical_legends)} historical players")
    print(f"Data size would be manageable: ~{len(historical_legends)} players vs thousands")