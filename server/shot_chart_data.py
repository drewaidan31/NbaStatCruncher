#!/usr/bin/env python3

import json
import sys
try:
    from nba_api.stats.endpoints import shotchartdetail
    import pandas as pd
    NBA_API_AVAILABLE = True
except ImportError:
    NBA_API_AVAILABLE = False

def get_player_shot_chart(player_id, season='2024-25'):
    """Get detailed shot chart data for a player"""
    try:
        if not NBA_API_AVAILABLE:
            print("NBA API not available", file=sys.stderr)
            return None
            
        # Get shot chart data
        shot_chart = shotchartdetail.ShotChartDetail(
            team_id=0,
            player_id=player_id,
            season_nullable=season,
            context_measure_simple='FGA'
        )
        
        df = shot_chart.get_data_frames()[0]
        
        if df.empty:
            return {
                'shots': [],
                'summary': {
                    'totalAttempts': 0,
                    'totalMakes': 0,
                    'fieldGoalPercentage': 0,
                    'averageDistance': 0,
                    'zoneBreakdown': {}
                }
            }
        
        # Process shot data
        shots = []
        for _, row in df.iterrows():
            shot = {
                'gameId': str(row['GAME_ID']),
                'playerId': int(row['PLAYER_ID']),
                'playerName': row['PLAYER_NAME'],
                'period': int(row['PERIOD']),
                'eventType': row['EVENT_TYPE'],
                'actionType': row['ACTION_TYPE'],
                'shotType': row['SHOT_TYPE'],
                'shotZoneBasic': row['SHOT_ZONE_BASIC'],
                'shotZoneArea': row['SHOT_ZONE_AREA'],
                'shotZoneRange': row['SHOT_ZONE_RANGE'],
                'shotDistance': float(row['SHOT_DISTANCE']) if row['SHOT_DISTANCE'] else 0,
                'locX': float(row['LOC_X']) if row['LOC_X'] else 0,
                'locY': float(row['LOC_Y']) if row['LOC_Y'] else 0,
                'shotAttempted': bool(row['SHOT_ATTEMPTED_FLAG']),
                'shotMade': bool(row['SHOT_MADE_FLAG']),
                'gameDate': str(row['GAME_DATE'])
            }
            shots.append(shot)
        
        # Calculate summary statistics
        total_attempts = len(shots)
        total_makes = sum(1 for shot in shots if shot['shotMade'])
        fg_percentage = (total_makes / total_attempts * 100) if total_attempts > 0 else 0
        avg_distance = sum(shot['shotDistance'] for shot in shots) / total_attempts if total_attempts > 0 else 0
        
        # Zone breakdown
        zones = {}
        for shot in shots:
            zone = shot['shotZoneBasic']
            if zone not in zones:
                zones[zone] = {'attempts': 0, 'makes': 0, 'percentage': 0}
            zones[zone]['attempts'] += 1
            if shot['shotMade']:
                zones[zone]['makes'] += 1
                
        # Calculate zone percentages
        for zone in zones:
            if zones[zone]['attempts'] > 0:
                zones[zone]['percentage'] = (zones[zone]['makes'] / zones[zone]['attempts']) * 100
        
        return {
            'shots': shots,
            'summary': {
                'totalAttempts': total_attempts,
                'totalMakes': total_makes,
                'fieldGoalPercentage': fg_percentage,
                'averageDistance': avg_distance,
                'zoneBreakdown': zones
            }
        }
        
    except Exception as e:
        print(f"Error fetching shot chart data: {e}", file=sys.stderr)
        return None

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python shot_chart_data.py <player_id> <season>", file=sys.stderr)
        sys.exit(1)
    
    player_id = int(sys.argv[1])
    season = sys.argv[2]
    
    shot_data = get_player_shot_chart(player_id, season)
    
    if shot_data:
        print(json.dumps(shot_data))
    else:
        print(json.dumps({'error': 'Failed to fetch shot chart data'}))