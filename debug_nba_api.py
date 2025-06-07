#!/usr/bin/env python3

from nba_api.stats.endpoints import leagueleaders
import pandas as pd

def debug_nba_api_structure():
    """Debug NBA API data structure to fix column mapping"""
    try:
        # Get current season data to see structure
        leaders = leagueleaders.LeagueLeaders(season='2023-24')
        df = leaders.get_data_frames()[0]
        
        print("NBA API Columns:")
        print(df.columns.tolist())
        print("\nFirst few rows:")
        print(df.head(3))
        print("\nData types:")
        print(df.dtypes)
        
        # Check for team column variations
        team_columns = [col for col in df.columns if 'TEAM' in col.upper()]
        print(f"\nTeam-related columns: {team_columns}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_nba_api_structure()