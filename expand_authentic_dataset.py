#!/usr/bin/env python3

import os
import psycopg2
from nba_api.stats.endpoints import leagueleaders, playergamelog
from nba_api.stats.library.parameters import SeasonType
import pandas as pd
import time

def get_db_connection():
    database_url = os.environ.get('DATABASE_URL')
    return psycopg2.connect(database_url)

def get_season_leaders(season):
    """Get top performers for a specific season"""
    try:
        leaders = leagueleaders.LeagueLeaders(
            season=season,
            season_type_all_star=SeasonType.regular
        )
        return leaders.get_data_frames()[0]
    except Exception as e:
        print(f"Error fetching data for {season}: {e}")
        return None

def add_players_to_db(players_df, season, conn):
    """Add players from season to database"""
    cursor = conn.cursor()
    added_count = 0
    
    for _, player in players_df.iterrows():
        try:
            # Check if player already exists for this season
            cursor.execute("""
                SELECT COUNT(*) FROM nba_players 
                WHERE name = %s AND current_season = %s
            """, (player['PLAYER'], season))
            
            if cursor.fetchone()[0] > 0:
                continue
                
            cursor.execute("""
                INSERT INTO nba_players (
                    player_id, name, team, position, games_played, minutes_per_game,
                    points, assists, rebounds, steals, blocks, turnovers,
                    field_goal_percentage, field_goal_attempts, three_point_percentage,
                    three_point_attempts, free_throw_percentage, free_throw_attempts,
                    plus_minus, win_percentage, current_season
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                int(player['PLAYER_ID']),
                player['PLAYER'],
                player['TEAM_ABBREVIATION'],
                'F',  # Default position
                int(player['GP']),
                float(player['MIN']),
                float(player['PTS']),
                float(player['AST']),
                float(player['REB']),
                float(player['STL']),
                float(player['BLK']),
                float(player['TOV']),
                float(player['FG_PCT']) if player['FG_PCT'] else 0.0,
                int(player['FGA']),
                float(player['FG3_PCT']) if player['FG3_PCT'] else 0.0,
                int(player['FG3A']),
                float(player['FT_PCT']) if player['FT_PCT'] else 0.0,
                int(player['FTA']),
                0.0,  # plus_minus placeholder
                0.5,  # win_percentage placeholder
                season
            ))
            added_count += 1
            
        except Exception as e:
            print(f"Error inserting {player['PLAYER']}: {e}")
            continue
    
    conn.commit()
    cursor.close()
    return added_count

def main():
    """Expand database with comprehensive NBA data from 2000-2024"""
    conn = get_db_connection()
    
    # Historical seasons to add
    historical_seasons = [
        '2022-23', '2021-22', '2020-21', '2019-20', '2018-19',
        '2017-18', '2016-17', '2015-16', '2014-15', '2013-14',
        '2012-13', '2011-12', '2010-11', '2009-10', '2008-09',
        '2007-08', '2006-07', '2005-06', '2004-05', '2003-04',
        '2002-03', '2001-02', '2000-01', '1999-00'
    ]
    
    total_added = 0
    
    for season in historical_seasons:
        print(f"Processing {season}...")
        players_df = get_season_leaders(season)
        
        if players_df is not None:
            added = add_players_to_db(players_df, season, conn)
            total_added += added
            print(f"  Added {added} players from {season}")
            time.sleep(1)  # Rate limiting
        else:
            print(f"  Failed to get data for {season}")
    
    conn.close()
    print(f"Total players added: {total_added}")

if __name__ == "__main__":
    main()