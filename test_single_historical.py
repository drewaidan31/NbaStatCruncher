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

def test_single_historical_season():
    """Test if our existing function can process a historical season"""
    
    print("Testing 1996-97 season with existing function...")
    
    try:
        # Use our existing function to get 1996-97 data
        players_data = get_nba_players_from_api('1996-97')
        
        if players_data and len(players_data) > 0:
            print(f"✓ Success: {len(players_data)} players processed")
            
            # Check the structure of first player
            sample_player = players_data[0]
            print(f"Sample player structure:")
            print(f"  Name: {sample_player.get('name', 'N/A')}")
            print(f"  Team: {sample_player.get('team', 'N/A')}")
            print(f"  Points: {sample_player.get('points', 'N/A')}")
            print(f"  Games: {sample_player.get('gamesPlayed', 'N/A')}")
            
            # Check if it has the same fields as current players
            required_fields = ['playerId', 'name', 'team', 'position', 'gamesPlayed', 
                             'points', 'assists', 'rebounds', 'steals', 'blocks', 
                             'turnovers', 'fieldGoalPercentage', 'threePointPercentage', 
                             'freeThrowPercentage', 'plusMinus']
            
            missing_fields = []
            for field in required_fields:
                if field not in sample_player:
                    missing_fields.append(field)
            
            if missing_fields:
                print(f"⚠️  Missing fields: {missing_fields}")
                return False
            else:
                print("✓ All required fields present")
                return True
        else:
            print("✗ No data returned")
            return False
            
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_single_historical_season()
    if success:
        print("\n✓ Historical season processing works with existing function!")
    else:
        print("\n✗ Historical season processing failed")